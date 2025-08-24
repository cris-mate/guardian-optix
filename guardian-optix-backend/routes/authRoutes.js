const express = require('express');
const router = express.Router();
const User = require('../models/User');

// User registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, guardType } = req.body;
    const newUser = new User({ username, email, password, role, guardType });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// User login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

module.exports = router;
