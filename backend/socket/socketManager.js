/**
 * Socket.io Manager
 *
 * Centralised socket management for real-time features:
 * - Dashboard live updates
 * - Guard location tracking
 * - Alert notifications
 *
 * Uses event emitter pattern to decouple from controllers.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

// Store connected users for targeted messaging
const connectedUsers = new Map(); // userId -> Set of socketIds

/**
 * Initialize Socket.io with HTTP server
 */
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    const { userId, userRole } = socket;
    console.log(`Socket connected: ${socket.id} (User: ${userId})`);

    // Track connected user
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);

    // Join role-based rooms for targeted broadcasts
    socket.join(`role:${userRole}`);
    socket.join(`user:${userId}`);

    // Dashboard room for managers/admins
    if (['Manager', 'Admin'].includes(userRole)) {
      socket.join('dashboard');
    }

    // Handle client subscribing to specific updates
    socket.on('subscribe:guard-tracking', () => {
      if (['Manager', 'Admin'].includes(userRole)) {
        socket.join('guard-tracking');
      }
    });

    socket.on('unsubscribe:guard-tracking', () => {
      socket.leave('guard-tracking');
    });

    // Handle location updates from guards
    socket.on('location:update', (data) => {
      // Broadcast to tracking subscribers
      io.to('guard-tracking').emit('guard:location-updated', {
        guardId: userId,
        location: data.location,
        geofenceStatus: data.geofenceStatus,
        timestamp: new Date().toISOString(),
      });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
    });
  });

  return io;
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// ============================================
// Event Emitters (called from controllers)
// ============================================

/**
 * Emit dashboard metrics update
 */
const emitMetricsUpdate = (metrics) => {
  if (!io) return;
  io.to('dashboard').emit('dashboard:metrics-updated', {
    metrics,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit clock action (clock-in, clock-out, break)
 */
const emitClockAction = (data) => {
  if (!io) return;

  const { guardId, guardName, action, siteId, siteName, geofenceStatus } = data;

  // Broadcast to dashboard subscribers
  io.to('dashboard').emit('timeClock:action', {
    guardId,
    guardName,
    action, // 'clock-in' | 'clock-out' | 'break-start' | 'break-end'
    siteId,
    siteName,
    geofenceStatus,
    timestamp: new Date().toISOString(),
  });

  // Also emit as activity
  emitActivity({
    type: 'clock-action',
    action,
    guardId,
    guardName,
    siteName,
  });
};

/**
 * Emit geofence violation alert
 */
const emitGeofenceViolation = (data) => {
  if (!io) return;

  const { guardId: guardId, guardName: guardName, siteId, siteName, location, action } = data;

  // Critical alert to dashboard
  io.to('dashboard').emit('alert:geofence-violation', {
    severity: 'critical',
    guardId: guardId,
    guardName: guardName,
    siteId,
    siteName,
    location,
    action,
    timestamp: new Date().toISOString(),
  });

  // Notify the guard directly
  io.to(`user:${guardId}`).emit('alert:personal', {
    type: 'geofence-warning',
    message: `You are outside the geofence for ${siteName}`,
  });
};

/**
 * Emit incident report
 */
const emitIncidentReport = (data) => {
  if (!io) return;

  const { incidentId, type, severity, location, reportedBy, reportedByName } = data;

  io.to('dashboard').emit('incident:reported', {
    incidentId,
    type,
    severity,
    location,
    reportedBy,
    reportedByName,
    timestamp: new Date().toISOString(),
  });

  // High severity incidents get special alert
  if (['critical', 'high'].includes(severity)) {
    io.to('role:Manager').to('role:Admin').emit('alert:urgent', {
      type: 'incident',
      severity,
      message: `${severity.toUpperCase()} incident reported: ${type}`,
      incidentId,
    });
  }
};

/**
 * Emit shift status change
 */
const emitShiftUpdate = (data) => {
  if (!io) return;

  const { shiftId, status, guardId, guardName, siteName } = data;

  io.to('dashboard').emit('shift:status-changed', {
    shiftId,
    status,
    guardId,
    guardName,
    siteName,
    timestamp: new Date().toISOString(),
  });

  // Notify assigned guard
  if (guardId) {
    io.to(`user:${guardId}`).emit('shift:updated', {
      shiftId,
      status,
      message: `Your shift status changed to: ${status}`,
    });
  }
};

/**
 * Emit task completion
 */
const emitTaskComplete = (data) => {
  if (!io) return;

  const { shiftId, taskId, taskDescription, completedBy, completedByName } = data;

  io.to('dashboard').emit('task:completed', {
    shiftId,
    taskId,
    taskDescription,
    completedBy,
    completedByName,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit generic activity event
 */
const emitActivity = (data) => {
  if (!io) return;

  io.to('dashboard').emit('activity:new', {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send notification to specific user
 */
const notifyUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send notification to role group
 */
const notifyRole = (role, event, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// Exports
// ============================================

module.exports = {
  initializeSocket,
  getIO,

  // Event emitters
  emitMetricsUpdate,
  emitClockAction,
  emitGeofenceViolation,
  emitIncidentReport,
  emitShiftUpdate,
  emitTaskComplete,
  emitActivity,

  // Targeted notifications
  notifyUser,
  notifyRole,
};