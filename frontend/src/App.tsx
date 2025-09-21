import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import RootLayout from './layouts/RootLayout';
import Homepage from "./pages/Homepage";
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import Scheduling from './pages/Scheduling';
import Personnel from './pages/Personnel';
import TaskManager from './pages/TaskManager';
import PerformanceMonitoring from './pages/PerformanceMonitoring';
import Analytics from './pages/Analytics';
import Compliance from './pages/Compliance';
import ProtectedRoute from './components/auth/ProtectedRoute';
import {Navbar} from "./layouts/Navbar";


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
                <RootLayout>
                  <Dashboard />
                </RootLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scheduling"
            element={
              <ProtectedRoute>
                <RootLayout>
                  <Scheduling />
                </RootLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/personnel"
            element={
              <ProtectedRoute>
                <RootLayout>
                  <Personnel />
                </RootLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/taskManager"
            element={
              <ProtectedRoute>
                <RootLayout>
                  <TaskManager />
                </RootLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/performanceMonitoring"
            element={
              <ProtectedRoute>
                <RootLayout>
                  <PerformanceMonitoring />
                </RootLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <RootLayout>
                  <Analytics />
                </RootLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedRoute>
                <RootLayout>
                  <Compliance />
                </RootLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
