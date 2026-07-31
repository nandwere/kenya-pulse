const MoodSnapshot = require('../models/MoodSnapshot');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/trends/history?days=30
// Returns the last N days of MoodSnapshot documents, oldest first - this is
// the single source of truth the mobile app's Trends tab builds all four
// of its sub-views from (Overview's mood trend line, Issues' per-category
// sparklines, Indicators' per-category cards, and the "Most Changing
// Issues" comparison). Keeping this as one endpoint that returns raw
// history - rather than one endpoint per sub-tab - means the client can
// derive new views later without needing new backend routes.
const getMoodHistory = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 90);

  const snapshots = await MoodSnapshot.find()
    .sort({ date: -1 })
    .limit(days)
    .select('date nationalMoodScore changeFromPrevious trending');

  res.json(snapshots.reverse());
});

module.exports = { getMoodHistory };
