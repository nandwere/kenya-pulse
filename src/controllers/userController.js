const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const userAdminService = require('../services/userAdminService');


const signToken = (anonId) =>
  jwt.sign({ anonId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '365d',
  });

// POST /api/users/register-anon
// Called once on first app launch. Creates an anonymous identity and
// returns a long-lived token the app stores locally.
const registerAnon = asyncHandler(async (req, res) => {
  const { county } = req.body;

  const anonId = crypto.randomUUID();
  const user = await User.create({ anonId, county });
  const token = signToken(anonId);

  res.status(201).json({
    token,
    anonId: user.anonId,
    county: user.county,
  });
});

// GET /api/users/me/contribution
// Powers the "My Contribution" screen: today's response status, streak, achievements.
const getMyContribution = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    streak: user.streak,
    achievements: user.achievements,
    totalResponses: user.totalResponses,
    displayName: user.displayName,
  });
});

// PATCH /api/users/me/county
const updateCounty = asyncHandler(async (req, res) => {
  const { county } = req.body;
  req.user.county = county;
  await req.user.save();
  res.json({ county: req.user.county });
});

const VALID_STATUSES = ['ACTIVE', 'SUSPENDED', 'BANNED'];

const list = asyncHandler(async (req, res) => {
  const { page, limit, sort, order, search, status } = req.query;

  const result = await userAdminService.listUsers({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 25,
    sort: sort || 'createdAt',
    order: order === 'asc' ? 'asc' : 'desc',
    search,
    status,
  });

  res.json(result);
});

const getOne = asyncHandler(async (req, res) => {
  const user = await userAdminService.getUserById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json(user);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const user = await userAdminService.updateUserStatus(req.params.id, status);
  if (!user) throw new ApiError(404, 'User not found');

  res.json({ success: true });
});

module.exports = { registerAnon, getMyContribution, updateCounty, list, getOne, updateStatus };
