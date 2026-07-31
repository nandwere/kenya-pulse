// src/utils/jwt.js
//
// All admin tokens (access, mfa_setup_pending, mfa_pending,
// password_change_pending) are signed with the SAME secret but carry a
// `token_type` claim — middleware and each endpoint check this claim
// explicitly so a pending/scoped token can never be used as a real session
// token, and vice versa.

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { ApiError } = require('./ApiError');

const TOKEN_TYPES = Object.freeze({
  ACCESS: 'access',
  MFA_SETUP_PENDING: 'mfa_setup_pending',
  MFA_PENDING: 'mfa_pending',
  PASSWORD_CHANGE_PENDING: 'password_change_pending',
});

function sign(payload, expiresInSeconds) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: expiresInSeconds, algorithm: 'HS256' });
}

function signAccessToken(admin) {
  return sign(
    { sub: String(admin._id), role: admin.role, token_type: TOKEN_TYPES.ACCESS },
    env.accessTokenTtlSec,
  );
}

function signMfaSetupToken(admin) {
  return sign({ sub: String(admin._id), token_type: TOKEN_TYPES.MFA_SETUP_PENDING }, env.mfaChallengeTtlSec);
}

function signMfaChallengeToken(admin) {
  return sign({ sub: String(admin._id), token_type: TOKEN_TYPES.MFA_PENDING }, env.mfaChallengeTtlSec);
}

function signPasswordChangeToken(admin) {
  return sign(
    { sub: String(admin._id), token_type: TOKEN_TYPES.PASSWORD_CHANGE_PENDING },
    env.passwordChangeTtlSec,
  );
}

/**
 * Verify a token and assert its token_type matches expectedType (or is one
 * of several allowed types, if an array is passed). Throws ApiError(401) on
 * any failure — expired, malformed, wrong signature, or wrong type.
 */
function verify(token, expectedType) {
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch (e) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const allowed = Array.isArray(expectedType) ? expectedType : [expectedType];
  if (expectedType && !allowed.includes(payload.token_type)) {
    throw new ApiError(401, 'Token is not valid for this operation');
  }

  return payload;
}

module.exports = {
  TOKEN_TYPES,
  signAccessToken,
  signMfaSetupToken,
  signMfaChallengeToken,
  signPasswordChangeToken,
  verify,
};
