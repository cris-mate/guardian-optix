/**
 * Site Controller
 *
 * Handles CRUD operations for security sites.
 * Includes coverage requirements validation for scheduling.
 */

const Site = require('../models/Site');
const Client = require('../models/Client');
const asyncHandler = require('../utils/asyncHandler');
const { SHIFT_TIMES } = require('../utils/shiftTimes');

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate requirements object
 * @param {Object} requirements - The requirements object to validate
 * @returns {Object} - { isValid: boolean, error: string | null }
 */
const validateRequirements = (requirements) => {
  if (!requirements) {
    return { isValid: true, error: null }; // Requirements are optional
  }

  // Contract start is required if requirements provided
  if (!requirements.contractStart) {
    return { isValid: false, error: 'Contract start date is required' };
  }

  const startDate = new Date(requirements.contractStart);
  if (isNaN(startDate.getTime())) {
    return { isValid: false, error: 'Invalid contract start date' };
  }

  // Validate contract end if not ongoing
  if (!requirements.isOngoing) {
    if (!requirements.contractEnd) {
      return { isValid: false, error: 'Contract end date is required (or mark as ongoing)' };
    }

    const endDate = new Date(requirements.contractEnd);
    if (isNaN(endDate.getTime())) {
      return { isValid: false, error: 'Invalid contract end date' };
    }

    if (endDate < startDate) {
      return { isValid: false, error: 'Contract end date must be after start date' };
    }
  }

  // Validate shiftsPerDay
  if (!requirements.shiftsPerDay || !Array.isArray(requirements.shiftsPerDay)) {
    return { isValid: false, error: 'Shifts per day must be an array' };
  }

  if (requirements.shiftsPerDay.length === 0) {
    return { isValid: false, error: 'At least one shift is required' };
  }

  // Validate each shift
  const validShiftTypes = Object.keys(SHIFT_TIMES);
  const validGuardTypes = ['Static', 'Mobile Patrol', 'CCTV Operator', 'Door Supervisor', 'Close Protection'];

  for (let i = 0; i < requirements.shiftsPerDay.length; i++) {
    const shift = requirements.shiftsPerDay[i];

    if (!shift.shiftType || !validShiftTypes.includes(shift.shiftType)) {
      return {
        isValid: false,
        error: `Invalid shift type at index ${i}. Must be one of: ${validShiftTypes.join(', ')}`
      };
    }

    if (shift.guardsRequired !== undefined) {
      const guards = parseInt(shift.guardsRequired);
      if (isNaN(guards) || guards < 1) {
        return { isValid: false, error: `Guards required must be at least 1 at shift index ${i}` };
      }
    }

    if (shift.guardType && !validGuardTypes.includes(shift.guardType)) {
      return {
        isValid: false,
        error: `Invalid guard type at index ${i}. Must be one of: ${validGuardTypes.join(', ')}`
      };
    }
  }

  // Validate daysOfWeek
  if (requirements.daysOfWeek) {
    if (!Array.isArray(requirements.daysOfWeek)) {
      return { isValid: false, error: 'Days of week must be an array' };
    }

    if (requirements.daysOfWeek.length === 0) {
      return { isValid: false, error: 'At least one operating day is required' };
    }

    for (const day of requirements.daysOfWeek) {
      if (!Number.isInteger(day) || day < 1 || day > 7) {
        return { isValid: false, error: 'Days of week must be integers between 1 (Monday) and 7 (Sunday)' };
      }
    }
  }

  return { isValid: true, error: null };
};

/**
 * Transform requirements from frontend format to database format
 * @param {Object} requirements - Frontend requirements object
 * @returns {Object} - Transformed requirements for database
 */
