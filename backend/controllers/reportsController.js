/**
 * Reports Controller
 *
 * Provides report generation, analytics data, and export functionality.
 * Supports PDF and Excel exports for all report types.
 */

const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Shift = require('../models/Shift');
const Incident = require('../models/Incident');
const { TimeEntry, Timesheet } = require('../models/TimeEntry');
const {
  generateExport,
  getExportPath,
  cleanupOldExports,
} = require('../services/exportService');
const path = require('path');
const fs = require('fs');

// ============================================
// Helper Functions
// ============================================

/**
 * Get date range based on time range filter
 */
const getDateRange = (timeRange, customStart, customEnd) => {
  const now = new Date();
  let start, end;

  if (customStart && customEnd) {
    return {
      start: new Date(customStart),
      end: new Date(customEnd),
      startDateStr: customStart,
      endDateStr: customEnd,
    };
  }

  end = new Date(now);

  switch (timeRange) {
    case 'today':
      start = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'yesterday':
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
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
    case 'year':
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
  }

  return {
    start,
    end,
    startDateStr: start.toISOString().split('T')[0],
    endDateStr: end.toISOString().split('T')[0],
  };
};

/**
 * Calculate shift duration in hours
 */
const calculateShiftHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const start = parseInt(startTime.split(':')[0], 10);
  const end = parseInt(endTime.split(':')[0], 10);
  return end > start ? end - start : 24 - start + end;
};

/**
 * Parse time string to minutes
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Detect late arrivals
 */
const detectLateArrivals = (shifts, timeEntries, thresholdMinutes = 5) => {
  const lateArrivals = [];

  const clockInMap = new Map();
  timeEntries
    .filter((e) => e.type === 'clock-in')
    .forEach((entry) => {
      const officerId = entry.officer?.toString();
      const date = entry.date;
      const key = `${officerId}-${date}`;
      if (!clockInMap.has(key)) {
        clockInMap.set(key, entry);
      }
    });

  shifts.forEach((shift) => {
    const officerId = shift.officer?._id?.toString() || shift.officer?.toString();
    const key = `${officerId}-${shift.date}`;
    const clockInEntry = clockInMap.get(key);

    if (!clockInEntry) return;

    const scheduledMinutes = parseTimeToMinutes(shift.startTime);
    const clockInTime = new Date(clockInEntry.timestamp);
    const clockInMinutes = clockInTime.getHours() * 60 + clockInTime.getMinutes();
    const minutesLate = clockInMinutes - scheduledMinutes;

    if (minutesLate > thresholdMinutes) {
      lateArrivals.push({
        date: shift.date,
        officerId,
        officerName: shift.officer?.fullName || 'Unknown',
        siteName: shift.site?.name || 'Unknown',
        scheduledStart: shift.startTime,
        actualClockIn: clockInTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        minutesLate,
      });
    }
  });

  return lateArrivals;
};

/**
 * Detect no-shows
 */
const detectNoShows = (shifts, timeEntries) => {
  const noShows = [];

  const clockedInSet = new Set();
  timeEntries
    .filter((e) => e.type === 'clock-in')
    .forEach((entry) => {
      const key = `${entry.officer?.toString()}-${entry.date}`;
      clockedInSet.add(key);
    });

  const now = new Date();

  shifts.forEach((shift) => {
    if (shift.status === 'cancelled' || shift.status === 'completed') return;

    const officerId = shift.officer?._id?.toString() || shift.officer?.toString();
    const key = `${officerId}-${shift.date}`;

    // Check if shift should have started
    const shiftDate = new Date(shift.date);
    const [hours, minutes] = shift.startTime.split(':').map(Number);
    shiftDate.setHours(hours + 1, minutes, 0, 0); // 1 hour grace

    if (now > shiftDate && !clockedInSet.has(key)) {
      noShows.push({
        date: shift.date,
        officerId,
        officerName: shift.officer?.fullName || 'Unknown',
        siteName: shift.site?.name || 'Unknown',
        shiftType: shift.shiftType,
        scheduledStart: shift.startTime,
        scheduledEnd: shift.endTime,
      });
    }
  });

  return noShows;
};

// ============================================
// Report Data Endpoints
// ============================================

/**
 * @route   GET /api/reports/operational
 * @desc    Get operational report data
 * @access  Private (Manager/Admin)
 */
