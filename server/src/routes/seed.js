import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Complaint, RepairSubmission, VerificationResult, Notification } from '../models/index.js';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

function ensureSampleImages() {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    const assetsDir = path.join(__dirname, '../../sample-assets');
    const names = [
      'sample-pothole-1.jpg', 'sample-pothole-2.jpg', 'sample-pothole-3.jpg',
      'sample-pothole-4.jpg', 'sample-pothole-5.jpg',
      'sample-repair-1.png', 'sample-repair-2.png', 'sample-repair-3.png',
      'sample-repair-4.png'
    ];
    const prepared = names.filter((n) => fs.existsSync(path.join(assetsDir, n)));
    if (prepared.length) {
      for (const name of prepared) {
        fs.copyFileSync(path.join(assetsDir, name), path.join(uploadsDir, name));
      }
      if (prepared.length === names.length) return;
    }
    const fromUploads = fs.existsSync(uploadsDir)
      ? fs.readdirSync(uploadsDir)
          .filter((f) => /^(image-|sample-).*\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('sample-'))
          .map((f) => path.join(uploadsDir, f))
      : [];
    const sources = [
      path.join(__dirname, '../../../POTH1.jpg'),
      path.join(__dirname, '../../../NOPOTH1.png'),
      path.join(__dirname, '../../../POTH.jpg'),
      path.join(__dirname, '../../../NOPOTH.jfif'),
      ...fromUploads
    ];
    const source = sources.find((p) => fs.existsSync(p));
    if (!source) return;
    for (const name of names) {
      const dest = path.join(uploadsDir, name);
      if (!fs.existsSync(dest)) fs.copyFileSync(source, dest);
    }
  } catch (e) {
    console.warn('Sample image setup skipped:', e.message);
  }
}

const assignAuthority = ({ title = '', description = '', address = '', severity = 'medium' } = {}) => {
  const text = `${title} ${description} ${address}`.toLowerCase();
  const isHighway = /highway|expressway|motorway|freeway|ring road|bypass|nh-|sh-/.test(text);
  if (isHighway || severity === 'critical') return 'PWD Division, Thane';
  return 'Thane Municipal Corporation (TMC)';
};

const buildSeedTimeline = (status, citizenName, contractorName, municipalName, reportedAt, assignedAt, complaintId) => {
  const t = (d) => d ? new Date(d) : new Date();
  const timeline = [{
    event: 'REPORT_CREATED',
    actor: 'Citizen',
    actorName: citizenName,
    message: `Complaint submitted by ${citizenName}`,
    status: 'REPORTED',
    timestamp: t(reportedAt)
  }];
  const order = ['REPORTED', 'ASSIGNED', 'UNDER_REPAIR', 'VERIFICATION', 'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESOLVED'];
  const reached = order.indexOf(status);
  if (reached >= order.indexOf('ASSIGNED') && assignedAt) {
    timeline.push({
      event: 'ASSIGNED',
      actor: 'Municipality',
      actorName: municipalName,
      message: `Assigned to contractor ${contractorName} by ${municipalName}`,
      status: 'ASSIGNED',
      timestamp: t(assignedAt)
    });
  }
  if (reached >= order.indexOf('UNDER_REPAIR')) {
    timeline.push({
      event: 'REPAIR_STARTED',
      actor: 'Contractor',
      actorName: contractorName,
      message: `Repair started by ${contractorName}`,
      status: 'UNDER_REPAIR',
      timestamp: t(assignedAt ? new Date(assignedAt.getTime() + 86400000) : reportedAt)
    });
  }
  if (reached >= order.indexOf('VERIFICATION')) {
    timeline.push({
      event: 'EVIDENCE_UPLOADED',
      actor: 'Contractor',
      actorName: contractorName,
      message: `Repair evidence uploaded by ${contractorName}`,
      status: 'VERIFICATION',
      timestamp: t(assignedAt ? new Date(assignedAt.getTime() + 172800000) : reportedAt)
    });
    timeline.push({
      event: 'AI_VERIFICATION',
      actor: 'AI',
      actorName: 'AI Verification Engine',
      message: `AI verification completed for ${complaintId}`,
      status,
      timestamp: t(assignedAt ? new Date(assignedAt.getTime() + 173400000) : reportedAt)
    });
  }
  return timeline;
};

