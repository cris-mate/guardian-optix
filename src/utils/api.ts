import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const register = async (username: string, email: string, password: string, role: string, guardType: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { username, email, password, role, guardType });
    return response.data;
  } catch (error) {
    console.error('Registration request failed:', error);
    throw error;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
  } catch (error) {
    console.error('Login request failed:', error);
    throw error;
  }
};

// Create a new task
export const createTask = async (taskName: string, assignedTo: string, dueDate: string, priority: string) => {
  try {
    const response = await axios.post(`${API_URL}/tasks`, { taskName, assignedTo, dueDate, priority });
    return response.data;
  } catch (error) {
    console.error('Create task request failed:', error);
    throw error;
  }
};

// Fetch all tasks
export const fetchTasks = async () => {
  try {
    const response = await axios.get(`${API_URL}/tasks`);
    return response.data;
  } catch (error) {
    console.error('Fetch tasks request failed:', error);
    throw error;
  }
};

// Create a new schedule
export const createSchedule = async (employeeName: string, shiftTime: string, role: string) => {
  try {
    const response = await axios.post(`${API_URL}/schedules`, { employeeName, shiftTime, role });
    return response.data;
  } catch (error) {
    console.error('Schedule creation request failed:', error);
    throw error;
  }
};

// Fetch all schedules
export const fetchSchedules = async () => {
  try {
    const response = await axios.get(`${API_URL}/schedules`);
    return response.data;
  } catch (error) {
    console.error('Fetch schedules request failed:', error);
    throw error;
  }
};
