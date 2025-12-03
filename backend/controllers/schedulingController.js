/**
 * Scheduling Controller
 *
 * Handles shift and task management with officer recommendation system.
 * Includes intelligent officer matching based on distance, availability,
 * certifications, and performance scoring.
 *
 * Socket.io emissions integrated for real-time dashboard updates.
 */

const asyncHandler = require('../utils/asyncHandler');
const Shift = require('../models/Shift');
const User = require('../models/User');
const Site = require('../models/Site');
const {
  emitShiftUpdate,
  emitTaskComplete,
  emitActivity,
} = require('../socket/socketManager');

// ============================================
// Postcode & Distance Utilities
// ============================================

/**
 * UK Postcode area approximate coordinates
 * Maps postcode prefixes to lat/lng for distance calculations
 */
const UK_POSTCODE_COORDS = {
  // London
  'E': { lat: 51.5389, lng: 0.0556 },
  'EC': { lat: 51.5155, lng: -0.0922 },
  'N': { lat: 51.5732, lng: -0.0960 },
  'NW': { lat: 51.5472, lng: -0.1738 },
  'SE': { lat: 51.4505, lng: -0.0209 },
  'SW': { lat: 51.4613, lng: -0.1588 },
  'W': { lat: 51.5130, lng: -0.1805 },
  'WC': { lat: 51.5170, lng: -0.1200 },
  // Greater London & surrounds
  'BR': { lat: 51.4039, lng: 0.0198 },
  'CR': { lat: 51.3714, lng: -0.0977 },
  'DA': { lat: 51.4468, lng: 0.2116 },
  'EN': { lat: 51.6522, lng: -0.0808 },
  'HA': { lat: 51.5802, lng: -0.3340 },
  'IG': { lat: 51.5590, lng: 0.0741 },
  'KT': { lat: 51.3782, lng: -0.2861 },
  'RM': { lat: 51.5752, lng: 0.1827 },
  'SM': { lat: 51.3618, lng: -0.1945 },
  'TW': { lat: 51.4491, lng: -0.3254 },
  'UB': { lat: 51.5462, lng: -0.4417 },
  'WD': { lat: 51.6565, lng: -0.3903 },
  // Other major UK cities
  'B': { lat: 52.4862, lng: -1.8904 },      // Birmingham
  'M': { lat: 53.4808, lng: -2.2426 },      // Manchester
  'L': { lat: 53.4084, lng: -2.9916 },      // Liverpool
  'LS': { lat: 53.8008, lng: -1.5491 },     // Leeds
  'S': { lat: 53.3811, lng: -1.4701 },      // Sheffield
  'BS': { lat: 51.4545, lng: -2.5879 },     // Bristol
  'NG': { lat: 52.9548, lng: -1.1581 },     // Nottingham
  'G': { lat: 55.8642, lng: -4.2518 },      // Glasgow
  'EH': { lat: 55.9533, lng: -3.1883 },     // Edinburgh
  'CF': { lat: 51.4816, lng: -3.1791 },     // Cardiff
  'BT': { lat: 54.5973, lng: -5.9301 },     // Belfast
};

/**
 * Extract postcode prefix from full UK postcode
 * @param {string} postcode - Full UK postcode (e.g., "SW1A 1AA")
 * @returns {string} Postcode prefix (e.g., "SW")
 */
const extractPostcodePrefix = (postcode) => {
  if (!postcode) return null;

  // Clean and uppercase
  const cleaned = postcode.toUpperCase().replace(/\s+/g, '');

  // Match prefix pattern (1-2 letters, optionally followed by numbers)
  const match = cleaned.match(/^([A-Z]{1,2})/);
  return match ? match[1] : null;
};

/**
 * Get approximate coordinates for a UK postcode
 * @param {string} postcode - UK postcode
 * @returns {Object|null} { lat, lng } or null if not found
 */