const getOperationalReport = asyncHandler(async (req, res) => {
  const { timeRange = 'week', startDate, endDate, siteId } = req.query;
  const dateRange = getDateRange(timeRange, startDate, endDate);

  const shiftQuery = {
    date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr },
  };
  if (siteId) shiftQuery.site = siteId;

  const [shifts, incidents, timeEntries] = await Promise.all([
    Shift.find(shiftQuery)
      .populate('officer', 'fullName')
      .populate('site', 'name'),
    Incident.find({
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
    }),
    TimeEntry.find({
      date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr },
    }),
  ]);

  // Calculate shift metrics
  const totalShifts = shifts.length;
  const completedShifts = shifts.filter((s) => s.status === 'completed').length;
  const cancelledShifts = shifts.filter((s) => s.status === 'cancelled').length;
  const totalHours = shifts.reduce((sum, s) => sum + calculateShiftHours(s.startTime, s.endTime), 0);

  // Late arrivals and no-shows
  const lateArrivals = detectLateArrivals(shifts, timeEntries);
  const noShows = detectNoShows(shifts, timeEntries);

  // Site activity aggregation
  const siteMap = new Map();
  shifts.forEach((shift) => {
    const siteName = shift.site?.name || 'Unknown';
    const siteId = shift.site?._id?.toString() || 'unknown';

    if (!siteMap.has(siteId)) {
      siteMap.set(siteId, {
        siteId,
        siteName,
        totalShifts: 0,
        guardHours: 0,
        totalIncidents: 0,
        complianceScore: 95, // Default score
      });
    }

    const siteData = siteMap.get(siteId);
    siteData.totalShifts++;
    siteData.guardHours += calculateShiftHours(shift.startTime, shift.endTime);
  });

  // Add incident counts to sites
  incidents.forEach((incident) => {
    // Match by location name (simplified)
    siteMap.forEach((siteData) => {
      if (incident.location?.includes(siteData.siteName)) {
        siteData.totalIncidents++;
      }
    });
  });

  const reportData = {
    period: {
      start: dateRange.startDateStr,
      end: dateRange.endDateStr,
    },
    shifts: {
      totalShifts,
      completedShifts,
      activeShifts: shifts.filter((s) => s.status === 'in-progress').length,
      cancelledShifts,
      completionRate: totalShifts > 0 ? Math.round((completedShifts / totalShifts) * 100) : 0,
      totalHours,
      overtimeHours: 0, // Would need timesheet data
    },
    attendance: {
      lateArrivals: lateArrivals.length,
      noShows: noShows.length,
      rate: totalShifts > 0 ? Math.round(((totalShifts - noShows.length) / totalShifts) * 100) : 100,
    },
    incidents: {
      total: incidents.length,
      open: incidents.filter((i) => i.status === 'open').length,
      resolved: incidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
    },
    siteActivity: Array.from(siteMap.values()),
    lateArrivalDetails: lateArrivals,
    noShowDetails: noShows,
  };

  res.json({
    success: true,
    data: reportData,
  });
});

/**
 * @route   GET /api/reports/attendance
 * @desc    Get attendance report data
 * @access  Private (Manager/Admin)
 */
const getAttendanceReport = asyncHandler(async (req, res) => {
  const { timeRange = 'week', startDate, endDate, officerId } = req.query;
  const dateRange = getDateRange(timeRange, startDate, endDate);

  const shiftQuery = {
    date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr },
  };
  if (officerId) shiftQuery.officer = officerId;

  const [shifts, timeEntries, timesheets] = await Promise.all([
    Shift.find(shiftQuery)
      .populate('officer', 'fullName badgeNumber')
      .populate('site', 'name'),
    TimeEntry.find({
      date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr },
    }),
    Timesheet.find({
      date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr },
    }).populate('officer', 'fullName badgeNumber'),
  ]);

  // Late arrivals and no-shows
  const lateArrivals = detectLateArrivals(shifts, timeEntries);
  const noShows = detectNoShows(shifts, timeEntries);

  // Officer aggregation
  const officerMap = new Map();

  shifts.forEach((shift) => {
    const id = shift.officer?._id?.toString();
    if (!id) return;

    if (!officerMap.has(id)) {
      officerMap.set(id, {
        officerId: id,
        name: shift.officer?.fullName || 'Unknown',
        badgeNumber: shift.officer?.badgeNumber,
        shiftsScheduled: 0,
        shiftsWorked: 0,
        hoursWorked: 0,
        lateArrivals: 0,
        noShows: 0,
        attendanceRate: 100,
      });
    }

    const data = officerMap.get(id);
    data.shiftsScheduled++;

    if (shift.status === 'completed' || shift.status === 'in-progress') {
      data.shiftsWorked++;
      data.hoursWorked += calculateShiftHours(shift.startTime, shift.endTime);
    }
  });

  // Add late arrivals count
  lateArrivals.forEach((late) => {
    const data = officerMap.get(late.officerId);
    if (data) data.lateArrivals++;
  });

  // Add no-shows count
  noShows.forEach((noShow) => {
    const data = officerMap.get(noShow.officerId);
    if (data) data.noShows++;
  });

  // Calculate attendance rate
  officerMap.forEach((data) => {
    if (data.shiftsScheduled > 0) {
      data.attendanceRate = Math.round(((data.shiftsScheduled - data.noShows) / data.shiftsScheduled) * 100);
    }
  });

  const officers = Array.from(officerMap.values());

  res.json({
    success: true,
    data: {
      period: {
        start: dateRange.startDateStr,
        end: dateRange.endDateStr,
      },
      summary: {
        totalOfficers: officers.length,
        avgAttendanceRate: officers.length > 0
          ? Math.round(officers.reduce((sum, o) => sum + o.attendanceRate, 0) / officers.length)
          : 100,
        totalLateArrivals: lateArrivals.length,
        totalNoShows: noShows.length,
        totalHoursWorked: officers.reduce((sum, o) => sum + o.hoursWorked, 0),
        totalOvertime: 0,
      },
      officers,
      lateArrivals,
      noShows,
    },
  });
});

