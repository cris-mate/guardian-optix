/**
 * Dashboard Routes
 *
 * API endpoints for the Guardian Optix operations dashboard.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getMetrics,
  getAlerts,
  getScheduleOverview,
  getGuardStatuses,
  getActivityFeed,
  getPendingTasks,
  getRecentIncidents,
  dismissAlert,
  markAlertRead,
} = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(authMiddleware);

// ============================================
// Dashboard Data Routes
// ============================================

/**
 * @route   GET /api/dashboard/metrics
 * @desc    Get operational metrics (KPIs)
 * @access  Private
 */
router.get('/metrics', getMetrics);

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Get active alerts and notifications
 * @access  Private
 */
router.get('/alerts', getAlerts);

/**
 * @route   GET /api/dashboard/schedule-overview
 * @desc    Get today's schedule summary
 * @access  Private
 */
router.get('/schedule-overview', getScheduleOverview);

/**
 * @route   GET /api/dashboard/guard-statuses
 * @desc    Get current status of all guards
 * @access  Private
 */
router.get('/guard-statuses', getGuardStatuses);

/**
 * @route   GET /api/dashboard/activity-feed
 * @desc    Get recent activity events
 * @access  Private
 */
router.get('/activity-feed', getActivityFeed);

/**
 * @route   GET /api/dashboard/pending-tasks
 * @desc    Get pending tasks for dashboard display
 * @access  Private
 */
router.get('/pending-tasks', getPendingTasks);

/**
 * @route   GET /api/dashboard/recent-incidents
 * @desc    Get recent open incidents
 * @access  Private
 */
router.get('/recent-incidents', getRecentIncidents);

// ============================================
// Alert Management Routes
// ============================================

/**
 * @route   PATCH /api/dashboard/alerts/:id/dismiss
 * @desc    Dismiss an alert
 * @access  Private
 */
router.patch('/alerts/:id/dismiss', dismissAlert);

/**
 * @route   PATCH /api/dashboard/alerts/:id/read
 * @desc    Mark an alert as read
 * @access  Private
 */
router.patch('/alerts/:id/read', markAlertRead);

module.exports = router;