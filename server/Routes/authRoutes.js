import express from 'express';
import {
  loginUser, registerUser, updatePassword,
  deleteUser, updateUser, getUsers,
  getProfile,
} from '../Controllers/auth.js';
import { protect, superadminOnly } from '../Middleware/auth.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/users', protect, superadminOnly, getUsers);
router.put('/users/:id', protect, superadminOnly, updateUser);
router.delete('/users/:id', protect, superadminOnly, deleteUser);
router.put('/users/:id/password', protect, superadminOnly, updatePassword);
// In your auth routes:
router.get("/profile", protect, getProfile);

export default router;