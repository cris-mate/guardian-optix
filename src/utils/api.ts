import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create a new Axios instance
const api = axios.create({
  baseURL: API_URL
});

// Use an interceptor that automatically adds auth tokens to every request header
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

/// --- AUTHENTICATION FUNCTIONS ---
// Use basic axios, they don't need a token
export const register = async (username: string, email: string, password: string, role: string, guardType: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { username, email, password, role, guardType });
    return response.data;
  } catch (error) {
    console.error('Registration request failed: ', error);
    throw error;
  }
};

export const login =  async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    // when successfully login, store the token
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Login request failed: ', error);
    throw error;
  }
};


// --- PROTECTED FUNCTIONS ---
// These use the api instance that sends the token

// Create a new task
export const createTask = async (taskName: string, assignedTo: string, dueDate: string, priority: string) => {
  // Use api instead of axios
  const response = await api.post('/tasks', { taskName, assignedTo, dueDate, priority });
  return response.data;
};

// Fetch all tasks
export const fetchTasks = async () => {
  // Use api instead of axios
  const response = await api.get('/tasks');
  return response.data;
};

// Create a new schedule
export const createSchedule = async (employeeName: string, shiftTime: string, role: string) => {
  const response = await api.post('/schedules', { employeeName, shiftTime, role });
  return response.data;
};

// Fetch all schedules
export const fetchSchedules = async () => {
  const response = await api.get('/schedules');
  return response.data;
};
