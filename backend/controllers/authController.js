const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');

// User Registration
exports.registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, phoneNumber, postCode, password, role, managerType, guardType } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const field = existingUser.email === email ? 'Email' : 'Username';
    return res.status(400).json({ message: `Registration failed. ${field} already in use` });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    fullName,
    username,
    email,
    phoneNumber,
    postCode,
    password: hashedPassword,
    role,
    managerType,
    guardType
  });

  await newUser.save();
  res.status(201).json({ message: 'User registered successfully' });
});

// User Login
exports.loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Exclude password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  res.json({ token, user: userResponse });

});

