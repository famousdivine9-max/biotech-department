import { Router } from 'express';
import { authenticate, requireLecturer } from '../middleware/auth';
import { getProfile } from '../controllers/authController';

const router = Router();

router.get('/profile', authenticate, requireLecturer, getProfile);

export default router;
