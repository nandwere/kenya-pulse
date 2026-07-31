// src/routes/adminRoutes.js
const express = require('express');
const { adminAuth } = require('../middleware/adminAuth');
const { requireRole } = require('../middleware/requireRole');

const adminAuthRoutes = require('./adminAuthRoutes');
const meController = require('../controllers/meController');
const dashboardController = require('../controllers/dashboardController');
const userController = require('../controllers/userController');
const reportController = require('../controllers/reportController');

const router = express.Router();

// ── Public ──────────────────────────────────────────────────────────────
router.use('/auth', adminAuthRoutes);

// ── Everything below requires a valid access token ──────────────────────
router.use(adminAuth);

router.get('/health', meController.health);
router.get('/me', meController.me);

router.get('/dashboard/stats', requireRole('SUPER_ADMIN', 'MODERATOR', 'SUPPORT'), dashboardController.stats);

router.get('/users', requireRole('SUPER_ADMIN', 'MODERATOR'), userController.list);
router.get('/users/:id', requireRole('SUPER_ADMIN', 'MODERATOR'), userController.getOne);
router.patch('/users/:id/status', requireRole('SUPER_ADMIN', 'MODERATOR'), userController.updateStatus);

router.get('/reports', requireRole('SUPER_ADMIN', 'MODERATOR'), reportController.list);
router.patch('/reports/:id/resolve', requireRole('SUPER_ADMIN', 'MODERATOR'), reportController.resolve);

module.exports = router;
