import { Router } from 'express';
import { 
  createComplaint, 
  getMyComplaints, 
  getComplaintById, 
  getAllComplaints, 
  updateComplaintStatus, 
  assignContractor,
  getDashboardStats 
} from '../controllers/complaintController.js';
import { User } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { validate } from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = Router();

router.use(authenticate);

router.post('/', 
  upload.single('image'),
  handleUploadError,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    validate
  ],
  createComplaint
);

router.get('/my', getMyComplaints);
router.get('/stats', authorize('municipal'), getDashboardStats);
router.get('/contractors', authorize('municipal'), async (req, res) => {
  try {
    const contractors = await User.find({ role: 'contractor', isActive: true })
      .select('name email phone')
      .sort({ name: 1 });
    res.json({ contractors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
});
router.get('/', authorize('municipal'), getAllComplaints);
router.get('/:id', getComplaintById);

router.patch('/:id/status', 
  authorize('municipal'),
  [
    body('status').isIn(['REPORTED', 'ASSIGNED', 'UNDER_REPAIR', 'VERIFICATION', 'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESOLVED']).withMessage('Invalid status'),
    validate
  ],
  updateComplaintStatus
);

router.post('/:id/assign', 
  authorize('municipal'),
  [
    body('contractorId').isMongoId().withMessage('Valid contractor ID required'),
    validate
  ],
  assignContractor
);

export default router;