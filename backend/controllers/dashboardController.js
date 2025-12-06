/**
 * Dashboard Controller
 *
 * Provides aggregated operational data for the Guardian Optix dashboard.
 * Optimised for performance with parallel queries and minimal data transfer.
 */

const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Shift = require('../models/Shift');
const Incident = require('../models/Incident');
const TimeEntry = require('../models/TimeEntry');
// const Site = require('../models/Site');
// const Certification = require('../models/Certification');

// ============================================
// Helper Functions
// ============================================

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDateString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Calculate time-based attendance metrics from shifts
 */
const calculateAttendanceMetrics = (shifts) => {
  const activeShifts = shifts.filter((s) => s.status === 'in-progress').length;
  const completedShifts = shifts.filter((s) => s.status === 'completed').length;
  const scheduledShifts = shifts.filter((s) => s.status === 'scheduled').length;
  const cancelledShifts = shifts.filter((s) => s.status === 'cancelled').length;

  // Count late arrivals (would need TimeEntry data for accurate tracking)
  const lateArrivals = 0; // TODO - implement with TimeEntry comparison

  return {
    totalShifts: shifts.length,
    activeShifts,
    completedShifts,
    scheduledShifts,
    cancelledShifts,
    upcomingShifts: scheduledShifts,
    noShows: 0, // Would need to compare scheduled vs clocked-in
    lateArrivals,
  };
};

/**
 * Count pending tasks across all shifts
 */
const countPendingTasks = (shifts) => {
  let pending = 0;
  let total = 0;

  shifts.forEach((shift) => {
    if (shift.tasks && shift.tasks.length > 0) {
      shift.tasks.forEach((task) => {
        total++;
        if (!task.completed) {
          pending++;
        }
      });
    }
  });

  return { pending, total };
};

/**
 * Generate alerts based on current operational data
 */
