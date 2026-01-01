/**
 * Shift Generator Utility
 *
 * Generates unassigned shifts based on site coverage requirements.
 * Guards are assigned manually via the scheduling interface.
 */

const Site = require('../models/Site');
const Shift = require('../models/Shift');
const { SHIFT_TIMES } = require('./shiftTimes');

// ============================================
// Constants
// ============================================

const DEFAULT_SHIFT_TYPE = 'Night';
const DEFAULT_DAYS_OF_WEEK = [1, 2, 3, 4, 5]; // Mon-Fri (ISO 8601)

// ============================================
// Helper Functions
// ============================================

/**
 * Convert ISO day (1=Mon, 7=Sun) to JS Date.getDay() (0=Sun, 6=Sat)
 */
const isoToJsDay = (isoDay) => {
  return isoDay === 7 ? 0 : isoDay;
};

/**
 * Convert JS Date.getDay() to ISO day
 */
const jsDayToIso = (jsDay) => {
  return jsDay === 0 ? 7 : jsDay;
};

/**
 * Add days to a date (returns new Date)
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Format date to YYYY-MM-DD string
 */
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Generate date range array
 */
const getDateRange = (startDate, endDate) => {
  const dates = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }

  return dates;
};

// ============================================
// Main Generator Functions
// ============================================

/**
 * Generate shifts for a single site within a date range
 *
 * @param {string} siteId - Site ObjectId
 * @param {Object} options - Generation options
 * @param {Date|string} options.startDate - Start of date range
 * @param {Date|string} options.endDate - End of date range
 * @param {boolean} options.skipExisting - Skip dates that already have shifts (default: true)
 * @returns {Promise<Array>} - Array of generated shift objects (not saved)
 */
const generateShiftsForSite = async (siteId, options = {}) => {
  const {
    startDate = new Date(),
    endDate,
    skipExisting = true,
  } = options;

  // Default to 2 weeks ahead if no end date
  const end = endDate || addDays(new Date(startDate), 14);

  // Fetch site with requirements
  const site = await Site.findById(siteId);
  if (!site) {
    throw new Error(`Site not found: ${siteId}`);
  }

  // Check if site is active
  if (site.status !== 'active') {
    return [];
  }

  // Get requirements or use defaults
  const requirements = site.requirements;
  const daysOfWeek = requirements?.daysOfWeek || DEFAULT_DAYS_OF_WEEK;
  const shiftsPerDay = requirements?.shiftsPerDay || [
    {
      shiftType: DEFAULT_SHIFT_TYPE,
      guardsRequired: 1,
      guardType: 'Static',
    },
  ];

  // Check contract dates if requirements exist
  if (requirements) {
    const contractStart = new Date(requirements.contractStart);
    const contractEnd = requirements.contractEnd ? new Date(requirements.contractEnd) : null;

    // Skip if contract hasn't started
    if (contractStart > end) {
      return [];
    }

    // Skip if contract has ended
    if (contractEnd && contractEnd < startDate) {
      return [];
    }
  }

  // Get existing shifts for this site in date range (if skipExisting)
  let existingShiftDates = new Set();
  if (skipExisting) {
    const existingShifts = await Shift.find({
      site: siteId,
      date: {
        $gte: formatDate(new Date(startDate)),
        $lte: formatDate(end),
      },
    }).select('date shiftType');

    existingShifts.forEach((shift) => {
      existingShiftDates.add(`${shift.date}-${shift.shiftType}`);
    });
  }

  // Generate shifts
  const shifts = [];
  const dateRange = getDateRange(startDate, end);

  for (const date of dateRange) {
    const isoDay = jsDayToIso(date.getDay());

    // Check if this day is in operating days
    if (!daysOfWeek.includes(isoDay)) {
      continue;
    }

    // Check contract bounds
    if (requirements) {
      const contractStart = new Date(requirements.contractStart);
      const contractEnd = requirements.contractEnd ? new Date(requirements.contractEnd) : null;

      if (date < contractStart) continue;
      if (contractEnd && date > contractEnd) continue;
    }

    const dateStr = formatDate(date);

    // Generate shift for each requirement
    for (const req of shiftsPerDay) {
      const shiftKey = `${dateStr}-${req.shiftType}`;

      // Skip if shift already exists
      if (skipExisting && existingShiftDates.has(shiftKey)) {
        continue;
      }

      const shiftTimes = SHIFT_TIMES[req.shiftType];
      if (!shiftTimes) {
        console.warn(`Unknown shift type: ${req.shiftType}`);
        continue;
      }

      // Create shift for each guard required
      for (let i = 0; i < (req.guardsRequired || 1); i++) {
        shifts.push({
          site: siteId,
          guard: null, // Unassigned - to be manually assigned
          date: dateStr,
          shiftType: req.shiftType,
          startTime: shiftTimes.start,
          endTime: shiftTimes.end,
          status: 'scheduled',
          tasks: [], // Tasks can be added via templates later
          notes: req.guardsRequired > 1 ? `Position ${i + 1} of ${req.guardsRequired}` : undefined,
          metadata: {
            generatedAt: new Date(),
            guardType: req.guardType,
            requiredCertifications: req.requiredCertifications || [],
          },
        });
      }
    }
  }

  return shifts;
};

