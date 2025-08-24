const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  shiftTime: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
