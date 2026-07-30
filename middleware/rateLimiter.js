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

module.exports = { generalLimiter, writeLimiter };
