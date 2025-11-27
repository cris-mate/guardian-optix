const Task = require('../models/Task');

/**
* @desc    Create new task
* @route   POST /api/tasks
* @access  Private
*/
exports.createTask = async (req, res) => {
  try {
    const { taskName, assignedTo, dueDate, priority } = req.body;
    const newTask = new Task({ taskName, assignedTo, dueDate, priority });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error( 'Error creating task', error );
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid task data provided', errors: error.errors });
    }
    res.status(500).json({ message: 'An unexpected error occurred on the server.'});
  }
};

/**
* @desc    Get all tasks
* @route   GET /api/tasks
* @access  Private
*/
exports.getAllTasks = async (req, res) => {
  try {
    // noinspection JSCheckFunctionSignatures
    const tasks = await Task.find().populate('assignedTo', 'username').exec();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error creating tasks:', error);
    res.status(500).json({ message: 'An unexpected error occurred on the server.'});
  }
};