const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

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

module.exports = { registerAnon, getMyContribution, updateCounty };
