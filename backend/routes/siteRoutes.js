/**
 * Site Routes
 *
 * API routes for site management.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getSites,
  getSiteById,
  getSitesByClient,
  createSite,
  updateSite,
  deleteSite,
  getSiteStats,
} = require('../controllers/siteController');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// Read Routes (all authenticated users)
// ============================================

/**
 * @route   GET /api/sites
 * @desc    Get all sites with filtering
 * @access  Private
 */
router.get('/', getSites);

/**
 * @route   GET /api/sites/stats
 * @desc    Get site statistics
 * @access  Private
 */
router.get('/stats', getSiteStats);

/**
 * @route   GET /api/sites/client/:clientId
 * @desc    Get sites for a specific client
 * @access  Private
 */
router.get('/client/:clientId', getSitesByClient);

/**
 * @route   GET /api/sites/:id
 * @desc    Get single site by ID
 * @access  Private
 */
router.get('/:id', getSiteById);

// ============================================
// Write Routes (Manager/Admin only)
// ============================================

/**
 * @route   POST /api/sites
 * @desc    Create new site
 * @access  Private (Manager/Admin)
 */
router.post('/', roleMiddleware('Manager', 'Admin'), createSite);

/**
 * @route   PUT /api/sites/:id
 * @desc    Update site
 * @access  Private (Manager/Admin)
 */
router.put('/:id', roleMiddleware('Manager', 'Admin'), updateSite);

/**
 * @route   DELETE /api/sites/:id
 * @desc    Delete/deactivate site
 * @access  Private (Admin)
 */
router.delete('/:id', roleMiddleware('Admin'), deleteSite);

module.exports = router;