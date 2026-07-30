const mongoose = require('mongoose');

/**
 * Users are anonymous. No name, email, or phone is required to participate.
 * anonId is a stable device/session identifier issued at first launch and
 * stored client-side; it's what lets us track streaks/achievements without
 * identifying the person.
 */
const userSchema = new mongoose.Schema(
  {
    anonId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      default: 'Anonymous Citizen',
    },
    county: {
      type: String,
      index: true,
    },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastResponseDate: { type: Date, default: null },
      // Last 7 days of activity, most recent last, for the Mon-Sun UI strip
      last7Days: [
        {
          date: Date,
          completed: Boolean,
        },
      ],
    },
    achievements: [
      {
        key: { type: String }, // e.g. 'community_voice', 'active_citizen', '30_day_contributor'
        title: String,
        description: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    totalResponses: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
