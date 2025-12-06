/**
 * Guards Routes
 *
 * API routes for guards management.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
  getGuards,
  getGuardsStats,
  getGuardById,
  createGuard,
  updateGuard,
  deleteGuard,
  updateGuardStatus,
  getAvailableGuards,
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
 * @desc    Get available guards for assignment
 * @access  Private
 */
router.get('/available', getAvailableGuards);

/**
 * @route   GET /api/guards/:id
 * @desc    Get single guard by ID
 * @access  Private
 */
router.get('/:id', getGuardById);

// ============================================
// Write Routes (Admin/Manager only)
// ============================================

/**
 * @route   POST /api/guards
 * @desc    Create new guard
 * @access  Private (Admin/Manager)
 */
router.post('/', authorize('Admin', 'Manager'), createGuard);

/**
 * @route   PUT /api/guards/:id
 * @desc    Update guard
 * @access  Private (Admin/Manager)
 */
router.put('/:id', authorize('Admin', 'Manager'), updateGuard);

/**
 * @route   PATCH /api/guards/:id/status
 * @desc    Update guard status
 * @access  Private (Admin/Manager)
 */
router.patch('/:id/status', authorize('Admin', 'Manager'), updateGuardStatus);

/**
 * @route   DELETE /api/guards/:id
 * @desc    Delete guard (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize('Admin'), deleteGuard);

module.exports = router;