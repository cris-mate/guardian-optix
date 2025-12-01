/**
 * Shift Model
 *
 * MongoDB schema for shift management.
 * Includes embedded tasks subdocument.
 */

const mongoose = require('mongoose');

// Task subdocument schema
const TaskSchema = new mongoose.Schema({
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

// Shift schema
const ShiftSchema = new mongoose.Schema(
  {
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Officer is required'],
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

// Indexes for efficient querying
ShiftSchema.index({ date: 1, officer: 1 });
ShiftSchema.index({ date: 1, site: 1 });
ShiftSchema.index({ date: 1, status: 1 });
ShiftSchema.index({ officer: 1, status: 1 });

// Virtual for shift duration in hours
ShiftSchema.virtual('durationHours').get(function () {
  const start = parseInt(this.startTime.split(':')[0]);
  const end = parseInt(this.endTime.split(':')[0]);
  return end > start ? end - start : 24 - start + end;
});

// Virtual for task completion percentage
ShiftSchema.virtual('taskCompletionPercentage').get(function () {
  if (this.tasks.length === 0) return 100;
  const completed = this.tasks.filter((t) => t.completed).length;
  return Math.round((completed / this.tasks.length) * 100);
});

// Ensure virtuals are included in JSON output
ShiftSchema.set('toJSON', { virtuals: true });
ShiftSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shift', ShiftSchema);