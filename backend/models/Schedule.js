const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  role: { type: String, enum: ['Static', 'Dog Handler', 'Close Protection', 'Mobile Patrol'], required: true },
  jobName: { type: String, required: true },
  location: { type: String, required: true },
  shift: { type: String, enum: ['Morning', 'Afternoon', 'Night'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
