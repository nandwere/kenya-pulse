// src/utils/hashToken.js
//
// Refresh tokens are opaque random strings (not JWTs) — only their SHA-256
// hash is ever stored in MongoDB, mirroring how a password would be handled.
// A leaked database dump doesn't hand out usable refresh tokens.

const crypto = require('crypto');

function generateOpaqueToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = { generateOpaqueToken, hashToken };
