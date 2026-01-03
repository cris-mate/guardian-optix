/**
 * Scheduling Controller
 *
 * Handles API requests for shift and task management.
 */

const Shift = require('../models/Shift');
const User = require('../models/User');
const Site = require('../models/Site');
const { emitShiftUpdate, emitTaskComplete } = require('../socket/socketManager');
const { scoreGuard: scoreGuard, getPostcodeCoords } = require('../services/guardMatchingService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/scheduling/shifts
 * @desc    Get all shifts with filtering
 * @access  Private
 */
const getShift = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    guardId: guardId,
    siteId,
    shiftType,
    status,
    sortBy = 'date',
    sortOrder = 'asc',
    page = 1,
    limit = 100,
  } = req.query;

  // Build query
  const query = {};

  // Date range filter
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  // Guard filter
  if (guardId) {
    query.guard = guardId;
  }

  // Site filter
  if (siteId) {
    query.site = siteId;
  }

  // Shift type filter
  if (shiftType && shiftType !== 'all') {
    query.shiftType = shiftType;
  }

  // Status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [shifts, total] = await Promise.all([
    Shift.find(query)
      .populate('guard', 'fullName siaLicenceNumber phoneNumber email')
      .populate('site', 'name address postCode')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit)),
    Shift.countDocuments(query),
  ]);

  res.status(200).json({
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

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = startDate;
    if (endDate) matchStage.date.$lte = endDate;
  }

  const stats = await Shift.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalShifts: { $sum: 1 },
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

  res.status(200).json({
    success: true,
    data: stats[0] || {
      totalShifts: 0,
      scheduledShifts: 0,
      inProgressShifts: 0,
      completedShifts: 0,
      cancelledShifts: 0,
    },
  });
});

/**
 * @route   GET /api/scheduling/shifts/:id
 * @desc    Get single shift by ID
 * @access  Private
 */
const getShiftById = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id)
    .populate('guard', 'fullName siaLicenceNumber phoneNumber email')
    .populate('site', 'name address postCode');

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  res.status(200).json({
    success: true,
    data: shift,
  });
});

/**
 * @route   POST /api/scheduling/shifts
 * @desc    Create new shift
 */
const createShift = asyncHandler(async (req, res) => {
  const {
    guardId: guardId,
    siteId,
    date,
    shiftType,
    tasks,
    notes,
  } = req.body;

  // Validate site
  const site = await Site.findById(siteId);
  if (!site) {
    res.status(400);
    throw new Error('Site not found');
  }

  // Validate guard if provided
  if (guardId) {
    const guard = await User.findById(guardId);
    if (!guard) {
      res.status(400);
      throw new Error('Guard not found');
    }

    // Check for conflicting shifts (only if guard assigned)
    const conflictingShift = await Shift.findOne({
      guard: guardId,
      date,
      shiftType,
      status: { $ne: 'cancelled' },
    });

    if (conflictingShift) {
      res.status(400);
      throw new Error('Guard already has a shift during this time');
    }
  }

  // Create shift (guard can be null)
  const shift = await Shift.create({
    guard: guardId || null,
    site: siteId,
    date,
    shiftType,
    tasks: tasks || [],
    notes,
    status: 'scheduled',
    createdBy: req.user._id,
  });

  // Populate and return
  const populatedShift = await Shift.findById(shift._id)
    .populate('guard', 'fullName phoneNumber email siaLicence')
    .populate('site', 'name address postCode');

  res.status(201).json({
    success: true,
    data: populatedShift,
  });
});

/**
 * @route   PUT /api/scheduling/shifts/:id
 * @desc    Update shift
 */
const updateShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  // Update shift
  const updatedShift = await Shift.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
    .populate('guard', 'fullName siaLicenceNumber phoneNumber email')
    .populate('site', 'name address postCode');

  res.status(200).json({
    success: true,
    data: updatedShift,
  });
});

/**
 * @route   DELETE /api/scheduling/shifts/:id
 * @desc    Delete shift
 */
const deleteShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  await shift.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Shift deleted successfully',
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

  const shift = await Shift.findByIdAndUpdate(
    req.params.id,
    { status, updatedAt: new Date() },
    { new: true }
  )
    .populate('guard', 'fullName')
    .populate('site', 'name');

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  res.status(200).json({
    success: true,
    data: shift,
  });

  emitShiftUpdate({
    shiftId,
    status: newStatus,
    guardId: shift.guard?._id,
    guardName: shift.guard?.fullName || 'Unassigned',
    siteName: shift.site?.name || 'Unknown Site',
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

  const shift = await Shift.findById(shiftId);

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  // Find and update the task
  const task = shift.tasks.id(taskId);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.completed = completed;
  task.completedAt = completed ? new Date() : undefined;
  task.completedBy = completed ? req.user._id : undefined;

  await shift.save();

  const updatedShift = await Shift.findById(shiftId)
    .populate('guard', 'fullName siaLicenceNumber phoneNumber email')
    .populate('site', 'name address postCode');

  res.status(200).json({
    success: true,
    data: updatedShift,
  });

  emitTaskComplete({
    shiftId,
    taskId,
    taskDescription: task.description,
    completedBy: req.user._id,
    completedByName: req.user.fullName,
  });
});

