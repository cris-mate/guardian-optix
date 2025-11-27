const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const User = require('../models/User');
const Task = require('../models/Task');

// Only Admin/Manager can view employees
router.get('/employees', authMiddleware, roleMiddleware('Admin', 'Manager'), async (req, res) => {
  try {
    const employees = await User.find({ role: { $in: ['Guard', 'Manager'] } })
      .select('-password')
      .populate('assignedTask');
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error });
  }
});

// Only Admin/Manager can assign tasks
router.post('/assign-task', authMiddleware, roleMiddleware('Admin', 'Manager'), async (req, res) => {
  try {
    const { employeeId, taskId } = req.body;
    const employee = await User.findById(employeeId);
    const task = await Task.findById(taskId);

    if (!employee || !task) {
      return res.status(404).json({ message: 'Employee or Task not found' });
    }

    employee.assignedTask = taskId;
    employee.availability = false;
    await employee.save();

    task.status = 'In Progress';
    await task.save();

    res.status(200).json({ message: 'Task assigned successfully', employee });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning task', error });
  }
});

module.exports = router;