/**
 * Guards Controller
 *
 * Handles API requests for guards management.
 * Uses the unified User model with role-based filtering.
 */

const User = require('../models/User');
const Shift = require('../models/Shift');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/guards
 * @desc    Get all guards (Guards only)
 * @access  Private
 */
const getGuards = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    guardType,
    shift,
    availability,
    licenceStatus,
    sortBy = 'fullName',
    sortOrder = 'asc',
    page = 1,
    limit = 20,
  } = req.query;

  // Build query
  const query = {
    // Exclude Admin and Manager users from guards list
    role: 'Guard'
  };

  // Search filter
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { badgeNumber: { $regex: search, $options: 'i' } },
      { postCode: { $regex: search, $options: 'i' } },
    ];
  }

  // Status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Guard type filter
  if (guardType && guardType !== 'all') {
    query.guardType = guardType;
  }

  // Shift filter
  if (shift && shift !== 'all') {
    query.shift = shift;
  }

  // Availability filter
  if (availability && availability !== 'all') {
    query.availability = availability === 'available';
  }

  // Licence status filter
  if (licenceStatus && licenceStatus !== 'all') {
    query['siaLicence.status'] = licenceStatus;
  }

  // Build sort object
  const sortField = sortBy === 'name' ? 'fullName' : sortBy;
  const sortObj = {};
  sortObj[sortField] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [guards, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(query),
  ]);

  // Fetch last completed/in-progress shift for each guard
  const guardsWithLastShift = await Promise.all(
    guards.map(async (guard) => {
      const lastShift = await Shift.findOne({
        guard: guard._id,
        status: { $in: ['completed', 'in-progress'] },
      })
        .sort({ date: -1, endTime: -1 })
        .select('date site shiftType')
        .populate('site', 'name')
        .lean();

      return {
        ...guard,
        lastShift: lastShift
          ? {
            date: lastShift.date,
            siteName: lastShift.site?.name || null,
            shiftType: lastShift.shiftType,
          }
          : null,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: guardsWithLastShift,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * Helper: Get start of current week (Monday)
 */
const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust for Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
};

/**
 * Helper: Get end of current week (Sunday)
 */
const getEndOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 0 : 7 - day; // Adjust for Sunday
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + diff);
  return sunday.toISOString().split('T')[0];
};

/**
 * @route   GET /api/guards/stats
 * @desc    Get guards statistics
 * @access  Private
 */
const getGuardsStats = asyncHandler(async (req, res) => {
  // Get week boundaries
  const startOfWeek = getStartOfWeek();
  const endOfWeek = getEndOfWeek();

  // Run aggregation and shift query in parallel
  const [statsResult, guardsWithShiftsThisWeek, totalGuards] = await Promise.all([
    // Basic stats aggregation
    User.aggregate([
      { $match: { role: 'Guard' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          onDuty: { $sum: { $cond: [{ $eq: ['$status', 'on-duty'] }, 1, 0] } },
          offDuty: { $sum: { $cond: [{ $eq: ['$status', 'off-duty'] }, 1, 0] } },
          onBreak: { $sum: { $cond: [{ $eq: ['$status', 'on-break'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          availableToday: { $sum: { $cond: [{ $eq: ['$availability', true] }, 1, 0] } },
          expiringLicences: {
            $sum: {
              $cond: [
                { $in: ['$siaLicence.status', ['expiring-soon', 'expired']] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    // Get distinct guards who have shifts this week
    Shift.distinct('guard', {
      date: { $gte: startOfWeek, $lte: endOfWeek },
      status: { $ne: 'cancelled' },
    }),
    // Total guard count
    User.countDocuments({ role: 'Guard' }),
  ]);

  const stats = statsResult[0] || {
    total: 0,
    onDuty: 0,
    offDuty: 0,
    onBreak: 0,
    late: 0,
    absent: 0,
    scheduled: 0,
    availableToday: 0,
    expiringLicences: 0,
  };

  // Calculate unassigned this week
  const unassignedThisWeek = totalGuards - guardsWithShiftsThisWeek.length;

  res.status(200).json({
    success: true,
    data: {
      ...stats,
      unassignedThisWeek,
    },
  });
});

/**
 * @route   GET /api/guards/:id
 * @desc    Get single guard by ID
 * @access  Private
 */
const getGuardById = asyncHandler(async (req, res) => {
  const guard = await User.findById(req.params.id)
    .select('-password')
    .lean();

  if (!guard) {
    res.status(404);
    throw new Error('Guard not found');
  }

  // Fetch last shift for this guard
  const lastShift = await Shift.findOne({
    guard: guard._id,
    status: { $in: ['completed', 'in-progress'] },
  })
    .sort({ date: -1, endTime: -1 })
    .select('date site shiftType')
    .populate('site', 'name')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      ...guard,
      lastShift: lastShift
        ? {
          date: lastShift.date,
          siteName: lastShift.site?.name || null,
          shiftType: lastShift.shiftType,
        }
        : null,
    },
  });
});

/**
 * @route   POST /api/guards
 * @desc    Create new guard
 * @access  Private (Admin/Manager)
 */
const createGuard = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phoneNumber,
    postCode,
    role,
    guardType,
    siaLicenceNumber,
    siaLicenceType,
    siaLicenceExpiry,
  } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('Email already registered');
  }

  // Build user object
  const userData = {
    fullName,
    email,
    username: email.split('@')[0],
    phoneNumber,
    postCode,
    role,
    guardType: role === 'Guard' ? guardType : undefined,
    status: 'off-duty',
    availability: true,
    password: Math.random().toString(36).slice(-8),
  };

  // Add SIA licence if provided
  if (siaLicenceNumber) {
    userData.siaLicence = {
      licenceNumber: siaLicenceNumber,
      licenceType: siaLicenceType || 'Security Guard',
      issueDate: new Date(),
      expiryDate: siaLicenceExpiry ? new Date(siaLicenceExpiry) : null,
      status: 'valid',
    };
  }

  const guard = await User.create(userData);

  // Remove password from response
  const response = guard.toObject();
  delete response.password;

  res.status(201).json({
    success: true,
    data: response,
  });
});

/**
 * @route   PUT /api/guards/:id
 * @desc    Update guard
 * @access  Private (Admin/Manager)
 */
const updateGuard = asyncHandler(async (req, res) => {
  const guard = await User.findById(req.params.id);

  if (!guard) {
    res.status(404);
    throw new Error('Guard not found');
  }

  // Prevent password update through this endpoint
  delete req.body.password;

  const updatedGuard = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    data: updatedGuard,
  });
});

/**
 * @route   DELETE /api/guards/:id
 * @desc    Delete guard (soft delete by setting status to 'suspended')
 * @access  Private (Admin only)
 */
const deleteGuard = asyncHandler(async (req, res) => {
  const guard = await User.findById(req.params.id);

  if (!guard) {
    res.status(404);
    throw new Error('Guard not found');
  }

  // Soft delete - set status to suspended
  guard.status = 'suspended';
  guard.availability = false;
  await guard.save();

  res.status(200).json({
    success: true,
    message: 'Guard suspended successfully',
  });
});

/**
 * @route   PATCH /api/guards/:id/status
 * @desc    Update guard status
 * @access  Private (Admin/Manager)
 */
const updateGuardStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['on-duty', 'off-duty', 'on-break', 'late', 'absent', 'scheduled'];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const guard = await User.findByIdAndUpdate(
    req.params.id,
    {
      status,
      availability: status === 'active',
    },
    { new: true }
  ).select('-password');

  if (!guard) {
    res.status(404);
    throw new Error('Guard not found');
  }

  res.status(200).json({
    success: true,
    data: guard,
  });
});

/**
 * @route   GET /api/guards/available
 * @desc    Get available guards for assignment
 * @access  Private
 */
const getAvailableGuards = asyncHandler(async (req, res) => {
  const { shift, guardType, postCode } = req.query;

  const query = {
    role: 'Guard',
    status: 'active',
    postCode: postCode,
    availability: true,
  };

  if (shift) query.shift = shift;
  if (guardType) query.guardType = guardType;

  const guards = await User.find(query)
    .select('fullName badgeNumber guardType shift postCode phoneNumber')
    .sort('fullName');

  res.status(200).json({
    success: true,
    data: s,
  });
});

module.exports = {
  getGuards,
  getGuardsStats,
  getGuardById,
  createGuard,
  updateGuard,
  deleteGuard,
  updateGuardStatus,
  getAvailableGuards,
};