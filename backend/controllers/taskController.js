const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

/**
* @desc    Create new task
* @route   POST /api/tasks
* @access  Private
*/
// Create new task
exports.createTask = asyncHandler(async (req, res) => {
  const { taskName, assignedTo, dueDate, priority } = req.body;
  const newTask = new Task({ taskName, assignedTo, dueDate, priority });
  await newTask.save();
  res.status(201).json(newTask);
});

/**
* @desc    Get all tasks
* @route   GET /api/tasks
* @access  Private
*/
// Get all tasks
exports.getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find().populate('assignedTo', 'username').exec();
  res.status(200).json(tasks);
});