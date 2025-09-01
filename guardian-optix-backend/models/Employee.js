const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['Guard', 'Manager', 'Client'], required: true },
  guardType: { type: String, enum: ['Static', 'Dog Handler', 'Close Protection'], default: 'Static' },
  assignedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  availability: { type: Boolean, default: true },
  shift: { type: String, enum: ['Day', 'Night'], default: 'Day' },
});

module.exports = mongoose.model('Employee', EmployeeSchema);
