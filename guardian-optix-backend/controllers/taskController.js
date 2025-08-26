const Task = require('../models/task');

// @desc  Create new task
// @route POST /api/tasks
// @access Private
exports.createTask = async (req, res) => {
    try {
        const { taskName, assignedTo, dueDate, priority } = req.body;
        const newTask = new Task({ taskName, assignedTo, dueDate, priority });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: 'Error creating task', error });
    }
};

// @desc  Get all tasks
// @route GET /api/tasks
// @access Private
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignedTo', 'username');
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error });
    }
};