/**
 * Performance Controller
 *
 * Provides aggregated performance metrics for security guards.
 * Tracks patrol completion, attendance, incident response, and compliance.
 *
 * Updated to use Shift model (tasks are embedded subdocuments).
 */

const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Shift = require('../models/Shift');
const Incident = require('../models/Incident');
const TimeEntry = require('../models/TimeEntry');
// const Certification = require('../models/Certification');

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate performance rating based on overall score
 */
const getPerformanceRating = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'average';
  if (score >= 40) return 'needs-improvement';
  return 'poor';
};

/**
 * Calculate trend direction based on comparison
 */
const getTrendDirection = (current, previous) => {
  const diff = current - previous;
  if (Math.abs(diff) < 1) return 'stable';
  return diff > 0 ? 'up' : 'down';
};

/**
 * Get date range based on time range filter
 */
const getDateRange = (timeRange) => {
  const now = new Date();
  const end = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  let start;

  switch (timeRange) {
    case 'today':
      start = end;
      break;
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      start = weekAgo.toISOString().split('T')[0];
      break;
    }
    case 'month': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      start = monthAgo.toISOString().split('T')[0];
      break;
    }
    case 'quarter': {
      const quarterAgo = new Date(now);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      start = quarterAgo.toISOString().split('T')[0];
      break;
    }
    default: {
      const defaultWeek = new Date(now);
      defaultWeek.setDate(defaultWeek.getDate() - 7);
      start = defaultWeek.toISOString().split('T')[0];
    }
  }

  return { start, end };
};

/**
 * Calculate task completion metrics from shifts
 */
const calculateTaskMetrics = (shifts) => {
  let totalTasks = 0;
  let completedTasks = 0;

  shifts.forEach((shift) => {
    if (shift.tasks && shift.tasks.length > 0) {
      totalTasks += shift.tasks.length;
      completedTasks += shift.tasks.filter((t) => t.completed).length;
    }
  });

  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100,
  };
};

// ============================================
// Controller Methods
// ============================================

/**
 * @desc    Get performance overview metrics
 * @route   GET /api/performance/overview
 * @access  Private
 */
const getOverview = asyncHandler(async (req, res) => {
  const { timeRange = 'week' } = req.query;
  const { start, end } = getDateRange(timeRange);

  // Parallel queries for performance metrics
  const [shifts, incidents] = await Promise.all([
    Shift.find({
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    }).lean(),
    Incident.find({
      createdAt: { $gte: new Date(start), $lte: new Date(end + 'T23:59:59') },
    }).lean(),
  ]);

  // Calculate shift metrics
  const totalShifts = shifts.length;
  const completedShifts = shifts.filter((s) => s.status === 'completed').length;
  const shiftCompletionRate =
    totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 100;

  // Calculate task/patrol metrics
  const taskMetrics = calculateTaskMetrics(shifts);

  // Calculate incident metrics
  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(
    (i) => i.status === 'resolved' || i.status === 'closed'
  ).length;
  const incidentResolutionRate =
    totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 100;

  // Previous period for trends (placeholder values)
  const previousPatrolCompletion = taskMetrics.completionRate - 2;
  const previousAttendance = shiftCompletionRate + 1;
  const previousIncidentResponse = incidentResolutionRate - 3;

  res.json({
    data: {
      patrolCompletionRate: Math.round(taskMetrics.completionRate * 10) / 10,
      patrolCompletionTrend: {
        direction: getTrendDirection(
          taskMetrics.completionRate,
          previousPatrolCompletion
        ),
        changePercent: Math.abs(
          taskMetrics.completionRate - previousPatrolCompletion
        ),
      },
      attendanceRate: Math.round(shiftCompletionRate * 10) / 10,
      attendanceTrend: {
        direction: getTrendDirection(shiftCompletionRate, previousAttendance),
        changePercent: Math.abs(shiftCompletionRate - previousAttendance),
      },
      incidentResponseRate: Math.round(incidentResolutionRate * 10) / 10,
      incidentResponseTrend: {
        direction: getTrendDirection(
          incidentResolutionRate,
          previousIncidentResponse
        ),
        changePercent: Math.abs(
          incidentResolutionRate - previousIncidentResponse
        ),
      },
      complianceScore: 92, // Placeholder - would aggregate from compliance module
      totalShifts,
      completedShifts,
      totalTasks: taskMetrics.totalTasks,
      completedTasks: taskMetrics.completedTasks,
      totalIncidents,
      resolvedIncidents,
    },
  });
});

