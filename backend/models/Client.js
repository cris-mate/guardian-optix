/**
 * MongoDB schema for client management.
 * No contracts or portal access tracking.
 */

const mongoose = require('mongoose');

// Sub-schemas
const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  postCode: { type: String, required: true },
  country: { type: String, default: 'United Kingdom' },
  coordinates: { lat: Number, lng: Number },
}, { _id: false });

const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  jobTitle: String,
  isPrimary: { type: Boolean, default: false },
}, { timestamps: true });

// Main schema
const clientSchema = new mongoose.Schema({
  companyName: { type: String, required: true, index: true },
  tradingName: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect'],
    default: 'prospect',
    index: true,
  },
  industry: String,
  logoUrl: String,
  address: { type: addressSchema, required: true },
  contacts: [contactSchema],
  sites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Site' }],
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastActivityAt: Date,
}, { timestamps: true });

// Indexes
clientSchema.index({ companyName: 'text', tradingName: 'text' });
clientSchema.index({ 'address.postCode': 1 });
clientSchema.index({ status: 1, createdAt: -1 });

// Virtuals
clientSchema.virtual('primaryContact').get(function() {
  return this.contacts.find(c => c.isPrimary) || this.contacts[0];
});

clientSchema.virtual('totalSites').get(function() {
  return this.sites ? this.sites.length : 0;
});

clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

// Pre-save
clientSchema.pre('save', function(next) {
  if (this.contacts.length > 0 && !this.contacts.some(c => c.isPrimary)) {
    this.contacts[0].isPrimary = true;
  }
  next();
});

// Static: Search
clientSchema.statics.searchClients = async function(searchTerm, filters = {}) {
  const query = {};

  if (searchTerm) {
    query.$or = [
      { companyName: { $regex: searchTerm, $options: 'i' } },
      { tradingName: { $regex: searchTerm, $options: 'i' } },
      { 'address.postCode': { $regex: searchTerm, $options: 'i' } },
      { 'contacts.firstName': { $regex: searchTerm, $options: 'i' } },
      { 'contacts.lastName': { $regex: searchTerm, $options: 'i' } },
    ];
  }

  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  const sortField = filters.sortBy || 'companyName';
  const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const skip = (page - 1) * limit;

  const [clients, total] = await Promise.all([
    this.find(query)
      .populate('sites', 'name address status')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    clients,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = mongoose.model('Client', clientSchema);