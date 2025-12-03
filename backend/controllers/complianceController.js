/**
 * Compliance Controller
 *
 * Handles compliance management including certifications,
 * incidents, and audit trail. Emits Socket.io events for real-time updates.
 */

const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Certification = require('../models/Certification');
const Incident = require('../models/Incident');
const ComplianceAudit = require('../models/ComplianceAudit');
const {
  emitIncidentReport,
  emitActivity,
  notifyRole,
} = require('../socket/socketManager');

// ============================================
// Helper Functions
// ============================================

/**
 * Log compliance audit event
 */
const logAudit = async (action, performedBy, targetId, targetType, details, ipAddress) => {
  await ComplianceAudit.create({
    action,
    performedBy,
    targetId,
    targetType,
    details,
    ipAddress,
  });
};

/**
 * Calculate compliance score for an officer
 */
const calculateComplianceScore = (certifications) => {
  if (!certifications || certifications.length === 0) return 0;

  const validCount = certifications.filter((c) => c.status === 'valid').length;
  return Math.round((validCount / certifications.length) * 100);
};

// ============================================
// Certification Management
// ============================================

/**
 * @route   GET /api/compliance/certifications
 * @desc    Get all certifications with filtering
 * @access  Private
 */
const getCertifications = asyncHandler(async (req, res) => {
  const { userId, status, certType, expiringWithin } = req.query;

  const query = {};

  if (userId) query.userId = userId;
  if (status) query.status = status;
  if (certType) query.certType = certType;

  // Filter for expiring soon
  if (expiringWithin) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(expiringWithin));
    query.expiryDate = { $lte: futureDate, $gte: new Date() };
  }

  const certifications = await Certification.find(query)
    .populate('userId', 'fullName username')
    .populate('verifiedBy', 'fullName')
    .sort({ expiryDate: 1 });

  res.json({
    success: true,
    data: certifications,
    count: certifications.length,
  });
});

/**
 * @route   GET /api/compliance/certifications/:id
 * @desc    Get a single certification
 * @access  Private
 */
const getCertificationById = asyncHandler(async (req, res) => {
  const certification = await Certification.findById(req.params.id)
    .populate('userId', 'fullName username email')
    .populate('verifiedBy', 'fullName');

  if (!certification) {
    res.status(404);
    throw new Error('Certification not found');
  }

  res.json({
    success: true,
    data: certification,
  });
});

/**
 * @route   POST /api/compliance/certifications
 * @desc    Add a new certification
 * @access  Private
 */
const createCertification = asyncHandler(async (req, res) => {
  const { userId, certType, certNumber, issueDate, expiryDate, documentUrl } = req.body;

  // Check for duplicate
  const existing = await Certification.findOne({
    userId,
    certType,
    certNumber,
  });

  if (existing) {
    res.status(400);
    throw new Error('Certification with this number already exists');
  }

  const certification = await Certification.create({
    userId,
    certType,
    certNumber,
    issueDate,
    expiryDate,
    documentUrl,
  });

  // Log audit
  await logAudit(
    'cert-uploaded',
    req.user._id,
    certification._id,
    'Certification',
    `${certType} certification added for user`,
    req.ip
  );

  // Emit activity
  emitActivity({
    type: 'certification-added',
    certType,
    userId,
  });

  await certification.populate('userId', 'fullName');

  res.status(201).json({
    success: true,
    data: certification,
  });
});

/**
 * @route   PUT /api/compliance/certifications/:id
 * @desc    Update a certification
 * @access  Private (Manager/Admin)
 */
const updateCertification = asyncHandler(async (req, res) => {
  const certification = await Certification.findById(req.params.id);

  if (!certification) {
    res.status(404);
    throw new Error('Certification not found');
  }

  const allowedUpdates = ['certNumber', 'issueDate', 'expiryDate', 'documentUrl', 'status'];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      certification[field] = req.body[field];
    }
  });

  await certification.save();
  await certification.populate('userId', 'fullName');

  res.json({
    success: true,
    data: certification,
  });
});

/**
 * @route   PATCH /api/compliance/certifications/:id/verify
 * @desc    Verify a certification
 * @access  Private (Manager/Admin)
 */