const generateAlerts = (metrics, shifts, expiringCerts = []) => {
  const alerts = [];

  // No-show alerts (critical)
  if (metrics.noShows > 0) {
    alerts.push({
      id: `no-show-${Date.now()}`,
      type: 'attendance',
      severity: 'critical',
      title: 'No-Show Alert',
      message: `${metrics.noShows} guard(s) have not clocked in for scheduled shifts`,
      timestamp: new Date().toISOString(),
      actionRequired: true,
      actionUrl: '/scheduling',
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
      message: `${metrics.lateArrivals} guard(s) arrived late to shifts today`,
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
      actionRequired: true,
      actionUrl: '/compliance',
      isRead: false,
      isDismissed: false,
    });
  }

  // Understaffed shifts
  const understaffed = shifts.filter(
    (s) => s.status === 'scheduled' && !s.guard
  ).length;
  if (understaffed > 0) {
    alerts.push({
      id: `understaffed-${Date.now()}`,
      type: 'attendance',
      severity: 'warning',
      title: 'Unassigned Shifts',
      message: `${understaffed} shift(s) today have no guard assigned`,
      timestamp: new Date().toISOString(),
      actionRequired: true,
      actionUrl: '/scheduling',
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
 * @desc    Get dashboard metrics (KPIs)
 * @route   GET /api/dashboard/metrics
 * @access  Private
 */
const getMetrics = asyncHandler(async (req, res) => {
  const todayDate = getTodayDateString();

  // Parallel queries for performance
  const [guards, todayShifts, openIncidents] = await Promise.all([
    User.find({ role: 'Guard' }).lean(),
    Shift.find({ date: todayDate }).lean(),
    Incident.countDocuments({ status: { $in: ['open', 'under-review'] } }),
  ]);

  // Calculate metrics
  const activeGuards = guards.filter((g) => g.availability === true).length;
  const totalGuards = guards.length;

  const attendanceMetrics = calculateAttendanceMetrics(todayShifts);
  const taskCounts = countPendingTasks(todayShifts);

  // Attendance rate calculation
  const attendanceRate =
    attendanceMetrics.totalShifts > 0
      ? ((attendanceMetrics.activeShifts + attendanceMetrics.completedShifts) /
        attendanceMetrics.totalShifts) *
      100
      : 100;

  // Patrol completion rate (based on task completion)
  const patrolCompletionRate =
    taskCounts.total > 0
      ? ((taskCounts.total - taskCounts.pending) / taskCounts.total) * 100
      : 100;

  res.json({
    activeGuards,
    totalScheduled: totalGuards,
    shiftsToday: attendanceMetrics.totalShifts,
    shiftsCovered: attendanceMetrics.activeShifts + attendanceMetrics.completedShifts,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    patrolCompletionRate: Math.round(patrolCompletionRate * 10) / 10,
    openIncidents,
    pendingTasks: taskCounts.pending,
    geofenceViolations: 0, // Would come from TimeEntry geofence data
    complianceScore: 92, // Placeholder - would aggregate from compliance module
  });
});

/**
 * @desc    Get dashboard alerts
 * @route   GET /api/dashboard/alerts
 * @access  Private
 */
const getAlerts = asyncHandler(async (req, res) => {
  const todayDate = getTodayDateString();

  const [todayShifts, expiringCerts] = await Promise.all([
    Shift.find({ date: todayDate }).lean(),
    // Placeholder for certification expiry check
    Promise.resolve([]),
  ]);

  const metrics = calculateAttendanceMetrics(todayShifts);
  const alerts = generateAlerts(metrics, todayShifts, expiringCerts);

  res.json(alerts);
});

/**
 * @desc    Get today's schedule overview
 * @route   GET /api/dashboard/schedule-overview
 * @access  Private
 */
const getScheduleOverview = asyncHandler(async (req, res) => {
  const todayDate = getTodayDateString();

  const shifts = await Shift.find({ date: todayDate })
    .populate('guard', 'fullName phoneNumber role guardType')
    .populate('site', 'name address')
    .sort({ startTime: 1 })
    .lean();

  const metrics = calculateAttendanceMetrics(shifts);

  const formattedShifts = shifts.map((s) => ({
    id: s._id,
    guardId: s.guard?._id || null,
    guardName: s.guard?.fullName || 'Unassigned',
    siteName: s.site?.name || 'Unknown Site',
    siteId: s.site?._id || null,
    role: s.guard?.guardType || 'Security Officer',
    startTime: `${s.date}T${s.startTime}:00`,
    endTime: `${s.date}T${s.endTime}:00`,
    status: s.status,
    shiftType: s.shiftType,
    tasksTotal: s.tasks?.length || 0,
    tasksCompleted: s.tasks?.filter((t) => t.completed).length || 0,
    notes: s.notes,
  }));

  res.json({
    ...metrics,
    shifts: formattedShifts,
  });
});

/**
 * @desc    Get guard statuses
 * @route   GET /api/dashboard/guard-statuses
 * @access  Private
 */
const getGuardStatuses = asyncHandler(async (req, res) => {
  const todayDate = getTodayDateString();

  // Get all guards
  const guards = await User.find({
    role: { $in: ['Guard', 'Manager', 'Admin'] },
  })
    .select('fullName role guardType phoneNumber email availability shiftTime avatar')
    .lean();

  // Get today's shifts to determine current assignments
  const todayShifts = await Shift.find({ date: todayDate })
    .populate('site', 'name')
    .lean();

  // Map guards to their current status
  const formattedGuards = guards.map((g) => {
    // Find if guard has an active shift today
    const activeShift = todayShifts.find(
      (s) =>
        s.guard?.toString() === g._id.toString() &&
        s.status === 'in-progress'
    );

    const scheduledShift = todayShifts.find(
      (s) =>
        s.guard?.toString() === g._id.toString() && s.status === 'scheduled'
    );

    let status = 'off-duty';
    if (activeShift) {
      status = 'on-duty';
    } else if (scheduledShift) {
      status = 'scheduled';
    }

    return {
      id: g._id,
      name: g.fullName,
      role: g.role,
      guardType: g.guardType,
      status,
      currentSite: activeShift?.site?.name || null,
      shiftTime: g.shiftTime,
      contactInfo: {
        phone: g.phoneNumber,
        email: g.email,
      },
      availability: g.availability,
      lastActivity: activeShift?.updatedAt || null,
      avatar: g.avatar || null,
    };
  });

  res.json(formattedGuards);
});

/**
 * @desc    Get activity feed
 * @route   GET /api/dashboard/activity-feed
 * @access  Private
 */
const getActivityFeed = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const todayDate = getTodayDateString();

  // Get recent time entries as activity
  const recentEntries = await TimeEntry.find({
    date: todayDate,
  })
    .populate('guard', 'fullName')
    .populate('site', 'name')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .lean();

  const activities = recentEntries.map((entry) => {
    // Generate description based on activity type
    let description = '';
    switch (entry.type) {
      case 'clock-in':
        description = `Clocked in at ${entry.site?.name || 'site'}`;
        break;
      case 'clock-out':
        description = `Clocked out from ${entry.site?.name || 'site'}`;
        break;
      case 'break-start':
        description = 'Started break';
        break;
      case 'break-end':
        description = 'Ended break';
        break;
      default:
        description = entry.notes || `${entry.type} recorded`;
    }

    return {
      id: entry._id,
      type: entry.type, // 'clock-in', 'clock-out', 'break-start', 'break-end'
      guardId: entry.guard?._id,
      guardName: entry.guard?.fullName || 'Unknown',
      siteName: entry.site?.name || null,
      timestamp: entry.timestamp,
      location: entry.location,
      geofenceStatus: entry.geofenceStatus,
      notes: entry.notes,
      description,
      severity: entry.geofenceStatus === 'outside' ? 'warning' : undefined,
    };
  });

  res.json(activities);
});

/**
 * @desc    Get pending tasks for dashboard
 * @route   GET /api/dashboard/pending-tasks
 * @access  Private
 */
const getPendingTasks = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const todayDate = getTodayDateString();

  // Get today's shifts with incomplete tasks
  const shiftsWithTasks = await Shift.find({
    date: todayDate,
    'tasks.completed': false,
  })
    .populate('guard', 'fullName')
    .populate('site', 'name')
    .lean();

  // Extract and format pending tasks
  const pendingTasks = [];

  shiftsWithTasks.forEach((shift) => {
    shift.tasks
      .filter((task) => !task.completed)
      .forEach((task) => {
        pendingTasks.push({
          id: task._id,
          shiftId: shift._id,
          title: task.description.split(' - ')[0] || task.description.substring(0, 30),
          description: task.description,
          frequency: task.frequency,
          priority: task.frequency === 'once' ? 'high' : 'medium',
          status: 'pending',
          dueDate: `${shift.date}T${shift.endTime}:00`,
          assignedTo: shift.guard
            ? {
              id: shift.guard._id,
              name: shift.guard.fullName,
            }
            : null,
          site: shift.site
            ? {
              id: shift.site._id,
              name: shift.site.name,
            }
            : null,
        });
      });
  });

  // Sort by due date and limit
  const sortedTasks = pendingTasks
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, parseInt(limit));

  res.json(sortedTasks);
});

/**
 * @desc    Get recent incidents for dashboard
 * @route   GET /api/dashboard/recent-incidents
 * @access  Private
 */
const getRecentIncidents = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const incidents = await Incident.find({
    status: { $in: ['open', 'under-review'] },
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('reportedBy', 'fullName')
    .lean();

  const formattedIncidents = incidents.map((i) => ({
    id: i._id,
    title: `${i.incidentType} - ${i.location}`,
    incidentType: i.incidentType,
    severity: i.severity,
    status: i.status,
    location: i.location,
    description: i.description,
    reportedAt: i.createdAt,
    reportedBy: i.reportedBy
      ? {
        id: i.reportedBy._id,
        name: i.reportedBy.fullName,
      }
      : null,
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

  // In a full implementation, this would update an Alert collection
  // For now, acknowledge the request
  res.json({ success: true, id, dismissed: true });
});

/**
 * @desc    Mark alert as read
 * @route   PATCH /api/dashboard/alerts/:id/read
 * @access  Private
 */
const markAlertRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // In a full implementation, this would update an Alert collection
  res.json({ success: true, id, isRead: true });
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