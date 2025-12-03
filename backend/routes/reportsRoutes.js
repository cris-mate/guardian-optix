/**
 * Reports Routes
 *
 * API endpoints for report generation and export.
 * Includes operational, attendance, incident, and timesheet reports.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getOperationalReport,
  getAttendanceReport,
  getIncidentReport,
  getTimesheetReport,
  exportReport,
  downloadReport,
  cleanupExports,
  getQuickStats,
} = require('../controllers/reportsController');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// Report Data Endpoints
// ============================================

/**
 * @route   GET /api/reports/quick-stats
 * @desc    Get quick statistics for reports dashboard
 * @access  Private
 */
router.get('/quick-stats', getQuickStats);

/**
 * @route   GET /api/reports/operational
 * @desc    Get operational report data
 * @access  Private (Manager/Admin)
 */
router.get('/operational', roleMiddleware('Manager', 'Admin'), getOperationalReport);

/**
 * @route   GET /api/reports/attendance
 * @desc    Get attendance report data with late arrivals and no-shows
 * @access  Private (Manager/Admin)
 */
router.get('/attendance', roleMiddleware('Manager', 'Admin'), getAttendanceReport);

/**
 * @route   GET /api/reports/incidents
 * @desc    Get incident report data
 * @access  Private (Manager/Admin)
 */
router.get('/incidents', roleMiddleware('Manager', 'Admin'), getIncidentReport);

/**
 * @route   GET /api/reports/timesheets
 * @desc    Get timesheet report data
 * @access  Private (Manager/Admin)
 */
router.get('/timesheets', roleMiddleware('Manager', 'Admin'), getTimesheetReport);

// ============================================
// Export Endpoints
// ============================================

/**
 * @route   POST /api/reports/export
 * @desc    Generate and export a report (PDF/Excel)
 * @access  Private (Manager/Admin)
 * @body    { reportType, format, timeRange, startDate?, endDate?, filters? }
 */
router.post('/export', roleMiddleware('Manager', 'Admin'), exportReport);

/**
 * @route   GET /api/reports/download/:filename
 * @desc    Download a generated report file
 * @access  Private (Manager/Admin)
 */
router.get('/download/:filename', roleMiddleware('Manager', 'Admin'), downloadReport);

/**
 * @route   POST /api/reports/cleanup
 * @desc    Clean up old export files (24+ hours)
 * @access  Private (Admin only)
 */
router.post('/cleanup', roleMiddleware('Admin'), cleanupExports);

module.exports = router;