const Schedule = require("../models/Schedule.js");
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Create a new schedule
 * @route   POST /api/schedules
 * @access  Private
 */
exports.createSchedule = asyncHandler(async (req, res) => {
    const { employeeName, role, jobName, location, shiftTime } = req.body;
    const newSchedule = new Schedule({ employeeName, role, jobName, location, shiftTime });
    await newSchedule.save();
    res.status(201).json(newSchedule);
});

/**
 * @desc    Get all schedules
 * @route   GET /api/schedules
 * @access  Private
 */
exports.getAllSchedules = asyncHandler(async (req, res) => {
    const schedules = await Schedule.find();
    res.status(200).json(schedules);
});