/**
 * @route   GET /api/scheduling/available-guards
 * @desc    Get available guards for scheduling
 * @access  Private
 */
const getAvailableGuards = asyncHandler(async (req, res) => {
  const { date, shiftType } = req.query;
  const guards = await User.find({
    role: 'Guard',
    status: { $in: ['active', 'on-duty', 'off-duty', 'scheduled'] },
  })
    .select('fullName siaLicenceNumber guardType availability')
    .sort('fullName')
    .lean();

  if (date && shiftType) {
    const conflictingShifts = await Shift.find({
      date,
      shiftType,
      status: {$nin: ['cancelled']},
      guard: {$ne: null},
    }).select('guard');

    const busyGuardIds = conflictingShifts.map((s) => s.guard.toString());

    const availableGuards = guards.filter(
      (g) => !busyGuardIds.includes(g._id.toString())
    );

    return res.status(200).json({
      success: true,
      data: availableGuards,
    });
  }

  res.status(200).json({
    success: true,
    data: guards,
  });
});

/**
 * @route   GET /api/scheduling/available-sites
 * @desc    Get available sites for scheduling
 * @access  Private
 */
const getAvailableSites = asyncHandler(async (req, res) => {
  const sites = await Site.find({ status: 'active' })
    .select('name address postCode client')
    .populate('client', 'name')
    .sort('name');

  res.status(200).json({
    success: true,
    data: sites.map((site) => ({
      _id: site._id,
      name: site.name,
      address: site.address,
      postCode: site.postCode,
      clientName: site.client?.name,
    })),
  });
});

/**
 * @route   GET /api/scheduling/recommended-guards/:siteId
 * @desc    Get top 3 recommended guards for a site based on scoring algorithm
 *
 * Scoring factors:
 * - Distance from site (30%)
 * - Guard type match (25%)
 * - Availability (20%)
 * - SIA Licence status (15%)
 * - Certifications match (10%)
 */
const getRecommendedGuards = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const { date, shiftType } = req.query;

  // Validate site
  const site = await Site.findById(siteId);
  if (!site) throw new Error('Site not found');

  // Get site location
  let siteCoords = null;
  const sitePostCode = site.address?.postCode || site.postCode;
  if (sitePostCode) {
    try {
      siteCoords = await getPostcodeCoords(sitePostCode);
    } catch (error) {
      console.warn('Failed to get site coordinates:', error.message);
    }
  }

  // Get eligible guards
  const guards = await User.find({
    role: 'Guard',
    $or: [
      { status: { $in: ['active', 'off-duty', 'available'] } },
      { availability: true },
    ],
    'siaLicence.status': { $in: ['valid', 'expiring-soon'] },
  }).lean();

  if (guards.length === 0) {
    return res.json({
      success: true,
      data: [],
      message: 'No eligible guards found',
    });
  }

  // Get guards already assigned to shifts on this date
  let busyGuardIds = [];
  if (date) {
    const query = {
      date,
      status: { $nin: ['cancelled'] },
      guard: { $ne: null },
    };

    // If shiftType provided, only exclude guards on that exact shift type
    if (shiftType) {
      query.shiftType = shiftType;
    }

    const conflictingShifts = await Shift.find(query).select('guard').lean();
    busyGuardIds = conflictingShifts.map((s) => s.guard.toString());
  }

  // Filter out busy guards
  const availableGuards = guards.filter(
    (g) => !busyGuardIds.includes(g._id.toString())
  );

  if (availableGuards.length === 0) {
    return res.json({
      success: true,
      data: [],
      message: 'All eligible guards are already assigned on this date',
    });
  }

  // Score each available guard
  const scored = await Promise.all(
    availableGuards.map(async (guard) => {
      const scoring = await scoreGuard(guard, site, siteCoords);
      return {
        guard: {
          _id: guard._id,
          guardType: guard.guardType || null,
          postCode: guard.postCode,
          siaLicence: guard.siaLicence || null,
          certifications: guard.certifications || [],
        },
        score: scoring.score,
        breakdown: scoring.breakdown,
        distanceKm: scoring.distanceKm,
      };
    })
  );

  // Sort by score (descending) and return top 3
  const recommendations = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  res.json({
    success: true,
    data: recommendations,
  });
});

module.exports = {
  getShifts: getShift,
  getShiftStats,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  updateShiftStatus,
  updateTaskStatus,
  getAvailableGuards,
  getAvailableSites,
  getRecommendedGuards,
};