/**
 * Scheduling Controller
 *
 * Handles API requests for shift and task management.
 */

const Shift = require('../models/Shift');
const User = require('../models/User');
const Site = require('../models/Site');
const { emitShiftUpdate, emitTaskComplete } = require('../socket/socketManager');
const { scoreOfficer, getPostcodeCoords } = require('../services/officerMatchingService');
const asyncHandler = require('../utils/asyncHandler');

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

  // Officer filter
  if (officerId) {
    query.officer = officerId;
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
      .populate('officer', 'fullName badgeNumber phoneNumber profileImage')
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
    .populate('officer', 'fullName badgeNumber phoneNumber profileImage')
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
 * @access  Private (Admin/Manager)
 */
const createShift = asyncHandler(async (req, res) => {
  const {
    officerId,
    siteId,
    date,
    startTime,
    endTime,
    shiftType,
    tasks,
    notes,
  } = req.body;

  // Validate officer exists and is available
  const officer = await User.findById(officerId);
  if (!officer) {
    res.status(400);
    throw new Error('Officer not found');
  }

  // Validate site exists
  const site = await Site.findById(siteId);
  if (!site) {
    res.status(400);
    throw new Error('Site not found');
  }

  // Check for conflicting shifts
  const conflictingShift = await Shift.findOne({
    officer: officerId,
    date,
    status: { $ne: 'cancelled' },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  });

  if (conflictingShift) {
    res.status(400);
    throw new Error('Officer already has a shift during this time');
  }

  // Create shift
  const shift = await Shift.create({
    officer: officerId,
    site: siteId,
    date,
    startTime,
    endTime,
    shiftType,
    tasks: tasks || [],
    notes,
    status: 'scheduled',
    createdBy: req.user._id,
  });

  // Populate and return
  const populatedShift = await Shift.findById(shift._id)
    .populate('officer', 'fullName badgeNumber phoneNumber profileImage')
    .populate('site', 'name address postCode');

  res.status(201).json({
    success: true,
    data: populatedShift,
  });
});

/**
 * @route   PUT /api/scheduling/shifts/:id
 * @desc    Update shift
 * @access  Private (Admin/Manager)
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
    .populate('officer', 'fullName badgeNumber phoneNumber profileImage')
    .populate('site', 'name address postCode');

  res.status(200).json({
    success: true,
    data: updatedShift,
  });
});

/**
 * @route   DELETE /api/scheduling/shifts/:id
 * @desc    Delete shift
 * @access  Private (Admin/Manager)
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
    .populate('officer', 'fullName')
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
    officerId: shift.officer?._id,
    officerName: shift.officer?.fullName || 'Unassigned',
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
    .populate('officer', 'fullName badgeNumber phoneNumber profileImage')
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
 * @route   GET /api/scheduling/available-officers
 * @desc    Get available officers for scheduling
 * @access  Private
 */
const getAvailableOfficers = asyncHandler(async (req, res) => {
  const officers = await User.find({
    role: 'Guard',
    status: 'active',
  })
    .select('fullName badgeNumber guardType availability')
    .sort('fullName');

  res.status(200).json({
    success: true,
    data: officers,
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

const getRecommendedOfficers = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const { date, shiftType } = req.query;

  const site = await Site.findById(siteId);
  if (!site) throw new Error('Site not found');

  const siteCoords = await getPostcodeCoords(site.address.postCode);

  // Get eligible officers (active, valid licence, available)
  const officers = await User.find({
    role: 'Guard',
    status: 'active',
    'siaLicence.status': { $in: ['valid', 'expiring-soon'] },
  });

  // Score each officer
  const scored = await Promise.all(
    officers.map(async (officer) => ({
      officer: {
        _id: officer._id,
        fullName: officer.fullName,
        badgeNumber: officer.badgeNumber,
        guardType: officer.guardType,
        postCode: officer.postCode,
        siaLicence: officer.siaLicence,
        certifications: officer.certifications,
      },
      ...(await scoreOfficer(officer, site, siteCoords, date)),
    }))
  );

  // Sort and return top 3
  const recommendations = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  res.json({ success: true, data: recommendations });
});

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
};