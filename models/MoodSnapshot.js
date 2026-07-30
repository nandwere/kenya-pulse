const mongoose = require('mongoose');

/**
 * One document per day = the "Kenya Mood Index" and trending topics shown
 * on the Home Dashboard. Precomputed by a scheduled job (see utils/aggregate.js)
 * so the home screen is a single fast read instead of an on-the-fly aggregation.
 */
const moodSnapshotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    nationalMoodScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    changeFromPrevious: {
      type: Number,
      default: 0,
    },
    trending: [
      {
        category: String,
        percentage: Number,
        changePercentagePoints: Number, // e.g. +6, -2
      },
    ],
    aiDailySummary: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MoodSnapshot', moodSnapshotSchema);