/**
 * @route   GET /api/reports/incidents
 * @desc    Get incident report data
 * @access  Private (Manager/Admin)
 */
const getIncidentReport = asyncHandler(async (req, res) => {
  const { timeRange = 'month', startDate, endDate, severity, incidentType } = req.query;
  const dateRange = getDateRange(timeRange, startDate, endDate);

  const query = {
    createdAt: { $gte: dateRange.start, $lte: dateRange.end },
  };
  if (severity) query.severity = severity;
  if (incidentType) query.incidentType = incidentType;

  const incidents = await Incident.find(query)
    .populate('reportedBy', 'fullName')
    .populate('resolvedBy', 'fullName')
    .sort({ createdAt: -1 });

  // Aggregate by severity
  const bySeverity = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  incidents.forEach((incident) => {
    if (bySeverity[incident.severity] !== undefined) {
      bySeverity[incident.severity]++;
    }
  });

  // Aggregate by type
  const byType = {};
  incidents.forEach((incident) => {
    byType[incident.incidentType] = (byType[incident.incidentType] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      period: {
        start: dateRange.startDateStr,
        end: dateRange.endDateStr,
      },
      summary: {
        totalIncidents: incidents.length,
        openIncidents: incidents.filter((i) => i.status === 'open').length,
        resolvedIncidents: incidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
        criticalIncidents: bySeverity.critical,
        avgResponseTime: 0, // Would need response time tracking
      },
      bySeverity,
      byType,
      incidents: incidents.map((i) => ({
        _id: i._id,
        incidentType: i.incidentType,
        severity: i.severity,
        location: i.location,
        status: i.status,
        description: i.description,
        reportedByName: i.reportedBy?.fullName,
        createdAt: i.createdAt,
        resolvedAt: i.resolvedAt,
      })),
    },
  });
});

/**
 * @route   GET /api/reports/timesheets
 * @desc    Get timesheet report data
 * @access  Private (Manager/Admin)
 */