const getPostcodeCoords = (postcode) => {
  const prefix = extractPostcodePrefix(postcode);
  if (!prefix) return null;

  // Try exact match first, then single letter
  return UK_POSTCODE_COORDS[prefix] || UK_POSTCODE_COORDS[prefix[0]] || null;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - { lat, lng }
 * @param {Object} coord2 - { lat, lng }
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return null;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
    Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

// ============================================
// Officer Scoring System
// ============================================

/**
 * Score an officer for a specific site assignment
 * Higher score = better match
 *
 * Scoring factors:
 * - Distance (40 points max) - closer is better
 * - Availability (20 points) - available officers preferred
 * - Guard type match (15 points) - matching site requirements
 * - Shift preference (10 points) - matches preferred shift time
 * - Certification status (10 points) - valid SIA licence
 * - Recent performance (5 points) - no recent issues
 *
 * @param {Object} officer - Officer document
 * @param {Object} site - Site document
 * @param {Object} options - { date, shiftType }
 * @returns {Object} { score, breakdown }
 */
const scoreOfficer = async (officer, site, options = {}) => {
  const breakdown = {
    distance: 0,
    availability: 0,
    guardTypeMatch: 0,
    shiftPreference: 0,
    certification: 0,
    performance: 0,
  };

  // 1. Distance Score (max 40 points)
  const officerCoords = getPostcodeCoords(officer.postCode);
  const siteCoords = getPostcodeCoords(site.address?.postCode || site.postCode);

  if (officerCoords && siteCoords) {
    const distance = calculateDistance(officerCoords, siteCoords);

    if (distance !== null) {
      // Score: 40 points for 0km, decreasing to 0 at 50km+
      if (distance <= 5) {
        breakdown.distance = 40;
      } else if (distance <= 10) {
        breakdown.distance = 35;
      } else if (distance <= 20) {
        breakdown.distance = 25;
      } else if (distance <= 30) {
        breakdown.distance = 15;
      } else if (distance <= 50) {
        breakdown.distance = 5;
      } else {
        breakdown.distance = 0;
      }
    }
  }

  // 2. Availability Score (max 20 points)
  if (officer.availability === true) {
    breakdown.availability = 20;
  } else if (officer.availability === 'partial') {
    breakdown.availability = 10;
  }

  // 3. Guard Type Match (max 15 points)
  // Check if officer's guard type matches site requirements
  const siteType = site.siteType?.toLowerCase() || '';
  const guardType = officer.guardType?.toLowerCase() || '';

  const typeMatches = {
    'corporate': ['static', 'close protection'],
    'retail': ['static', 'mobile patrol'],
    'industrial': ['static', 'dog handler', 'mobile patrol'],
    'residential': ['static', 'mobile patrol'],
    'event': ['static', 'close protection', 'dog handler'],
    'construction': ['static', 'mobile patrol', 'dog handler'],
  };

  const preferredTypes = typeMatches[siteType] || [];
  if (preferredTypes.some(type => guardType.includes(type.replace(' ', '-')))) {
    breakdown.guardTypeMatch = 15;
  } else if (guardType === 'static') {
    // Static guards are generalists
    breakdown.guardTypeMatch = 10;
  }

  // 4. Shift Preference Match (max 10 points)
  if (options.shiftType && officer.shiftTime) {
    const shiftType = options.shiftType.toLowerCase();
    const preference = officer.shiftTime.toLowerCase();

    if (preference === 'any') {
      breakdown.shiftPreference = 8;
    } else if (
      (shiftType === 'morning' && preference === 'day') ||
      (shiftType === 'afternoon' && preference === 'day') ||
      (shiftType === 'night' && preference === 'night')
    ) {
      breakdown.shiftPreference = 10;
    } else if (preference === 'flexible') {
      breakdown.shiftPreference = 6;
    }
  }

  // 5. Certification Score (max 10 points)
  // This would ideally check actual certification status
  // For now, assume all guards have valid SIA
  breakdown.certification = 10;

  // 6. Performance Score (max 5 points)
  // Base score - could be enhanced with actual performance data
  breakdown.performance = 5;

  // Calculate total
  const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return {
    score: totalScore,
    maxScore: 100,
    percentage: Math.round((totalScore / 100) * 100),
    breakdown,
  };
};

// ============================================
// Shift CRUD Operations
// ============================================

/**
 * @route   GET /api/scheduling/shifts
 * @desc    Get all shifts with filtering
 * @access  Private
 */
const getShifts = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    officerId,
    siteId,
    shiftType,
    status,
    page = 1,
    limit = 100,
  } = req.query;

  const query = {};

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  if (officerId) query.officer = officerId;
  if (siteId) query.site = siteId;
  if (shiftType && shiftType !== 'all') query.shiftType = shiftType;
  if (status && status !== 'all') query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [shifts, total] = await Promise.all([
    Shift.find(query)
      .populate('officer', 'fullName username badgeNumber guardType')
      .populate('site', 'name address postCode')
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Shift.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: shifts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @route   GET /api/scheduling/shifts/stats
 * @desc    Get shift statistics
 * @access  Private
 */
const getShiftStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const today = new Date().toISOString().split('T')[0];
  const start = startDate || today;
  const end = endDate || today;

  const shifts = await Shift.find({
    date: { $gte: start, $lte: end },
  });

  const stats = {
    totalShifts: shifts.length,
    scheduledShifts: shifts.filter(s => s.status === 'scheduled').length,
    activeShifts: shifts.filter(s => s.status === 'in-progress').length,
    completedShifts: shifts.filter(s => s.status === 'completed').length,
    cancelledShifts: shifts.filter(s => s.status === 'cancelled').length,
  };

  // Task statistics
  let totalTasks = 0;
  let completedTasks = 0;

  shifts.forEach(shift => {
    if (shift.tasks) {
      totalTasks += shift.tasks.length;
      completedTasks += shift.tasks.filter(t => t.completed).length;
    }
  });

  stats.totalTasks = totalTasks;
  stats.completedTasks = completedTasks;
  stats.pendingTasks = totalTasks - completedTasks;
  stats.taskCompletionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * @route   GET /api/scheduling/shifts/:id
 * @desc    Get single shift by ID
 * @access  Private
 */
const getShiftById = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id)
    .populate('officer', 'fullName username badgeNumber guardType phoneNumber email')
    .populate('site', 'name address postCode contactName contactPhone');

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  res.json({
    success: true,
    data: shift,
  });
});

