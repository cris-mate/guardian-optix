const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { createTask, getAllTasks } = require('../controllers/taskController');

// Any logged-in user can view tasks
router.get('/tasks', authMiddleware, getAllTasks);

// Only Admin/Manager can create tasks
router.post('/tasks', authMiddleware,  roleMiddleware('Admin', 'Manager'), createTask);


module.exports = router;
