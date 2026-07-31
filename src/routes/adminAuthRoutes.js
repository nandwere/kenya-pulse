// src/routes/adminAuthRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { loginLimiter, mfaLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', loginLimiter, authController.login);
router.post('/mfa/setup/init', authController.mfaSetupInit);
router.post('/mfa/verify', mfaLimiter, authController.mfaVerify);
router.post('/change-password', authController.changePassword);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