/**
 * @route   POST /api/scheduling/shifts
 * @desc    Create new shift
 * @access  Private (Admin/Manager)
 */
const createShift = asyncHandler(async (req, res) => {
  const { officer, site, date, startTime, endTime, shiftType, tasks, notes } = req.body;

  // Validate officer
  const officerDoc = await User.findById(officer);
  if (!officerDoc || officerDoc.role !== 'Guard') {
    res.status(400);
    throw new Error('Invalid officer');
  }

  // Validate site
  const siteDoc = await Site.findById(site);
  if (!siteDoc) {
    res.status(400);
    throw new Error('Invalid site');
  }

  // Check for conflicts
  const conflict = await Shift.findOne({
    officer,
    date,
    status: { $ne: 'cancelled' },
  });

  if (conflict) {
    res.status(400);
    throw new Error('Officer already has a shift scheduled for this date');
  }

  const shift = await Shift.create({
    officer,
    site,
    date,
    startTime,
    endTime,
    shiftType,
    tasks: tasks || [],
    notes,
    status: 'scheduled',
  });

  await shift.populate('officer', 'fullName username');
  await shift.populate('site', 'name');

  // Emit socket events
  emitShiftUpdate({
    shiftId: shift._id,
    status: 'scheduled',
    officerId: officer,
    officerName: shift.officer?.fullName,
    siteName: shift.site?.name,
  });

  emitActivity({
    type: 'shift-created',
    shiftId: shift._id,
    officerName: shift.officer?.fullName,
    siteName: shift.site?.name,
    date,
    shiftType,
    createdBy: req.user.fullName,
  });

  res.status(201).json({
    success: true,
    data: shift,
  });
});

/**
 * @route   PUT /api/scheduling/shifts/:id
 * @desc    Update shift
 * @access  Private (Admin/Manager)
 */
