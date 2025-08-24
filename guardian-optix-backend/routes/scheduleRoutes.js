const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');

// Create a new schedule
router.post('/schedules', async (req, res) => {
  try {
    const { employeeName, shiftTime, role } = req.body;
    const newSchedule = new Schedule({ employeeName, shiftTime, role });
    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(500).json({ message: 'Error creating schedule', error });
  }
});

// Get all schedules
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedules', error });
  }
});

module.exports = router;