/**
 * @desc    Get individual guard performance data
 * @route   GET /api/performance/guards
 * @access  Private
 */
const getGuardPerformance = asyncHandler(async (req, res) => {
  const { timeRange = 'week', sortBy = 'overallScore', limit = 20 } = req.query;
  const { start, end } = getDateRange(timeRange);

  // Get all guards
  const guards = await User.find({ role: 'Guard' })
    .select('fullName guardType availability')
    .lean();

  // Get shifts for the period
  const shifts = await Shift.find({
    date: { $gte: start, $lte: end },
    status: { $ne: 'cancelled' },
  }).lean();

  // Calculate performance per guard
  const guardPerformance = guards.map((guard) => {
    const guardShifts = shifts.filter(
      (s) => s.guard?.toString() === guard._id.toString()
    );

    const totalShifts = guardShifts.length;
    const completedShifts = guardShifts.filter(
      (s) => s.status === 'completed'
    ).length;

    // Task completion for this guard
    let totalTasks = 0;
    let completedTasks = 0;
    guardShifts.forEach((shift) => {
      if (shift.tasks) {
        totalTasks += shift.tasks.length;
        completedTasks += shift.tasks.filter((t) => t.completed).length;
      }
    });

    const taskCompletionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
    const shiftCompletionRate =
      totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 100;

    // Overall score (weighted average)
    const overallScore = Math.round(
      taskCompletionRate * 0.4 + shiftCompletionRate * 0.4 + 92 * 0.2 // Compliance placeholder
    );

    return {
      guardId: guard._id,
      guardName: guard.fullName,
      guardType: guard.guardType,
      availability: guard.availability,
      shiftsCompleted: completedShifts,
      totalShifts,
      tasksCompleted: completedTasks,
      totalTasks,
      patrolCompletionRate: Math.round(taskCompletionRate * 10) / 10,
      punctualityRate: 95, // Placeholder - would need TimeEntry analysis
      incidentResponseScore: 90, // Placeholder
      overallScore,
      rating: getPerformanceRating(overallScore),
    };
  });

  // Sort by specified field
  guardPerformance.sort((a, b) => {
    if (sortBy === 'overallScore') return b.overallScore - a.overallScore;
    if (sortBy === 'patrolCompletionRate')
      return b.patrolCompletionRate - a.patrolCompletionRate;
    if (sortBy === 'punctualityRate')
      return b.punctualityRate - a.punctualityRate;
    return 0;
  });

  res.json({
    data: guardPerformance.slice(0, parseInt(limit)),
  });
});

/**
 * @desc    Get patrol/task completion metrics
 * @route   GET /api/performance/patrols
 * @access  Private
 */
