/**
 * Compliance Routes
 *
 * API endpoints for compliance management including certifications,
 * incidents, documents, and audit trails.
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getComplianceMetrics,
  getCertifications,
  addCertification,
  updateCertification,
  getIncidents,
  reportIncident,
  updateIncident,
  getDocuments,
  uploadDocument,
  getAuditTrail,
} = require('../controllers/complianceController');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// Metrics
// ============================================

/**
 * @route   GET /api/compliance/metrics
 * @desc    Get compliance dashboard metrics
 * @access  Private
 */
router.get('/metrics', getComplianceMetrics);

// ============================================
// Certifications
// ============================================

/**
 * @route   GET /api/compliance/certifications
 * @desc    Get all certifications with optional filtering
 * @access  Private
 */
router.get('/certifications', getCertifications);

/**
 * @route   POST /api/compliance/certifications
 * @desc    Add a new certification
 * @access  Private (Manager/Admin)
 */
router.post('/certifications', roleMiddleware(['Manager', 'Admin']), addCertification);

/**
 * @route   PATCH /api/compliance/certifications/:id
 * @desc    Update a certification
 * @access  Private (Manager/Admin)
 */
router.patch('/certifications/:id', roleMiddleware(['Manager', 'Admin']), updateCertification);

// ============================================
// Incidents
// ============================================

/**
 * @route   GET /api/compliance/incidents
 * @desc    Get all incidents with optional filtering
 * @access  Private
 */
router.get('/incidents', getIncidents);

/**
 * @route   POST /api/compliance/incidents
 * @desc    Report a new incident
 * @access  Private
 */
router.post('/incidents', reportIncident);

/**
 * @route   PATCH /api/compliance/incidents/:id
 * @desc    Update incident status
 * @access  Private (Manager/Admin)
 */
router.patch('/incidents/:id', roleMiddleware(['Manager', 'Admin']), updateIncident);

// ============================================
// Documents
// ============================================

/**
 * @route   GET /api/compliance/documents
 * @desc    Get all compliance documents
 * @access  Private
 */
router.get('/documents', getDocuments);

/**
 * @route   POST /api/compliance/documents
 * @desc    Upload a compliance document
 * @access  Private (Manager/Admin)
 */
router.post('/documents', roleMiddleware(['Manager', 'Admin']), uploadDocument);

// ============================================
// Audit Trail
// ============================================

/**
 * @route   GET /api/compliance/audit
 * @desc    Get audit trail entries
 * @access  Private (Manager/Admin)
 */
router.get('/audit', roleMiddleware(['Manager', 'Admin']), getAuditTrail);

module.exports = router;