/**
 * Scheduling Routes
 *
 * API routes for shift and task management.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
  getShifts,
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
} = require('../controllers/schedulingController');

const {
  generateForSite,
  generateForAllSites,
  getCoverageStats,
  getUnassignedStats,
  getActivityHubStats,
} = require('../controllers/shiftGeneratorController');

// All routes require authentication
router.use(protect);

// ============================================
// Shift Generation Routes
// ============================================

/**
 * @route   POST /api/scheduling/generate/:siteId
 * @desc    Generate shifts for a specific site
 * @access  Private (Manager/Admin)
 */
router.post('/generate/:siteId', authorize('Manager', 'Admin'), generateForSite);

/**
 * @route   POST /api/scheduling/generate-all
 * @desc    Generate shifts for all active sites
 * @access  Private (Admin)
 */
router.post('/generate-all', authorize('Admin'), generateForAllSites);

// ============================================
// Statistics Routes (for ActivityHub)
// ============================================

/**
 * @route   GET /api/scheduling/stats/coverage
 * @desc    Get shift coverage statistics
 * @access  Private
 */
router.get('/stats/coverage', getCoverageStats);

/**
 * @route   GET /api/scheduling/stats/unassigned
 * @desc    Get unassigned shifts by site
 * @access  Private
 */
router.get('/stats/unassigned', getUnassignedStats);

/**
 * @route   GET /api/scheduling/stats/activity-hub
 * @desc    Get combined ActivityHub statistics
 * @access  Private
 */
router.get('/stats/activity-hub', getActivityHubStats);

// ============================================
// Read Routes (all authenticated users)
// ============================================

/**
 * @route   GET /api/scheduling/shifts
 * @desc    Get all shifts with filtering
 * @access  Private
 */
router.get('/shifts', getShifts);

/**
 * @route   GET /api/scheduling/shifts/stats
 * @desc    Get shift statistics
 * @access  Private
 */
router.get('/shifts/stats', getShiftStats);

/**
 * @route   GET /api/scheduling/available-guards
 * @desc    Get available guards for scheduling
 * @access  Private
 */
router.get('/available-guards', getAvailableGuards);

/**
 * @route   GET /api/scheduling/available-sites
 * @desc    Get available sites for scheduling
 * @access  Private
 */
router.get('/available-sites', getAvailableSites);

/**
 * @route   GET /api/scheduling/recommended-guards/:siteId
 * @desc    Get recommended guards for a site
 * @access  Private
 */
router.get('/recommended-guards/:siteId', getRecommendedGuards);

/**
 * @route   GET /api/scheduling/shifts/:id
 * @desc    Get single shift by ID
 * @access  Private
 */
router.get('/shifts/:id', getShiftById);

// ============================================
// Write Routes (Admin/Manager only)
// ============================================

/**
 * @route   POST /api/scheduling/shifts
 * @desc    Create new shift
 * @access  Private (Admin/Manager)
 */
router.post('/shifts', authorize('Admin', 'Manager'), createShift);

/**
 * @route   PUT /api/scheduling/shifts/:id
 * @desc    Update shift
 * @access  Private (Admin/Manager)
 */
router.put('/shifts/:id', authorize('Admin', 'Manager'), updateShift);

/**
 * @route   PATCH /api/scheduling/shifts/:id/status
 * @desc    Update shift status
 * @access  Private
 */
router.patch('/shifts/:id/status', updateShiftStatus);

/**
 * @route   PATCH /api/scheduling/shifts/:shiftId/tasks/:taskId
 * @desc    Update task completion status
 * @access  Private
 */
router.patch('/shifts/:shiftId/tasks/:taskId', updateTaskStatus);

/**
 * @route   DELETE /api/scheduling/shifts/:id
 * @desc    Delete shift
 * @access  Private (Admin/Manager)
 */
router.delete('/shifts/:id', authorize('Admin', 'Manager'), deleteShift);

module.exports = router;