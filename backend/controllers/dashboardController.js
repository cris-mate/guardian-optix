/**
 * Dashboard Controller
 *
 * Provides aggregated operational data for the Guardian Optix dashboard.
 */

const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Shift = require('../models/Shift');
const Incident = require('../models/Incident');
const { TimeEntry, Timesheet, ActiveSession } = require('../models/TimeEntry');
const Site = require('../models/Site');
const { emitMetricsUpdate, emitActivity } = require('../socket/socketManager');

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
 * Parse time string (HH:mm) to minutes since midnight
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Calculate late arrival threshold (default: 5 minutes grace period)
 */
const LATE_THRESHOLD_MINUTES = 5;

/**
 * Detect late arrivals by comparing scheduled start time vs actual clock-in
 * @param {Array} shifts - Today's shifts with populated officer data
 * @param {Array} timeEntries - Today's clock-in entries
 * @returns {Object} Late arrivals data
 */
const detectLateArrivals = (shifts, timeEntries) => {
  const lateArrivals = [];
  let lateCount = 0;

  // Create a map of officer clock-ins for quick lookup
  const clockInMap = new Map();
  timeEntries
    .filter(entry => entry.type === 'clock-in')
    .forEach(entry => {
      const officerId = entry.officer?.toString() || entry.officer;
      if (!clockInMap.has(officerId)) {
        clockInMap.set(officerId, entry);
      }
    });

  shifts.forEach(shift => {
    if (shift.status === 'cancelled') return;

    const officerId = shift.officer?._id?.toString() || shift.officer?.toString();
    const clockInEntry = clockInMap.get(officerId);

    if (!clockInEntry) return; // No clock-in yet (could be no-show or future shift)

    const scheduledStartMinutes = parseTimeToMinutes(shift.startTime);
    const clockInTime = new Date(clockInEntry.timestamp);
    const clockInMinutes = clockInTime.getHours() * 60 + clockInTime.getMinutes();

    const minutesLate = clockInMinutes - scheduledStartMinutes;

    if (minutesLate > LATE_THRESHOLD_MINUTES) {
      lateCount++;
      lateArrivals.push({
        shiftId: shift._id,
        officerId,
        officerName: shift.officer?.fullName || 'Unknown',
        siteName: shift.site?.name || 'Unknown Site',
        scheduledStart: shift.startTime,
        actualClockIn: clockInTime.toISOString(),
        minutesLate,
        severity: minutesLate > 30 ? 'high' : minutesLate > 15 ? 'medium' : 'low',
      });
    }
  });

  return {
    count: lateCount,
    details: lateArrivals,
  };
};

/**
 * Detect no-shows by finding scheduled shifts without clock-ins
 * @param {Array} shifts - Today's shifts with populated officer data
 * @param {Array} timeEntries - Today's clock-in entries
 * @returns {Object} No-shows data
 */
const detectNoShows = (shifts, timeEntries) => {
  const noShows = [];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Create a set of officers who have clocked in today
  const clockedInOfficers = new Set();
  timeEntries
    .filter(entry => entry.type === 'clock-in')
    .forEach(entry => {
      const officerId = entry.officer?.toString() || entry.officer;
      clockedInOfficers.add(officerId);
    });

  shifts.forEach(shift => {
    if (shift.status === 'cancelled' || shift.status === 'completed') return;

    const officerId = shift.officer?._id?.toString() || shift.officer?.toString();
    const scheduledStartMinutes = parseTimeToMinutes(shift.startTime);

    // Check if shift should have started (with 30-minute grace period for no-show)
    const noShowThreshold = scheduledStartMinutes + 30;

    if (currentMinutes > noShowThreshold && !clockedInOfficers.has(officerId)) {
      noShows.push({
        shiftId: shift._id,
        officerId,
        officerName: shift.officer?.fullName || 'Unknown',
        siteName: shift.site?.name || 'Unknown Site',
        scheduledStart: shift.startTime,
        scheduledEnd: shift.endTime,
        shiftType: shift.shiftType,
        minutesOverdue: currentMinutes - scheduledStartMinutes,
      });
    }
  });

  return {
    count: noShows.length,
    details: noShows,
  };
};

/**
 * Calculate attendance metrics from shifts and time entries
 */
const calculateAttendanceMetrics = (shifts, timeEntries) => {
  const activeShifts = shifts.filter((s) => s.status === 'in-progress').length;
  const completedShifts = shifts.filter((s) => s.status === 'completed').length;
  const scheduledShifts = shifts.filter((s) => s.status === 'scheduled').length;
  const cancelledShifts = shifts.filter((s) => s.status === 'cancelled').length;

  const lateData = detectLateArrivals(shifts, timeEntries);
  const noShowData = detectNoShows(shifts, timeEntries);

  return {
    totalShifts: shifts.length,
    activeShifts,
    completedShifts,
    scheduledShifts,
    cancelledShifts,
    upcomingShifts: scheduledShifts,
    lateArrivals: lateData.count,
    lateArrivalDetails: lateData.details,
    noShows: noShowData.count,
    noShowDetails: noShowData.details,
  };
};

