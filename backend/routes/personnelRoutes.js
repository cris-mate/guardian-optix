/**
 * Personnel Routes
 *
 * API routes for personnel/officer management.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPersonnel,
  getPersonnelStats,
  getOfficerById,
  createOfficer,
  updateOfficer,
  deleteOfficer,
  updateOfficerStatus,
  getAvailableOfficers,
} = require('../controllers/personnelController');

// All routes require authentication
router.use(protect);

// ============================================
// Read Routes (all authenticated users)
// ============================================

/**
 * @route   GET /api/personnel
 * @desc    Get all personnel with filtering and pagination
 * @access  Private
 */
router.get('/', getPersonnel);

/**
 * @route   GET /api/personnel/stats
 * @desc    Get personnel statistics
 * @access  Private
 */
router.get('/stats', getPersonnelStats);

/**
 * @route   GET /api/personnel/available
 * @desc    Get available officers for assignment
 * @access  Private
 */
router.get('/available', getAvailableOfficers);

/**
 * @route   GET /api/personnel/:id
 * @desc    Get single officer by ID
 * @access  Private
 */
router.get('/:id', getOfficerById);

// ============================================
// Write Routes (Admin/Manager only)
// ============================================

/**
 * @route   POST /api/personnel
 * @desc    Create new officer
 * @access  Private (Admin/Manager)
 */
router.post('/', authorize('Admin', 'Manager'), createOfficer);

/**
 * @route   PUT /api/personnel/:id
 * @desc    Update officer
 * @access  Private (Admin/Manager)
 */
router.put('/:id', authorize('Admin', 'Manager'), updateOfficer);

/**
 * @route   PATCH /api/personnel/:id/status
 * @desc    Update officer status
 * @access  Private (Admin/Manager)
 */
router.patch('/:id/status', authorize('Admin', 'Manager'), updateOfficerStatus);

/**
 * @route   DELETE /api/personnel/:id
 * @desc    Delete officer (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize('Admin'), deleteOfficer);

module.exports = router;