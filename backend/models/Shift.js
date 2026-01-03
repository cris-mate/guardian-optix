/**
 * Shift Model
 *
 * MongoDB schema for shift management.
 * Includes embedded tasks subdocument.
 */

const mongoose = require('mongoose');

// ============================================
// Task Subdocument Schema
// ============================================
const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Task title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [200, 'Task description cannot exceed 200 characters'],
  },
  frequency: {
    type: String,
    enum: ['once', 'hourly', 'periodic'],
    default: 'once',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// ============================================
// Shift Times
// ============================================
const SHIFT_TIMES = {
  Morning: { start: '06:00', end: '14:00' },
  Afternoon: { start: '14:00', end: '22:00' },
  Night: { start: '22:00', end: '06:00' },
};

// ============================================
// Shift Schema
// ============================================
const ShiftSchema = new mongoose.Schema(
  {
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,  // Allow unassigned shifts
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site is required'],
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Date is required'],
      validate: {
        validator: function (v) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: 'Date must be in YYYY-MM-DD format',
      },
    },
    shiftType: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Night'],
      required: [true, 'Shift type is required'],
    },
    tasks: [TaskSchema],
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['unassigned', 'scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'unassigned',
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

ShiftSchema.index({date: 1, guard: 1});
ShiftSchema.index({date: 1, site: 1});
ShiftSchema.index({date: 1, status: 1});
ShiftSchema.index({guard: 1, status: 1});

// ============================================
// Virtuals
// ============================================

ShiftSchema.virtual('startTime').get(function () {
  return SHIFT_TIMES[this.shiftType]?.start || '00:00';
});

ShiftSchema.virtual('endTime').get(function () {
  return SHIFT_TIMES[this.shiftType]?.end || '00:00';
});

ShiftSchema.virtual('durationHours').get(function () {
  const times = SHIFT_TIMES[this.shiftType];
  if (!times) return 8;
  const start = parseInt(times.start.split(':')[0]);
  const end = parseInt(times.end.split(':')[0]);
  return end > start ? end - start : 24 - start + end;
});

ShiftSchema.virtual('tasksCompleted').get(function () {
  return this.tasks.filter((t) => t.completed).length;
});

ShiftSchema.virtual('tasksTotal').get(function () {
  return this.tasks.length;
});

// Ensure virtuals are included in JSON output
ShiftSchema.set('toJSON', {virtuals: true});
ShiftSchema.set('toObject', {virtuals: true});

module.exports = mongoose.model('Shift', ShiftSchema);