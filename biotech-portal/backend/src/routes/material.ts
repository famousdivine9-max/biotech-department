import { Router } from 'express';
import {
  uploadMaterial,
  getPublicMaterials,
  getLecturerMaterials,
  trackDownload,
  updateMaterial,
  deleteMaterial,
  adminDeleteMaterial
} from '../controllers/materialController';
import { authenticate, requireAdmin, requireLecturer } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/public', getPublicMaterials);
router.post('/download/:id', trackDownload);
router.post('/upload', authenticate, requireLecturer, upload.single('file'), uploadMaterial);
router.get('/my', authenticate, requireLecturer, getLecturerMaterials);
router.put('/:id', authenticate, requireLecturer, upload.single('file'), updateMaterial);
router.delete('/:id', authenticate, requireLecturer, deleteMaterial);
router.delete('/admin/:id', authenticate, requireAdmin, adminDeleteMaterial);

export default router;
