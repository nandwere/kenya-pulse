// src/config/env.js
//
// Loads and validates required environment variables once, at boot —
// fail fast rather than discovering a missing secret mid-request.

require('dotenv').config();

const required = ['MONGO_URI', 'ADMIN_JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.NODE_ENV === 'production' && process.env.ADMIN_JWT_SECRET.length < 32) {
  throw new Error('ADMIN_JWT_SECRET is too short for production use — generate a longer random secret.');
}

module.exports = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  adminFrontendOrigin: process.env.ADMIN_FRONTEND_ORIGIN || 'http://localhost:3000',

  jwtSecret: process.env.ADMIN_JWT_SECRET,
  accessTokenTtlSec: Number(process.env.ADMIN_ACCESS_TOKEN_TTL) || 900,
  refreshTokenTtlHours: Number(process.env.ADMIN_REFRESH_TOKEN_TTL_HOURS) || 12,
  mfaChallengeTtlSec: Number(process.env.ADMIN_MFA_CHALLENGE_TTL) || 300,
  passwordChangeTtlSec: Number(process.env.ADMIN_PASSWORD_CHANGE_TTL) || 600,

  bcryptRounds: Number(process.env.ADMIN_BCRYPT_ROUNDS) || 12,
};
