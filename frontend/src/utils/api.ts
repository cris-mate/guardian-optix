import axios from 'axios';
import scheduling from "@/pages/Scheduling";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create a new Axios instance
const api = axios.create({
  baseURL: API_URL
});

// Use an interceptor to automatically add the auth token to every request
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
// These use the basic axios instance, they don't need a token

export const register = async (
  fullName: string,
  username: string,
  email: string,
  phoneNumber: string,
  postCode: string,
  password: string,
  role: string,
  managerType?: string,
  guardType?: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`,
      { fullName, username, email, phoneNumber, postCode, password, role, managerType, guardType });
    return response.data;
  } catch (error) {
    console.error('Registration request failed: ', error);
    throw error;
  }
};

export const login =  async (identifier: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { identifier, password });
    // When successfully login, store the token
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
// These functions use the api instance that automatically sends the token

// Create new task
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

// Create new schedule
export const createSchedule = async (employeeName: string, role: string, jobName: string, location: string, shiftTime: string ) => {
  const response = await api.post('/schedules', { employeeName, role, jobName, location, shiftTime } );
  return response.data;
};

// Fetch all schedules
export const fetchSchedules = async () => {
  const response = await api.get('/schedules');
  return response.data;
};

// Fetch all employees
export const fetchEmployees = async () => {
  const response = await api.get('/employees');
  return response.data;
};