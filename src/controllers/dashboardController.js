// src/controllers/dashboardController.js
const { asyncHandler } = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');

const stats = asyncHandler(async (req, res) => {
  const data = await dashboardService.getStats();
  res.json(data);
});

module.exports = { stats };
