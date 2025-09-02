const express = require('express');
const router = express.Router();
const {registerUser, loginUser} = require('../controllers/authController');

// User registration endpoint
router.post('/register', registerUser);

// User login endpoint
router.post('/login', loginUser);

module.exports = router;
