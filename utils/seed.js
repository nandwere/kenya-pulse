require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const KENYA_COUNTIES = require('./kenyaCounties');

const County = require('../models/County');
const DailyQuestion = require('../models/DailyQuestion');
const MoodSnapshot = require('../models/MoodSnapshot');
const CommunityPost = require('../models/CommunityPost');

// A few counties get richer seed data (matching the mockups) so the app
// has something interesting to show out of the box. Everything else in
// KENYA_COUNTIES gets inserted with a neutral default score of 50 - the
// aggregation job (utils/aggregateMood.js) will start giving them real
// numbers as soon as citizens submit responses in those counties.
const FEATURED = {
  'Kisumu County': {
    moodScore: 61,
    sentiment: 'neutral',
    topIssues: [
      { category: 'Water', percentage: 42 },
      { category: 'Healthcare', percentage: 28 },
      { category: 'Jobs', percentage: 16 },
    ],
    aiSummary:
      'Water access concerns increased by 24% this week. Healthcare availability remains a major issue in rural areas.',
  },
  'Nairobi County': { moodScore: 64, sentiment: 'neutral' },
  'Mombasa County': { moodScore: 70, sentiment: 'positive' },
  'Nakuru County': { moodScore: 52, sentiment: 'neutral' },
};

const run = async () => {
  await connectDB();

  await Promise.all([
    County.deleteMany({}),
    DailyQuestion.deleteMany({}),
    MoodSnapshot.deleteMany({}),
    CommunityPost.deleteMany({}),
  ]);

  const counties = KENYA_COUNTIES.map((name) => ({
    name,
    ...(FEATURED[name] ?? { moodScore: 50, sentiment: 'neutral' }),
  }));

  await County.insertMany(counties);

  // Kisumu's sub-county breakdown, shown on the My County screen.
  await County.insertMany([
    { name: 'Kisumu Central', parentCounty: 'Kisumu County', moodScore: 68, sentiment: 'positive' },
    { name: 'Kisumu East', parentCounty: 'Kisumu County', moodScore: 58, sentiment: 'neutral' },
    { name: 'Kisumu West', parentCounty: 'Kisumu County', moodScore: 63, sentiment: 'positive' },
    { name: 'Nyando', parentCounty: 'Kisumu County', moodScore: 55, sentiment: 'neutral' },
  ]);

  await DailyQuestion.create({
    text: 'What is the biggest challenge affecting your community today?',
    date: new Date(),
    categoryOptions: [
      { key: 'cost_of_living', label: 'Cost of Living', icon: '💰' },
      { key: 'jobs', label: 'Jobs', icon: '💼' },
      { key: 'water', label: 'Water', icon: '💧' },
      { key: 'healthcare', label: 'Healthcare', icon: '🏥' },
      { key: 'education', label: 'Education', icon: '🎓' },
      { key: 'roads', label: 'Roads', icon: '🚧' },
      { key: 'security', label: 'Security', icon: '🚔' },
      { key: 'agriculture', label: 'Agriculture', icon: '🌱' },
      { key: 'electricity', label: 'Electricity', icon: '⚡' },
    ],
  });

  await MoodSnapshot.create({
    date: new Date(),
    nationalMoodScore: 68,
    changeFromPrevious: 3,
    trending: [
      { category: 'Cost of Living', percentage: 38, changePercentagePoints: 6 },
      { category: 'Water', percentage: 22, changePercentagePoints: 12 },
      { category: 'Jobs', percentage: 18, changePercentagePoints: -2 },
    ],
    aiDailySummary:
      'Citizens across Kenya continue to rank the cost of living as their biggest concern. Water shortages are rapidly increasing in western counties.',
  });

  await CommunityPost.insertMany([
    { anonId: 'seed-1', county: 'Kisumu East', text: 'Many residents report unreliable water supply.', category: 'Water', agreeCount: 348 },
    { anonId: 'seed-2', county: 'Nairobi West', text: 'Youth employment opportunities remain limited.', category: 'Jobs', agreeCount: 612 },
    { anonId: 'seed-3', county: 'Nakuru Town East', text: 'The high cost of basic commodities is affecting families.', category: 'Cost of Living', agreeCount: 523 },
    { anonId: 'seed-4', county: 'Mombasa County', text: 'Good progress in waste collection and environmental cleanliness.', category: 'Environment', agreeCount: 287 },
  ]);

  console.log('Seed data inserted.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
