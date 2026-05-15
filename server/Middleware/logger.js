import Log from '../Models/Log.js';

// middleware/logger.js
export const logAction = async (req, action, resource, resourceId, resourceName, details = {}) => {
  try {
    if (!req.user) {
      console.warn(`logAction skipped — no req.user for ${action} ${resource}`);
      return;
    }
    await Log.create({
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByEmail: req.user.email,   // populated by protect via DB lookup ✅
      action,
      resource,
      resourceId: resourceId?.toString(),
      resourceName,
      details,
    });
  } catch (err) {
    console.error('Log error:', err.message);
  }
};