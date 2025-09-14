import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import MainLayout from './components/MainLayout';
import Homepage from "./components/Homepage";
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Scheduling from './components/Scheduling';
import Personnel from './components/Personnel';
import TaskManager from './components/TaskManager';
import PerformanceMonitoring from './components/PerformanceMonitoring';
import Analytics from './components/Analytics';
import Compliance from './components/Compliance';
import ProtectedRoute from './components/ProtectedRoute';
import {Navbar} from "./components/Navbar";


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
            path="/scheduling"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Scheduling />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/personnel"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Personnel />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/taskManager"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TaskManager />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/performanceMonitoring"
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
