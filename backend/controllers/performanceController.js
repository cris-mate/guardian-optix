/**
 * Performance Controller
 *
 * Provides aggregated performance metrics for security officers.
 * Tracks patrol completion, attendance, incident response, and compliance.
 */

const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Task = require('../models/Task');
const Incident = require('../models/Incident');
// const Patrol = require('../models/Patrol');
// const Checkpoint = require('../models/Checkpoint');
// const TimeEntry = require('../models/TimeEntry');

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
  const end = new Date(now);
  let start;

  switch (timeRange) {
    case 'today':
      start = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      break;
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 7);
  }

  return { start, end };
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
  const [schedules, incidents] = await Promise.all([
    Schedule.find({
      startTime: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    }).lean(),
    Incident.find({
      createdAt: { $gte: start, $lte: end },
    }).lean(),
  ]);

  // Calculate patrol metrics (placeholder - would use Patrol model)
  const totalPatrols = schedules.length;
  const completedPatrols = schedules.filter(s => s.status === 'completed').length;
  const patrolCompletionRate = totalPatrols > 0
    ? (completedPatrols / totalPatrols) * 100
    : 100;

  // Calculate attendance metrics
  const totalShifts = schedules.length;
  const activeShifts = schedules.filter(s => s.status === 'active' || s.status === 'completed').length;
  const lateArrivals = schedules.filter(s => s.isLate).length;
  const noShows = schedules.filter(s => s.status === 'no-show').length;
  const attendanceRate = totalShifts > 0
    ? ((totalShifts - noShows) / totalShifts) * 100
    : 100;

  // Calculate incident response metrics
  const totalIncidents = incidents.length;
  const avgResponseTime = incidents.length > 0
    ? incidents.reduce((sum, i) => {
    const responseTime = i.respondedAt
      ? (new Date(i.respondedAt) - new Date(i.createdAt)) / 60000
      : 0;
    return sum + responseTime;
  }, 0) / incidents.length
    : 0;
  const resolvedWithinSLA = incidents.filter(i => i.metSLA).length;

  // Checkpoint metrics (placeholder)
  const totalCheckpoints = 100;
  const scannedCheckpoints = 96;
  const checkpointRate = (scannedCheckpoints / totalCheckpoints) * 100;

  // Geofence metrics (placeholder)
  const geofenceViolations = 3;
  const geofenceComplianceRate = 98.5;

  // Shift completion metrics
  const completedShifts = schedules.filter(s => s.status === 'completed').length;
  const earlyExits = schedules.filter(s => s.earlyExit).length;
  const incompleteShifts = schedules.filter(s =>
    s.status !== 'completed' && s.status !== 'active' && s.status !== 'cancelled'
  ).length;
  const shiftCompletionRate = totalShifts > 0
    ? (completedShifts / totalShifts) * 100
    : 100;

  res.json({
    patrolCompletion: {
      rate: Math.round(patrolCompletionRate * 10) / 10,
      completed: completedPatrols,
      scheduled: totalPatrols,
      trend: 'up',
      trendValue: 3.2,
    },
    attendance: {
      rate: Math.round(attendanceRate * 10) / 10,
      onTime: activeShifts - lateArrivals,
      late: lateArrivals,
      noShow: noShows,
      trend: 'up',
      trendValue: 1.5,
    },
    incidentResponse: {
      averageTime: Math.round(avgResponseTime * 10) / 10,
      resolvedWithinSLA,
      total: totalIncidents,
      trend: 'down',
      trendValue: 0.8,
    },
    checkpointScans: {
      completed: scannedCheckpoints,
      missed: totalCheckpoints - scannedCheckpoints,
      rate: Math.round(checkpointRate * 10) / 10,
      trend: 'up',
      trendValue: 2.1,
    },
    geofenceCompliance: {
      rate: geofenceComplianceRate,
      violations: geofenceViolations,
      trend: 'stable',
      trendValue: 0,
    },
    shiftCompletion: {
      rate: Math.round(shiftCompletionRate * 10) / 10,
      completed: completedShifts,
      early: earlyExits,
      incomplete: incompleteShifts,
    },
  });
});

/**
 * @desc    Get officer performance data
 * @route   GET /api/performance/officers
 * @access  Private
 */