const getTimesheetReport = asyncHandler(async (req, res) => {
  const { timeRange = 'week', startDate, endDate, officerId, status } = req.query;
  const dateRange = getDateRange(timeRange, startDate, endDate);

  const query = {
    date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr },
  };
  if (officerId) query.officer = officerId;
  if (status) query.status = status;

  const timesheets = await Timesheet.find(query)
    .populate('officer', 'fullName badgeNumber')
    .sort({ date: -1, 'officer.fullName': 1 });

  const formatted = timesheets.map((ts) => ({
    _id: ts._id,
    date: ts.date,
    officerId: ts.officer?._id,
    officerName: ts.officer?.fullName || 'Unknown',
    badgeNumber: ts.officer?.badgeNumber,
    clockInTime: ts.clockInTime ? new Date(ts.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null,
    clockOutTime: ts.clockOutTime ? new Date(ts.clockOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null,
    totalHours: ts.hoursWorked || 0,
    regularHours: (ts.regularMinutes || 0) / 60,
    overtimeHours: (ts.overtimeMinutes || 0) / 60,
    breakMinutes: ts.totalBreakMinutes || 0,
    status: ts.status,
  }));

  res.json({
    success: true,
    data: {
      period: {
        start: dateRange.startDateStr,
        end: dateRange.endDateStr,
      },
      timesheets: formatted,
      summary: {
        totalEntries: formatted.length,
        totalHours: formatted.reduce((sum, t) => sum + t.totalHours, 0),
        totalOvertime: formatted.reduce((sum, t) => sum + t.overtimeHours, 0),
        pendingApproval: formatted.filter((t) => t.status === 'pending' || t.status === 'submitted').length,
      },
    },
  });
});

// ============================================
// Export Endpoints
// ============================================

/**
 * @route   POST /api/reports/export
 * @desc    Generate and export a report
 * @access  Private (Manager/Admin)
 */
const exportReport = asyncHandler(async (req, res) => {
  const { reportType, format = 'xlsx', timeRange = 'week', startDate, endDate, filters = {} } = req.body;

  if (!['operational', 'attendance', 'incident', 'incidents', 'timesheet'].includes(reportType)) {
    res.status(400);
    throw new Error('Invalid report type');
  }

  if (!['pdf', 'xlsx'].includes(format)) {
    res.status(400);
    throw new Error('Invalid format. Use pdf or xlsx');
  }

  // Get report data based on type
  let reportData;
  const dateRange = getDateRange(timeRange, startDate, endDate);

  switch (reportType) {
    case 'operational': {
      const shiftQuery = { date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr } };
      const [shifts, incidents, timeEntries] = await Promise.all([
        Shift.find(shiftQuery).populate('officer', 'fullName').populate('site', 'name'),
        Incident.find({ createdAt: { $gte: dateRange.start, $lte: dateRange.end } }),
        TimeEntry.find({ date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr } }),
      ]);

      const lateArrivals = detectLateArrivals(shifts, timeEntries);
      const noShows = detectNoShows(shifts, timeEntries);

      const siteMap = new Map();
      shifts.forEach((shift) => {
        const siteName = shift.site?.name || 'Unknown';
        const siteId = shift.site?._id?.toString() || 'unknown';
        if (!siteMap.has(siteId)) {
          siteMap.set(siteId, { siteId, siteName, totalShifts: 0, guardHours: 0, totalIncidents: 0, complianceScore: 95 });
        }
        const d = siteMap.get(siteId);
        d.totalShifts++;
        d.guardHours += calculateShiftHours(shift.startTime, shift.endTime);
      });

      reportData = {
        period: { start: dateRange.startDateStr, end: dateRange.endDateStr },
        shifts: {
          totalShifts: shifts.length,
          completedShifts: shifts.filter((s) => s.status === 'completed').length,
          completionRate: shifts.length > 0 ? Math.round((shifts.filter((s) => s.status === 'completed').length / shifts.length) * 100) : 0,
          totalHours: shifts.reduce((sum, s) => sum + calculateShiftHours(s.startTime, s.endTime), 0),
          overtimeHours: 0,
        },
        attendance: {
          lateArrivals: lateArrivals.length,
          noShows: noShows.length,
          rate: shifts.length > 0 ? Math.round(((shifts.length - noShows.length) / shifts.length) * 100) : 100,
        },
        siteActivity: Array.from(siteMap.values()),
      };
      break;
    }

    case 'attendance': {
      const shiftQuery = { date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr } };
      const [shifts, timeEntries] = await Promise.all([
        Shift.find(shiftQuery).populate('officer', 'fullName badgeNumber').populate('site', 'name'),
        TimeEntry.find({ date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr } }),
      ]);

      const lateArrivals = detectLateArrivals(shifts, timeEntries);
      const noShows = detectNoShows(shifts, timeEntries);

      const officerMap = new Map();
      shifts.forEach((shift) => {
        const id = shift.officer?._id?.toString();
        if (!id) return;
        if (!officerMap.has(id)) {
          officerMap.set(id, {
            name: shift.officer?.fullName || 'Unknown',
            badgeNumber: shift.officer?.badgeNumber,
            shiftsWorked: 0,
            hoursWorked: 0,
            lateArrivals: 0,
            noShows: 0,
            attendanceRate: 100,
          });
        }
        const d = officerMap.get(id);
        if (shift.status === 'completed' || shift.status === 'in-progress') {
          d.shiftsWorked++;
          d.hoursWorked += calculateShiftHours(shift.startTime, shift.endTime);
        }
      });

      lateArrivals.forEach((l) => {
        const d = officerMap.get(l.officerId);
        if (d) d.lateArrivals++;
      });

      noShows.forEach((n) => {
        const d = officerMap.get(n.officerId);
        if (d) d.noShows++;
      });

      const officers = Array.from(officerMap.values());

      reportData = {
        period: { start: dateRange.startDateStr, end: dateRange.endDateStr },
        summary: {
          totalOfficers: officers.length,
          avgAttendanceRate: officers.length > 0 ? Math.round(officers.reduce((s, o) => s + o.attendanceRate, 0) / officers.length) : 100,
          totalLateArrivals: lateArrivals.length,
          totalNoShows: noShows.length,
          totalHoursWorked: officers.reduce((s, o) => s + o.hoursWorked, 0),
          totalOvertime: 0,
        },
        officers,
        lateArrivals,
      };
      break;
    }

    case 'incident':
    case 'incidents': {
      const incidents = await Incident.find({
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      }).populate('reportedBy', 'fullName');

      const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
      incidents.forEach((i) => { if (bySeverity[i.severity] !== undefined) bySeverity[i.severity]++; });

      reportData = {
        period: { start: dateRange.startDateStr, end: dateRange.endDateStr },
        summary: {
          totalIncidents: incidents.length,
          openIncidents: incidents.filter((i) => i.status === 'open').length,
          resolvedIncidents: incidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
          criticalIncidents: bySeverity.critical,
          avgResponseTime: 0,
        },
        bySeverity,
        incidents: incidents.map((i) => ({
          incidentType: i.incidentType,
          severity: i.severity,
          location: i.location,
          status: i.status,
          description: i.description,
          reportedByName: i.reportedBy?.fullName,
          createdAt: i.createdAt,
        })),
      };
      break;
    }

    case 'timesheet': {
      const timesheets = await Timesheet.find({
        date: { $gte: dateRange.startDateStr, $lte: dateRange.endDateStr },
      }).populate('officer', 'fullName badgeNumber');

      reportData = {
        timesheets: timesheets.map((ts) => ({
          date: ts.date,
          officerName: ts.officer?.fullName || 'Unknown',
          badgeNumber: ts.officer?.badgeNumber,
          clockInTime: ts.clockInTime ? new Date(ts.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-',
          clockOutTime: ts.clockOutTime ? new Date(ts.clockOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-',
          regularHours: (ts.regularMinutes || 0) / 60,
          overtimeHours: (ts.overtimeMinutes || 0) / 60,
          breakMinutes: ts.totalBreakMinutes || 0,
          status: ts.status,
        })),
      };
      break;
    }
  }

  // Generate export
  const result = await generateExport(reportType, format, reportData);

  res.json({
    success: true,
    data: {
      filename: result.filename,
      format: result.format,
      size: result.sizeFormatted,
      downloadUrl: `/api/reports/download/${result.filename}`,
      generatedAt: result.generatedAt,
    },
  });
});

