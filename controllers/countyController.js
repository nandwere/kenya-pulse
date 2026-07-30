const County = require('../models/County');
const MoodSnapshot = require('../models/MoodSnapshot');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/home/summary
// Powers the Home Dashboard: Kenya Mood Index, trending, AI daily summary.
const getHomeSummary = asyncHandler(async (req, res) => {
  const latest = await MoodSnapshot.findOne().sort({ date: -1 });

  if (!latest) {
    return res.status(404).json({ message: 'No mood data available yet.' });
  }

  res.json({
    kenyaMoodIndex: latest.nationalMoodScore,
    changeFromPrevious: latest.changeFromPrevious,
    trending: latest.trending,
    aiDailySummary: latest.aiDailySummary,
    date: latest.date,
  });
});

// GET /api/counties
// Powers the Kenya Mood Map (all counties with color-coded sentiment).
const getAllCounties = asyncHandler(async (req, res) => {
  const counties = await County.find().select(
    'name parentCounty moodScore sentiment geo lastUpdated'
  );
  res.json(counties);
});

// GET /api/counties/:name
// Powers the County View screen (Kisumu County, etc.)
const getCountyByName = asyncHandler(async (req, res) => {
  const county = await County.findOne({
    name: new RegExp(`^${req.params.name}$`, 'i'),
  });

  if (!county) {
    return res.status(404).json({ message: 'County not found' });
  }

  // Sub-region breakdown (e.g. Kisumu Central, Kisumu East, Kisumu West)
  const subCounties = await County.find({ parentCounty: county.name }).select(
    'name moodScore sentiment'
  );

  res.json({
    ...county.toObject(),
    breakdown: subCounties,
  });
});

module.exports = { getHomeSummary, getAllCounties, getCountyByName };
