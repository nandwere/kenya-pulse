// src/services/dashboardService.js
const User = require('../models/User');
const Report = require('../models/Report');
const CommunityPost = require('../models/CommunityPost');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDaysAgo(days) {
  const d = startOfToday();
  d.setDate(d.getDate() - days);
  return d;
}

async function getStats() {
  const todayStart = startOfToday();
  const weekStart = startOfDaysAgo(7);

  const [
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    suspendedUsers,
    bannedUsers,
    pendingReports,
    reportsResolvedToday,
    insightsSharedToday,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({ createdAt: { $gte: weekStart } }),
    User.countDocuments({ accountStatus: 'SUSPENDED' }),
    User.countDocuments({ accountStatus: 'BANNED' }),
    Report.countDocuments({ status: 'PENDING' }),
    Report.countDocuments({ status: 'ACTIONED', resolvedAt: { $gte: todayStart } }),
    CommunityPost.countDocuments({ createdAt: { $gte: todayStart } }).catch(() => 0),
  ]);

  return {
    totalUsers,
    newUsersToday,
    newUsersThisWeek,
    suspendedUsers,
    bannedUsers,
    pendingReports,
    reportsResolvedToday,
    insightsSharedToday,
  };
}

module.exports = { getStats };