/**
 * Count pending tasks across all shifts
 */
const countPendingTasks = (shifts) => {
  let pending = 0;
  let total = 0;
  let completed = 0;

  shifts.forEach((shift) => {
    if (shift.tasks && shift.tasks.length > 0) {
      total += shift.tasks.length;
      shift.tasks.forEach((task) => {
        if (task.completed) {
          completed++;
        } else {
          pending++;
        }
      });
    }
  });

  return { pending, total, completed, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 };
};

// ============================================
// Main Controller Functions
// ============================================

/**
 * @route   GET /api/dashboard/metrics
 * @desc    Get operational metrics (KPIs) with late arrivals and no-shows
 * @access  Private
 */
const getMetrics = asyncHandler(async (req, res) => {
  const today = getTodayDateString();

  // Parallel queries for performance
  const [guards, todayShifts, openIncidents, timeEntries] = await Promise.all([
    User.countDocuments({ role: 'Guard' }),
    Shift.find({ date: today })
      .populate('officer', 'fullName username')
      .populate('site', 'name'),
    Incident.countDocuments({ status: { $in: ['open', 'under-review'] } }),
    TimeEntry.find({ date: today }).lean(),
  ]);

  // Calculate attendance with late arrivals and no-shows
  const attendance = calculateAttendanceMetrics(todayShifts, timeEntries);
  const taskMetrics = countPendingTasks(todayShifts);

  const metrics = {
    totalGuards: guards,
    activeGuards: attendance.activeShifts,
    shiftsToday: attendance.totalShifts,
    activeShifts: attendance.activeShifts,
    completedShifts: attendance.completedShifts,
    scheduledShifts: attendance.scheduledShifts,
    cancelledShifts: attendance.cancelledShifts,
    lateArrivals: attendance.lateArrivals,
    noShows: attendance.noShows,
    openIncidents,
    pendingTasks: taskMetrics.pending,
    taskCompletionRate: taskMetrics.completionRate,
    attendanceRate: attendance.totalShifts > 0
      ? Math.round(((attendance.activeShifts + attendance.completedShifts) / attendance.totalShifts) * 100)
      : 100,
  };

  // Emit real-time update to dashboard subscribers
  emitMetricsUpdate(metrics);

  res.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Get active alerts including late arrivals and no-shows
 * @access  Private
 */
const getAlerts = asyncHandler(async (req, res) => {
  const today = getTodayDateString();

  const [todayShifts, timeEntries, openIncidents] = await Promise.all([
    Shift.find({ date: today })
      .populate('officer', 'fullName')
      .populate('site', 'name'),
    TimeEntry.find({ date: today }).lean(),
    Incident.find({
      status: { $in: ['open', 'under-review'] },
      severity: { $in: ['high', 'critical'] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reportedBy', 'fullName'),
  ]);

  const attendance = calculateAttendanceMetrics(todayShifts, timeEntries);
  const alerts = [];

  // Generate no-show alerts (critical)
  attendance.noShowDetails.forEach((noShow) => {
    alerts.push({
      id: `noshow-${noShow.shiftId}`,
      type: 'no-show',
      severity: 'critical',
      title: 'No-Show Alert',
      message: `${noShow.officerName} has not clocked in for their ${noShow.shiftType} shift at ${noShow.siteName}`,
      shiftId: noShow.shiftId,
      officerId: noShow.officerId,
      officerName: noShow.officerName,
      siteName: noShow.siteName,
      scheduledStart: noShow.scheduledStart,
      minutesOverdue: noShow.minutesOverdue,
      timestamp: new Date().toISOString(),
      isRead: false,
      isDismissed: false,
    });
  });

  // Generate late arrival alerts (warning/high based on severity)
  attendance.lateArrivalDetails.forEach((late) => {
    alerts.push({
      id: `late-${late.shiftId}`,
      type: 'late-arrival',
      severity: late.severity === 'high' ? 'high' : 'warning',
      title: 'Late Arrival',
      message: `${late.officerName} arrived ${late.minutesLate} minutes late at ${late.siteName}`,
      shiftId: late.shiftId,
      officerId: late.officerId,
      officerName: late.officerName,
      siteName: late.siteName,
      scheduledStart: late.scheduledStart,
      actualClockIn: late.actualClockIn,
      minutesLate: late.minutesLate,
      timestamp: late.actualClockIn,
      isRead: false,
      isDismissed: false,
    });
  });

  // Add high-severity incident alerts
  openIncidents.forEach((incident) => {
    alerts.push({
      id: `incident-${incident._id}`,
      type: 'incident',
      severity: incident.severity,
      title: `${incident.severity.toUpperCase()} Incident`,
      message: `${incident.incidentType} reported at ${incident.location}`,
      incidentId: incident._id,
      reportedBy: incident.reportedBy?.fullName,
      location: incident.location,
      timestamp: incident.createdAt,
      isRead: false,
      isDismissed: false,
    });
  });

  // Sort by severity (critical first) then by timestamp
  const severityOrder = { critical: 0, high: 1, warning: 2, medium: 3, low: 4, info: 5 };
  alerts.sort((a, b) => {
    const severityDiff = (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5);
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  res.json({
    success: true,
    data: alerts,
    summary: {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
    },
  });
});

/**
 * @route   GET /api/dashboard/schedule-overview
 * @desc    Get today's schedule summary
 * @access  Private
 */
const getScheduleOverview = asyncHandler(async (req, res) => {
  const today = getTodayDateString();

  const shifts = await Shift.find({ date: today })
    .populate('officer', 'fullName username badgeNumber')
    .populate('site', 'name address')
    .sort({ startTime: 1 });

  const byShiftType = {
    Morning: shifts.filter((s) => s.shiftType === 'Morning'),
    Afternoon: shifts.filter((s) => s.shiftType === 'Afternoon'),
    Night: shifts.filter((s) => s.shiftType === 'Night'),
  };

  res.json({
    success: true,
    data: {
      date: today,
      totalShifts: shifts.length,
      shifts,
      byShiftType: {
        morning: byShiftType.Morning.length,
        afternoon: byShiftType.Afternoon.length,
        night: byShiftType.Night.length,
      },
    },
  });
});

/**
 * @route   GET /api/dashboard/guard-statuses
 * @desc    Get current status of all guards with real-time data
 * @access  Private
 */
const getGuardStatuses = asyncHandler(async (req, res) => {
  const today = getTodayDateString();

  // Get all guards with their active sessions
  const [guards, activeSessions, todayShifts] = await Promise.all([
    User.find({ role: 'Guard' }).select('fullName username phoneNumber availability'),
    ActiveSession.find().populate('site', 'name'),
    Shift.find({ date: today }).populate('site', 'name'),
  ]);

  // Map active sessions by officer ID
  const sessionMap = new Map();
  activeSessions.forEach((session) => {
    sessionMap.set(session.officer.toString(), session);
  });

  // Map shifts by officer ID
  const shiftMap = new Map();
  todayShifts.forEach((shift) => {
    const officerId = shift.officer.toString();
    if (!shiftMap.has(officerId)) {
      shiftMap.set(officerId, []);
    }
    shiftMap.get(officerId).push(shift);
  });

  const guardStatuses = guards.map((guard) => {
    const session = sessionMap.get(guard._id.toString());
    const shifts = shiftMap.get(guard._id.toString()) || [];
    const currentShift = shifts.find((s) => s.status === 'in-progress');
    const nextShift = shifts.find((s) => s.status === 'scheduled');

    return {
      id: guard._id,
      name: guard.fullName,
      username: guard.username,
      phoneNumber: guard.phoneNumber,
      availability: guard.availability,
      clockStatus: session?.clockStatus || 'clocked-out',
      currentSite: session?.site?.name || currentShift?.site?.name || null,
      geofenceStatus: session?.geofenceStatus || 'unknown',
      lastLocation: session?.lastKnownLocation || null,
      currentShift: currentShift ? {
        id: currentShift._id,
        startTime: currentShift.startTime,
        endTime: currentShift.endTime,
        shiftType: currentShift.shiftType,
      } : null,
      nextShift: nextShift ? {
        id: nextShift._id,
        startTime: nextShift.startTime,
        endTime: nextShift.endTime,
        siteName: nextShift.site?.name,
      } : null,
    };
  });

  res.json({
    success: true,
    data: guardStatuses,
    summary: {
      total: guards.length,
      clockedIn: guardStatuses.filter((g) => g.clockStatus === 'clocked-in').length,
      onBreak: guardStatuses.filter((g) => g.clockStatus === 'on-break').length,
      clockedOut: guardStatuses.filter((g) => g.clockStatus === 'clocked-out').length,
      available: guardStatuses.filter((g) => g.availability).length,
    },
  });
});

/**
 * @route   GET /api/dashboard/activity-feed
 * @desc    Get recent activity events
 * @access  Private
 */
const getActivityFeed = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const today = getTodayDateString();

  // Get recent time entries and incidents
  const [recentEntries, recentIncidents] = await Promise.all([
    TimeEntry.find({ date: today })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('officer', 'fullName')
      .populate('site', 'name'),
    Incident.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('reportedBy', 'fullName'),
  ]);

  const activities = [];

  // Convert time entries to activity events
  recentEntries.forEach((entry) => {
    activities.push({
      id: entry._id,
      type: 'clock-action',
      action: entry.type,
      actorId: entry.officer?._id,
      actorName: entry.officer?.fullName || 'Unknown',
      siteName: entry.site?.name || 'Unknown Site',
      geofenceStatus: entry.geofenceStatus,
      timestamp: entry.timestamp,
      description: getClockActionDescription(entry),
    });
  });

  // Convert incidents to activity events
  recentIncidents.forEach((incident) => {
    activities.push({
      id: incident._id,
      type: 'incident',
      action: 'reported',
      severity: incident.severity,
      incidentType: incident.incidentType,
      actorId: incident.reportedBy?._id,
      actorName: incident.reportedBy?.fullName || 'Unknown',
      location: incident.location,
      timestamp: incident.createdAt,
      description: `${incident.severity} ${incident.incidentType} incident reported`,
    });
  });

  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    success: true,
    data: activities.slice(0, parseInt(limit)),
  });
});

/**
 * Helper to generate clock action description
 */
const getClockActionDescription = (entry) => {
  const name = entry.officer?.fullName || 'Officer';
  const site = entry.site?.name || 'site';

  switch (entry.type) {
    case 'clock-in':
      return `${name} clocked in at ${site}`;
    case 'clock-out':
      return `${name} clocked out from ${site}`;
    case 'break-start':
      return `${name} started break at ${site}`;
    case 'break-end':
      return `${name} ended break at ${site}`;
    default:
      return `${name} performed ${entry.type}`;
  }
};

/**
 * @route   GET /api/dashboard/pending-tasks
 * @desc    Get pending tasks for dashboard display
 * @access  Private
 */
const getPendingTasks = asyncHandler(async (req, res) => {
  const today = getTodayDateString();

  const shifts = await Shift.find({
    date: today,
    status: { $in: ['scheduled', 'in-progress'] },
    'tasks.completed': false,
  })
    .populate('officer', 'fullName')
    .populate('site', 'name');

  const pendingTasks = [];

  shifts.forEach((shift) => {
    shift.tasks
      .filter((task) => !task.completed)
      .forEach((task) => {
        pendingTasks.push({
          taskId: task._id,
          shiftId: shift._id,
          description: task.description,
          frequency: task.frequency,
          officerId: shift.officer?._id,
          officerName: shift.officer?.fullName || 'Unassigned',
          siteName: shift.site?.name || 'Unknown Site',
          shiftType: shift.shiftType,
          shiftStatus: shift.status,
        });
      });
  });

  res.json({
    success: true,
    data: pendingTasks,
    count: pendingTasks.length,
  });
});

/**
 * @route   GET /api/dashboard/recent-incidents
 * @desc    Get recent open incidents
 * @access  Private
 */
const getRecentIncidents = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const incidents = await Incident.find({
    status: { $in: ['open', 'under-review'] },
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('reportedBy', 'fullName');

  res.json({
    success: true,
    data: incidents,
  });
});

/**
 * @route   PATCH /api/dashboard/alerts/:id/dismiss
 * @desc    Dismiss an alert
 * @access  Private
 */
const dismissAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // In a production system, you'd store dismissed alerts in a separate collection
  // For now, emit activity to notify other dashboard users
  emitActivity({
    type: 'alert-dismissed',
    alertId: id,
    dismissedBy: req.user._id,
    dismissedByName: req.user.fullName,
  });

  res.json({
    success: true,
    message: 'Alert dismissed',
  });
});

/**
 * @route   PATCH /api/dashboard/alerts/:id/read
 * @desc    Mark an alert as read
 * @access  Private
 */
const markAlertRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    message: 'Alert marked as read',
  });
});

/**
 * @route   GET /api/dashboard/attendance-issues
 * @desc    Get detailed late arrivals and no-shows
 * @access  Private (Manager/Admin)
 */
const getAttendanceIssues = asyncHandler(async (req, res) => {
  const { date = getTodayDateString() } = req.query;

  const [shifts, timeEntries] = await Promise.all([
    Shift.find({ date })
      .populate('officer', 'fullName username phoneNumber')
      .populate('site', 'name address'),
    TimeEntry.find({ date }).lean(),
  ]);

  const attendance = calculateAttendanceMetrics(shifts, timeEntries);

  res.json({
    success: true,
    data: {
      date,
      lateArrivals: {
        count: attendance.lateArrivals,
        details: attendance.lateArrivalDetails,
      },
      noShows: {
        count: attendance.noShows,
        details: attendance.noShowDetails,
      },
    },
  });
});

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
  getAttendanceIssues,
};