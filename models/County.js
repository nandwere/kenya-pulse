const mongoose = require('mongoose');

const trendPointSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const countySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Optional grouping, e.g. Kisumu Central, Kisumu East are sub-regions of Kisumu
    parentCounty: {
      type: String,
      default: null,
    },
    moodScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    topIssues: [
      {
        category: String,
        percentage: Number,
      },
    ],
    trend30Days: [trendPointSchema],
    aiSummary: {
      type: String,
      default: '',
    },
    geo: {
      // For map rendering / tap-to-explore
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

countySchema.index({ geo: '2dsphere' });

module.exports = mongoose.model('County', countySchema);
