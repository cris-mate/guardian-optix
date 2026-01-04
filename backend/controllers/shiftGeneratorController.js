/**
 * Shift Generator Controller
 *
 * API endpoints for generating and managing unassigned shifts.
 */

const asyncHandler = require('../utils/asyncHandler');
const {
  generateAndSaveShiftsForSite,
  generateShiftsForAllSites,
  getShiftStats,
  getUnassignedShiftsBySite,
  addDays,
  formatDate,
} = require('../utils/shiftGenerator');

// ============================================
// Generate Shifts
// ============================================

/**
 * @desc    Generate shifts for a specific site
 * @route   POST /api/shifts/generate/:siteId
 * @access  Private (Manager/Admin)
 */
const generateForSite = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const { startDate, endDate, weeks = 2 } = req.body;

  const options = {
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : addDays(new Date(), weeks * 7),
    skipExisting: true,
  };

  const result = await generateAndSaveShiftsForSite(siteId, options);

  res.status(201).json({
    success: true,
    message: `Generated ${result.created} shifts for site`,
    data: {
      created: result.created,
      dateRange: {
        start: formatDate(options.startDate),
        end: formatDate(options.endDate),
      },
    },
  });
});

/**
 * @desc    Generate shifts for all active sites
 * @route   POST /api/shifts/generate-all
 * @access  Private (Admin)
 */
const generateForAllSites = asyncHandler(async (req, res) => {
  const { startDate, endDate, weeks = 2 } = req.body;

  const options = {
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : addDays(new Date(), weeks * 7),
    skipExisting: true,
  };

  const result = await generateShiftsForAllSites(options);

  res.status(201).json({
    success: true,
    message: `Generated ${result.totalShiftsCreated} shifts across ${result.totalSites} sites`,
    data: result,
  });
});

// ============================================
// Statistics for ActivityHub
// ============================================

/**
 * @desc    Get shift coverage statistics
 * @route   GET /api/shifts/stats/coverage
 * @access  Private
 */
const getCoverageStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, days = 7 } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : addDays(new Date(), parseInt(days)),
  };

  const stats = await getShiftStats(options);

  // Calculate coverage percentage
  const coveragePercentage = stats.totalShifts > 0
    ? Math.round((stats.assignedShifts / stats.totalShifts) * 100)
    : 100;

  res.json({
    success: true,
    data: {
      ...stats,
      coveragePercentage,
      dateRange: {
        start: formatDate(options.startDate),
        end: formatDate(options.endDate),
      },
    },
  });
});

/**
 * @desc    Get unassigned shifts grouped by site
 * @route   GET /api/shifts/stats/unassigned
 * @access  Private
 */
const getUnassignedStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, days = 7 } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : addDays(new Date(), parseInt(days)),
  };

  const unassignedBySite = await getUnassignedShiftsBySite(options);

  const totalUnassigned = unassignedBySite.reduce((sum, site) => sum + site.count, 0);

  res.json({
    success: true,
    data: {
      totalUnassigned,
      sitesNeedingAttention: unassignedBySite.length,
      bySite: unassignedBySite,
      dateRange: {
        start: formatDate(options.startDate),
        end: formatDate(options.endDate),
      },
    },
  });
});

/**
 * @desc    Get combined ActivityHub statistics
 * @route   GET /api/shifts/stats/activityHub
 * @access  Private
 */
const getActivityHubStats = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  const today = new Date();
  const endDate = addDays(today, parseInt(days));

  const [stats, unassignedBySite] = await Promise.all([
    getShiftStats({ startDate: today, endDate }),
    getUnassignedShiftsBySite({ startDate: today, endDate }),
  ]);

  const coveragePercentage = stats.totalShifts > 0
    ? Math.round((stats.assignedShifts / stats.totalShifts) * 100)
    : 100;

  res.json({
    success: true,
    data: {
      summary: {
        totalShifts: stats.totalShifts,
        assignedShifts: stats.assignedShifts,
        unassignedShifts: stats.unassignedShifts,
        coveragePercentage,
        completedShifts: stats.completedShifts,
        inProgressShifts: stats.inProgressShifts,
      },
      attention: {
        sitesNeedingCoverage: unassignedBySite.length,
        urgentUnassigned: unassignedBySite.slice(0, 5), // Top 5 sites
      },
      dateRange: {
        start: formatDate(today),
        end: formatDate(endDate),
        days: parseInt(days),
      },
    },
  });
});

// ============================================
// Exports
// ============================================

module.exports = {
  generateForSite,
  generateForAllSites,
  getCoverageStats,
  getUnassignedStats,
  getActivityHubStats,
};