// src/controllers/meController.js
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const AdminUser = require('../models/AdminUser');

const me = asyncHandler(async (req, res) => {
  const admin = await AdminUser.findById(req.admin.id);
  if (!admin) throw new ApiError(401, 'Admin not found');

  res.json({ id: admin._id, email: admin.email, role: admin.role });
});

const health = asyncHandler(async (req, res) => {
  res.status(200).json({ ok: true });
});

module.exports = { me, health };
