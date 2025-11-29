/**
 * Dashboard Controller
 *
 * Provides aggregated operational data for the Guardian Optix dashboard.
 * Optimized for performance with parallel queries and minimal data transfer.
 */

const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Task = require('../models/Task');
const Incident = require('../models/Incident');
// const Site = require('../models/Site');
// const ActivityLog = require('../models/ActivityLog');

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate time-based attendance metrics
 */
const calculateAttendanceMetrics = (schedules) => {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));

  const todayShifts = schedules.filter(s => {
    const shiftStart = new Date(s.startTime || s.shift?.start);
    return shiftStart >= todayStart && shiftStart <= todayEnd;
  });

  const activeShifts = todayShifts.filter(s => s.status === 'active');
  const completedShifts = todayShifts.filter(s => s.status === 'completed');
  const noShows = todayShifts.filter(s => s.status === 'no-show');
  const lateArrivals = todayShifts.filter(s => s.isLate);

  return {
    totalShifts: todayShifts.length,
    activeShifts: activeShifts.length,
    completedShifts: completedShifts.length,
    upcomingShifts: todayShifts.length - activeShifts.length - completedShifts.length,
    noShows: noShows.length,
    lateArrivals: lateArrivals.length,
  };
};

/**
 * Generate alerts based on current data
 */
const generateAlerts = (metrics, schedules, expiringCerts) => {
  const alerts = [];

  // No-show alerts (critical)
  if (metrics.noShows > 0) {
    alerts.push({
      id: `no-show-${Date.now()}`,
      type: 'attendance',
      severity: 'critical',
      title: 'No-Show Alert',
      message: `${metrics.noShows} guard(s) have not clocked in for their scheduled shifts`,
      timestamp: new Date(),
      actionRequired: true,
      actionUrl: '/schedules',
      isRead: false,
      isDismissed: false,
    });
  }

  // Late arrivals (warning)
  if (metrics.lateArrivals > 0) {
    alerts.push({
      id: `late-${Date.now()}`,
      type: 'attendance',
      severity: 'warning',
      title: 'Late Arrivals',
      message: `${metrics.lateArrivals} guard(s) arrived late to their shifts today`,
      timestamp: new Date(),
      actionRequired: false,
      isRead: false,
      isDismissed: false,
    });
  }

  // Expiring certifications (warning)
  if (expiringCerts && expiringCerts.length > 0) {
    alerts.push({
      id: `cert-expiring-${Date.now()}`,
      type: 'compliance',
      severity: 'warning',
      title: 'Certifications Expiring',
      message: `${expiringCerts.length} certification(s) expiring within 30 days`,
      timestamp: new Date(),
      actionRequired: true,
      actionUrl: '/compliance',
      isRead: false,
      isDismissed: false,
    });
  }

  return alerts;
};

// ============================================
// Controller Methods
// ============================================

/**
 * @desc    Get dashboard metrics
 * @route   GET /api/dashboard/metrics
 * @access  Private
 */
const getMetrics = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  // Parallel queries for performance
  const [
    activeGuards,
    totalScheduled,
    todaySchedules,
    openIncidents,
    pendingTasks,
  ] = await Promise.all([
    User.countDocuments({ status: 'on-duty', role: { $in: ['Guard', 'Supervisor'] } }),
    User.countDocuments({
      role: { $in: ['Guard', 'Supervisor'] },
      status: { $ne: 'inactive' }
    }),
    Schedule.find({
      startTime: { $gte: todayStart },
      status: { $ne: 'cancelled' }
    }).lean(),
    Incident.countDocuments({ status: { $in: ['open', 'under-review'] } }),
    Task.countDocuments({ status: { $in: ['pending', 'in-progress'] } }),
  ]);

  const attendanceMetrics = calculateAttendanceMetrics(todaySchedules);

  // Calculate rates
  const attendanceRate = attendanceMetrics.totalShifts > 0
    ? ((attendanceMetrics.activeShifts + attendanceMetrics.completedShifts) / attendanceMetrics.totalShifts) * 100
    : 100;

  // Patrol completion rate (placeholder - would need checkpoint data)
  const patrolCompletionRate = 87.5;

  // Compliance score (placeholder - would aggregate from compliance module)
  const complianceScore = 92;

  res.json({
    activeGuards,
    totalScheduled,
    shiftsToday: attendanceMetrics.totalShifts,
    shiftsCovered: attendanceMetrics.activeShifts + attendanceMetrics.completedShifts,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    patrolCompletionRate,
    openIncidents,
    pendingTasks,
    geofenceViolations: 0, // Would come from real-time tracking
    complianceScore,
  });
});

/**
 * @desc    Get dashboard alerts
 * @route   GET /api/dashboard/alerts
 * @access  Private
 */
const getAlerts = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  const [todaySchedules, expiringCerts] = await Promise.all([
    Schedule.find({
      startTime: { $gte: todayStart },
      status: { $ne: 'cancelled' }
    }).lean(),
    // Would query certifications expiring in 30 days
    Promise.resolve([]),
  ]);

  const metrics = calculateAttendanceMetrics(todaySchedules);
  const alerts = generateAlerts(metrics, todaySchedules, expiringCerts);

  res.json(alerts);
});

