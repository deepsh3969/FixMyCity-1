import mongoose from 'mongoose';

const verificationResultSchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  repairSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairSubmission',
    required: true
  },
  gpsScore: {
    type: Number,
    min: 0,
    max: 30,
    required: true
  },
  viewpointScore: {
    type: Number,
    min: 0,
    max: 20,
    required: true
  },
  landmarkScore: {
    type: Number,
    min: 0,
    max: 20,
    required: true
  },
  roadSceneScore: {
    type: Number,
    min: 0,
    max: 20,
    required: true
  },
  potholeScore: {
    type: Number,
    min: 0,
    max: 10,
    required: true
  },
  totalScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  decision: {
    type: String,
    enum: ['VERIFIED', 'MANUAL_REVIEW', 'REJECTED'],
    required: true
  },
  confidence: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    required: true
  },
  distanceMeters: {
    type: Number,
    required: true
  },
  explanation: [{
    type: String
  }],
  aiServiceVersion: {
    type: String,
    default: '1.0.0'
  },
  processingTimeMs: {
    type: Number
  },
  fallbackMode: {
    type: Boolean,
    default: false
  },
  geminiVerdict: {
    type: String,
    enum: ['REPAIR_VISIBLE', 'NOT_A_REPAIR', 'UNCERTAIN', 'SKIPPED']
  },
  geminiConfidence: {
    type: Number,
    min: 0,
    max: 100
  },
  geminiNotes: {
    type: String
  }
}, {
  timestamps: true
});

verificationResultSchema.index({ complaintId: 1 });
verificationResultSchema.index({ decision: 1 });

export default mongoose.model('VerificationResult', verificationResultSchema);