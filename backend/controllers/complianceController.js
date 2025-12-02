const Certification = require('../models/Certification');
const Incident = require('../models/Incident');
const ComplianceAudit = require('../models/ComplianceAudit');
const { emitIncidentReport } = require('../socket/socketManager');
const asyncHandler = require('../utils/asyncHandler');

// Dashboard metrics aggregation
exports.getComplianceMetrics = asyncHandler(async (req, res) => {

  const [certStats, incidentStats] = await Promise.all([
    Certification.aggregate([
      { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
    ]),
    Incident.aggregate([
      { $match: { status: { $in: ['open', 'under-review'] } } },
      { $count: 'openCount' }
    ])
  ]);

  const metrics = {
    validCertifications: certStats.find(s => s._id === 'valid')?.count || 0,
    certsExpiringSoon: certStats.find(s => s._id === 'expiring-soon')?.count || 0,
    expiredCerts: certStats.find(s => s._id === 'expired')?.count || 0,
    openIncidents: incidentStats[0]?.openCount || 0
  };

  const totalCerts = metrics.validCertifications + metrics.certsExpiringSoon + metrics.expiredCerts;
  metrics.complianceRate = totalCerts ? Math.round((metrics.validCertifications / totalCerts) * 100) : 100;

  res.json(metrics);
});

// Get all certifications with optional filtering
exports.getCertifications = asyncHandler(async (req, res) => {
  const { status, userId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (userId) filter.userId = userId;

  const certifications = await Certification.find(filter)
    .populate('userId', 'fullName email')
    .sort({ expiryDate: 1 });

  res.json(certifications);
});

// Create/upload certification
exports.addCertification = asyncHandler(async (req, res) => {
  const certification = await Certification.create(req.body);

  // Log audit trail
  await ComplianceAudit.create({
    action: 'cert-uploaded',
    performedBy: req.user._id,
    targetId: certification._id,
    targetType: 'Certification',
    details: `Added ${certification.certType} for user`
  });

  res.status(201).json(certification);
});

// Report incident
exports.reportIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.create({
    ...req.body,
    reportedBy: req.user._id
  });

  await ComplianceAudit.create({
    action: 'incident-reported',
    performedBy: req.user._id,
    targetId: incident._id,
    targetType: 'Incident',
    details: `Reported ${incident.incidentType} at ${incident.location}`
  });

  res.status(201).json(incident);

  emitIncidentReport({
    incidentId: incident._id,
    type: incident.incidentType,
    severity: incident.severity,
    location: incident.location,
    reportedBy: req.user._id,
    reportedByName: req.user.fullName,
  });
});

// Get audit trail (managers only)
exports.getAuditTrail = asyncHandler(async (req, res) => {
  const { limit = 50, page = 1 } = req.query;

  const audits = await ComplianceAudit.find()
    .populate('performedBy', 'fullName')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  res.json(audits);
});