/**
 * @desc    Get today's schedule overview
 * @route   GET /api/dashboard/schedule-overview
 * @access  Private
 */
const getScheduleOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));

  const schedules = await Schedule.find({
    startTime: { $gte: todayStart, $lte: todayEnd },
    status: { $ne: 'cancelled' }
  })
    .populate('employee', 'firstName lastName role')
    .populate('site', 'name')
    .lean();

  const metrics = calculateAttendanceMetrics(schedules);

  const shifts = schedules.map(s => ({
    id: s._id,
    guardId: s.employee?._id,
    guardName: s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : 'Unassigned',
    siteName: s.site?.name || s.location || 'Unknown',
    siteId: s.site?._id,
    role: s.role || s.employee?.role,
    startTime: s.startTime || s.shift?.start,
    endTime: s.endTime || s.shift?.end,
    status: s.status || 'upcoming',
    clockInTime: s.clockInTime,
    clockOutTime: s.clockOutTime,
    checkpointsCompleted: s.checkpointsCompleted || 0,
    checkpointsTotal: s.checkpointsTotal || 0,
  }));

  res.json({
    ...metrics,
    shifts,
  });
});

/**
 * @desc    Get guard statuses
 * @route   GET /api/dashboard/guard-statuses
 * @access  Private
 */
const getGuardStatuses = asyncHandler(async (req, res) => {
  const guards = await User.find({
    role: { $in: ['Guard', 'Supervisor', 'Admin'] },
    status: { $ne: 'inactive' }
  })
    .select('firstName lastName role status currentSite lastActivity phone email avatar')
    .populate('currentSite', 'name')
    .lean();

  const formattedGuards = guards.map(g => ({
    id: g._id,
    name: `${g.firstName} ${g.lastName}`,
    role: g.role,
    status: g.status || 'off-duty',
    currentSite: g.currentSite?.name,
    lastActivity: g.lastActivity,
    contactInfo: {
      phone: g.phone,
      email: g.email,
    },
    avatar: g.avatar,
  }));

  res.json(formattedGuards);
});

/**
 * @desc    Get activity feed
 * @route   GET /api/dashboard/activity-feed
 * @access  Private
 */
const getActivityFeed = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  // This would typically come from an ActivityLog collection
  // For now, returning mock recent activities
  const activities = [];

  // Would query: ActivityLog.find().sort({ timestamp: -1 }).limit(limit)

  res.json(activities);
});

/**
 * @desc    Get pending tasks for dashboard
 * @route   GET /api/dashboard/pending-tasks
 * @access  Private
 */
const getPendingTasks = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const tasks = await Task.find({
    status: { $in: ['pending', 'in-progress'] }
  })
    .sort({ dueDate: 1, priority: -1 })
    .limit(parseInt(limit))
    .populate('assignedTo', 'firstName lastName')
    .populate('site', 'name')
    .lean();

  const formattedTasks = tasks.map(t => ({
    id: t._id,
    title: t.title,
    description: t.description,
    priority: t.priority || 'medium',
    status: t.status,
    dueDate: t.dueDate,
    assignedTo: t.assignedTo ? {
      id: t.assignedTo._id,
      name: `${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
    } : null,
    site: t.site ? {
      id: t.site._id,
      name: t.site.name,
    } : null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  res.json(formattedTasks);
});

/**
 * @desc    Get recent incidents for dashboard
 * @route   GET /api/dashboard/recent-incidents
 * @access  Private
 */
const getRecentIncidents = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const incidents = await Incident.find({
    status: { $in: ['open', 'under-review'] }
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('reportedBy', 'firstName lastName')
    .populate('site', 'name')
    .lean();

  const formattedIncidents = incidents.map(i => ({
    id: i._id,
    title: i.title,
    severity: i.severity || 'medium',
    status: i.status,
    reportedAt: i.createdAt,
    reportedBy: i.reportedBy ? {
      id: i.reportedBy._id,
      name: `${i.reportedBy.firstName} ${i.reportedBy.lastName}`,
    } : null,
    site: i.site ? {
      id: i.site._id,
      name: i.site.name,
    } : null,
    category: i.category,
  }));

  res.json(formattedIncidents);
});

/**
 * @desc    Dismiss an alert
 * @route   PATCH /api/dashboard/alerts/:id/dismiss
 * @access  Private
 */
const dismissAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Would update alert in database
  // For now, just acknowledge the request
  res.json({ success: true, id });
});

/**
 * @desc    Mark alert as read
 * @route   PATCH /api/dashboard/alerts/:id/read
 * @access  Private
 */
const markAlertRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Would update alert in database
  res.json({ success: true, id });
});

// ============================================
// Exports
// ============================================

module.exports = {
  getMetrics,
  getAlerts,
  getScheduleOverview,
  getGuardStatuses,
  getActivityFeed,
  getPendingTasks,
  getRecentIncidents,
  dismissAlert,
  markAlertRead,
};