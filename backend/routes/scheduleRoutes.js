const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {createSchedule, getAllSchedules} = require("../controllers/scheduleController");

// Any logged-in user can view
router.get('/schedules', authMiddleware, getAllSchedules);

// Only Admin/Manager can create
router.post('/schedules', authMiddleware, roleMiddleware('Admin', 'Manager'), createSchedule);

module.exports = router;
