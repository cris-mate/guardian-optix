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
    case 'year': {
      const yearAgo = new Date(now);
      yearAgo.setMonth(yearAgo.getMonth() - 12);
      start = yearAgo.toISOString().split('T')[0];
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

  // Previous period values (placeholders for trend calculation)
  const previousPatrolRate = taskMetrics.completionRate - 2;
  const previousAttendanceRate = shiftCompletionRate + 1;
  const previousIncidentRate = incidentResolutionRate - 3;

  res.json({
    data: {
      patrolCompletion: {
        rate: Math.round(taskMetrics.completionRate * 10) / 10,
        completed: taskMetrics.completedTasks,
        scheduled: taskMetrics.totalTasks,
        trend: getTrendDirection(taskMetrics.completionRate, previousPatrolRate),
        trendValue: Math.abs(Math.round((taskMetrics.completionRate - previousPatrolRate) * 10) / 10),
      },
      attendance: {
        rate: Math.round(shiftCompletionRate * 10) / 10,
        onTime: completedShifts,
        late: 0, // Placeholder - needs TimeEntry analysis
        noShow: totalShifts - completedShifts,
        trend: getTrendDirection(shiftCompletionRate, previousAttendanceRate),
        trendValue: Math.abs(Math.round((shiftCompletionRate - previousAttendanceRate) * 10) / 10),
      },
      incidentResponse: {
        averageTime: 4.5, // Placeholder - needs response time tracking
        resolvedWithinSLA: resolvedIncidents,
        total: totalIncidents,
        trend: getTrendDirection(incidentResolutionRate, previousIncidentRate),
        trendValue: Math.abs(Math.round((incidentResolutionRate - previousIncidentRate) * 10) / 10),
      },
      checkpointScans: {
        completed: taskMetrics.completedTasks,
        missed: taskMetrics.totalTasks - taskMetrics.completedTasks,
        rate: Math.round(taskMetrics.completionRate * 10) / 10,
        trend: 'stable',
        trendValue: 0,
      },
      geofenceCompliance: {
        rate: 98.5, // Placeholder
        violations: 0,
        trend: 'stable',
        trendValue: 0,
      },
      shiftCompletion: {
        rate: Math.round(shiftCompletionRate * 10) / 10,
        completed: completedShifts,
        early: 0,
        incomplete: totalShifts - completedShifts,
      },
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
  const guardPerformance = guards.map((guard, index) => {
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
      siaLicenceNumber: guard.siaLicenceNumber,
      overallScore,
      rating: getPerformanceRating(overallScore),
      rank: index + 1,
      metrics: {
        patrolCompletion: Math.round(taskCompletionRate * 10) / 10,
        patrolCompletionRate: Math.round(taskCompletionRate * 10) / 10,
        attendanceRate: Math.round(shiftCompletionRate * 10) / 10,
        punctualityRate: 95, // Placeholder
        incidentResponseScore: 90, // Placeholder
        incidentResponseAvg: 4.5, // Placeholder
        checkpointAccuracy: Math.round(taskCompletionRate * 10) / 10,
        geofenceCompliance: 98, // Placeholder
        shiftCompletion: Math.round(shiftCompletionRate * 10) / 10,
        trainingCompletion: 85, // Placeholder
      },
      trends: {
        overall: 'stable',
        value: 0,
      },
      recentActivity: {
        shiftsCompleted: completedShifts,
        patrolsCompleted: completedTasks,
        incidentsHandled: 0, // Placeholder
        lastActive: new Date().toISOString(),
      },
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
    .populate('guard', 'fullName')
    .lean();

  const taskMetrics = calculateTaskMetrics(shifts);

  // Group by site
  const bySite = {};
  shifts.forEach((shift) => {
    const siteName = shift.site?.name || 'Unknown';
    const siteId = shift.site?._id?.toString() || 'unknown';
    if (!bySite[siteId]) {
      bySite[siteId] = { siteName, totalTours: 0, completed: 0 };
    }
    bySite[siteId].totalTours++;
    if (shift.status === 'completed') bySite[siteId].completed++;
  });

  // Group by guard
  const byGuard = {};
  shifts.forEach((shift) => {
    const guardName = shift.guard?.fullName || 'Unassigned';
    const guardId = shift.guard?._id?.toString() || 'unassigned';
    if (!byGuard[guardId]) {
      byGuard[guardId] = { guardName, tours: 0, completed: 0 };
    }
    byGuard[guardId].tours++;
    if (shift.status === 'completed') byGuard[guardId].completed++;
  });

  const completedShifts = shifts.filter((s) => s.status === 'completed').length;
  const partialShifts = shifts.filter((s) => s.status === 'in-progress').length;
  const missedShifts = shifts.filter((s) => s.status === 'missed' || s.status === 'no-show').length;

  res.json({
    data: {
      summary: {
        totalTours: shifts.length,
        completed: completedShifts,
        partial: partialShifts,
        missed: missedShifts,
        completionRate: shifts.length > 0
          ? Math.round((completedShifts / shifts.length) * 1000) / 10
          : 100,
      },
      checkpointStats: {
        totalScans: taskMetrics.totalTasks,
        missedScans: taskMetrics.totalTasks - taskMetrics.completedTasks,
        avgScanTime: 45, // Placeholder
        scanAccuracy: Math.round(taskMetrics.completionRate * 10) / 10,
      },
      byGuard: Object.entries(byGuard).map(([guardId, data]) => ({
        guardId,
        guardName: data.guardName,
        tours: data.tours,
        completed: data.completed,
        rate: data.tours > 0
          ? Math.round((data.completed / data.tours) * 1000) / 10
          : 100,
      })),
      bySite: Object.entries(bySite).map(([siteId, data]) => ({
        siteId,
        siteName: data.siteName,
        tours: data.totalTours,
        completed: data.completed,
        rate: data.totalTours > 0
          ? Math.round((data.completed / data.totalTours) * 1000) / 10
          : 100,
      })),
      recentPatrols: [], // Placeholder
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

  const scheduledShifts = totalShifts - cancelledShifts;
  const attendanceRate = scheduledShifts > 0
    ? (completedShifts / scheduledShifts) * 100
    : 100;

  // Group by guard
  const byGuard = {};
  shifts.forEach((shift) => {
    const guardName = shift.guard?.fullName || 'Unassigned';
    const guardId = shift.guard?._id?.toString() || 'unassigned';

    if (!byGuard[guardId]) {
      byGuard[guardId] = {
        guardName,
        shifts: 0,
        onTime: 0,
        late: 0,
        noShow: 0,
      };
    }

    byGuard[guardId].shifts++;
    if (shift.status === 'completed') byGuard[guardId].onTime++;
    if (shift.status === 'missed' || shift.status === 'no-show') byGuard[guardId].noShow++;
  });

  res.json({
    data: {
      summary: {
        totalShifts: scheduledShifts,
        onTime: completedShifts,
        late: 0, // Placeholder - needs TimeEntry
        early: 0, // Placeholder
        noShow: scheduledShifts - completedShifts,
        punctualityRate: 94.5, // Placeholder
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      },
      lateArrivals: {
        count: 0, // Placeholder
        avgMinutesLate: 0,
        trend: 'stable',
      },
      earlyDepartures: {
        count: 0, // Placeholder
        avgMinutesEarly: 0,
      },
      byGuard: Object.entries(byGuard).map(([guardId, data]) => ({
        guardId,
        guardName: data.guardName,
        shifts: data.shifts,
        onTime: data.onTime,
        late: data.late,
        noShow: data.noShow,
        punctualityRate: data.shifts > 0
          ? Math.round((data.onTime / data.shifts) * 1000) / 10
          : 100,
      })),
      recentRecords: [], // Placeholder
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

  // SIA compliance
  const siaCompliance =
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
        slaCompliance: Math.round(siaCompliance * 10) / 10,
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