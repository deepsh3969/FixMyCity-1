import { Complaint, RepairSubmission, VerificationResult, Notification, User } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { checkRepairProof } from '../services/gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '../../uploads');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

export const getAssignments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { contractorId: req.user._id };
    
    if (status) {
      query.status = { $in: status.split(',') };
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('citizenId', 'name email phone')
      .populate('repairSubmissionId')
      .populate('verificationResultId');

    const total = await Complaint.countDocuments(query);

    res.json({
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizenId', 'name email phone')
      .populate('repairSubmissionId')
      .populate('verificationResultId');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.contractorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ complaint });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
};

export const startRepair = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.contractorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (complaint.status !== 'ASSIGNED') {
      return res.status(400).json({ error: 'Complaint must be in ASSIGNED status to start repair' });
    }

    complaint.status = 'UNDER_REPAIR';
    await complaint.save();

    await Notification.create({
      userId: complaint.citizenId,
      type: 'REPAIR_STARTED',
      title: 'Repair Started',
      message: `Repair has started for complaint ${complaint.complaintId}.`,
      relatedComplaintId: complaint._id
    });

    res.json({ complaint });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start repair' });
  }
};

export const submitRepairEvidence = async (req, res) => {
  try {
    const { latitude, longitude, notes } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!imageUrl) {
      return res.status(400).json({ error: 'After-repair image is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.contractorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['ASSIGNED', 'UNDER_REPAIR', 'REJECTED'].includes(complaint.status)) {
      return res.status(400).json({ error: 'Invalid complaint status for repair submission' });
    }

    const repairSubmission = await RepairSubmission.create({
      complaintId: complaint._id,
      contractorId: req.user._id,
      imageUrl,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      notes,
      status: 'SUBMITTED'
    });

    complaint.repairSubmissionId = repairSubmission._id;
    complaint.status = 'VERIFICATION';
    await complaint.save();

    await Notification.create({
      userId: complaint.citizenId,
      type: 'REPAIR_SUBMITTED',
      title: 'Repair Evidence Submitted',
      message: `Contractor has submitted repair evidence for complaint ${complaint.complaintId}.`,
      relatedComplaintId: complaint._id,
      relatedRepairSubmissionId: repairSubmission._id
    });

    const municipalUsers = await User.find({ role: 'municipal', isActive: true });
    for (const municipal of municipalUsers) {
      await Notification.create({
        userId: municipal._id,
        type: 'REPAIR_REQUIRES_REVIEW',
        title: 'Repair Evidence Requires Review',
        message: `Repair evidence submitted for complaint ${complaint.complaintId} requires verification.`,
        relatedComplaintId: complaint._id,
        relatedRepairSubmissionId: repairSubmission._id
      });
    }

    // AI check: does the submitted photo actually show completed repair work?
    const repairAbsPath = path.join(uploadsRoot, path.basename(imageUrl));
    const geminiCheck = await checkRepairProof(repairAbsPath);
    console.log(`Repair proof AI check [${complaint.complaintId}]:`, geminiCheck.verdict, geminiCheck.confidence);

    try {
      let verificationResult;

      if (geminiCheck.verdict === 'NOT_A_REPAIR' && geminiCheck.confidence >= 70) {
        // Confident junk/non-repair photo — reject without wasting the vision service.
        verificationResult = await buildGeminiRejectedResult(complaint, repairSubmission, geminiCheck);
      } else {
        try {
          verificationResult = await runAIVerification(complaint, repairSubmission);
        } catch (svcError) {
          console.error('AI service failed, using fallback scoring:', svcError);
          verificationResult = await createFallbackVerification(complaint, repairSubmission);
        }
        attachGeminiCheck(verificationResult, geminiCheck);
        await verificationResult.save();
      }

      repairSubmission.verificationResultId = verificationResult._id;
      repairSubmission.status = verificationResult.decision;
      await repairSubmission.save();

      complaint.verificationResultId = verificationResult._id;
      await complaint.save();

      let notificationType, notificationTitle, notificationMessage;

      switch (verificationResult.decision) {
        case 'VERIFIED':
          notificationType = 'VERIFICATION_COMPLETE';
          notificationTitle = 'Repair Verified';
          notificationMessage = `Repair for complaint ${complaint.complaintId} has been verified (Score: ${verificationResult.totalScore}/100).`;
          complaint.status = 'VERIFIED';
          break;
        case 'MANUAL_REVIEW':
          notificationType = 'VERIFICATION_MANUAL_REVIEW';
          notificationTitle = 'Manual Review Required';
          notificationMessage = `Repair for complaint ${complaint.complaintId} requires manual review (Score: ${verificationResult.totalScore}/100).`;
          complaint.status = 'MANUAL_REVIEW';
          break;
        case 'REJECTED':
          notificationType = 'VERIFICATION_REJECTED';
          notificationTitle = 'Repair Rejected';
          notificationMessage = `Repair for complaint ${complaint.complaintId} was rejected (Score: ${verificationResult.totalScore}/100). Please resubmit.`;
          complaint.status = 'REJECTED';
          repairSubmission.status = 'REJECTED';
          break;
      }

      await complaint.save();
      await repairSubmission.save();

      await Notification.create({
        userId: complaint.citizenId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        relatedComplaintId: complaint._id,
        relatedRepairSubmissionId: repairSubmission._id
      });

      await Notification.create({
        userId: req.user._id,
        type: notificationType === 'VERIFICATION_REJECTED' ? 'EVIDENCE_REJECTED_RESUBMIT' : notificationType,
        title: notificationTitle,
        message: notificationMessage,
        relatedComplaintId: complaint._id,
        relatedRepairSubmissionId: repairSubmission._id
      });

      for (const municipal of municipalUsers) {
        await Notification.create({
          userId: municipal._id,
          type: notificationType,
          title: notificationTitle,
          message: `${notificationMessage} (Complaint: ${complaint.complaintId})`,
          relatedComplaintId: complaint._id,
          relatedRepairSubmissionId: repairSubmission._id
        });
      }

    } catch (aiError) {
      console.error('AI Verification failed:', aiError);

      const fallbackResult = await createFallbackVerification(complaint, repairSubmission);
      attachGeminiCheck(fallbackResult, geminiCheck);
      await fallbackResult.save();

      repairSubmission.verificationResultId = fallbackResult._id;
      repairSubmission.status = fallbackResult.decision;
      await repairSubmission.save();

      complaint.verificationResultId = fallbackResult._id;
      complaint.status = fallbackResult.decision === 'VERIFIED' ? 'VERIFIED' :
                         fallbackResult.decision === 'MANUAL_REVIEW' ? 'MANUAL_REVIEW' : 'REJECTED';
      await complaint.save();
    }

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('repairSubmissionId')
      .populate('verificationResultId');

    res.json({ complaint: updatedComplaint, repairSubmission });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit repair evidence' });
  }
};

const attachGeminiCheck = (result, check) => {
  result.geminiVerdict = check.verdict;
  result.geminiConfidence = check.confidence;
  result.geminiNotes = check.notes;
  const line = `AI repair-photo check: ${check.verdict} (${check.confidence}%) — ${check.notes}`;
  result.explanation = [...(result.explanation || []), line];

  if (check.verdict === 'REPAIR_VISIBLE') return;

  if (result.fallbackMode && result.decision === 'VERIFIED') {
    result.decision = 'MANUAL_REVIEW';
    result.confidence = 'MEDIUM';
    result.explanation.push('Auto-verify withheld: fallback scoring without a confirmed repair photo');
  } else if (check.verdict === 'UNCERTAIN' && result.decision === 'VERIFIED') {
    result.decision = 'MANUAL_REVIEW';
    result.confidence = 'MEDIUM';
    result.explanation.push('Auto-verify capped to manual review: AI uncertain whether the photo shows a completed repair');
  }
};

const buildGeminiRejectedResult = async (complaint, repairSubmission, geminiCheck) => {
  const distanceMeters = calculateDistance(
    complaint.latitude, complaint.longitude,
    repairSubmission.latitude, repairSubmission.longitude
  );

  let gpsScore = 0;
  if (distanceMeters <= 10) gpsScore = 30;
  else if (distanceMeters <= 30) gpsScore = 20;
  else if (distanceMeters <= 50) gpsScore = 10;

  const explanation = [
    `GPS distance: ${distanceMeters.toFixed(1)}m (score: ${gpsScore}/30)`,
    `AI repair-photo check: NOT_A_REPAIR (${geminiCheck.confidence}%) — ${geminiCheck.notes}`,
    'Submitted photo does not show completed repair work — rejected'
  ];

  return await VerificationResult.create({
    complaintId: complaint._id,
    repairSubmissionId: repairSubmission._id,
    gpsScore,
    viewpointScore: 0,
    landmarkScore: 0,
    roadSceneScore: 0,
    potholeScore: 0,
    totalScore: gpsScore,
    decision: 'REJECTED',
    confidence: geminiCheck.confidence >= 85 ? 'HIGH' : 'MEDIUM',
    distanceMeters,
    explanation,
    fallbackMode: false,
    geminiVerdict: geminiCheck.verdict,
    geminiConfidence: geminiCheck.confidence,
    geminiNotes: geminiCheck.notes
  });
};

const runAIVerification = async (complaint, repairSubmission) => {
  const originalImagePath = path.join(uploadsRoot, path.basename(complaint.imageUrl || ''));
  const repairImagePath = path.join(uploadsRoot, path.basename(repairSubmission.imageUrl || ''));

  const response = await fetch(`${AI_SERVICE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalImage: originalImagePath,
      repairImage: repairImagePath,
      originalGPS: { lat: complaint.latitude, lng: complaint.longitude },
      repairGPS: { lat: repairSubmission.latitude, lng: repairSubmission.longitude },
      complaintId: complaint._id.toString(),
      repairSubmissionId: repairSubmission._id.toString()
    })
  });

  if (!response.ok) {
    throw new Error(`AI service returned ${response.status}`);
  }

  const result = await response.json();
  
  return await VerificationResult.create({
    complaintId: complaint._id,
    repairSubmissionId: repairSubmission._id,
    ...result
  });
};

const createFallbackVerification = async (complaint, repairSubmission) => {
  const distanceMeters = calculateDistance(
    complaint.latitude, complaint.longitude,
    repairSubmission.latitude, repairSubmission.longitude
  );

  let gpsScore = 0;
  if (distanceMeters <= 10) gpsScore = 30;
  else if (distanceMeters <= 30) gpsScore = 20;
  else if (distanceMeters <= 50) gpsScore = 10;
  else gpsScore = 0;

  const viewpointScore = 15;
  const landmarkScore = 15;
  const roadSceneScore = 15;
  const potholeScore = 5;

  const totalScore = gpsScore + viewpointScore + landmarkScore + roadSceneScore + potholeScore;
  
  let decision = 'MANUAL_REVIEW';
  let confidence = 'LOW';
  
  if (totalScore >= 80) {
    decision = 'VERIFIED';
    confidence = 'HIGH';
  } else if (totalScore >= 60) {
    decision = 'MANUAL_REVIEW';
    confidence = 'MEDIUM';
  } else {
    decision = 'REJECTED';
    confidence = 'LOW';
  }

  const explanation = [
    `GPS distance: ${distanceMeters.toFixed(1)}m (score: ${gpsScore}/30)`,
    'AI service unavailable - using fallback scoring',
    'Manual verification recommended'
  ];

  return await VerificationResult.create({
    complaintId: complaint._id,
    repairSubmissionId: repairSubmission._id,
    gpsScore,
    viewpointScore,
    landmarkScore,
    roadSceneScore,
    potholeScore,
    totalScore,
    decision,
    confidence,
    distanceMeters,
    explanation,
    fallbackMode: true
  });
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};