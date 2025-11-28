const mongoose = require('mongoose');

const complianceAuditSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['document-viewed', 'document-signed', 'cert-uploaded', 'cert-verified',
      'incident-reported', 'checklist-completed', 'policy-acknowledged'],
    required: true
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: mongoose.Schema.Types.ObjectId,
  targetType: { type: String, enum: ['Certification', 'Incident', 'Document', 'Checklist'] },
  details: String,
  ipAddress: String,
  timestamp: { type: Date, default: Date.now }
});

// Index for efficient querying
complianceAuditSchema.index({ timestamp: -1 });
complianceAuditSchema.index({ performedBy: 1, timestamp: -1 });

module.exports = mongoose.model('ComplianceAudit', complianceAuditSchema);