import { Router } from 'express';
import { 
  getAssignments, 
  getAssignmentById, 
  startRepair, 
  submitRepairEvidence 
} from '../controllers/contractorController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { validate } from '../middleware/validation.js';
import { body } from 'express-validator';

const router = Router();

router.use(authenticate);
router.use(authorize('contractor'));

router.get('/', getAssignments);
router.get('/:id', getAssignmentById);

router.post('/:id/start-repair', startRepair);

router.post('/:id/repair-submission',
  upload.single('image'),
  handleUploadError,
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    validate
  ],
  submitRepairEvidence
);

export default router;