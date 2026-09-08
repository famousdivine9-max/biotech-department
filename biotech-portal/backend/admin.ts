import { Router } from 'express';
import { getDashboardStats, getAllLecturers, updateLecturerStatus, resetLecturerPassword, deleteLecturer, getAllPayments, getSettings, updateSetting, updateBulkSettings, uploadBrandingImage, getAcademicData, createAcademicSession, createCourse, getAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/lecturers', getAllLecturers);
router.patch('/lecturers/:id/status', updateLecturerStatus);
router.patch('/lecturers/:id/reset-password', resetLecturerPassword);
router.delete('/lecturers/:id', deleteLecturer);
router.get('/payments', getAllPayments);
router.get('/settings', getSettings);
router.patch('/settings', updateSetting);
router.put('/settings', updateBulkSettings);
router.post('/settings/branding/:type', uploadBrandingImage);
router.get('/academic', getAcademicData);
router.post('/academic/sessions', createAcademicSession);
router.post('/academic/courses', createCourse);
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

export default router;