const updateShift = asyncHandler(async (req, res) => {
  const { officer, site, date, startTime, endTime, shiftType, tasks, notes, status } = req.body;

  const shift = await Shift.findById(req.params.id);

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  const previousStatus = shift.status;

  // Update fields
  if (officer) shift.officer = officer;
  if (site) shift.site = site;
  if (date) shift.date = date;
  if (startTime) shift.startTime = startTime;
  if (endTime) shift.endTime = endTime;
  if (shiftType) shift.shiftType = shiftType;
  if (tasks !== undefined) shift.tasks = tasks;
  if (notes !== undefined) shift.notes = notes;
  if (status) shift.status = status;

  await shift.save();
  await shift.populate('officer', 'fullName username');
  await shift.populate('site', 'name');

  // Emit socket event if status changed
  if (status && status !== previousStatus) {
    emitShiftUpdate({
      shiftId: shift._id,
      status,
      previousStatus,
      officerId: shift.officer?._id,
      officerName: shift.officer?.fullName,
      siteName: shift.site?.name,
    });

    emitActivity({
      type: 'shift-status-changed',
      shiftId: shift._id,
      officerName: shift.officer?.fullName,
      siteName: shift.site?.name,
      previousStatus,
      newStatus: status,
      updatedBy: req.user.fullName,
    });
  }

  res.json({
    success: true,
    data: shift,
  });
});

/**
 * @route   DELETE /api/scheduling/shifts/:id
 * @desc    Delete shift
 * @access  Private (Admin/Manager)
 */
const deleteShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id)
    .populate('officer', 'fullName')
    .populate('site', 'name');

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  await shift.deleteOne();

  emitActivity({
    type: 'shift-deleted',
    shiftId: req.params.id,
    officerName: shift.officer?.fullName,
    siteName: shift.site?.name,
    deletedBy: req.user.fullName,
  });

  res.json({
    success: true,
    message: 'Shift deleted',
  });
});

/**
 * @route   PATCH /api/scheduling/shifts/:id/status
 * @desc    Update shift status
 * @access  Private
 */
const updateShiftStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const shift = await Shift.findById(req.params.id)
    .populate('officer', 'fullName')
    .populate('site', 'name');

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  const previousStatus = shift.status;
  shift.status = status;

  // Set actual timestamps
  if (status === 'in-progress' && !shift.actualStart) {
    shift.actualStart = new Date();
  } else if (status === 'completed' && !shift.actualEnd) {
    shift.actualEnd = new Date();
  }

  await shift.save();

  // Emit socket events
  emitShiftUpdate({
    shiftId: shift._id,
    status,
    previousStatus,
    officerId: shift.officer?._id,
    officerName: shift.officer?.fullName,
    siteName: shift.site?.name,
  });

  emitActivity({
    type: `shift-${status}`,
    shiftId: shift._id,
    officerName: shift.officer?.fullName,
    siteName: shift.site?.name,
  });

  res.json({
    success: true,
    data: shift,
  });
});

/**
 * @route   PATCH /api/scheduling/shifts/:shiftId/tasks/:taskId
 * @desc    Update task completion status
 * @access  Private
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { shiftId, taskId } = req.params;
  const { completed } = req.body;

  const shift = await Shift.findById(shiftId)
    .populate('officer', 'fullName')
    .populate('site', 'name');

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  const task = shift.tasks.id(taskId);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.completed = completed;

  if (completed) {
    task.completedAt = new Date();
    task.completedBy = req.user._id;
  } else {
    task.completedAt = null;
    task.completedBy = null;
  }

  await shift.save();

  // Emit socket event for completion
  if (completed) {
    emitTaskComplete({
      shiftId: shift._id,
      taskId: task._id,
      taskDescription: task.description,
      completedBy: req.user._id,
      completedByName: req.user.fullName,
    });

    emitActivity({
      type: 'task-completed',
      shiftId: shift._id,
      taskDescription: task.description,
      officerName: shift.officer?.fullName,
      siteName: shift.site?.name,
      completedBy: req.user.fullName,
    });
  }

  res.json({
    success: true,
    data: task,
  });
});

// ============================================
// Resource Endpoints
// ============================================

/**
 * @route   GET /api/scheduling/available-officers
 * @desc    Get available officers for scheduling
 * @access  Private
 */
