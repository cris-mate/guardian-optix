/**
 * TimeEntry Model
 *
 * MongoDB schema for time clock entries.
 * Tracks clock-ins, clock-outs, and breaks with GPS verification.
 */

const mongoose = require('mongoose');

// ============================================
// GPS Location Sub-schema
// ============================================

const GPSLocationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number, // metres
    default: 0,
  },
  address: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// ============================================
// Break Record Sub-schema
// ============================================

const BreakRecordSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  breakType: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: 'paid',
  },
  duration: {
    type: Number, // minutes
  },
  location: GPSLocationSchema,
});

// Calculate duration on save
BreakRecordSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  next();
});

// ============================================
// Main TimeEntry Schema
// ============================================

const TimeEntrySchema = new mongoose.Schema(
  {
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Officer is required'],
      index: true,
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      index: true,
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      index: true,
    },
    date: {
      type: String, // ISO date string (YYYY-MM-DD)
      required: [true, 'Date is required'],
      index: true,
      validate: {
        validator: function (v) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: 'Date must be in YYYY-MM-DD format',
      },
    },
    type: {
      type: String,
      enum: ['clock-in', 'clock-out', 'break-start', 'break-end'],
      required: [true, 'Entry type is required'],
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      default: Date.now,
    },
    location: GPSLocationSchema,
    geofenceStatus: {
      type: String,
      enum: ['inside', 'outside', 'unknown'],
      default: 'unknown',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isManualEntry: {
      type: Boolean,
      default: false,
    },
    manualEntryReason: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// Timesheet Schema (Daily Summary)
// ============================================

const TimesheetSchema = new mongoose.Schema(
  {
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // ISO date string (YYYY-MM-DD)
      required: true,
      index: true,
    },
    entries: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeEntry',
    }],
    breaks: [BreakRecordSchema],
    clockInTime: {
      type: Date,
    },
    clockOutTime: {
      type: Date,
    },
    totalMinutesWorked: {
      type: Number,
      default: 0,
    },
    totalBreakMinutes: {
      type: Number,
      default: 0,
    },
    regularMinutes: {
      type: Number,
      default: 0,
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
TimesheetSchema.index({ officer: 1, date: 1 }, { unique: true });
TimesheetSchema.index({ date: 1, status: 1 });

// ============================================
// Active Session Schema (Current Clock Status)
// ============================================

const ActiveSessionSchema = new mongoose.Schema(
  {
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
    },
    clockStatus: {
      type: String,
      enum: ['clocked-out', 'clocked-in', 'on-break'],
      default: 'clocked-out',
    },
    clockedInAt: {
      type: Date,
    },
    currentBreakStartedAt: {
      type: Date,
    },
    currentBreakType: {
      type: String,
      enum: ['paid', 'unpaid'],
    },
    lastKnownLocation: GPSLocationSchema,
    geofenceStatus: {
      type: String,
      enum: ['inside', 'outside', 'unknown'],
      default: 'unknown',
    },
    totalBreakMinutesToday: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// Indexes
// ============================================

TimeEntrySchema.index({ officer: 1, date: 1 });
TimeEntrySchema.index({ officer: 1, timestamp: -1 });
TimeEntrySchema.index({ site: 1, date: 1 });
TimeEntrySchema.index({ type: 1, timestamp: -1 });

// ============================================
// Virtual: Hours Worked Today
// ============================================

TimesheetSchema.virtual('hoursWorked').get(function() {
  return Math.round((this.totalMinutesWorked / 60) * 100) / 100;
});

TimesheetSchema.virtual('overtimeHours').get(function() {
  return Math.round((this.overtimeMinutes / 60) * 100) / 100;
});

// Ensure virtuals are included in JSON output
TimesheetSchema.set('toJSON', { virtuals: true });
TimesheetSchema.set('toObject', { virtuals: true });

// ============================================
// Static Methods
// ============================================

/**
 * Get or create timesheet for officer on a given date
 */
TimesheetSchema.statics.getOrCreateForDate = async function(officerId, date) {
  let timesheet = await this.findOne({ officer: officerId, date });

  if (!timesheet) {
    timesheet = await this.create({
      officer: officerId,
      date,
      entries: [],
      breaks: [],
    });
  }

  return timesheet;
};

/**
 * Calculate overtime (assuming 8-hour standard day)
 */
TimesheetSchema.methods.calculateOvertime = function() {
  const STANDARD_DAY_MINUTES = 480; // 8 hours
  const netWorked = this.totalMinutesWorked - this.totalBreakMinutes;

  if (netWorked > STANDARD_DAY_MINUTES) {
    this.overtimeMinutes = netWorked - STANDARD_DAY_MINUTES;
    this.regularMinutes = STANDARD_DAY_MINUTES;
  } else {
    this.overtimeMinutes = 0;
    this.regularMinutes = netWorked;
  }

  return this;
};

// ============================================
// Exports
// ============================================

const TimeEntry = mongoose.model('TimeEntry', TimeEntrySchema);
const Timesheet = mongoose.model('Timesheet', TimesheetSchema);
const ActiveSession = mongoose.model('ActiveSession', ActiveSessionSchema);

module.exports = {
  TimeEntry,
  Timesheet,
  ActiveSession,
};