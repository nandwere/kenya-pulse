// src/middleware/requireRole.js
const { ApiError } = require('../utils/ApiError');

/**
 * Usage: requireRole('SUPER_ADMIN', 'MODERATOR')
 * Must run after adminAuth (relies on req.admin.role being set).
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin || !allowedRoles.includes(req.admin.role)) {
      return next(new ApiError(403, 'Insufficient permissions for this action'));
    }
    next();
  };
}

module.exports = { requireRole };
