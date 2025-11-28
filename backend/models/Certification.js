const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certType: {
    type: String,
    enum: ['SIA License', 'First Aid', 'Fire Safety', 'CCTV', 'Door Supervisor', 'Close Protection'],
    required: true
  },
  certNumber: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['valid', 'expiring-soon', 'expired'],
    default: 'valid'
  },
  documentUrl: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date
}, { timestamps: true });

// Auto-calculate status based on expiry
certificationSchema.pre('save', function(next) {
  const daysUntilExpiry = Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 0) this.status = 'expired';
  else if (daysUntilExpiry <= 30) this.status = 'expiring-soon';
  else this.status = 'valid';
  next();
});

module.exports = mongoose.model('Certification', certificationSchema);