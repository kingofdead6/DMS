import express from 'express';
import { getLogs } from '../Controllers/logs.js';
import { protect, superadminOnly } from '../Middleware/auth.js';

const router = express.Router();
router.get('/', protect, superadminOnly, getLogs);

export default router;