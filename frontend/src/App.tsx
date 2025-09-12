import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import MainLayout from './components/MainLayout';
import Homepage from "./components/Homepage";
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Scheduling from './components/Scheduling';
import PersonnelManagement from './components/PersonnelManagement';
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
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-scheduling"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Scheduling />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/people-management"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PersonnelManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/task-manager"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TaskManager />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/performance-monitoring"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PerformanceMonitoring />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Analytics />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Compliance />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
