import React, { useState, useEffect } from 'react';
import { createTask, fetchTasks } from '../utils/api';

interface Task {
  _id: string;
  taskName: string;
  assignedTo: string;
  dueDate: string;
  priority: string;
  status: string;
}

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]); // Specify the type for tasks
  const [taskName, setTaskName] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');

  const loadTasks = async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask(taskName, assignedTo, dueDate, priority);
      setTaskName('');
      setAssignedTo('');
      setDueDate('');
      setPriority('Medium');
      loadTasks(); // Refresh the list after creation
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div>
      <h2>Task Manager</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task Name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Assigned To"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          required
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} required>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button type="submit">Create Task</button>
      </form>

      <h3>Task List</h3>
      <ul>
        {tasks.map((task) => (
          <li key={task._id}>
            {task.taskName} - Assigned to: {task.assignedTo} - Due: {task.dueDate} - Status: {task.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskManager;
