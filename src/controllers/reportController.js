// src/controllers/reportController.js
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const reportAdminService = require('../services/reportAdminService');

const VALID_RESOLUTIONS = ['DISMISS', 'WARN_USER', 'SUSPEND_USER', 'BAN_USER', 'REMOVE_CONTENT'];

const list = asyncHandler(async (req, res) => {
  const { page, limit, sort, order, status, entityType } = req.query;

  const result = await reportAdminService.listReports({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 25,
    sort: sort || 'createdAt',
    order: order === 'asc' ? 'asc' : 'desc',
    status,
    entityType,
  });

  res.json(result);
});

const resolve = asyncHandler(async (req, res) => {
  const { resolution, note } = req.body;
  if (!VALID_RESOLUTIONS.includes(resolution)) {
    throw new ApiError(400, `resolution must be one of: ${VALID_RESOLUTIONS.join(', ')}`);
  }

  const report = await reportAdminService.resolveReport(req.params.id, { resolution, note }, req.admin.id);
  if (!report) throw new ApiError(404, 'Report not found');

  res.json({ success: true });
});

module.exports = { list, resolve };