/**
 * @route   GET /api/reports/download/:filename
 * @desc    Download a generated report
 * @access  Private (Manager/Admin)
 */
const downloadReport = asyncHandler(async (req, res) => {
  const { filename } = req.params;

  // Security: Prevent directory traversal
  const sanitizedFilename = path.basename(filename);
  const filepath = getExportPath(sanitizedFilename);

  if (!fs.existsSync(filepath)) {
    res.status(404);
    throw new Error('Report file not found');
  }

  // Set appropriate content type
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);

  const fileStream = fs.createReadStream(filepath);
  fileStream.pipe(res);
});

/**
 * @route   POST /api/reports/cleanup
 * @desc    Clean up old export files
 * @access  Private (Admin)
 */
const cleanupExports = asyncHandler(async (req, res) => {
  await cleanupOldExports();
  res.json({
    success: true,
    message: 'Old exports cleaned up',
  });
});

/**
 * @route   GET /api/reports/quick-stats
 * @desc    Get quick statistics for reports dashboard
 * @access  Private
 */
const getQuickStats = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [shiftsThisWeek, incidentsThisMonth, guards] = await Promise.all([
    Shift.countDocuments({ date: { $gte: weekAgo, $lte: today } }),
    Incident.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
    User.countDocuments({ role: 'Guard' }),
  ]);

  res.json({
    success: true,
    data: {
      reportsGenerated: 0, // Would need tracking
      reportsThisMonth: 0,
      scheduledReports: 0,
      favoriteReports: 0,
      shiftsThisWeek,
      incidentsThisMonth,
      totalGuards: guards,
    },
  });
});

module.exports = {
  getOperationalReport,
  getAttendanceReport,
  getIncidentReport,
  getTimesheetReport,
  exportReport,
  downloadReport,
  cleanupExports,
  getQuickStats,
};