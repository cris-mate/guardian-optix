/**
 * Compliance Controller
 *
 * Handles compliance-related operations including certifications,
 * incidents, documents, and audit trails.
 */

const Certification = require('../models/Certification');
const Incident = require('../models/Incident');
const ComplianceAudit = require('../models/ComplianceAudit');
const ComplianceDocument = require('../models/ComplianceDocument');
const { emitIncidentReport } = require('../socket/socketManager');
const asyncHandler = require('../utils/asyncHandler');

// ============================================
// Metrics
// ============================================

/**
 * @desc    Get compliance dashboard metrics
 * @route   GET /api/compliance/metrics
 * @access  Private
 */
exports.getComplianceMetrics = asyncHandler(async (req, res) => {
  const [certStats, incidentStats] = await Promise.all([
    Certification.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Incident.aggregate([
      { $match: { status: { $in: ['open', 'under-review'] } } },
      { $count: 'openCount' },
    ]),
  ]);

  const metrics = {
    validCertifications: certStats.find((s) => s._id === 'valid')?.count || 0,
    certsExpiringSoon: certStats.find((s) => s._id === 'expiring-soon')?.count || 0,
    expiredCerts: certStats.find((s) => s._id === 'expired')?.count || 0,
    openIncidents: incidentStats[0]?.openCount || 0,
  };

  const totalCerts =
    metrics.validCertifications + metrics.certsExpiringSoon + metrics.expiredCerts;
  metrics.complianceRate = totalCerts
    ? Math.round((metrics.validCertifications / totalCerts) * 100)
    : 100;

  res.json(metrics);
});

// ============================================
// Certifications
// ============================================

/**
 * @desc    Get all certifications with optional filtering
 * @route   GET /api/compliance/certifications
 * @access  Private
 */
exports.getCertifications = asyncHandler(async (req, res) => {
  const { status, userId, certType } = req.query;
  const filter = {};

  if (status) {
    // Support comma-separated status values
    const statuses = status.split(',').map((s) => s.trim());
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  if (userId) filter.userId = userId;
  if (certType) filter.certType = certType;

  const certifications = await Certification.find(filter)
    .populate('userId', 'fullName email')
    .sort({ expiryDate: 1 });

  res.json(certifications);
});

/**
 * @desc    Add a new certification
 * @route   POST /api/compliance/certifications
 * @access  Private (Manager/Admin)
 */
exports.addCertification = asyncHandler(async (req, res) => {
  const certification = await Certification.create(req.body);

  // Log audit trail
  await ComplianceAudit.create({
    action: 'cert-uploaded',
    performedBy: req.user._id,
    targetId: certification._id,
    targetType: 'Certification',
    details: `Added ${certification.certType} for user`,
  });

  res.status(201).json(certification);
});

/**
 * @desc    Update a certification
 * @route   PATCH /api/compliance/certifications/:id
 * @access  Private (Manager/Admin)
 */
exports.updateCertification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const certification = await Certification.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate('userId', 'fullName email');

  if (!certification) {
    res.status(404);
    throw new Error('Certification not found');
  }

  // Log audit trail
  await ComplianceAudit.create({
    action: 'cert-updated',
    performedBy: req.user._id,
    targetId: certification._id,
    targetType: 'Certification',
    details: `Updated ${certification.certType} - ${Object.keys(updates).join(', ')}`,
  });

  res.json(certification);
});

// ============================================
// Incidents
// ============================================

/**
 * @desc    Get all incidents with optional filtering
 * @route   GET /api/compliance/incidents
 * @access  Private
 */
