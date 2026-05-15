// routes/case.js
import express from 'express';
import multer from 'multer';
import { protect } from '../Middleware/auth.js';
import {
  getCases, getCaseById, createCase,
  updateCase, deleteCase, deleteDocument,
} from '../Controllers/case.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    const allowed = [
      'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
      'application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get('/', getCases);
router.get('/:id', getCaseById);
// ✅ protect added so req.user is populated → logAction works
router.post('/', protect, upload.array('documents', 20), createCase);
router.put('/:id', protect, upload.array('documents', 20), updateCase);
router.delete('/:id', protect, deleteCase);
router.delete('/:id/documents/:docId', protect, deleteDocument);

export default router;