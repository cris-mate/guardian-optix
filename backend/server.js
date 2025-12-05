/**
 * Guardian Optix Backend Server
 * Main entry point for the application
 *
 * Uses Socket.io for real-time features.
 */

// DEPENDENCIES
require('dotenv').config();
const express = require('express');
const http = require('http'); // Required for Socket.io
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { initializeSocket } = require('./socket/socketManager');

// APP INITIALIZATION
const app = express();
const server = http.createServer(app); // Create HTTP server for Socket.io

// MIDDLEWARE
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// DATABASE CONNECTION
const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/guardian-optix-db';

mongoose.connect(dbURI)
  .then(() => console.log('MongoDB Connected...'))
  .catch((error) => console.error('MongoDB Connection Error:', error));

// SOCKET.IO INITIALIZATION
const io = initializeSocket(server);
console.log('Socket.io initialized');

// ============================================
// ROUTES
// ============================================

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityHubRoutes = require('./routes/activityHubRoutes');
const clientRoutes = require('./routes/clientRoutes');
const siteRoutes = require('./routes/siteRoutes');
const guardsRoutes = require('./routes/guardsRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const schedulingRoutes = require('./routes/schedulingRoutes');
const timeClockRoutes = require('./routes/timeClockRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

app.use('/api', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activityHub', activityHubRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/guards', guardsRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/timeClock', timeClockRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/reports', reportsRoutes);

// Serve exports directory for report downloads
app.use('/api/reports/files', express.static(path.join(__dirname, 'exports')));

// ============================================
// ERROR HANDLING
// ============================================

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});