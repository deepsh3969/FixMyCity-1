import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'COMPLAINT_SUBMITTED',
      'COMPLAINT_ASSIGNED',
      'REPAIR_STARTED',
      'REPAIR_SUBMITTED',
      'VERIFICATION_COMPLETE',
      'VERIFICATION_MANUAL_REVIEW',
      'VERIFICATION_REJECTED',
      'COMPLAINT_RESOLVED',
      'NEW_COMPLAINT',
      'REPAIR_REQUIRES_REVIEW',
      'ASSIGNMENT_RECEIVED',
      'EVIDENCE_REJECTED_RESUBMIT'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedComplaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  },
  relatedRepairSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairSubmission'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);