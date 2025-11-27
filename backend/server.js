/**
 * Guardian Optix Backend Server
 * Main entry point for the application
 */

// DEPENDENCIES
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// APP INITIALIZATION
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/guardian-optix-db';

mongoose.connect(dbURI)
  .then(() => console.log('MongoDB Connected...'))
  .catch((error) => console.error('MongoDB Connection Error:', error));

// ROUTES
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const guardsRoutes = require('./routes/guardsRoutes');

app.use('/api', authRoutes);
app.use('/api', taskRoutes);
app.use('/api', scheduleRoutes);
app.use('/api', guardsRoutes);

// SERVER STARTUP
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ERROR HANDLING
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);
