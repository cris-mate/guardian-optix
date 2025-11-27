const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {createSchedule, getAllSchedules} = require("../controllers/scheduleController");

// Create a new schedule
router.post('/schedules', authMiddleware, createSchedule);

// Get all schedules
router.get('/schedules', authMiddleware, getAllSchedules);

module.exports = router;
