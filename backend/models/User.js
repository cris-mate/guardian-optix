const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  postCode: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Manager', 'Guard'], required: true },
  guardType: { type: String, enum: ['Static', 'Dog Handler', 'Close Protection', 'Mobile Patrol'], required: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
