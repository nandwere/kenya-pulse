const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { submitResponse } = require('../controllers/responseController');
const { requireAnonAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

router.post(
  '/',
  requireAnonAuth,
  writeLimiter,
  [
    body('questionId').isMongoId(),
    body('category').isString().trim().notEmpty(),
    body('county').optional().isString().trim(),
    body('note').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  submitResponse
);

module.exports = router;
