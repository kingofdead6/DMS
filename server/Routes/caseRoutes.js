import express from 'express';
import multer from 'multer';
import {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  deleteDocument,
} from '../Controllers/case.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword',                                                  // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel',                                            // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',   // .xlsx
      'application/vnd.ms-powerpoint',                                       // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
router.get('/', getCases);
router.get('/:id', getCaseById);
router.post('/', upload.array('documents', 20), createCase);
router.put('/:id', upload.array('documents', 20), updateCase);
router.delete('/:id', deleteCase);
router.delete('/:id/documents/:docId', deleteDocument);

export default router;