/**
 * Performance Routes
 *
 * API endpoints for security officer performance metrics.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getOverview,
  getOfficerPerformance,
  getPatrolMetrics,
  getAttendanceMetrics,
  getIncidentMetrics,
  getAlerts,
} = require('../controllers/performanceController');

// All performance routes require authentication
router.use(authMiddleware);

// ============================================
// Performance Data Routes
// ============================================

/**
 * @route   GET /api/performance/overview
 * @desc    Get performance overview metrics (KPIs)
 * @access  Private
 */
router.get('/overview', getOverview);

/**
 * @route   GET /api/performance/officers
 * @desc    Get individual officer performance data
 * @access  Private
 */
router.get('/officers', getOfficerPerformance);

/**
 * @route   GET /api/performance/patrols
 * @desc    Get patrol completion metrics
 * @access  Private
 */
router.get('/patrols', getPatrolMetrics);

/**
 * @route   GET /api/performance/attendance
 * @desc    Get attendance and punctuality metrics
 * @access  Private
 */
router.get('/attendance', getAttendanceMetrics);

/**
 * @route   GET /api/performance/incidents
 * @desc    Get incident response metrics
 * @access  Private
 */
router.get('/incidents', getIncidentMetrics);

/**
 * @route   GET /api/performance/alerts
 * @desc    Get performance alerts and exceptions
 * @access  Private
 */
router.get('/alerts', getAlerts);

module.exports = router;