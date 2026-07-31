// src/middleware/adminAuth.js
const jwtUtil = require('../utils/jwt');
const { ApiError } = require('../utils/ApiError');
const AdminUser = require('../models/AdminUser');

/**
 * Verifies the Authorization: Bearer <token> header, requires token_type
 * === 'access' (rejects any pending/scoped token — MFA setup, MFA
 * challenge, password-change — from ever authenticating a real request),
 * and attaches `req.admin = { id, role }`.
 */
function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwtUtil.verify(token, jwtUtil.TOKEN_TYPES.ACCESS);
    req.admin = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Loads the full AdminUser document onto req.adminDoc. Split from adminAuth
 * so routes that only need the id/role (the common case) skip the DB hit.
 */
async function loadAdminUser(req, res, next) {
  try {
    const admin = await AdminUser.findById(req.admin.id);
    if (!admin || !admin.active) {
      return next(new ApiError(401, 'Admin account not found or inactive'));
    }
    req.adminDoc = admin;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { adminAuth, loadAdminUser };
