/**
 * Guards Controller
 *
 * Handles API requests for guards management.
 * Uses the unified User model with role-based filtering.
 */

const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/guards
 * @desc    Get all guards (Guards and Managers)
 * @access  Private
 */
const getGuards = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    role,
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
    // Exclude Admin users from guards list (they are system admins, not field staff)
    role: { $in: ['Guard', 'Manager'] },
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

  // Role filter
  if (role && role !== 'all') {
    query.role = role;
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
      .limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: guards,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @route   GET /api/guards/stats
 * @desc    Get guards statistics
 * @access  Private
 */
const getGuardsStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    { $match: { role: { $in: ['Guard', 'Manager'] } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        onLeave: { $sum: { $cond: [{ $eq: ['$status', 'on-leave'] }, 1, 0] } },
        offDuty: { $sum: { $cond: [{ $eq: ['$status', 'off-duty'] }, 1, 0] } },
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
  ]);

  res.status(200).json({
    success: true,
    data: stats[0] || {
      total: 0,
      active: 0,
      onLeave: 0,
      offDuty: 0,
      expiringLicences: 0,
    },
  });
});

/**
 * @route   GET /api/guards/:id
 * @desc    Get single guard by ID
 * @access  Private
 */
const getGuardById = asyncHandler(async (req, res) => {
  const guard = await User.findById(req.params.id).select('-password');

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
    managerType,
    shift,
    badgeNumber,
    startDate,
    siaLicenceNumber,
    siaLicenceType,
    siaLicenceExpiry,
    emergencyContact,
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
    username: email.split('@')[0], // Generate username from email
    phoneNumber,
    postCode,
    role,
    guardType: role === 'Guard' ? guardType : undefined,
    managerType: role === 'Manager' ? managerType : undefined,
    shift,
    badgeNumber,
    startDate,
    emergencyContact,
    status: 'active',
    availability: true,
    // Generate temporary password (should be changed on first login)
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
  const validStatuses = ['active', 'on-leave', 'off-duty', 'suspended'];

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
  getGuards: getGuards,
  getGuardsStats,
  getGuardById: getGuardById,
  createGuard: createGuard,
  updateGuard: updateGuard,
  deleteGuard: deleteGuard,
  updateGuardStatus: updateGuardStatus,
  getAvailableGuards: getAvailableGuards,
};