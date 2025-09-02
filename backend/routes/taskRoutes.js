const express = require('express');
const router = express.Router();
const { createTask, getAllTasks } = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new task
router.post('/tasks', authMiddleware, createTask);

// Get all tasks
router.get('/tasks', authMiddleware, getAllTasks);

module.exports = router;
