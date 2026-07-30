const express = require('express');
const router = express.Router();
const { getTodaysQuestion } = require('../controllers/questionController');

router.get('/today', getTodaysQuestion);

module.exports = router;