const getPatrolMetrics = asyncHandler(async (req, res) => {
  const { timeRange = 'week' } = req.query;
  const { start, end } = getDateRange(timeRange);

  const shifts = await Shift.find({
    date: { $gte: start, $lte: end },
    status: { $ne: 'cancelled' },
  })
    .populate('site', 'name')
    .lean();

  const taskMetrics = calculateTaskMetrics(shifts);

  // Group by site
  const bySite = {};
  shifts.forEach((shift) => {
    const siteName = shift.site?.name || 'Unknown';
    if (!bySite[siteName]) {
      bySite[siteName] = { totalTasks: 0, completedTasks: 0 };
    }
    if (shift.tasks) {
      bySite[siteName].totalTasks += shift.tasks.length;
      bySite[siteName].completedTasks += shift.tasks.filter(
        (t) => t.completed
      ).length;
    }
  });

  const siteBreakdown = Object.entries(bySite).map(([site, data]) => ({
    site,
    totalTasks: data.totalTasks,
    completedTasks: data.completedTasks,
    completionRate:
      data.totalTasks > 0
        ? Math.round((data.completedTasks / data.totalTasks) * 1000) / 10
        : 100,
  }));

  res.json({
    data: {
      summary: {
        totalPatrols: taskMetrics.totalTasks,
        completedPatrols: taskMetrics.completedTasks,
        completionRate: Math.round(taskMetrics.completionRate * 10) / 10,
        missedPatrols: taskMetrics.totalTasks - taskMetrics.completedTasks,
      },
      bySite: siteBreakdown,
      recentPatrols: [], // Would be populated with actual patrol records
    },
  });
});

/**
 * @desc    Get attendance and punctuality metrics
 * @route   GET /api/performance/attendance
 * @access  Private
 */
const getAttendanceMetrics = asyncHandler(async (req, res) => {
  const { timeRange = 'week' } = req.query;
  const { start, end } = getDateRange(timeRange);

  const shifts = await Shift.find({
    date: { $gte: start, $lte: end },
  })
    .populate('guard', 'fullName')
    .lean();

  const totalShifts = shifts.length;
  const completedShifts = shifts.filter((s) => s.status === 'completed').length;
  const cancelledShifts = shifts.filter((s) => s.status === 'cancelled').length;

  // Attendance rate (completed / (total - cancelled))
  const scheduledShifts = totalShifts - cancelledShifts;
  const attendanceRate =
    scheduledShifts > 0 ? (completedShifts / scheduledShifts) * 100 : 100;

  // Group by guard
  const byGuard = {};
  shifts.forEach((shift) => {
    const guardName = shift.guard?.fullName || 'Unassigned';
    const guardId = shift.guard?._id?.toString() || 'unassigned';

    if (!byGuard[guardId]) {
      byGuard[guardId] = {
        name: guardName,
        totalShifts: 0,
        completedShifts: 0,
        cancelledShifts: 0,
      };
    }

    byGuard[guardId].totalShifts++;
    if (shift.status === 'completed') byGuard[guardId].completedShifts++;
    if (shift.status === 'cancelled') byGuard[guardId].cancelledShifts++;
  });

  const guardBreakdown = Object.entries(byGuard).map(([id, data]) => {
    const scheduled = data.totalShifts - data.cancelledShifts;
    return {
      guardId: id,
      guardName: data.name,
      totalShifts: data.totalShifts,
      completedShifts: data.completedShifts,
      attendanceRate:
        scheduled > 0
          ? Math.round((data.completedShifts / scheduled) * 1000) / 10
          : 100,
      punctualityRate: 95, // Placeholder - would need TimeEntry analysis
    };
  });

  res.json({
    data: {
      summary: {
        totalShifts,
        completedShifts,
        cancelledShifts,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        punctualityRate: 94.5, // Placeholder
        lateArrivals: 0, // Would need TimeEntry analysis
        noShows: 0, // Would need TimeEntry analysis
      },
      byGuard: guardBreakdown,
      recentRecords: [], // Would be populated with actual attendance records
    },
  });
});

/**
 * @desc    Get incident response metrics
 * @route   GET /api/performance/incidents
 * @access  Private
 */
