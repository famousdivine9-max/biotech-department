import { Router } from 'express';
import multer from 'multer';
import {
  getDashboardStats,
  getAllLecturers,
  updateLecturerStatus,
  resetLecturerPassword,
  deleteLecturer,
  getAllPayments,
  getSettings,
  updateSetting,
  updateBulkSettings,
  uploadBrandingImage,
  getAcademicData,
  createAcademicSession,
  createCourse,
  createAnnouncement,
  getAnnouncements,
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Lecturers
router.get('/lecturers', getAllLecturers);
router.patch('/lecturers/:id/status', updateLecturerStatus);
router.patch('/lecturers/:id/reset-password', resetLecturerPassword);
router.delete('/lecturers/:id', deleteLecturer);

// Payments
router.get('/payments', getAllPayments);

// Settings
router.get('/settings', getSettings);
router.put('/settings/:key', updateSetting);
router.put('/settings', updateBulkSettings);
router.post('/settings/branding/:type', upload.single('image'), uploadBrandingImage);

// Academic
router.get('/academic', getAcademicData);
router.post('/academic/sessions', createAcademicSession);
router.post('/academic/courses', createCourse);

// Announcements
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);

export default router;
