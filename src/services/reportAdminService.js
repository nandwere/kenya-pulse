// src/services/reportAdminService.js
const Report = require('../models/Report');
const User = require('../models/User');
const userAdminService = require('./userAdminService');

async function listReports({ page = 1, limit = 25, sort = 'createdAt', order = 'desc', status, entityType }) {
  const filter = {};
  if (status) filter.status = status;
  if (entityType) filter.entityType = entityType;

  const sortSpec = { [sort]: order === 'asc' ? 1 : -1 };
  const skip = (Math.max(1, page) - 1) * limit;

  const [reports, total] = await Promise.all([
    Report.find(filter).sort(sortSpec).skip(skip).limit(limit).populate('reporter', 'username'),
    Report.countDocuments(filter),
  ]);

  const data = await Promise.all(reports.map(toListItem));
  return { data, total };
}

/**
 * Resolves a short, human-readable summary of the reported entity —
 * mirrors what the reporting UI needs to show without a separate lookup
 * round-trip per row.
 *
 * NOTE: only USER is wired up against a real model here. Wire POST/COMMENT
 * up against your actual Post/Comment models — this intentionally degrades
 * gracefully rather than crashing the whole list if those aren't present
 * yet in this codebase.
 */
async function resolveEntitySummary(report) {
  try {
    if (report.entityType === 'USER') {
      const user = await User.findById(report.entityId).select('username');
      return user ? `@${user.username}` : '(deleted user)';
    }

    // TODO: wire these up to your real Post / Comment models, e.g.:
    // if (report.entityType === 'POST') {
    //   const post = await Post.findById(report.entityId).select('caption');
    //   return post ? truncate(post.caption, 80) : '(deleted post)';
    // }
    return `${report.entityType.toLowerCase()} #${report.entityId}`;
  } catch {
    return '(unable to resolve)';
  }
}

async function toListItem(report) {
  return {
    _id: report._id,
    reporterUsername: report.reporter?.username ?? '(unknown)',
    entityType: report.entityType,
    entityId: report.entityId,
    entitySummary: await resolveEntitySummary(report),
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt,
  };
}

async function resolveReport(reportId, { resolution, note }, adminId) {
  const report = await Report.findById(reportId);
  if (!report) return null;

  report.status = resolution === 'DISMISS' ? 'DISMISSED' : 'ACTIONED';
  report.resolution = resolution;
  report.resolutionNote = note;
  report.resolvedByAdmin = adminId;
  report.resolvedAt = new Date();
  await report.save();

  // Cascade the moderation decision to the actual user record when the
  // reported entity IS a user account.
  if (report.entityType === 'USER') {
    if (resolution === 'SUSPEND_USER') {
      await userAdminService.updateUserStatus(report.entityId, 'SUSPENDED');
    } else if (resolution === 'BAN_USER') {
      await userAdminService.updateUserStatus(report.entityId, 'BANNED');
    }
  }
  // REMOVE_CONTENT for POST/COMMENT: wire this up to your actual content
  // models once they exist in this codebase (soft-delete / hide the post).

  return report;
}

module.exports = { listReports, resolveReport };
