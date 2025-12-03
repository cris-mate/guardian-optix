/**
 * Compliance Routes
 *
 * API endpoints for compliance management including
 * certifications, incidents, and audit trail.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  // Certifications
  getCertifications,
  getCertificationById,
  createCertification,
  updateCertification,
  verifyCertification,
  deleteCertification,

  // Incidents
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  resolveIncident,
  deleteIncident,

  // Audit
  getAuditTrail,

  // Stats
  getComplianceStats,
  getExpiringCertifications,
} = require('../controllers/complianceController');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// Statistics & Overview
// ============================================

/**
 * @route   GET /api/compliance/stats
 * @desc    Get compliance statistics
 * @access  Private
 */
router.get('/stats', getComplianceStats);

/**
 * @route   GET /api/compliance/expiring
 * @desc    Get certifications expiring soon
 * @access  Private
 */
router.get('/expiring', getExpiringCertifications);

// ============================================
// Certification Routes
// ============================================

/**
 * @route   GET /api/compliance/certifications
 * @desc    Get all certifications
 * @access  Private
 */
router.get('/certifications', getCertifications);

/**
 * @route   GET /api/compliance/certifications/:id
 * @desc    Get a single certification
 * @access  Private
 */
router.get('/certifications/:id', getCertificationById);

/**
 * @route   POST /api/compliance/certifications
 * @desc    Add a new certification
 * @access  Private
 */
router.post('/certifications', createCertification);

/**
 * @route   PUT /api/compliance/certifications/:id
 * @desc    Update a certification
 * @access  Private (Manager/Admin)
 */
router.put('/certifications/:id', roleMiddleware('Manager', 'Admin'), updateCertification);

/**
 * @route   PATCH /api/compliance/certifications/:id/verify
 * @desc    Verify a certification
 * @access  Private (Manager/Admin)
 */
router.patch('/certifications/:id/verify', roleMiddleware('Manager', 'Admin'), verifyCertification);

/**
 * @route   DELETE /api/compliance/certifications/:id
 * @desc    Delete a certification
 * @access  Private (Admin)
 */
router.delete('/certifications/:id', roleMiddleware('Admin'), deleteCertification);

// ============================================
// Incident Routes
// ============================================

/**
 * @route   GET /api/compliance/incidents
 * @desc    Get all incidents
 * @access  Private
 */
router.get('/incidents', getIncidents);

/**
 * @route   GET /api/compliance/incidents/:id
 * @desc    Get a single incident
 * @access  Private
 */
router.get('/incidents/:id', getIncidentById);

/**
 * @route   POST /api/compliance/incidents
 * @desc    Report a new incident
 * @access  Private
 */
router.post('/incidents', createIncident);

/**
 * @route   PUT /api/compliance/incidents/:id
 * @desc    Update an incident
 * @access  Private (Manager/Admin)
 */
router.put('/incidents/:id', roleMiddleware('Manager', 'Admin'), updateIncident);

/**
 * @route   PATCH /api/compliance/incidents/:id/resolve
 * @desc    Resolve an incident
 * @access  Private (Manager/Admin)
 */
router.patch('/incidents/:id/resolve', roleMiddleware('Manager', 'Admin'), resolveIncident);

/**
 * @route   DELETE /api/compliance/incidents/:id
 * @desc    Delete an incident
 * @access  Private (Admin)
 */
router.delete('/incidents/:id', roleMiddleware('Admin'), deleteIncident);

// ============================================
// Audit Trail Routes
// ============================================

/**
 * @route   GET /api/compliance/audit-trail
 * @desc    Get audit trail entries
 * @access  Private (Manager/Admin)
 */
router.get('/audit-trail', roleMiddleware('Manager', 'Admin'), getAuditTrail);

module.exports = router;