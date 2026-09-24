import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: [
      'REPORT_CREATED',
      'ASSIGNED',
      'REPAIR_STARTED',
      'EVIDENCE_UPLOADED',
      'AI_VERIFICATION',
      'MUNICIPAL_REVIEW',
      'STATUS_CHANGED',
      'RESOLVED',
      'REJECTED'
    ]
  },
  actor: {
    type: String,
    required: true,
    enum: ['Citizen', 'Municipality', 'Contractor', 'AI', 'System']
  },
  actorName: {
    type: String
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String
  },
  score: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
    required: true
  },
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contractorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    trim: true
  },
  assignedAuthority: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['REPORTED', 'ASSIGNED', 'UNDER_REPAIR', 'VERIFICATION', 'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESOLVED'],
    default: 'REPORTED'
  },
  assignedAt: {
    type: Date
  },
  repairSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairSubmission'
  },
  verificationResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerificationResult'
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  timeline: {
    type: [timelineEventSchema],
    default: []
  }
}, {
  timestamps: true
});

complaintSchema.methods.pushTimelineEvent = function (event) {
  if (!this.timeline) this.timeline = [];
  this.timeline.push({
    timestamp: new Date(),
    ...event
  });
  return this;
};

complaintSchema.index({ latitude: 1, longitude: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ citizenId: 1 });
complaintSchema.index({ contractorId: 1 });

export default mongoose.model('Complaint', complaintSchema);