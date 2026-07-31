const express = require('express');
const router = express.Router();
const { getMoodHistory } = require('../controllers/trendsController');

router.get('/history', getMoodHistory);

module.exports = router;
