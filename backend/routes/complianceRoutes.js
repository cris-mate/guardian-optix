const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getComplianceMetrics,
  getCertifications,
  addCertification,
  reportIncident,
  getAuditTrail
} = require('../controllers/complianceController');

// All routes require authentication
router.use(authMiddleware);

router.get('/metrics', getComplianceMetrics);
router.get('/certifications', getCertifications);
router.post('/certifications', roleMiddleware(['manager', 'admin']), addCertification);
router.post('/incidents', reportIncident);
router.get('/audit', roleMiddleware(['manager', 'admin']), getAuditTrail);

module.exports = router;