const verifyCertification = asyncHandler(async (req, res) => {
  const certification = await Certification.findById(req.params.id);

  if (!certification) {
    res.status(404);
    throw new Error('Certification not found');
  }

  certification.verifiedBy = req.user._id;
  certification.verifiedAt = new Date();

  await certification.save();

  // Log audit
  await logAudit(
    'cert-verified',
    req.user._id,
    certification._id,
    'Certification',
    `${certification.certType} verified`,
    req.ip
  );

  await certification.populate('userId', 'fullName');
  await certification.populate('verifiedBy', 'fullName');

  res.json({
    success: true,
    data: certification,
    message: 'Certification verified',
  });
});

/**
 * @route   DELETE /api/compliance/certifications/:id
 * @desc    Delete a certification
 * @access  Private (Admin)
 */
const deleteCertification = asyncHandler(async (req, res) => {
  const certification = await Certification.findById(req.params.id);

  if (!certification) {
    res.status(404);
    throw new Error('Certification not found');
  }

  await certification.deleteOne();

  res.json({
    success: true,
    message: 'Certification deleted',
  });
});

// ============================================
// Incident Management
// ============================================

/**
 * @route   GET /api/compliance/incidents
 * @desc    Get all incidents with filtering
 * @access  Private
 */
const getIncidents = asyncHandler(async (req, res) => {
  const { status, severity, incidentType, startDate, endDate, limit = 50 } = req.query;

  const query = {};

  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (incidentType) query.incidentType = incidentType;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const incidents = await Incident.find(query)
    .populate('reportedBy', 'fullName username')
    .populate('resolvedBy', 'fullName')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: incidents,
    count: incidents.length,
  });
});

/**
 * @route   GET /api/compliance/incidents/:id
 * @desc    Get a single incident
 * @access  Private
 */
const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id)
    .populate('reportedBy', 'fullName username email')
    .populate('resolvedBy', 'fullName');

  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  // Log view audit
  await logAudit(
    'document-viewed',
    req.user._id,
    incident._id,
    'Incident',
    `Incident ${incident._id} viewed`,
    req.ip
  );

  res.json({
    success: true,
    data: incident,
  });
});

/**
 * @route   POST /api/compliance/incidents
 * @desc    Report a new incident
 * @access  Private
 */
const createIncident = asyncHandler(async (req, res) => {
  const {
    location,
    incidentType,
    severity,
    description,
    witnesses,
    evidenceUrls,
  } = req.body;

  const incident = await Incident.create({
    reportedBy: req.user._id,
    location,
    incidentType,
    severity,
    description,
    witnesses: witnesses || [],
    evidenceUrls: evidenceUrls || [],
    status: 'open',
  });

  // Log audit
  await logAudit(
    'incident-reported',
    req.user._id,
    incident._id,
    'Incident',
    `${severity} ${incidentType} incident reported at ${location}`,
    req.ip
  );

  // Emit socket event for real-time notification
  emitIncidentReport({
    incidentId: incident._id,
    type: incidentType,
    severity,
    location,
    reportedBy: req.user._id,
    reportedByName: req.user.fullName,
  });

  // Emit activity
  emitActivity({
    type: 'incident-reported',
    incidentId: incident._id,
    incidentType,
    severity,
    location,
    reportedBy: req.user.fullName,
  });

  // Notify managers for high/critical incidents
  if (['high', 'critical'].includes(severity)) {
    notifyRole('Manager', 'alert:incident', {
      severity,
      type: incidentType,
      location,
      message: `${severity.toUpperCase()} incident reported: ${incidentType} at ${location}`,
    });

    notifyRole('Admin', 'alert:incident', {
      severity,
      type: incidentType,
      location,
      message: `${severity.toUpperCase()} incident reported: ${incidentType} at ${location}`,
    });
  }

  await incident.populate('reportedBy', 'fullName');

  res.status(201).json({
    success: true,
    data: incident,
    message: 'Incident reported successfully',
  });
});

/**
 * @route   PUT /api/compliance/incidents/:id
 * @desc    Update an incident
 * @access  Private (Manager/Admin)
 */
const updateIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  const allowedUpdates = ['location', 'incidentType', 'severity', 'description', 'witnesses', 'evidenceUrls', 'status'];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      incident[field] = req.body[field];
    }
  });

  await incident.save();
  await incident.populate('reportedBy', 'fullName');

  // Emit activity for status change
  if (req.body.status) {
    emitActivity({
      type: 'incident-status-updated',
      incidentId: incident._id,
      newStatus: req.body.status,
      updatedBy: req.user.fullName,
    });
  }

  res.json({
    success: true,
    data: incident,
  });
});

/**
 * @route   PATCH /api/compliance/incidents/:id/resolve
 * @desc    Resolve an incident
 * @access  Private (Manager/Admin)
 */
const resolveIncident = asyncHandler(async (req, res) => {
  const { resolution } = req.body;

  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  if (incident.status === 'closed' || incident.status === 'resolved') {
    res.status(400);
    throw new Error('Incident already resolved');
  }

  incident.status = 'resolved';
  incident.resolution = resolution;
  incident.resolvedBy = req.user._id;
  incident.resolvedAt = new Date();

  await incident.save();

  // Log audit
  await logAudit(
    'incident-reported', // Using existing enum value
    req.user._id,
    incident._id,
    'Incident',
    `Incident resolved: ${resolution}`,
    req.ip
  );

  // Emit activity
  emitActivity({
    type: 'incident-resolved',
    incidentId: incident._id,
    incidentType: incident.incidentType,
    resolvedBy: req.user.fullName,
    resolution,
  });

  await incident.populate('reportedBy', 'fullName');
  await incident.populate('resolvedBy', 'fullName');

  res.json({
    success: true,
    data: incident,
    message: 'Incident resolved',
  });
});

/**
 * @route   DELETE /api/compliance/incidents/:id
 * @desc    Delete an incident
 * @access  Private (Admin)
 */
const deleteIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  await incident.deleteOne();

  res.json({
    success: true,
    message: 'Incident deleted',
  });
});

// ============================================
// Audit Trail
// ============================================

/**
 * @route   GET /api/compliance/audit-trail
 * @desc    Get audit trail entries
 * @access  Private (Manager/Admin)
 */
const getAuditTrail = asyncHandler(async (req, res) => {
  const { action, userId, startDate, endDate, limit = 100 } = req.query;

  const query = {};

  if (action) query.action = action;
  if (userId) query.performedBy = userId;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const entries = await ComplianceAudit.find(query)
    .populate('performedBy', 'fullName username role')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: entries,
    count: entries.length,
  });
});

// ============================================
// Compliance Statistics
// ============================================

/**
 * @route   GET /api/compliance/stats
 * @desc    Get compliance statistics
 * @access  Private
 */
const getComplianceStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalCertifications,
    validCertifications,
    expiringSoon,
    expired,
    totalIncidents,
    openIncidents,
    criticalIncidents,
  ] = await Promise.all([
    Certification.countDocuments(),
    Certification.countDocuments({ status: 'valid' }),
    Certification.countDocuments({
      expiryDate: { $lte: thirtyDaysFromNow, $gte: now },
    }),
    Certification.countDocuments({ status: 'expired' }),
    Incident.countDocuments(),
    Incident.countDocuments({ status: { $in: ['open', 'under-review'] } }),
    Incident.countDocuments({ severity: 'critical', status: { $in: ['open', 'under-review'] } }),
  ]);

  res.json({
    success: true,
    data: {
      certifications: {
        total: totalCertifications,
        valid: validCertifications,
        expiringSoon,
        expired,
        complianceRate: totalCertifications > 0
          ? Math.round((validCertifications / totalCertifications) * 100)
          : 100,
      },
      incidents: {
        total: totalIncidents,
        open: openIncidents,
        critical: criticalIncidents,
      },
    },
  });
});

/**
 * @route   GET /api/compliance/expiring
 * @desc    Get certifications expiring soon
 * @access  Private
 */
const getExpiringCertifications = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  const certifications = await Certification.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    status: { $ne: 'expired' },
  })
    .populate('userId', 'fullName username email phoneNumber')
    .sort({ expiryDate: 1 });

  res.json({
    success: true,
    data: certifications,
    count: certifications.length,
  });
});

module.exports = {
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
};