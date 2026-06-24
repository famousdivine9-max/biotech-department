// ============================================================
// auth.ts
// ============================================================
import { Router } from 'express';
import {
  adminLogin,
  lecturerLogin,
  lecturerRegister,
  forgotPassword,
  resetPassword,
  getProfile,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/admin/login', adminLogin);
router.post('/lecturer/login', lecturerLogin);
router.post('/lecturer/register', lecturerRegister);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getProfile);

export default router;
