// src/services/adminTokenService.js
const jwtUtil = require('../utils/jwt');
const { generateOpaqueToken, hashToken } = require('../utils/hashToken');
const AdminRefreshToken = require('../models/AdminRefreshToken');
const env = require('../config/env');

/**
 * Issues a full session: a short-lived JWT access token + an opaque
 * refresh token (persisted hashed, not raw). Returns the RAW refresh token
 * to hand to the caller — only the hash ever touches the database.
 */
async function issueSession(admin, { ipAddress, userAgent } = {}) {
  const accessToken = jwtUtil.signAccessToken(admin);

  const rawRefreshToken = generateOpaqueToken();
  const tokenHash = hashToken(rawRefreshToken);

  await AdminRefreshToken.create({
    admin: admin._id,
    tokenHash,
    expiresAt: new Date(Date.now() + env.refreshTokenTtlHours * 60 * 60 * 1000),
    ipAddress,
    userAgent,
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    expiresInSeconds: env.accessTokenTtlSec,
  };
}

/**
 * Validates a raw refresh token against the stored hash, and if valid,
 * ROTATES it: the old one is revoked and a new access+refresh pair is
 * issued. Rotation means a stolen-and-replayed old refresh token becomes
 * detectable (it'll already be revoked when the real client tries it next).
 */
async function rotateRefreshToken(rawRefreshToken, admin, meta) {
  const tokenHash = hashToken(rawRefreshToken);

  const existing = await AdminRefreshToken.findOne({ tokenHash, revokedAt: null });
  if (!existing || existing.expiresAt.getTime() < Date.now()) {
    return null;
  }

  existing.revokedAt = new Date();
  await existing.save();

  return issueSession(admin, meta);
}

async function revokeRefreshToken(rawRefreshToken) {
  const tokenHash = hashToken(rawRefreshToken);
  await AdminRefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
}

module.exports = { issueSession, rotateRefreshToken, revokeRefreshToken };