exports.getIncidents = asyncHandler(async (req, res) => {
  const { status, severity, location, startDate, endDate, limit = 50 } = req.query;
  const filter = {};

  if (status) {
    // Support comma-separated status values
    const statuses = status.split(',').map((s) => s.trim());
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }
  if (severity) {
    const severities = severity.split(',').map((s) => s.trim());
    filter.severity = severities.length === 1 ? severities[0] : { $in: severities };
  }
  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const incidents = await Incident.find(filter)
    .populate('reportedBy', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json(incidents);
});

/**
 * @desc    Report a new incident
 * @route   POST /api/compliance/incidents
 * @access  Private
 */
exports.reportIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.create({
    ...req.body,
    reportedBy: req.user._id,
  });

  await ComplianceAudit.create({
    action: 'incident-reported',
    performedBy: req.user._id,
    targetId: incident._id,
    targetType: 'Incident',
    details: `Reported ${incident.incidentType} at ${incident.location}`,
  });

  // Emit socket event for real-time updates
  if (typeof emitIncidentReport === 'function') {
    emitIncidentReport({
      incidentId: incident._id,
      type: incident.incidentType,
      severity: incident.severity,
      location: incident.location,
      reportedBy: req.user._id,
      reportedByName: req.user.fullName,
    });
  }

  res.status(201).json(incident);
});

/**
 * @desc    Update incident status
 * @route   PATCH /api/compliance/incidents/:id
 * @access  Private (Manager/Admin)
 */
exports.updateIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const incident = await Incident.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate('reportedBy', 'fullName email');

  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }

  // Log audit trail
  await ComplianceAudit.create({
    action: 'incident-updated',
    performedBy: req.user._id,
    targetId: incident._id,
    targetType: 'Incident',
    details: `Updated incident status to ${incident.status}`,
  });

  res.json(incident);
});

// ============================================
// Documents
// ============================================

/**
 * @desc    Get all compliance documents
 * @route   GET /api/compliance/documents
 * @access  Private
 */
exports.getDocuments = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const filter = {};

  if (category && category !== 'all') {
    filter.category = category;
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Check if ComplianceDocument model exists
  if (!ComplianceDocument) {
    // Return mock data if model doesn't exist yet
    return res.json([
      {
        _id: 'doc-001',
        name: 'Employee Handbook',
        category: 'policies',
        description: 'Company policies and procedures',
        fileType: 'pdf',
        fileSize: 2500000,
        uploadedBy: { fullName: 'System Admin' },
        createdAt: new Date().toISOString(),
        version: '2.1',
      },
      {
        _id: 'doc-002',
        name: 'Health & Safety Guidelines',
        category: 'health-safety',
        description: 'Workplace health and safety requirements',
        fileType: 'pdf',
        fileSize: 1800000,
        uploadedBy: { fullName: 'System Admin' },
        createdAt: new Date().toISOString(),
        version: '1.5',
      },
      {
        _id: 'doc-003',
        name: 'SIA Licence Requirements',
        category: 'training',
        description: 'SIA licensing requirements and renewal process',
        fileType: 'pdf',
        fileSize: 950000,
        uploadedBy: { fullName: 'System Admin' },
        createdAt: new Date().toISOString(),
        version: '3.0',
      },
    ]);
  }

  const documents = await ComplianceDocument.find(filter)
    .populate('uploadedBy', 'fullName')
    .sort({ createdAt: -1 });

  res.json(documents);
});

/**
 * @desc    Upload a compliance document
 * @route   POST /api/compliance/documents
 * @access  Private (Manager/Admin)
 */
exports.uploadDocument = asyncHandler(async (req, res) => {
  const document = await ComplianceDocument.create({
    ...req.body,
    uploadedBy: req.user._id,
  });

  await ComplianceAudit.create({
    action: 'document-uploaded',
    performedBy: req.user._id,
    targetId: document._id,
    targetType: 'Document',
    details: `Uploaded ${document.name}`,
  });

  res.status(201).json(document);
});

// ============================================
// Audit Trail
// ============================================

/**
 * @desc    Get audit trail entries
 * @route   GET /api/compliance/audit
 * @access  Private (Manager/Admin)
 */
exports.getAuditTrail = asyncHandler(async (req, res) => {
  const { limit = 50, page = 1, action, targetType } = req.query;
  const filter = {};

  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;

  const audits = await ComplianceAudit.find(filter)
    .populate('performedBy', 'fullName')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await ComplianceAudit.countDocuments(filter);

  res.json({
    audits,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});