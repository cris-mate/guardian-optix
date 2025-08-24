const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['Guard', 'Manager', 'Client'], required: true },
  guardType: { type: String, enum: ['Static Guard', 'Dog Handler Guard', 'Close Protection Guard'], default: 'Static Guard' },
  assignedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  availability: { type: Boolean, default: true },
  shift: { type: String, enum: ['Morning', 'Afternoon', 'Night'], default: 'Morning' },
});

module.exports = mongoose.model('Employee', EmployeeSchema);
