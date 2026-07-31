const express = require('express');
const router = express.Router();

const { getAllCounties, getCountyByName } = require('../controllers/countyController');

router.get('/', getAllCounties);
router.get('/:name', getCountyByName);

module.exports = router;
