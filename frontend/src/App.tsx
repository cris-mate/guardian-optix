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
import ActivityHub from "./pages/ActivityHub";
import Clients from './pages/clients';
import Guards from './pages/guards/Guards';
import Scheduling from './pages/scheduling/Scheduling';
import Performance from './pages/Performance';
import Analytics from './pages/Analytics';
import Compliance from './pages/compliance/Compliance';
import Chat from "./pages/Chat";
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
            <Route path="/activityHub" element={<ActivityHub />} />
            <Route path="/clients" element={<Clients/>} />
            <Route path="/guards" element={<Guards/>} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/timeClock" element={<TimeClock />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/compliance" element={<Compliance />} />

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