router.post('/', async (req, res) => {
  if (process.env.VERCEL) {
    const token = process.env.SEED_TOKEN;
    if (!token || req.get('x-seed-token') !== token) {
      return res.status(403).json({ error: 'Seeding is disabled: set SEED_TOKEN and send it via the x-seed-token header.' });
    }
  }
  try {
    await Promise.all([
      User.deleteMany({}),
      Complaint.deleteMany({}),
      RepairSubmission.deleteMany({}),
      VerificationResult.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('Cleared existing data');

    ensureSampleImages();

    const password = 'password123';

    const citizen = await User.create({
      name: 'Aarav Sharma',
      email: 'citizen@fixmycity.com',
      password,
      role: 'citizen',
      phone: '+91 98765 43210',
      address: 'Pokhran Road No. 2, Thane West, Maharashtra 400601'
    });

    const contractor = await User.create({
      name: 'Ramesh Gupta',
      email: 'contractor@fixmycity.com',
      password,
      role: 'contractor',
      phone: '+91 98765 43211',
      address: 'Ghodbunder Road, Majiwada, Thane, Maharashtra 400601'
    });

    const municipal = await User.create({
      name: 'TMC Ward Officer',
      email: 'municipal@fixmycity.com',
      password,
      role: 'municipal',
      phone: '+91 98765 43212',
      address: 'Thane Municipal Corporation, Naupada, Thane West, Maharashtra 400602'
    });

    await User.create([
      {
        name: 'Rajesh Patel',
        email: 'rajesh.patel@fixmycity.com',
        password,
        role: 'citizen',
        phone: '+91 98200 11223',
        address: 'Kolshet Road, Thane West, Maharashtra 400607'
      },
      {
        name: 'Ananya Deshmukh',
        email: 'ananya.d@fixmycity.com',
        password,
        role: 'citizen',
        phone: '+91 98200 44556',
        address: 'Ram Maruti Road, Naupada, Thane West'
      },
      {
        name: 'Suresh Infrastructure Ltd.',
        email: 'suresh.infra@fixmycity.com',
        password,
        role: 'contractor',
        phone: '+91 98200 77889',
        address: 'Eastern Express Highway, Thane, Maharashtra 400601'
      },
      {
        name: 'Apex Civil Works Thane',
        email: 'apex.civil@fixmycity.com',
        password,
        role: 'contractor',
        phone: '+91 98200 99001',
        address: 'Pokhran Road No. 1, Thane West, Maharashtra 400601'
      }
    ]);

    console.log('Created demo users');

    const complaintDefs = [
      {
        complaintId: 'FM-2026-0001',
        contractorId: contractor._id,
        title: 'Large pothole on Eastern Express Highway',
        description: 'Deep pothole near Thane stretch of Eastern Express Highway. Damaging tires during peak hours.',
        severity: 'high',
        imageUrl: '/uploads/sample-pothole-1.jpg',
        latitude: 19.2200,
        longitude: 72.9800,
        address: 'Eastern Express Highway, Thane',
        status: 'VERIFIED',
        assignedAt: new Date('2026-01-15'),
        reportedAt: new Date('2026-01-10')
      },
      {
        complaintId: 'FM-2026-0002',
        contractorId: contractor._id,
        title: 'Medium pothole on Ghodbunder Road',
        description: 'Pothole on Ghodbunder Road near Majiwada Junction. Getting worse after monsoon rain.',
        severity: 'medium',
        imageUrl: '/uploads/sample-pothole-2.jpg',
        latitude: 19.2400,
        longitude: 72.9700,
        address: 'Ghodbunder Road, Near Majiwada Junction, Thane',
        status: 'MANUAL_REVIEW',
        assignedAt: new Date('2026-01-20'),
        reportedAt: new Date('2026-01-18')
      },
      {
        complaintId: 'FM-2026-0003',
        contractorId: contractor._id,
        title: 'Small pothole on Pokhran Road No. 1',
        description: 'Growing pothole on Pokhran Road No. 1 near the school zone. Low traffic risk but widening.',
        severity: 'low',
        imageUrl: '/uploads/sample-pothole-3.jpg',
        latitude: 19.2100,
        longitude: 72.9900,
        address: 'Pokhran Road No. 1, Thane West',
        status: 'REJECTED',
        assignedAt: new Date('2026-01-25'),
        reportedAt: new Date('2026-01-22')
      },
      {
        complaintId: 'FM-2026-0004',
        title: 'New pothole on Thane Station Road',
        description: 'Fresh pothole near Jambli Naka on Thane Station Road after heavy rain. High pedestrian traffic.',
        severity: 'medium',
        imageUrl: '/uploads/sample-pothole-4.jpg',
        latitude: 19.1860,
        longitude: 72.9700,
        address: 'Thane Station Road, Near Jambli Naka, Thane',
        status: 'REPORTED',
        reportedAt: new Date('2026-02-01')
      },
      {
        complaintId: 'FM-2026-0005',
        contractorId: contractor._id,
        title: 'Critical pothole on Kolshet Road',
        description: 'Large deep pothole on Kolshet Road causing accidents near Viviana Mall approach. Urgent repair needed.',
        severity: 'critical',
        imageUrl: '/uploads/sample-pothole-5.jpg',
        latitude: 19.2450,
        longitude: 72.9600,
        address: 'Kolshet Road, Thane West',
        status: 'UNDER_REPAIR',
        assignedAt: new Date('2026-02-05'),
        reportedAt: new Date('2026-02-03')
      }
    ];

    const complaints = [];
    for (const def of complaintDefs) {
      const { title, description, address, severity, ...rest } = def;
      const complaint = await Complaint.create({
        ...rest,
        citizenId: citizen._id,
        title,
        description,
        address,
        severity,
        assignedAuthority: assignAuthority({ title, description, address, severity }),
        timeline: buildSeedTimeline(rest.status, citizen.name, contractor.name, municipal.name, rest.reportedAt, rest.assignedAt, def.complaintId)
      });
      complaints.push(complaint);
    }
    const [complaint1, complaint2, complaint3, complaint4, complaint5] = complaints;

    console.log('Created sample complaints');

    const repair1 = await RepairSubmission.create({
      complaintId: complaint1._id,
      contractorId: contractor._id,
        imageUrl: '/uploads/sample-repair-1.png',
      latitude: 19.2201,
      longitude: 72.9801,
      submittedAt: new Date('2026-01-20'),
      status: 'VERIFIED',
      notes: 'Repair completed with asphalt patch on Eastern Express Highway'
    });

    const repair2 = await RepairSubmission.create({
      complaintId: complaint2._id,
      contractorId: contractor._id,
        imageUrl: '/uploads/sample-repair-2.png',
      latitude: 19.2401,
      longitude: 72.9701,
      submittedAt: new Date('2026-01-25'),
      status: 'MANUAL_REVIEW',
      notes: 'Repair done near Majiwada Junction but lighting conditions differ'
    });

    const repair3 = await RepairSubmission.create({
      complaintId: complaint3._id,
      contractorId: contractor._id,
        imageUrl: '/uploads/sample-repair-3.png',
      latitude: 19.2300,
      longitude: 72.9750,
      submittedAt: new Date('2026-01-30'),
      status: 'REJECTED',
      notes: 'Different location submitted (not Pokhran Road)'
    });

    console.log('Created repair submissions');

    const verification1 = await VerificationResult.create({
      complaintId: complaint1._id,
      repairSubmissionId: repair1._id,
      gpsScore: 29,
      viewpointScore: 18,
      landmarkScore: 19,
      roadSceneScore: 19,
      potholeScore: 8,
      totalScore: 93,
      decision: 'VERIFIED',
      confidence: 'HIGH',
      distanceMeters: 5.2,
      explanation: [
        'GPS location matches within 5 meters - excellent match',
        'Camera viewpoint shows same perspective with minor angle difference',
        'Background buildings and road markings match perfectly',
        'Road scene features including curb and lane lines align',
        'Pothole region shows proper repair with matching surrounding texture'
      ],
      processingTimeMs: 1250
    });

    const verification2 = await VerificationResult.create({
      complaintId: complaint2._id,
      repairSubmissionId: repair2._id,
      gpsScore: 22,
      viewpointScore: 12,
      landmarkScore: 14,
      roadSceneScore: 15,
      potholeScore: 6,
      totalScore: 69,
      decision: 'MANUAL_REVIEW',
      confidence: 'MEDIUM',
      distanceMeters: 18.7,
      explanation: [
        'GPS location within acceptable range (18.7m)',
        'Camera viewpoint shows noticeable perspective shift',
        'Some background landmarks match but others differ',
        'Road scene partially matches but lighting conditions vary',
        'Pothole region shows repair but surrounding context uncertain'
      ],
      processingTimeMs: 1180
    });

    const verification3 = await VerificationResult.create({
      complaintId: complaint3._id,
      repairSubmissionId: repair3._id,
      gpsScore: 2,
      viewpointScore: 5,
      landmarkScore: 3,
      roadSceneScore: 4,
      potholeScore: 1,
      totalScore: 15,
      decision: 'REJECTED',
      confidence: 'HIGH',
      distanceMeters: 1245.3,
      explanation: [
        'GPS location mismatch - over 1.2km from original report',
        'Camera viewpoint completely different - different street',
        'No matching background landmarks detected',
        'Road scene features do not match original location',
        'Pothole region shows different damage pattern entirely'
      ],
      processingTimeMs: 980
    });

    complaint1.repairSubmissionId = repair1._id;
    complaint1.verificationResultId = verification1._id;
    await complaint1.save();

    complaint2.repairSubmissionId = repair2._id;
    complaint2.verificationResultId = verification2._id;
    await complaint2.save();

    complaint3.repairSubmissionId = repair3._id;
    complaint3.verificationResultId = verification3._id;
    await complaint3.save();

    console.log('Created verification results');

    await Notification.create([
      {
        userId: citizen._id,
        type: 'COMPLAINT_SUBMITTED',
        title: 'Complaint Submitted',
        message: 'Your complaint FM-2026-0001 has been submitted successfully.',
        relatedComplaintId: complaint1._id
      },
      {
        userId: citizen._id,
        type: 'COMPLAINT_ASSIGNED',
        title: 'Contractor Assigned',
        message: 'Contractor Ramesh Gupta has been assigned to your complaint FM-2026-0001.',
        relatedComplaintId: complaint1._id
      },
      {
        userId: citizen._id,
        type: 'VERIFICATION_COMPLETE',
        title: 'Repair Verified',
        message: 'Repair for complaint FM-2026-0001 has been verified (Score: 93/100).',
        relatedComplaintId: complaint1._id,
        relatedRepairSubmissionId: repair1._id
      },
      {
        userId: contractor._id,
        type: 'ASSIGNMENT_RECEIVED',
        title: 'New Repair Assignment',
        message: 'You have been assigned to complaint FM-2026-0001.',
        relatedComplaintId: complaint1._id
      },
      {
        userId: contractor._id,
        type: 'VERIFICATION_COMPLETE',
        title: 'Repair Verified',
        message: 'Your repair for complaint FM-2026-0001 has been verified (Score: 93/100).',
        relatedComplaintId: complaint1._id,
        relatedRepairSubmissionId: repair1._id
      },
      {
        userId: municipal._id,
        type: 'NEW_COMPLAINT',
        title: 'New Pothole Reported',
        message: 'New complaint FM-2026-0001 reported on Eastern Express Highway, Thane.',
        relatedComplaintId: complaint1._id
      },
      {
        userId: municipal._id,
        type: 'VERIFICATION_COMPLETE',
        title: 'Repair Verified',
        message: 'Repair for complaint FM-2026-0001 has been verified (Score: 93/100).',
        relatedComplaintId: complaint1._id,
        relatedRepairSubmissionId: repair1._id
      }
    ]);

    console.log('Created sample notifications');

    res.json({
      message: 'Database seeded successfully',
      credentials: {
        citizen: 'citizen@fixmycity.com / password123',
        contractor: 'contractor@fixmycity.com / password123',
        municipal: 'municipal@fixmycity.com / password123'
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed database' });
  }
});

export default router;
