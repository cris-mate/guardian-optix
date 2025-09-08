const Schedule = require("../models/Schedule.js");

/**
 * @desc    Create a new schedule
 * @route   POST /api/schedules
 * @access  Private
 */
exports.createSchedule = async (req, res) => {
  try {
    const { employeeName, role, jobName, location, shift } = req.body;
    const newSchedule = new Schedule({ employeeName, role, jobName, location, shift });
    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid schedule data provided.', errors: error.errors });
    }
    res.status(500).json({ message: 'An unexpected error occurred on the server.' });
  }
};

/**
 * @desc    Get all schedules
 * @route   GET /api/schedules
 * @access  Private
 */
exports.getAllSchedules = async (req, res) => {
  try {
    // noinspection JSCheckFunctionSignatures
    const schedules = await Schedule.find();
    res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'An unexpected error occurred on the server.' });
  }
};

