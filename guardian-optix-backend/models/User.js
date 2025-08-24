const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['guard', 'manager', 'client'], default: 'guard' },
  guardType: { type: String, enum: ['Static Guard', 'Dog Handler Guard', 'Close Protection Guard'], required: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
