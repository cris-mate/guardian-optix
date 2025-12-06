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
// Shift Schema
// ============================================
const ShiftSchema = new mongoose.Schema(
  {
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Guard is required'],
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site is required'],
    },
    date: {
      type: String, // ISO date string (YYYY-MM-DD)
      required: [true, 'Date is required'],
      validate: {
        validator: function (v) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: 'Date must be in YYYY-MM-DD format',
      },
    },
    startTime: {
      type: String, // HH:mm format
      required: [true, 'Start time is required'],
      validate: {
        validator: function (v) {
          return /^\d{2}:\d{2}$/.test(v);
        },
        message: 'Start time must be in HH:mm format',
      },
    },
    endTime: {
      type: String, // HH:mm format
      required: [true, 'End time is required'],
      validate: {
        validator: function (v) {
          return /^\d{2}:\d{2}$/.test(v);
        },
        message: 'End time must be in HH:mm format',
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
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
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

ShiftSchema.index({ date: 1, guard: 1 });
ShiftSchema.index({ date: 1, site: 1 });
ShiftSchema.index({ date: 1, status: 1 });
ShiftSchema.index({ guard: 1, status: 1 });

// ============================================
// Virtuals
// ============================================

ShiftSchema.virtual('durationHours').get(function () {
  const start = parseInt(this.startTime.split(':')[0]);
  const end = parseInt(this.endTime.split(':')[0]);
  return end > start ? end - start : 24 - start + end;
});

ShiftSchema.virtual('tasksCompleted').get(function () {
  return this.tasks.filter((t) => t.completed).length;
});

ShiftSchema.virtual('tasksTotal').get(function () {
  return this.tasks.length;
});

// Ensure virtuals are included in JSON output
ShiftSchema.set('toJSON', { virtuals: true });
ShiftSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shift', ShiftSchema);