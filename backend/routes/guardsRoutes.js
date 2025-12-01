/**
 * Guards Routes
 *
 * API routes for guards/officer management.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getGuards,
  getGuardsStats,
  getOfficerById,
  createOfficer,
  updateOfficer,
  deleteOfficer,
  updateOfficerStatus,
  getAvailableOfficers,
} = require('../controllers/guardsController');

// All routes require authentication
router.use(protect);

// ============================================
// Read Routes (all authenticated users)
// ============================================

/**
 * @route   GET /api/guards
 * @desc    Get all guards with filtering and pagination
 * @access  Private
 */
router.get('/', getGuards);

/**
 * @route   GET /api/guards/stats
 * @desc    Get guards statistics
 * @access  Private
 */
router.get('/stats', getGuardsStats);

/**
 * @route   GET /api/guards/available
 * @desc    Get available officers for assignment
 * @access  Private
 */
router.get('/available', getAvailableOfficers);

/**
 * @route   GET /api/guards/:id
 * @desc    Get single officer by ID
 * @access  Private
 */
router.get('/:id', getOfficerById);

// ============================================
// Write Routes (Admin/Manager only)
// ============================================

/**
 * @route   POST /api/guards
 * @desc    Create new officer
 * @access  Private (Admin/Manager)
 */
router.post('/', authorize('Admin', 'Manager'), createOfficer);

/**
 * @route   PUT /api/guards/:id
 * @desc    Update officer
 * @access  Private (Admin/Manager)
 */
router.put('/:id', authorize('Admin', 'Manager'), updateOfficer);

/**
 * @route   PATCH /api/guards/:id/status
 * @desc    Update officer status
 * @access  Private (Admin/Manager)
 */
router.patch('/:id/status', authorize('Admin', 'Manager'), updateOfficerStatus);

/**
 * @route   DELETE /api/guards/:id
 * @desc    Delete officer (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize('Admin'), deleteOfficer);

module.exports = router;