const getIncidentMetrics = asyncHandler(async (req, res) => {
  const { timeRange = 'week' } = req.query;
  const { start, end } = getDateRange(timeRange);

  const incidents = await Incident.find({
    createdAt: { $gte: new Date(start), $lte: new Date(end + 'T23:59:59') },
  })
    .populate('reportedBy', 'fullName')
    .populate('resolvedBy', 'fullName')
    .lean();

  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(
    (i) => i.status === 'resolved' || i.status === 'closed'
  ).length;

  // Average response time (placeholder)
  const avgResponseTime = 15; // minutes

  // SLA compliance (incidents resolved within SLA)
  const slaCompliance =
    totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 100;

  // Group by severity
  const bySeverity = {
    critical: { count: 0, resolved: 0 },
    high: { count: 0, resolved: 0 },
    medium: { count: 0, resolved: 0 },
    low: { count: 0, resolved: 0 },
  };

  incidents.forEach((incident) => {
    const severity = incident.severity || 'medium';
    if (bySeverity[severity]) {
      bySeverity[severity].count++;
      if (incident.status === 'resolved' || incident.status === 'closed') {
        bySeverity[severity].resolved++;
      }
    }
  });

  res.json({
    data: {
      summary: {
        totalIncidents,
        resolvedIncidents,
        openIncidents: totalIncidents - resolvedIncidents,
        avgResponseTime,
        slaCompliance: Math.round(slaCompliance * 10) / 10,
      },
      bySeverity: Object.entries(bySeverity).map(([severity, data]) => ({
        severity,
        count: data.count,
        resolved: data.resolved,
        resolutionRate:
          data.count > 0
            ? Math.round((data.resolved / data.count) * 1000) / 10
            : 100,
      })),
      recentIncidents: incidents.slice(0, 5).map((i) => ({
        id: i._id,
        type: i.incidentType,
        severity: i.severity,
        status: i.status,
        location: i.location,
        reportedAt: i.createdAt,
        reportedBy: i.reportedBy?.fullName || 'Unknown',
        resolvedAt: i.resolvedAt,
        resolvedBy: i.resolvedBy?.fullName,
      })),
    },
  });
});

/**
 * @desc    Get performance alerts
 * @route   GET /api/performance/alerts
 * @access  Private
 */
const getAlerts = asyncHandler(async (req, res) => {
  const { start, end } = getDateRange('week');
  const alerts = [];

  // Get shifts to analyse patterns
  const shifts = await Shift.find({
    date: { $gte: start, $lte: end },
  })
    .populate('guard', 'fullName')
    .lean();

  // Check for guards with low task completion
  const guardTaskCompletion = {};
  shifts.forEach((shift) => {
    if (shift.guard && shift.tasks && shift.tasks.length > 0) {
      const guardId = shift.guard._id.toString();
      if (!guardTaskCompletion[guardId]) {
        guardTaskCompletion[guardId] = {
          name: shift.guard.fullName,
          totalTasks: 0,
          completedTasks: 0,
        };
      }
      guardTaskCompletion[guardId].totalTasks += shift.tasks.length;
      guardTaskCompletion[guardId].completedTasks += shift.tasks.filter(
        (t) => t.completed
      ).length;
    }
  });

  // Alert for guards with <70% task completion
  Object.entries(guardTaskCompletion).forEach(([id, data]) => {
    const completionRate =
      data.totalTasks > 0 ? (data.completedTasks / data.totalTasks) * 100 : 100;
    if (completionRate < 70 && data.totalTasks >= 5) {
      alerts.push({
        id: `low-completion-${id}`,
        type: 'patrol',
        severity: 'warning',
        title: 'Low Task Completion',
        message: `${data.name} has ${Math.round(completionRate)}% task completion this week`,
        guardId: id,
        guardName: data.name,
        timestamp: new Date().toISOString(),
        isRead: false,
        actionRequired: true,
        actionUrl: `/guards/${id}`,
      });
    }
  });

  res.json({ data: alerts });
});

module.exports = {
  getOverview,
  getGuardPerformance,
  getPatrolMetrics,
  getAttendanceMetrics,
  getIncidentMetrics,
  getAlerts,
};