const getAvailableOfficers = asyncHandler(async (req, res) => {
  const { date, shiftType } = req.query;

  // Get all active guards
  const guards = await User.find({
    role: 'Guard',
    availability: true,
  }).select('fullName username badgeNumber guardType postCode shiftTime phoneNumber');

  // If date provided, filter out those already scheduled
  if (date) {
    const scheduledShifts = await Shift.find({
      date,
      status: { $ne: 'cancelled' },
    }).select('officer');

    const scheduledIds = new Set(scheduledShifts.map(s => s.officer.toString()));
    const available = guards.filter(g => !scheduledIds.has(g._id.toString()));

    return res.json({
      success: true,
      data: available,
      count: available.length,
    });
  }

  res.json({
    success: true,
    data: guards,
    count: guards.length,
  });
});

/**
 * @route   GET /api/scheduling/available-sites
 * @desc    Get available sites for scheduling
 * @access  Private
 */
const getAvailableSites = asyncHandler(async (req, res) => {
  const sites = await Site.find({ status: 'active' })
    .populate('client', 'companyName')
    .select('name address postCode siteType client guardsRequired');

  const formatted = sites.map(site => ({
    _id: site._id,
    name: site.name,
    address: site.address?.street || '',
    postCode: site.address?.postCode || site.postCode,
    siteType: site.siteType,
    clientName: site.client?.companyName || 'Unknown Client',
    guardsRequired: site.guardsRequired || 1,
  }));

  res.json({
    success: true,
    data: formatted,
    count: formatted.length,
  });
});

/**
 * @route   GET /api/scheduling/recommended-officers/:siteId
 * @desc    Get recommended officers for a site based on scoring
 * @access  Private
 */
const getRecommendedOfficers = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const { date, shiftType, limit = 10 } = req.query;

  // Get site
  const site = await Site.findById(siteId);
  if (!site) {
    res.status(404);
    throw new Error('Site not found');
  }

  // Get available officers
  let officers = await User.find({
    role: 'Guard',
    availability: true,
  }).select('fullName username badgeNumber guardType postCode shiftTime phoneNumber email');

  // Filter out already scheduled if date provided
  if (date) {
    const scheduledShifts = await Shift.find({
      date,
      status: { $ne: 'cancelled' },
    }).select('officer');

    const scheduledIds = new Set(scheduledShifts.map(s => s.officer.toString()));
    officers = officers.filter(o => !scheduledIds.has(o._id.toString()));
  }

  // Score each officer
  const scoredOfficers = await Promise.all(
    officers.map(async (officer) => {
      const scoring = await scoreOfficer(officer, site, { date, shiftType });

      return {
        officer: {
          _id: officer._id,
          fullName: officer.fullName,
          username: officer.username,
          badgeNumber: officer.badgeNumber,
          guardType: officer.guardType,
          postCode: officer.postCode,
          shiftTime: officer.shiftTime,
          phoneNumber: officer.phoneNumber,
        },
        score: scoring.score,
        percentage: scoring.percentage,
        breakdown: scoring.breakdown,
        recommendation: getRecommendationLevel(scoring.percentage),
      };
    })
  );

  // Sort by score descending
  scoredOfficers.sort((a, b) => b.score - a.score);

  // Limit results
  const topOfficers = scoredOfficers.slice(0, parseInt(limit));

  res.json({
    success: true,
    data: {
      site: {
        _id: site._id,
        name: site.name,
        postCode: site.address?.postCode || site.postCode,
        siteType: site.siteType,
      },
      recommendations: topOfficers,
      totalAvailable: officers.length,
    },
  });
});

/**
 * Get recommendation level based on score percentage
 */
const getRecommendationLevel = (percentage) => {
  if (percentage >= 80) return 'highly-recommended';
  if (percentage >= 60) return 'recommended';
  if (percentage >= 40) return 'suitable';
  return 'available';
};

// ============================================
// Exports
// ============================================

module.exports = {
  getShifts,
  getShiftStats,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  updateShiftStatus,
  updateTaskStatus,
  getAvailableOfficers,
  getAvailableSites,
  getRecommendedOfficers,
};