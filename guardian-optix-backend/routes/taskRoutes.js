const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new protected task
router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    const { taskName, assignedTo, dueDate, priority } = req.body;
    const newTask = new Task({ taskName, assignedTo, dueDate, priority });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error });
  }
});

// Get all tasks
router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo', 'username');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
});

module.exports = router;
