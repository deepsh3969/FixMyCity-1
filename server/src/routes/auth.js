import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { body } from 'express-validator';

const router = Router();

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['citizen', 'contractor', 'municipal']).withMessage('Invalid role'),
  validate
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], login);

router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;