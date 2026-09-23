import mongoose from 'mongoose';

const repairSubmissionSchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  contractorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['SUBMITTED', 'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESUBMITTED'],
    default: 'SUBMITTED'
  },
  verificationResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerificationResult'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

repairSubmissionSchema.index({ complaintId: 1 });
repairSubmissionSchema.index({ contractorId: 1 });
repairSubmissionSchema.index({ status: 1 });

export default mongoose.model('RepairSubmission', repairSubmissionSchema);