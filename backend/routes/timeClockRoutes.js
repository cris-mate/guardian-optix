/**
 * TimeClock Routes
 *
 * API routes for time clock functionality.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
  // Clock actions
  clockIn,
  clockOut,
  startBreak,
  endBreak,

  // Status & data
  getClockStatus,
  getTodayEntries,
  getTimeEntries,
  getTodayTimesheet,
  getWeeklySummary,
  getStats,
  getActiveGuards,

  // Utilities
  verifyLocation,
  getGeofenceConfig,

  // Timesheet management
  approveTimesheet,
  rejectTimesheet,
} = require('../controllers/timeClockController');

// All routes require authentication
router.use(protect);

// ============================================
// Clock Actions
// ============================================

/**
 * @route   POST /api/timeClock/clock-in
 * @desc    Clock in for current shift
 * @access  Private
 */
router.post('/clock-in', clockIn);

/**
 * @route   POST /api/timeClock/clock-out
 * @desc    Clock out from current shift
 * @access  Private
 */
router.post('/clock-out', clockOut);

/**
 * @route   POST /api/timeClock/break/start
 * @desc    Start a break
 * @access  Private
 */
router.post('/break/start', startBreak);

/**
 * @route   POST /api/timeClock/break/end
 * @desc    End a break
 * @access  Private
 */
router.post('/break/end', endBreak);

// ============================================
// Status & Data Retrieval (All authenticated users)
// ============================================

/**
 * @route   GET /api/timeClock/status
 * @desc    Get current clock status
 * @access  Private
 */
router.get('/status', getClockStatus);

/**
 * @route   GET /api/timeClock/entries/today
 * @desc    Get today's time entries for current user
 * @access  Private
 */
router.get('/entries/today', getTodayEntries);

/**
 * @route   GET /api/timeClock/entries
 * @desc    Get time entries with filtering
 * @access  Private
 */
router.get('/entries', getTimeEntries);

/**
 * @route   GET /api/timeClock/timesheet/today
 * @desc    Get today's timesheet
 * @access  Private
 */
router.get('/timesheet/today', getTodayTimesheet);

/**
 * @route   GET /api/timeClock/timesheet/weekly
 * @desc    Get weekly summary
 * @access  Private
 */
router.get('/timesheet/weekly', getWeeklySummary);

/**
 * @route   POST /api/timeClock/verify-location
 * @desc    Verify if location is within geofence
 * @access  Private
 */
router.post('/verify-location', verifyLocation);

// Geofence config (for simulation panel)
router.get('/geofence-config', protect, getGeofenceConfig);

// ============================================
// Manager/Admin Routes
// ============================================

/**
 * @route   GET /api/timeClock/stats
 * @desc    Get time clock statistics
 * @access  Private (Admin/Manager)
 */
router.get('/stats', authorize('Admin', 'Manager'), getStats);

/**
 * @route   GET /api/timeClock/active-guards
 * @desc    Get list of currently active guards
 * @access  Private (Admin/Manager)
 */
router.get('/active-guards', authorize('Admin', 'Manager'), getActiveGuards);

/**
 * @route   PATCH /api/timeClock/timesheet/:id/approve
 * @desc    Approve a timesheet
 * @access  Private (Admin/Manager)
 */
router.patch(
  '/timesheet/:id/approve',
  authorize('Admin', 'Manager'),
  approveTimesheet
);

/**
 * @route   PATCH /api/timeClock/timesheet/:id/reject
 * @desc    Reject a timesheet
 * @access  Private (Admin/Manager)
 */
router.patch(
  '/timesheet/:id/reject',
  authorize('Admin', 'Manager'),
  rejectTimesheet
);

module.exports = router;