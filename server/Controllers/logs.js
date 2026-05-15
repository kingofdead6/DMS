import asyncHandler from 'express-async-handler';
import Log from '../Models/Log.js';

// controllers/logs.js
export const getLogs = asyncHandler(async (req, res) => {
  const { resource, action, from, to, page = 1, limit = 20 } = req.query;
  const query = {};
  if (resource) query.resource = resource;
  if (action) query.action = action;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    // ✅ Fix: append end-of-day correctly
    if (to) query.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }
  const total = await Log.countDocuments(query);
  const logs = await Log.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();
  res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
});