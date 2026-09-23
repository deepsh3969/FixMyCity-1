import mongoose from 'mongoose';

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
  }
}, {
  timestamps: true
});

complaintSchema.index({ latitude: 1, longitude: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ citizenId: 1 });
complaintSchema.index({ contractorId: 1 });

export default mongoose.model('Complaint', complaintSchema);