const transformRequirements = (requirements) => {
  if (!requirements) return null;

  return {
    contractStart: new Date(requirements.contractStart),
    contractEnd: requirements.isOngoing ? null : new Date(requirements.contractEnd),
    isOngoing: Boolean(requirements.isOngoing),
    shiftsPerDay: requirements.shiftsPerDay.map(shift => ({
      shiftType: shift.shiftType,
      guardsRequired: parseInt(shift.guardsRequired) || 1,
      guardType: shift.guardType || 'Static',
      requiredCertifications: shift.requiredCertifications || [],
    })),
    daysOfWeek: requirements.daysOfWeek || [1, 2, 3, 4, 5],
  };
};

// ============================================
// GET Routes
// ============================================

/**
 * @desc    Get all sites with filtering and pagination
 * @route   GET /api/sites
 * @access  Private
 */
const getSites = asyncHandler(async (req, res) => {
  const { search, status, clientId, siteType, page = 1, limit = 20 } = req.query;

  const result = await Site.searchSites(search, {
    status,
    clientId,
    siteType,
    page,
    limit,
  });

  res.json({
    success: true,
    data: result.sites,
    pagination: result.pagination,
  });
});

/**
 * @desc    Get single site by ID
 * @route   GET /api/sites/:id
 * @access  Private
 */
const getSiteById = asyncHandler(async (req, res) => {
  const site = await Site.findById(req.params.id)
    .populate('client', 'companyName tradingName contactEmail contactPhone')
    .lean();

  if (!site) {
    res.status(404);
    throw new Error('Site not found');
  }

  res.json({
    success: true,
    data: site,
  });
});

/**
 * @desc    Get sites with active contracts
 * @route   GET /api/sites/active-contracts
 * @access  Private
 */
const getSitesWithActiveContracts = asyncHandler(async (req, res) => {
  const sites = await Site.findWithActiveContracts();

  res.json({
    success: true,
    data: sites,
  });
});

/**
 * @desc    Get sites for a specific client
 * @route   GET /api/sites/client/:clientId
 * @access  Private
 */
const getSitesByClient = asyncHandler(async (req, res) => {
  const { clientId } = req.params;

  const sites = await Site.find({ client: clientId })
    .sort({ name: 1 })
    .lean();

  res.json({
    success: true,
    data: sites,
  });
});

// ============================================
// POST Routes
// ============================================

/**
 * @desc    Create new site
 * @route   POST /api/sites
 * @access  Private (Manager/Admin)
 */
const createSite = asyncHandler(async (req, res) => {
  const {
    name,
    client,
    address,
    geofence,
    siteType,
    status = 'active',
    contactName,
    contactPhone,
    contactEmail,
    specialInstructions,
    requirements,
  } = req.body;

  // Validate required fields
  if (!name || !client || !address) {
    res.status(400);
    throw new Error('Name, client, and address are required');
  }

  // Validate address fields
  if (!address.street || !address.city || !address.postCode) {
    res.status(400);
    throw new Error('Address must include street, city, and postCode');
  }

  // Verify client exists
  const clientExists = await Client.findById(client);
  if (!clientExists) {
    res.status(400);
    throw new Error('Invalid client ID');
  }

  // Check for duplicate site name for this client
  const existingSite = await Site.findOne({ name, client });
  if (existingSite) {
    res.status(400);
    throw new Error('A site with this name already exists for this client');
  }

  // Validate requirements if provided
  const requirementsValidation = validateRequirements(requirements);
  if (!requirementsValidation.isValid) {
    res.status(400);
    throw new Error(requirementsValidation.error);
  }

  // Create site
  const site = await Site.create({
    name,
    client,
    address: {
      street: address.street.trim(),
      city: address.city.trim(),
      postCode: address.postCode.trim().toUpperCase(),
      country: address.country || 'United Kingdom',
    },
    geofence: geofence || undefined,
    siteType,
    status,
    contactName,
    contactPhone,
    contactEmail,
    specialInstructions,
    requirements: transformRequirements(requirements),
    createdBy: req.user._id,
  });

  // Populate client info for response
  const populatedSite = await Site.findById(site._id)
    .populate('client', 'companyName')
    .lean();

  res.status(201).json({
    success: true,
    data: populatedSite,
  });
});

