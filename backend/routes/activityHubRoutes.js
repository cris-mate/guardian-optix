/**
 * Activity Hub Routes
 *
 * API endpoints for system activity tracking, updates, and activity statistics.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getActivities,
  getUpdates,
  getStats,
  createUpdate,
  markUpdateRead,
  acknowledgeUpdate,
} = require('../controllers/activityHubController');

// All activity-hub routes require authentication
router.use(authMiddleware);

// ============================================
// Read Routes (All authenticated users)
// ============================================

/**
 * @route   GET /api/activityHub/activities
 * @desc    Get system activities with filtering
 * @access  Private
 */
router.get('/activities', getActivities);

/**
 * @route   GET /api/activityHub/stats
 * @desc    Get activity statistics for dashboard
 * @access  Private
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/activityHub/updates
 * @desc    Get system updates and announcements
 * @access  Private
 */
router.get('/updates', getUpdates);

/**
 * @route   POST /api/activityHub/updates
 * @desc    Create a new update/announcement
 * @access  Private (Manager/Admin)
 */
router.post('/updates', roleMiddleware('Manager', 'Admin'), createUpdate);

/**
 * @route   PATCH /api/activityHub/updates/:id/read
 * @desc    Mark an update as read
 * @access  Private
 */
router.patch('/updates/:id/read', markUpdateRead);

/**
 * @route   PATCH /api/activityHub/updates/:id/acknowledge
 * @desc    Acknowledge an update
 * @access  Private
 */
router.patch('/updates/:id/acknowledge', acknowledgeUpdate);

module.exports = router;