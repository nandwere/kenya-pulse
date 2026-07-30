const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Anonymous auth: the client gets an anonId + JWT on first launch
 * (see /api/users/register-anon) and sends it back on every request.
 * No personal data is ever required. This just lets us persist streaks
 * and achievements against a stable pseudonymous identity.
 */
const requireAnonAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing anonymous session token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ anonId: decoded.anonId });
    if (!user) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session token' });
  }
};

module.exports = { requireAnonAuth };
