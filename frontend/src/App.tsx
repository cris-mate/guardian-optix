import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Homepage from "./components/Homepage";
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeScheduling from './components/EmployeeScheduling';
import PeopleManagement from './components/PeopleManagement';
import TaskManager from './components/TaskManager';
import PerformanceMonitoring from './components/PerformanceMonitoring';
import Analytics from './components/Analytics';
import Compliance from './components/Compliance';
import ProtectedRoute from './components/ProtectedRoute';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-scheduling"
            element={
              <ProtectedRoute>
                <EmployeeScheduling />
              </ProtectedRoute>
            }
          />
          <Route
            path="/people-management"
            element={
              <ProtectedRoute>
                <PeopleManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/task-manager"
            element={
              <ProtectedRoute>
                <TaskManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performance-monitoring"
            element={
              <ProtectedRoute>
                <PerformanceMonitoring />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedRoute>
                <Compliance />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
