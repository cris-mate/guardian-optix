const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Task = require('../models/Task');

// Get all employees
router.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find().populate('assignedTask');
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error });
  }
});

// Assign a task to an employee
router.post('/assign-task', async (req, res) => {
  try {
    const { employeeId, taskId } = req.body;
    const employee = await Employee.findById(employeeId);
    const task = await Task.findById(taskId);

    if (!employee || !task) {
      return res.status(404).json({ message: 'Employee or Task not found' });
    }

    employee.assignedTask = taskId;
    employee.availability = false; // Set employee availability to false when assigned to a task
    await employee.save();

    task.status = 'In Progress';
    await task.save();

    res.status(200).json({ message: 'Task assigned successfully', employee });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning task', error });
  }
});

module.exports = router;
