const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  getCommunityFeed,
  createCommunityPost,
  agreeToPost,
} = require('../controllers/communityController');
const { requireAnonAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

router.get(
  '/',
  [query('scope').optional().isIn(['all', 'county', 'following'])],
  validate,
  getCommunityFeed
);

router.post(
  '/',
  requireAnonAuth,
  writeLimiter,
  [
    body('text').isString().trim().isLength({ min: 5, max: 600 }),
    body('category').isString().trim().notEmpty(),
    body('county').optional().isString().trim(),
  ],
  validate,
  createCommunityPost
);

router.post('/:id/agree', requireAnonAuth, agreeToPost);

module.exports = router;
