import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import MainLayout from '@/layouts/MainLayout';
import Homepage from "@/pages/Homepage";
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Scheduling from '@/pages/Scheduling';
import Personnel from '@/pages/Personnel';
import TaskManager from '@/pages/TaskManager';
import PerformanceMonitoring from '@/pages/PerformanceMonitoring';
import Analytics from '@/pages/Analytics';
import Compliance from '@/pages/Compliance';
import ProtectedRoute from './components/auth/ProtectedRoute';
import {Navbar} from "@/layouts/Navbar";


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
