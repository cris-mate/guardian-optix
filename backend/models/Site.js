/**
 * Site Model
 *
 * MongoDB schema for client sites.
 * Includes geofence configuration for GPS verification
 * and coverage requirements for scheduling
 */

const mongoose = require('mongoose');
const { SHIFT_TIMES } = require('../utils/shiftTimes');

// ============================================
// Geofence Sub-schema
// ============================================

const GeofenceSchema = new mongoose.Schema({
  center: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  radius: {
    type: Number,
    default: 150, // metres
    min: [50, 'Radius must be at least 50 metres'],
    max: [1000, 'Radius cannot exceed 1000 metres'],
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

// ============================================
// Address Sub-schema
// ============================================

const AddressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  postCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  country: {
    type: String,
    default: 'United Kingdom',
  },
}, { _id: false });

// ============================================
// Requirements Sub-schema
// ============================================

const RequirementsSchema = new mongoose.Schema({
  contractStart: {
    type: Date,
    required: [true, 'Contract start date is required'],
  },
  contractEnd: {
    type: Date,
    default: null, // null = ongoing
  },
  isOngoing: {
    type: Boolean,
    default: false,
  },

  // Coverage
  shiftsPerDay: [{
    shiftType: {
      type: String,
      enum: {
        values: Object.keys(SHIFT_TIMES),
        message: 'Invalid shift type. Must be one of: ' + Object.keys(SHIFT_TIMES).join(', '),
      },
      required: [true, 'Shift type is required'],
    },
    guardsRequired: {
      type: Number,
      min: [1, 'At least 1 guard required'],
      default: 1,
    },
    guardType: {
      type: String,
      enum: ['Static', 'Mobile Patrol', 'CCTV Operator', 'Door Supervisor', 'Close Protection'],
      default: 'Static',
    },
  }],

  // Operating Days
  daysOfWeek: {
    type: [Number],
    default: [1, 2, 3, 4, 5], // Mon-Fri
    validate: {
      validator: (arr) => arr.every(d => d >= 1 && d <= 7),
      message: 'Days must be 1-7',
    },
  },
}, { _id: false });

// ============================================
// Main Site Schema
// ============================================

const SiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      maxlength: [100, 'Site name cannot exceed 100 characters'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
      index: true,
    },
    address: {
      type: AddressSchema,
      required: true,
    },
    siteType: {
      type: String,
      enum: [
        'Corporate Office',
        'Retail',
        'Industrial',
        'Residential',
        'Event Venue',
        'Construction',
        'Healthcare',
        'Education',
        'Government',
        'Other',
      ],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
      index: true,
    },
    geofence: {
      type: GeofenceSchema,
    },
    requirements: {
      type: RequirementsSchema,
      default: null,
    },
    contactName: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Special instructions cannot exceed 1000 characters'],
    },
    accessCodes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// Indexes
// ============================================

SiteSchema.index({ name: 'text' });
SiteSchema.index({ 'address.postCode': 1 });
SiteSchema.index({ client: 1, status: 1 });
SiteSchema.index({ status: 1, createdAt: -1 });
SiteSchema.index({ 'requirements.contractStart': 1, 'requirements.contractEnd': 1 });

// ============================================
// Virtuals
// ============================================

SiteSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.postCode}`;
});

/**
 * Virtual: Calculate total guards needed per day based on requirements
 */
SiteSchema.virtual('totalDailyGuards').get(function() {
  if (!this.requirements || !this.requirements.shiftsPerDay) {
    return this.guardsRequired || 1;
  }
  return this.requirements.shiftsPerDay.reduce((sum, shift) => sum + (shift.guardsRequired || 1), 0);
});

/**
 * Virtual: Check if contract is currently active
 */
SiteSchema.virtual('isContractActive').get(function() {
  if (!this.requirements) return true; // No requirements = always active

  const now = new Date();
  const start = this.requirements.contractStart;
  const end = this.requirements.contractEnd;

  if (now < start) return false;
  if (this.requirements.isOngoing) return true;
  if (end && now > end) return false;

  return true;
});

// Ensure virtuals are included in JSON output
SiteSchema.set('toJSON', { virtuals: true });
SiteSchema.set('toObject', { virtuals: true });

// ============================================
// Methods
// ============================================

/**
 * Check if a location is within this site's geofence
 * Uses Haversine formula to calculate distance between two coordinates
 */
SiteSchema.methods.isLocationInGeofence = function(latitude, longitude) {
  if (!this.geofence || !this.geofence.isEnabled) {
    return true; // No geofence configured, allow
  }

  const R = 6371000; // Earth's radius in metres
  const lat1 = (this.geofence.center.latitude * Math.PI) / 180;
  const lat2 = (latitude * Math.PI) / 180;
  const deltaLat = ((latitude - this.geofence.center.latitude) * Math.PI) / 180;
  const deltaLng = ((longitude - this.geofence.center.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= this.geofence.radius;
};

/**
 * Get shift times for a given shift type from this site's requirements
 * Falls back to default SHIFT_TIMES if not customised
 */
SiteSchema.methods.getShiftTimes = function(shiftType) {
  return SHIFT_TIMES[shiftType] || null;
};

// ============================================
// Statics
// ============================================

/**
 * Find active sites for a client
 */
SiteSchema.statics.findActiveByClient = function(clientId) {
  return this.find({ client: clientId, status: 'active' }).sort({ name: 1 });
};

/**
 * Find sites with active contracts
 */
SiteSchema.statics.findWithActiveContracts = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    $or: [
      { requirements: null },
      { 'requirements.isOngoing': true, 'requirements.contractStart': { $lte: now } },
      {
        'requirements.contractStart': { $lte: now },
        'requirements.contractEnd': { $gte: now },
      },
    ],
  }).sort({ name: 1 });
};

/**
 * Search sites
 */
SiteSchema.statics.searchSites = async function(searchTerm, filters = {}) {
  const query = {};

  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { 'address.postCode': { $regex: searchTerm, $options: 'i' } },
      { 'address.city': { $regex: searchTerm, $options: 'i' } },
    ];
  }

  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  if (filters.clientId) {
    query.client = filters.clientId;
  }

  if (filters.siteType) {
    query.siteType = filters.siteType;
  }

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const [sites, total] = await Promise.all([
    this.find(query)
      .populate('client', 'companyName')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    sites,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = mongoose.model('Site', SiteSchema);