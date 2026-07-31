require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Response = require('../models/Response');
const County = require('../models/County');
const MoodSnapshot = require('../models/MoodSnapshot');

/**
 * Converts raw response volume/category mix into a 0-100 "mood score".
 *
 * This is a simple, transparent starting formula, not a black box:
 * - Categories are weighted by how strongly they signal distress vs. neutrality.
 * - More weighted-negative categories -> lower score. Sparse data defaults to neutral (50).
 * Replace CATEGORY_WEIGHT with a tuned model once you have real usage data
 * (e.g. incorporate free-text sentiment analysis on `note`).
 */
const CATEGORY_WEIGHT = {
  cost_of_living: -8,
  water: -7,
  healthcare: -6,
  jobs: -6,
  security: -9,
  roads: -4,
  electricity: -5,
  education: -3,
  agriculture: -3,
};

const scoreFromResponses = (responses) => {
  if (responses.length === 0) return 50; // neutral default, no data yet

  const avgWeight =
    responses.reduce((sum, r) => sum + (CATEGORY_WEIGHT[r.category] ?? -4), 0) /
    responses.length;

  // Map avgWeight (roughly -9..0) onto a 0-100 scale centered around 65
  const score = Math.round(65 + avgWeight * 3);
  return Math.max(0, Math.min(100, score));
};

const sentimentFromScore = (score) => {
  if (score >= 60) return 'positive';
  if (score >= 40) return 'neutral';
  return 'negative';
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const runAggregation = async () => {
  await connectDB();

  const today = startOfDay(new Date());
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // ---- 1. Per-county mood score + top issues (today's responses) ----
  const counties = await County.find({ parentCounty: null }).select('name');

  for (const county of counties) {
    const todaysResponses = await Response.find({
      county: county.name,
      createdAt: { $gte: today },
    });

    const score = scoreFromResponses(todaysResponses);

    // Top issues by % share of today's responses
    const counts = {};
    todaysResponses.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    const total = todaysResponses.length || 1;
    const topIssues = Object.entries(counts)
      .map(([category, count]) => ({
        category,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    // Roll the 30-day trend window forward
    const county30d = await County.findById(county._id);
    const trend = (county30d.trend30Days || []).filter(
      (p) => p.date >= thirtyDaysAgo
    );
    const alreadyHasToday = trend.some(
      (p) => startOfDay(p.date).getTime() === today.getTime()
    );
    if (!alreadyHasToday) {
      trend.push({ date: today, score });
    } else {
      trend[trend.length - 1].score = score;
    }

    await County.updateOne(
      { _id: county._id },
      {
        $set: {
          moodScore: score,
          sentiment: sentimentFromScore(score),
          topIssues: topIssues.length ? topIssues : county30d.topIssues,
          trend30Days: trend,
          lastUpdated: new Date(),
        },
      }
    );
  }

  // ---- 2. National MoodSnapshot (today) ----
  const allTodaysResponses = await Response.find({ createdAt: { $gte: today } });
  const nationalScore = scoreFromResponses(allTodaysResponses);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const previousSnapshot = await MoodSnapshot.findOne({ date: yesterday });
  const changeFromPrevious = previousSnapshot
    ? nationalScore - previousSnapshot.nationalMoodScore
    : 0;

  const counts = {};
  allTodaysResponses.forEach((r) => {
    counts[r.category] = (counts[r.category] || 0) + 1;
  });
  const total = allTodaysResponses.length || 1;
  const trending = Object.entries(counts)
    .map(([category, count]) => {
      const percentage = Math.round((count / total) * 100);
      const prevCategoryEntry = previousSnapshot?.trending.find(
        (t) => t.category === category
      );
      const changePercentagePoints = prevCategoryEntry
        ? percentage - prevCategoryEntry.percentage
        : 0;
      return { category, percentage, changePercentagePoints };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  await MoodSnapshot.findOneAndUpdate(
    { date: today },
    {
      date: today,
      nationalMoodScore: nationalScore,
      changeFromPrevious,
      trending,
      // aiDailySummary intentionally left untouched here - see generateAiSummary.js
    },
    { upsert: true }
  );

  console.log(
    `Aggregation complete for ${today.toDateString()}. National score: ${nationalScore}`
  );
  await mongoose.disconnect();
  process.exit(0);
};

runAggregation().catch((err) => {
  console.error('Aggregation failed:', err);
  process.exit(1);
});
