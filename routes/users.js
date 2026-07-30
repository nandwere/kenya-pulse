const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { registerAnon, getMyContribution, updateCounty } = require('../controllers/userController');
const { requireAnonAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post(
  '/register-anon',
  [body('county').optional().isString().trim()],
  validate,
  registerAnon
);

router.get('/me/contribution', requireAnonAuth, getMyContribution);

router.patch(
  '/me/county',
  requireAnonAuth,
  [body('county').isString().trim().notEmpty()],
  validate,
  updateCounty
);

module.exports = router;
