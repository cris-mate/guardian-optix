import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PageTitleProvider } from './context/PageContext';
import RootLayout from './layouts/RootLayout';

// Pages
import Homepage from "./pages/Homepage";
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Activity from "./pages/Activity";
import Clients from './pages/clients';
import Personnel from './pages/personnel/Personnel';
import Scheduling from './pages/Scheduling';
import TaskManager from './pages/TaskManager';
import PerformanceMonitoring from './pages/PerformanceMonitoring';
import Analytics from './pages/Analytics';
import Compliance from './pages/compliance/Compliance';
import Chat from "./pages/Chat";
import Updates from "./pages/Updates";
import TimeClock from "./pages/TimeClock";

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
            element={
              <ProtectedRoute>
                <PageTitleProvider>
                  <RootLayout />
                </PageTitleProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/clients" element={<Clients/>} />
            <Route path="/personnel" element={<Personnel />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/taskManager" element={<TaskManager />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/timeClock" element={<TimeClock />} />
            <Route path="/performanceMonitoring" element={<PerformanceMonitoring />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/compliance" element={<Compliance />} />

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
