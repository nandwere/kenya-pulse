// src/services/userAdminService.js
const User = require('../models/User');

async function listUsers({ page = 1, limit = 25, sort = 'createdAt', order = 'desc', search, status }) {
  const filter = {};

  if (status) filter.accountStatus = status;

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ username: regex }, { displayName: regex }, { email: regex }];
  }

  const sortSpec = { [sort]: order === 'asc' ? 1 : -1 };
  const skip = (Math.max(1, page) - 1) * limit;

  const [data, total] = await Promise.all([
    User.find(filter).sort(sortSpec).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { data, total };
}

async function getUserById(id) {
  return User.findById(id);
}

async function updateUserStatus(id, status) {
  const update = { accountStatus: status };
  if (status !== 'SUSPENDED') update.suspendedUntil = null;

  return User.findByIdAndUpdate(id, { $set: update }, { new: true });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { listUsers, getUserById, updateUserStatus };
