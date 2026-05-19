import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../Models/User.js';
import validator from 'validator';
import { logAction } from '../Middleware/logger.js';

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !validator.isEmail(email)) {
    res.status(400); throw new Error('Valid email is required');
  }
  if (!password) { res.status(400); throw new Error('Password is required'); }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401); throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { id: user._id, usertype: user.usertype, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.status(200).json({ token, usertype: user.usertype });
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !validator.isLength(name.trim(), { min: 1 })) {
    res.status(400); throw new Error('Valid name required');
  }
  if (!email || !validator.isEmail(email)) {
    res.status(400); throw new Error('Valid email required');
  }
  if (!password || password.length < 6) {
    res.status(400); throw new Error('Password must be at least 6 characters');
  }
  if (await User.findOne({ email })) {
    res.status(400); throw new Error('Email already exists');
  }
  const user = await User.create({ name, email, password, usertype: 'admin' });
  await logAction(req, 'CREATE', 'USER', user._id, user.name, { email: user.email });
  res.status(201).json({ id: user._id, name: user.name, email: user.email });
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ usertype: 'admin' }).select('-password').lean();
  res.status(200).json(users);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.usertype === 'superadmin') {
    res.status(403); throw new Error('Cannot modify superadmin');
  }
  const before = { name: user.name, email: user.email };
  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  await user.save();
  await logAction(req, 'UPDATE', 'USER', user._id, user.name, { before, after: { name: user.name, email: user.email } });
  res.status(200).json({ id: user._id, name: user.name, email: user.email });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.usertype === 'superadmin') {
    res.status(400); throw new Error('Cannot delete superadmin');
  }
  await logAction(req, 'DELETE', 'USER', user._id, user.name, { email: user.email });
  await User.deleteOne({ _id: req.params.id });
  res.status(200).json({ message: 'User deleted' });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (!req.body.password || req.body.password.length < 6) {
    res.status(400); throw new Error('Password must be at least 6 characters');
  }
  user.password = req.body.password;
  await user.save();
  res.json({ message: 'Password updated' });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({
    _id: req.user._id, 
    name: req.user.name,
    email: req.user.email,
    usertype: req.user.usertype,
  });
});


export const registersuperadmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !validator.isLength(name.trim(), { min: 1 })) {
    res.status(400); throw new Error('Valid name required');
  }
  if (!email || !validator.isEmail(email)) {
    res.status(400); throw new Error('Valid email required');
  }
  if (!password || password.length < 6) {
    res.status(400); throw new Error('Password must be at least 6 characters');
  }
  if (await User.findOne({ email })) {
    res.status(400); throw new Error('Email already exists');
  }
  const user = await User.create({ name, email, password, usertype: 'superadmin' });
  await logAction(req, 'CREATE', 'USER', user._id, user.name, { email: user.email });
  res.status(201).json({ id: user._id, name: user.name, email: user.email });
});