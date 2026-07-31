// src/services/adminAuthService.js
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');
const AdminRefreshToken = require('../models/AdminRefreshToken');
const totp = require('../utils/totp');
const jwtUtil = require('../utils/jwt');
const { hashToken } = require('../utils/hashToken');
const tokenService = require('./adminTokenService');
const { ApiError } = require('../utils/ApiError');
const env = require('../config/env');

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

async function login(email, password) {
  const admin = await AdminUser.findOne({ email: email.toLowerCase().trim() });

  // Same error message whether the email doesn't exist or the password is
  // wrong — don't let a login form reveal which admin emails are valid.
  const genericError = () => new ApiError(401, 'Invalid email or password');

  if (!admin || !admin.active) throw genericError();

  if (admin.isLocked()) {
    throw new ApiError(423, 'Account temporarily locked due to repeated failed attempts. Try again later.');
  }

  const passwordOk = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordOk) {
    admin.failedLoginAttempts += 1;
    if (admin.failedLoginAttempts >= LOCK_THRESHOLD) {
      admin.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      admin.failedLoginAttempts = 0;
    }
    await admin.save();
    throw genericError();
  }

  admin.failedLoginAttempts = 0;
  admin.lockedUntil = null;
  admin.lastLoginAt = new Date();
  await admin.save();

  if (!admin.mfaEnabled) {
    return { mfaSetupRequired: true, token: jwtUtil.signMfaSetupToken(admin) };
  }

  return { mfaRequired: true, token: jwtUtil.signMfaChallengeToken(admin) };
}

async function initMfaSetup(setupToken) {
  const payload = jwtUtil.verify(setupToken, jwtUtil.TOKEN_TYPES.MFA_SETUP_PENDING);
  const admin = await AdminUser.findById(payload.sub);
  if (!admin) throw new ApiError(401, 'Admin not found');

  const { base32, qrCodeDataUrl } = await totp.generateSecret(admin.email);

  admin.pendingTotpSecret = base32;
  await admin.save();

  return { qrCodeDataUrl, secret: base32 };
}

/**
 * Handles BOTH first-time MFA enrollment confirmation (challengeToken has
 * token_type mfa_setup_pending) and regular login MFA challenges
 * (token_type mfa_pending) — the caller doesn't need to know which, the
 * token itself carries that.
 */
async function verifyMfa(code, challengeToken, meta) {
  const payload = jwtUtil.verify(challengeToken, [
    jwtUtil.TOKEN_TYPES.MFA_SETUP_PENDING,
    jwtUtil.TOKEN_TYPES.MFA_PENDING,
  ]);

  const admin = await AdminUser.findById(payload.sub).select('+totpSecret +pendingTotpSecret');
  if (!admin) throw new ApiError(401, 'Admin not found');

  const isSetupFlow = payload.token_type === jwtUtil.TOKEN_TYPES.MFA_SETUP_PENDING;
  const secretToCheck = isSetupFlow ? admin.pendingTotpSecret : admin.totpSecret;

  if (!secretToCheck) throw new ApiError(401, 'No pending MFA session found for this admin');

  const valid = totp.verifyCode(secretToCheck, code);
  if (!valid) throw new ApiError(401, 'Invalid verification code');

  if (isSetupFlow) {
    admin.totpSecret = admin.pendingTotpSecret;
    admin.pendingTotpSecret = undefined;
    admin.mfaEnabled = true;
    await admin.save();
  }

  if (admin.mustChangePassword) {
    return { passwordChangeRequired: true, token: jwtUtil.signPasswordChangeToken(admin) };
  }

  return tokenService.issueSession(admin, meta);
}

async function changePassword(passwordChangeToken, newPassword, meta) {
  const payload = jwtUtil.verify(passwordChangeToken, jwtUtil.TOKEN_TYPES.PASSWORD_CHANGE_PENDING);
  const admin = await AdminUser.findById(payload.sub);
  if (!admin) throw new ApiError(401, 'Admin not found');

  admin.passwordHash = await bcrypt.hash(newPassword, env.bcryptRounds);
  admin.mustChangePassword = false;
  await admin.save();

  return tokenService.issueSession(admin, meta);
}

async function refresh(rawRefreshToken, meta) {
  // We need the admin the token belongs to before we can rotate/sign a new
  // access token — but AdminRefreshToken only stores the hash, so look up
  // by hash first, then load the admin it's tied to.
  const tokenHash = hashToken(rawRefreshToken);
  const existing = await AdminRefreshToken.findOne({ tokenHash, revokedAt: null }).populate('admin');

  if (!existing || existing.expiresAt.getTime() < Date.now() || !existing.admin || !existing.admin.active) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const rotated = await tokenService.rotateRefreshToken(rawRefreshToken, existing.admin, meta);
  if (!rotated) throw new ApiError(401, 'Invalid or expired refresh token');

  return rotated;
}

async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return;
  await tokenService.revokeRefreshToken(rawRefreshToken);
}

module.exports = { login, initMfaSetup, verifyMfa, changePassword, refresh, logout };
