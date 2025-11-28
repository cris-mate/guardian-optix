const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: String, required: true },
  incidentType: {
    type: String,
    enum: ['security-breach', 'injury', 'property-damage', 'unauthorized-access',
      'equipment-failure', 'policy-violation', 'other'],
    required: true
  },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  description: { type: String, required: true },
  witnesses: [String],
  evidenceUrls: [String],
  status: {
    type: String,
    enum: ['open', 'under-review', 'resolved', 'closed'],
    default: 'open'
  },
  resolution: String,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);