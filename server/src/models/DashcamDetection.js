import mongoose from 'mongoose';

/**
 * DashcamDetection — future entity for the AI Road Monitoring / dashcam phase.
 * Modular and intentionally NOT wired into any live route yet: detections only
 * enter the municipal workflow after the dashcam pipeline is fully connected.
 * No personal data (faces, plates, device owner) is ever stored here.
 */
const dashcamDetectionSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ['DASHCAM'],
      default: 'DASHCAM',
      required: true
    },
    timestamp: { type: Date, default: Date.now, required: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    confidence: { type: Number, min: 0, max: 1 },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    defectType: { type: String, default: 'POTHOLE' },
    frameUrl: { type: String },
    videoId: { type: String },
    roadSegment: { type: String },
    deviceId: { type: String },
    clusterId: { type: String },
    status: {
      type: String,
      enum: ['DETECTED', 'CLUSTERED', 'MERGED', 'DISMISSED'],
      default: 'DETECTED'
    },
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }
  },
  { timestamps: true }
);

dashcamDetectionSchema.index({ videoId: 1 });
dashcamDetectionSchema.index({ clusterId: 1 });
dashcamDetectionSchema.index({ status: 1, timestamp: -1 });

export default mongoose.models.DashcamDetection ||
  mongoose.model('DashcamDetection', dashcamDetectionSchema);