const getOfficerPerformance = asyncHandler(async (req, res) => {
  const { timeRange = 'week' } = req.query;
  const { start, end } = getDateRange(timeRange);

  // Get all guards/supervisors
  const officers = await User.find({
    role: { $in: ['Guard', 'Supervisor'] },
    status: { $ne: 'inactive' },
  }).lean();

  // Get schedules for the period
  const schedules = await Schedule.find({
    startTime: { $gte: start, $lte: end },
    status: { $ne: 'cancelled' },
  }).lean();

  // Calculate performance for each officer
  const officerPerformance = officers.map((officer) => {
    const officerSchedules = schedules.filter(
      s => s.employee?.toString() === officer._id.toString()
    );

    const totalShifts = officerSchedules.length;
    const completedShifts = officerSchedules.filter(s => s.status === 'completed').length;
    const lateArrivals = officerSchedules.filter(s => s.isLate).length;
    const noShows = officerSchedules.filter(s => s.status === 'no-show').length;

    // Calculate metrics (with fallbacks for mock data)
    const attendanceRate = totalShifts > 0
      ? ((totalShifts - noShows) / totalShifts) * 100
      : 95 + Math.random() * 5;
    const punctualityRate = totalShifts > 0
      ? ((totalShifts - lateArrivals) / totalShifts) * 100
      : 85 + Math.random() * 15;
    const shiftCompletion = totalShifts > 0
      ? (completedShifts / totalShifts) * 100
      : 90 + Math.random() * 10;

    // Mock other metrics
    const patrolCompletion = 85 + Math.random() * 15;
    const checkpointAccuracy = 88 + Math.random() * 12;
    const geofenceCompliance = 95 + Math.random() * 5;
    const incidentResponseAvg = 2 + Math.random() * 5;
    const trainingCompletion = 70 + Math.random() * 30;

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      patrolCompletion * 0.2 +
      attendanceRate * 0.2 +
      punctualityRate * 0.15 +
      checkpointAccuracy * 0.15 +
      geofenceCompliance * 0.1 +
      shiftCompletion * 0.1 +
      trainingCompletion * 0.1
    );

    return {
      officerId: officer._id.toString(),
      officerName: officer.fullName || `${officer.firstName} ${officer.lastName}`,
      profileImage: officer.profileImage,
      badgeNumber: officer.badgeNumber,
      guardType: officer.guardType,
      site: officer.assignedSite || 'Unassigned',
      overallScore,
      rating: getPerformanceRating(overallScore),
      metrics: {
        patrolCompletion: Math.round(patrolCompletion),
        attendanceRate: Math.round(attendanceRate),
        punctualityRate: Math.round(punctualityRate),
        incidentResponseAvg: Math.round(incidentResponseAvg * 10) / 10,
        checkpointAccuracy: Math.round(checkpointAccuracy),
        geofenceCompliance: Math.round(geofenceCompliance),
        shiftCompletion: Math.round(shiftCompletion),
        trainingCompletion: Math.round(trainingCompletion),
      },
      trends: {
        overall: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        value: Math.round(Math.random() * 5 * 10) / 10,
      },
      recentActivity: {
        shiftsCompleted: completedShifts || Math.floor(Math.random() * 12) + 5,
        patrolsCompleted: Math.floor(Math.random() * 50) + 20,
        incidentsHandled: Math.floor(Math.random() * 5),
        lastActive: new Date().toISOString(),
      },
    };
  });

  // Sort by overall score
  officerPerformance.sort((a, b) => b.overallScore - a.overallScore);

  // Add ranks
  officerPerformance.forEach((officer, index) => {
    officer.rank = index + 1;
  });

  res.json({ data: officerPerformance });
});

/**
 * @desc    Get patrol performance metrics
 * @route   GET /api/performance/patrols
 * @access  Private
 */
const getPatrolMetrics = asyncHandler(async (req, res) => {
  const { timeRange = 'week' } = req.query;
  const { start, end } = getDateRange(timeRange);

  // Placeholder data - would query Patrol model
  res.json({
    data: {
      summary: {
        totalTours: 48,
        completed: 42,
        partial: 4,
        missed: 2,
        completionRate: 87.5,
      },
      checkpointStats: {
        totalScans: 336,
        missedScans: 12,
        avgScanTime: 45,
        scanAccuracy: 96.4,
      },
      byOfficer: [],
      bySite: [],
      recentPatrols: [],
    },
  });
});

/**
 * @desc    Get attendance performance metrics
 * @route   GET /api/performance/attendance
 * @access  Private
 */