// ============================================
// PUT Routes
// ============================================

/**
 * @desc    Update site
 * @route   PUT /api/sites/:id
 * @access  Private (Manager/Admin)
 */
const updateSite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Find site
  const site = await Site.findById(id);
  if (!site) {
    res.status(404);
    throw new Error('Site not found');
  }

  // If changing client, verify new client exists
  if (updates.client && updates.client !== site.client.toString()) {
    const clientExists = await Client.findById(updates.client);
    if (!clientExists) {
      res.status(400);
      throw new Error('Invalid client ID');
    }
  }

  // Check for duplicate name if name is being changed
  if (updates.name && updates.name !== site.name) {
    const clientId = updates.client || site.client;
    const existingSite = await Site.findOne({
      name: updates.name,
      client: clientId,
      _id: { $ne: id },
    });
    if (existingSite) {
      res.status(400);
      throw new Error('A site with this name already exists for this client');
    }
  }

  // Validate requirements if being updated
  if (updates.requirements !== undefined) {
    const requirementsValidation = validateRequirements(updates.requirements);
    if (!requirementsValidation.isValid) {
      res.status(400);
      throw new Error(requirementsValidation.error);
    }
    updates.requirements = transformRequirements(updates.requirements);
  }

  // Sanitize address if being updated
  if (updates.address) {
    updates.address = {
      street: updates.address.street?.trim() || site.address.street,
      city: updates.address.city?.trim() || site.address.city,
      postCode: updates.address.postCode?.trim().toUpperCase() || site.address.postCode,
      country: updates.address.country || site.address.country,
    };
  }

  // Update site
  Object.assign(site, updates);
  await site.save();

  // Return populated site
  const populatedSite = await Site.findById(site._id)
    .populate('client', 'companyName')
    .lean();

  res.json({
    success: true,
    data: populatedSite,
  });
});

// ============================================
// DELETE Routes
// ============================================

/**
 * @desc    Delete site
 * @route   DELETE /api/sites/:id
 * @access  Private (Admin)
 */
const deleteSite = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const site = await Site.findById(id);
  if (!site) {
    res.status(404);
    throw new Error('Site not found');
  }

  // TODO: Check for active shifts or tasks before deleting
  // For now, soft delete by setting status to inactive
  // await site.deleteOne();

  // Soft delete
  site.status = 'inactive';
  await site.save();

  res.json({
    success: true,
    message: 'Site deactivated successfully',
  });
});

// ============================================
// Stats
// ============================================

/**
 * @desc    Get site statistics
 * @route   GET /api/sites/stats
 * @access  Private
 */
const getSiteStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const [total, active, inactive, byType, withActiveContracts] = await Promise.all([
    Site.countDocuments(),
    Site.countDocuments({ status: 'active' }),
    Site.countDocuments({ status: 'inactive' }),
    Site.aggregate([
      { $group: { _id: '$siteType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Site.countDocuments({
      status: 'active',
      $or: [
        { requirements: null },
        { 'requirements.isOngoing': true, 'requirements.contractStart': { $lte: now } },
        {
          'requirements.contractStart': { $lte: now },
          'requirements.contractEnd': { $gte: now },
        },
      ],
    }),
  ]);

  res.json({
    success: true,
    data: {
      total,
      active,
      inactive,
      withActiveContracts,
      byType: byType.reduce((acc, item) => {
        acc[item._id || 'unspecified'] = item.count;
        return acc;
      }, {}),
    },
  });
});

// ============================================
// Exports
// ============================================

module.exports = {
  getSites,
  getSiteById,
  getSitesByClient,
  getSitesWithActiveContracts,
  createSite,
  updateSite,
  deleteSite,
  getSiteStats,
};