// src/controllers/authController.js
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const authService = require('../services/adminAuthService');

function requestMeta(req) {
  return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const result = await authService.login(email, password);
  res.json(result);
});

const mfaSetupInit = asyncHandler(async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Missing setup token');

  const result = await authService.initMfaSetup(header.slice('Bearer '.length));
  res.json(result);
});

const mfaVerify = asyncHandler(async (req, res) => {
  const { code, challengeToken } = req.body;
  if (!code || !challengeToken) throw new ApiError(400, 'code and challengeToken are required');

  const result = await authService.verifyMfa(code, challengeToken, requestMeta(req));
  res.json(result);
});

const changePassword = asyncHandler(async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Missing password-change token');

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const result = await authService.changePassword(header.slice('Bearer '.length), newPassword, requestMeta(req));
  res.json(result);
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'refreshToken is required');

  const result = await authService.refresh(refreshToken, requestMeta(req));
  res.json(result);
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  res.json({ success: true });
});

module.exports = { login, mfaSetupInit, mfaVerify, changePassword, refresh, logout };
