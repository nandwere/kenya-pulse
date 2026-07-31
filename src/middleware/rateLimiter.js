const rateLimit = require('express-rate-limit');

// General API traffic
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Tighter limit on write endpoints (submitting responses / community posts)
// since the platform is anonymous and needs extra abuse protection.
const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions from this device. Please slow down.' },
});

// Brute-force protection on login — keyed by IP. Deliberately generous
// enough not to lock out a legitimate admin mistyping their password a
// couple of times, but caps sustained guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
});

// Tighter limit on MFA code verification — a 6-digit TOTP code has a much
// smaller keyspace than a password, so this needs to be stricter.
const mfaLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Please try again shortly.' },
});

module.exports = { generalLimiter, writeLimiter, loginLimiter, mfaLimiter };