/**
 * Generate and save shifts for a site
 *
 * @param {string} siteId - Site ObjectId
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - { created: number, skipped: number, shifts: Array }
 */
const generateAndSaveShiftsForSite = async (siteId, options = {}) => {
  const shifts = await generateShiftsForSite(siteId, options);

  if (shifts.length === 0) {
    return { created: 0, skipped: 0, shifts: [] };
  }

  // Bulk insert shifts
  const createdShifts = await Shift.insertMany(shifts, { ordered: false });

  return {
    created: createdShifts.length,
    skipped: 0,
    shifts: createdShifts,
  };
};

/**
 * Generate shifts for all active sites with active contracts
 *
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Summary of generation results
 */
const generateShiftsForAllSites = async (options = {}) => {
  const sites = await Site.findWithActiveContracts();

  const results = {
    totalSites: sites.length,
    totalShiftsCreated: 0,
    siteResults: [],
  };

  for (const site of sites) {
    try {
      const result = await generateAndSaveShiftsForSite(site._id, options);
      results.totalShiftsCreated += result.created;
      results.siteResults.push({
        siteId: site._id,
        siteName: site.name,
        created: result.created,
        status: 'success',
      });
    } catch (error) {
      results.siteResults.push({
        siteId: site._id,
        siteName: site.name,
        created: 0,
        status: 'error',
        error: error.message,
      });
    }
  }

  return results;
};

// ============================================
// Statistics Functions
// ============================================

/**
 * Get shift statistics for dashboard/ActivityHub
 *
 * @param {Object} options - Query options
 * @param {Date|string} options.startDate - Start of date range
 * @param {Date|string} options.endDate - End of date range
 * @returns {Promise<Object>} - Shift statistics
 */
const getShiftStats = async (options = {}) => {
  const {
    startDate = new Date(),
    endDate = addDays(new Date(), 7),
  } = options;

  const startStr = formatDate(new Date(startDate));
  const endStr = formatDate(new Date(endDate));

  const [stats] = await Shift.aggregate([
    {
      $match: {
        date: { $gte: startStr, $lte: endStr },
      },
    },
    {
      $group: {
        _id: null,
        totalShifts: { $sum: 1 },
        unassignedShifts: {
          $sum: { $cond: [{ $eq: ['$guard', null] }, 1, 0] },
        },
        assignedShifts: {
          $sum: { $cond: [{ $ne: ['$guard', null] }, 1, 0] },
        },
        scheduledShifts: {
          $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] },
        },
        inProgressShifts: {
          $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] },
        },
        completedShifts: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        cancelledShifts: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
      },
    },
  ]);

  return stats || {
    totalShifts: 0,
    unassignedShifts: 0,
    assignedShifts: 0,
    scheduledShifts: 0,
    inProgressShifts: 0,
    completedShifts: 0,
    cancelledShifts: 0,
  };
};

/**
 * Get unassigned shifts grouped by site
 *
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Unassigned shifts by site
 */
const getUnassignedShiftsBySite = async (options = {}) => {
  const {
    startDate = new Date(),
    endDate = addDays(new Date(), 7),
  } = options;

  const startStr = formatDate(new Date(startDate));
  const endStr = formatDate(new Date(endDate));

  return Shift.aggregate([
    {
      $match: {
        date: { $gte: startStr, $lte: endStr },
        guard: null,
        status: 'scheduled',
      },
    },
    {
      $group: {
        _id: '$site',
        count: { $sum: 1 },
        shifts: {
          $push: {
            _id: '$_id',
            date: '$date',
            shiftType: '$shiftType',
          },
        },
      },
    },
    {
      $lookup: {
        from: 'sites',
        localField: '_id',
        foreignField: '_id',
        as: 'siteInfo',
      },
    },
    {
      $unwind: '$siteInfo',
    },
    {
      $project: {
        _id: 1,
        siteName: '$siteInfo.name',
        count: 1,
        shifts: { $slice: ['$shifts', 5] }, // Limit to 5 per site
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

// ============================================
// Exports
// ============================================

module.exports = {
  generateShiftsForSite,
  generateAndSaveShiftsForSite,
  generateShiftsForAllSites,
  getShiftStats,
  getUnassignedShiftsBySite,
  // Helpers (exported for testing)
  isoToJsDay,
  jsDayToIso,
  addDays,
  formatDate,
};