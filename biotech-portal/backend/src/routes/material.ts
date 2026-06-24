import { Router } from 'express';
import multer from 'multer';
import {
  uploadMaterial,
  getPublicMaterials,
  trackDownload,
  getLecturerMaterials,
  updateMaterial,
  deleteMaterial,
} from '../controllers/materialController';
import { authenticate, requireLecturer, requireAdmin } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

const router = Router();

// Public
router.get('/public', getPublicMaterials);
router.post('/download/:id', trackDownload);

// Lecturer
router.post('/upload', authenticate, requireLecturer, upload.single('file'), uploadMaterial);
router.get('/my', authenticate, requireLecturer, getLecturerMaterials);
router.put('/:id', authenticate, requireLecturer, upload.single('file'), updateMaterial);
router.delete('/:id', authenticate, requireLecturer, deleteMaterial);

// Admin can delete any material
router.delete('/admin/:id', authenticate, requireAdmin, deleteMaterial);

export default router;
