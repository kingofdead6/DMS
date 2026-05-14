import express from 'express';
import { loginUser, registerUser, updatePassword, deleteUser, updateUser, getUsers } from '../Controllers/auth.js';
import { protect } from '../Middleware/auth.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
// routes/auth.js
router.get('/users', getUsers);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, deleteUser);
router.put('/users/:id/password', protect, updatePassword);

export default router;