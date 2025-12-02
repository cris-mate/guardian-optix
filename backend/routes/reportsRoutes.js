/**
 * Reports Routes
 *
 * API endpoints for analytics reports and data exports.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTemplates,
  getRecentReports,
  getScheduledReports,
  getReportStats,
  generateReport,
  toggleFavorite,
  createScheduledReport,
  deleteScheduledReport,
  getOperationalData,
  downloadReport,
} = require('../controllers/reportsController');

// All report routes require authentication
router.use(authMiddleware);

// ============================================
// Template Routes
// ============================================

/**
 * @route   GET /api/reports/templates
 * @desc    Get all report templates
 * @access  Private
 */
router.get('/templates', getTemplates);

/**
 * @route   POST /api/reports/templates/:id/favorite
 * @desc    Toggle template favorite status
 * @access  Private
 */
router.post('/templates/:id/favorite', toggleFavorite);

// ============================================
// Report Generation Routes
// ============================================

/**
 * @route   POST /api/reports/generate
 * @desc    Generate a new report
 * @access  Private
 */
router.post('/generate', generateReport);

/**
 * @route   GET /api/reports/download/:id
 * @desc    Download a generated report
 * @access  Private
 */
router.get('/download/:id', downloadReport);

// ============================================
// Report History Routes
// ============================================

/**
 * @route   GET /api/reports/recent
 * @desc    Get recently generated reports
 * @access  Private
 */
router.get('/recent', getRecentReports);

/**
 * @route   GET /api/reports/stats
 * @desc    Get report statistics
 * @access  Private
 */
router.get('/stats', getReportStats);

// ============================================
// Scheduled Report Routes
// ============================================

/**
 * @route   GET /api/reports/scheduled
 * @desc    Get all scheduled reports
 * @access  Private
 */
router.get('/scheduled', getScheduledReports);

/**
 * @route   POST /api/reports/scheduled
 * @desc    Create a new scheduled report
 * @access  Private
 */
router.post('/scheduled', createScheduledReport);

/**
 * @route   DELETE /api/reports/scheduled/:id
 * @desc    Delete a scheduled report
 * @access  Private
 */
router.delete('/scheduled/:id', deleteScheduledReport);

// ============================================
// Report Data Routes
// ============================================

/**
 * @route   GET /api/reports/data/operational
 * @desc    Get operational report data
 * @access  Private
 */
router.get('/data/operational', getOperationalData);

module.exports = router;