const getAttendanceMetrics = asyncHandler(async (req, res) => {
  const { timeRange = 'week' } = req.query;
  const { start, end } = getDateRange(timeRange);

  const schedules = await Schedule.find({
    startTime: { $gte: start, $lte: end },
    status: { $ne: 'cancelled' },
  })
    .populate('employee', 'fullName firstName lastName')
    .populate('site', 'name')
    .lean();

  const totalShifts = schedules.length;
  const onTime = schedules.filter(s => !s.isLate && s.status !== 'no-show').length;
  const late = schedules.filter(s => s.isLate).length;
  const noShow = schedules.filter(s => s.status === 'no-show').length;
  const early = schedules.filter(s => s.earlyExit).length;

  const punctualityRate = totalShifts > 0
    ? (onTime / totalShifts) * 100
    : 100;
  const attendanceRate = totalShifts > 0
    ? ((totalShifts - noShow) / totalShifts) * 100
    : 100;

  // Calculate average minutes late
  const lateSchedules = schedules.filter(s => s.isLate && s.lateMinutes);
  const avgMinutesLate = lateSchedules.length > 0
    ? lateSchedules.reduce((sum, s) => sum + (s.lateMinutes || 0), 0) / lateSchedules.length
    : 0;

  res.json({
    data: {
      summary: {
        totalShifts,
        onTime,
        late,
        early,
        noShow,
        punctualityRate: Math.round(punctualityRate * 10) / 10,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      },
      lateArrivals: {
        count: late,
        avgMinutesLate: Math.round(avgMinutesLate),
        trend: 'down',
      },
      earlyDepartures: {
        count: early,
        avgMinutesEarly: 12,
      },
      byOfficer: [],
      recentRecords: [],
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
    createdAt: { $gte: start, $lte: end },
  }).lean();

  const totalIncidents = incidents.length;

  // Calculate response times
  const incidentsWithResponse = incidents.filter(i => i.respondedAt);
  const avgResponseTime = incidentsWithResponse.length > 0
    ? incidentsWithResponse.reduce((sum, i) => {
    return sum + (new Date(i.respondedAt) - new Date(i.createdAt)) / 60000;
  }, 0) / incidentsWithResponse.length
    : 0;

  const incidentsWithResolution = incidents.filter(i => i.resolvedAt);
  const avgResolutionTime = incidentsWithResolution.length > 0
    ? incidentsWithResolution.reduce((sum, i) => {
    return sum + (new Date(i.resolvedAt) - new Date(i.createdAt)) / 60000;
  }, 0) / incidentsWithResolution.length
    : 0;

  const slaCompliance = incidentsWithResponse.filter(i => i.metSLA).length;
  const resolvedWithinHour = incidentsWithResolution.filter(i => {
    const resolutionTime = (new Date(i.resolvedAt) - new Date(i.createdAt)) / 60000;
    return resolutionTime <= 60;
  }).length;

  res.json({
    data: {
      summary: {
        totalIncidents,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        avgResolutionTime: Math.round(avgResolutionTime),
        slaCompliance: totalIncidents > 0 ? (slaCompliance / totalIncidents) * 100 : 100,
        resolvedWithinHour,
      },
      bySeverity: {
        critical: { count: 0, avgResponseTime: 0, slaCompliance: 100 },
        high: { count: 0, avgResponseTime: 0, slaCompliance: 100 },
        medium: { count: 0, avgResponseTime: 0, slaCompliance: 100 },
        low: { count: 0, avgResponseTime: 0, slaCompliance: 100 },
      },
      byOfficer: [],
      recentIncidents: [],
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

  // Generate alerts based on current data
  const alerts = [];

  // Check for late arrivals pattern
  const schedules = await Schedule.find({
    startTime: { $gte: start, $lte: end },
    isLate: true,
  })
    .populate('employee', 'fullName')
    .lean();

  // Group by employee
  const lateByEmployee = {};
  schedules.forEach(s => {
    const employeeId = s.employee?._id?.toString();
    if (employeeId) {
      if (!lateByEmployee[employeeId]) {
        lateByEmployee[employeeId] = {
          name: s.employee.fullName,
          count: 0,
        };
      }
      lateByEmployee[employeeId].count++;
    }
  });

  // Alert for employees with 3+ late arrivals
  Object.entries(lateByEmployee).forEach(([id, data]) => {
    if (data.count >= 3) {
      alerts.push({
        id: `late-pattern-${id}`,
        type: 'attendance',
        severity: 'warning',
        title: 'Late Arrival Pattern',
        message: `${data.name} has been late ${data.count} times this week`,
        officerId: id,
        officerName: data.name,
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
  getOfficerPerformance,
  getPatrolMetrics,
  getAttendanceMetrics,
  getIncidentMetrics,
  getAlerts,
};