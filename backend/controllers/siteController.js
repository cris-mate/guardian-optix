/**
 * Site Controller
 *
 * Handles CRUD operations for security sites.
 */

const Site = require('../models/Site');
const Client = require('../models/Client');
const asyncHandler = require('../utils/asyncHandler');

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

  // Create site
  const site = await Site.create({
    name,
    client,
    address,
    geofence: geofence || undefined,
    siteType,
    status,
    contactName,
    contactPhone,
    contactEmail,
    specialInstructions,
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

  // TODO: Check for active shifts or assignments before deleting
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
  const [total, active, inactive, byType] = await Promise.all([
    Site.countDocuments(),
    Site.countDocuments({ status: 'active' }),
    Site.countDocuments({ status: 'inactive' }),
    Site.aggregate([
      { $group: { _id: '$siteType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      total,
      active,
      inactive,
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
  createSite,
  updateSite,
  deleteSite,
  getSiteStats,
};