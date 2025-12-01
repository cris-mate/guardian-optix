/**
 * TimeClock Controller
 *
 * Handles API requests for time clock functionality.
 * Includes clock-in/out, break management, and timesheet operations.
 */

const { TimeEntry, Timesheet, ActiveSession } = require('../models/TimeEntry');
const User = require('../models/User');
const Site = require('../models/Site');
const Shift = require('../models/Shift');
const asyncHandler = require('../utils/asyncHandler');

// ============================================
// Helper Functions
// ============================================

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in metres
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Verify if location is within site geofence
 */
const verifyGeofence = async (location, siteId) => {
  if (!location || !siteId) return 'unknown';

  try {
    const site = await Site.findById(siteId);
    if (!site || !site.geofence) return 'unknown';

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      site.geofence.center.latitude,
      site.geofence.center.longitude
    );

    // Default radius is 150 metres if not specified
    const radius = site.geofence.radius || 150;
    return distance <= radius ? 'inside' : 'outside';
  } catch (error) {
    console.error('Geofence verification error:', error);
    return 'unknown';
  }
};

/**
 * Calculate worked minutes between two timestamps
 */
const calculateMinutesWorked = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end - start) / (1000 * 60));
};

// ============================================
// Clock Actions
// ============================================

/**
 * @route   POST /api/timeclock/clock-in
 * @desc    Clock in for current user
 * @access  Private
 */
const clockIn = asyncHandler(async (req, res) => {
  const { location, siteId, shiftId, notes } = req.body;
  const officerId = req.user._id;
  const today = getTodayDate();

  // Check if already clocked in
  let session = await ActiveSession.findOne({ officer: officerId });
  if (session && session.clockStatus !== 'clocked-out') {
    res.status(400);
    throw new Error('Already clocked in. Please clock out first.');
  }

  // Verify geofence if location provided
  let geofenceStatus = 'unknown';
  if (location && siteId) {
    geofenceStatus = await verifyGeofence(location, siteId);
  }

  // Create time entry
  const timeEntry = await TimeEntry.create({
    officer: officerId,
    shift: shiftId,
    site: siteId,
    date: today,
    type: 'clock-in',
    timestamp: new Date(),
    location,
    geofenceStatus,
    notes,
  });

  // Update or create active session
  if (!session) {
    session = await ActiveSession.create({
      officer: officerId,
      shift: shiftId,
      site: siteId,
      clockStatus: 'clocked-in',
      clockedInAt: new Date(),
      lastKnownLocation: location,
      geofenceStatus,
    });
  } else {
    session.clockStatus = 'clocked-in';
    session.clockedInAt = new Date();
    session.shift = shiftId;
    session.site = siteId;
    session.lastKnownLocation = location;
    session.geofenceStatus = geofenceStatus;
    session.totalBreakMinutesToday = 0;
    await session.save();
  }

  // Update timesheet
  const timesheet = await Timesheet.getOrCreateForDate(officerId, today);
  timesheet.entries.push(timeEntry._id);
  timesheet.clockInTime = new Date();
  await timesheet.save();

  // Update shift status if linked
  if (shiftId) {
    await Shift.findByIdAndUpdate(shiftId, {
      status: 'in-progress',
      actualStart: new Date(),
    });
  }

  res.status(201).json({
    success: true,
    data: {
      entry: timeEntry,
      session: {
        clockStatus: session.clockStatus,
        clockedInAt: session.clockedInAt,
        geofenceStatus: session.geofenceStatus,
      },
    },
    message: 'Clocked in successfully',
  });
});

/**
 * @route   POST /api/timeclock/clock-out
 * @desc    Clock out for current user
 * @access  Private
 */
const clockOut = asyncHandler(async (req, res) => {
  const { location, notes } = req.body;
  const officerId = req.user._id;
  const today = getTodayDate();

  // Verify user is clocked in
  const session = await ActiveSession.findOne({ officer: officerId });
  if (!session || session.clockStatus === 'clocked-out') {
    res.status(400);
    throw new Error('Not currently clocked in.');
  }

  // If on break, end break first
  if (session.clockStatus === 'on-break') {
    const breakDuration = calculateMinutesWorked(
      session.currentBreakStartedAt,
      new Date()
    );
    session.totalBreakMinutesToday += breakDuration;
  }

  // Verify geofence
  const geofenceStatus = session.site
    ? await verifyGeofence(location, session.site)
    : 'unknown';

  // Create time entry
  const timeEntry = await TimeEntry.create({
    officer: officerId,
    shift: session.shift,
    site: session.site,
    date: today,
    type: 'clock-out',
    timestamp: new Date(),
    location,
    geofenceStatus,
    notes,
  });

  // Calculate worked time
  const totalMinutesWorked = calculateMinutesWorked(
    session.clockedInAt,
    new Date()
  );

  // Update timesheet
  const timesheet = await Timesheet.getOrCreateForDate(officerId, today);
  timesheet.entries.push(timeEntry._id);
  timesheet.clockOutTime = new Date();
  timesheet.totalMinutesWorked = totalMinutesWorked;
  timesheet.totalBreakMinutes = session.totalBreakMinutesToday;
  timesheet.calculateOvertime();
  await timesheet.save();

  // Update shift status if linked
  if (session.shift) {
    await Shift.findByIdAndUpdate(session.shift, {
      status: 'completed',
      actualEnd: new Date(),
    });
  }

  // Update session
  session.clockStatus = 'clocked-out';
  session.lastKnownLocation = location;
  session.geofenceStatus = geofenceStatus;
  await session.save();

  res.status(201).json({
    success: true,
    data: {
      entry: timeEntry,
      timesheet: {
        totalMinutesWorked: timesheet.totalMinutesWorked,
        totalBreakMinutes: timesheet.totalBreakMinutes,
        hoursWorked: timesheet.hoursWorked,
      },
    },
    message: 'Clocked out successfully',
  });
});

/**
 * @route   POST /api/timeclock/break/start
 * @desc    Start a break
 * @access  Private
 */
const startBreak = asyncHandler(async (req, res) => {
  const { location, breakType = 'paid' } = req.body;
  const officerId = req.user._id;
  const today = getTodayDate();

  // Verify user is clocked in
  const session = await ActiveSession.findOne({ officer: officerId });
  if (!session || session.clockStatus !== 'clocked-in') {
    res.status(400);
    throw new Error('Must be clocked in to start a break.');
  }

  // Verify geofence
  const geofenceStatus = session.site
    ? await verifyGeofence(location, session.site)
    : 'unknown';

  // Create time entry
  const timeEntry = await TimeEntry.create({
    officer: officerId,
    shift: session.shift,
    site: session.site,
    date: today,
    type: 'break-start',
    timestamp: new Date(),
    location,
    geofenceStatus,
  });

  // Update session
  session.clockStatus = 'on-break';
  session.currentBreakStartedAt = new Date();
  session.currentBreakType = breakType;
  session.lastKnownLocation = location;
  await session.save();

  // Update timesheet
  const timesheet = await Timesheet.getOrCreateForDate(officerId, today);
  timesheet.entries.push(timeEntry._id);
  await timesheet.save();

  res.status(201).json({
    success: true,
    data: {
      entry: timeEntry,
      session: {
        clockStatus: session.clockStatus,
        breakStartedAt: session.currentBreakStartedAt,
        breakType: session.currentBreakType,
      },
    },
    message: 'Break started',
  });
});

/**
 * @route   POST /api/timeclock/break/end
 * @desc    End a break
 * @access  Private
 */
const endBreak = asyncHandler(async (req, res) => {
  const { location } = req.body;
  const officerId = req.user._id;
  const today = getTodayDate();

  // Verify user is on break
  const session = await ActiveSession.findOne({ officer: officerId });
  if (!session || session.clockStatus !== 'on-break') {
    res.status(400);
    throw new Error('Not currently on break.');
  }

  // Calculate break duration
  const breakDuration = calculateMinutesWorked(
    session.currentBreakStartedAt,
    new Date()
  );

  // Verify geofence
  const geofenceStatus = session.site
    ? await verifyGeofence(location, session.site)
    : 'unknown';

  // Create time entry
  const timeEntry = await TimeEntry.create({
    officer: officerId,
    shift: session.shift,
    site: session.site,
    date: today,
    type: 'break-end',
    timestamp: new Date(),
    location,
    geofenceStatus,
  });

  // Update timesheet with break record
  const timesheet = await Timesheet.getOrCreateForDate(officerId, today);
  timesheet.entries.push(timeEntry._id);
  timesheet.breaks.push({
    startTime: session.currentBreakStartedAt,
    endTime: new Date(),
    breakType: session.currentBreakType,
    duration: breakDuration,
    location,
  });
  await timesheet.save();

  // Update session
  session.clockStatus = 'clocked-in';
  session.totalBreakMinutesToday += breakDuration;
  session.currentBreakStartedAt = null;
  session.currentBreakType = null;
  session.lastKnownLocation = location;
  await session.save();

  res.status(201).json({
    success: true,
    data: {
      entry: timeEntry,
      breakDuration,
      session: {
        clockStatus: session.clockStatus,
        totalBreakMinutesToday: session.totalBreakMinutesToday,
      },
    },
    message: 'Break ended',
  });
});

// ============================================
// Status & Data Retrieval
// ============================================

/**
 * @route   GET /api/timeclock/status
 * @desc    Get current clock status for user
 * @access  Private
 */
const getClockStatus = asyncHandler(async (req, res) => {
  const officerId = req.user._id;

  const session = await ActiveSession.findOne({ officer: officerId })
    .populate('site', 'name address postCode')
    .populate('shift', 'startTime endTime shiftType');

  if (!session) {
    return res.status(200).json({
      success: true,
      data: {
        clockStatus: 'clocked-out',
        clockedInAt: null,
        site: null,
        shift: null,
      },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      clockStatus: session.clockStatus,
      clockedInAt: session.clockedInAt,
      site: session.site,
      shift: session.shift,
      geofenceStatus: session.geofenceStatus,
      currentBreakStartedAt: session.currentBreakStartedAt,
      totalBreakMinutesToday: session.totalBreakMinutesToday,
    },
  });
});

/**
 * @route   GET /api/timeclock/entries/today
 * @desc    Get today's time entries for current user
 * @access  Private
 */
const getTodayEntries = asyncHandler(async (req, res) => {
  const officerId = req.user._id;
  const today = getTodayDate();

  const entries = await TimeEntry.find({
    officer: officerId,
    date: today,
  })
    .populate('site', 'name')
    .sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    data: entries,
  });
});

/**
 * @route   GET /api/timeclock/entries
 * @desc    Get time entries with filtering
 * @access  Private
 */
const getTimeEntries = asyncHandler(async (req, res) => {
  const {
    officerId,
    siteId,
    startDate,
    endDate,
    type,
    page = 1,
    limit = 50,
  } = req.query;

  const query = {};

  // Filter by officer (if not specified, use current user for non-managers)
  if (officerId) {
    query.officer = officerId;
  } else if (req.user.role === 'Guard') {
    query.officer = req.user._id;
  }

  // Date range
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  // Site filter
  if (siteId) {
    query.site = siteId;
  }

  // Type filter
  if (type) {
    query.type = type;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [entries, total] = await Promise.all([
    TimeEntry.find(query)
      .populate('officer', 'fullName badgeNumber')
      .populate('site', 'name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    TimeEntry.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: entries,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @route   GET /api/timeclock/timesheet/today
 * @desc    Get today's timesheet for current user
 * @access  Private
 */
const getTodayTimesheet = asyncHandler(async (req, res) => {
  const officerId = req.user._id;
  const today = getTodayDate();

  let timesheet = await Timesheet.findOne({ officer: officerId, date: today })
    .populate('entries')
    .populate('officer', 'fullName badgeNumber');

  if (!timesheet) {
    timesheet = {
      date: today,
      entries: [],
      breaks: [],
      totalMinutesWorked: 0,
      totalBreakMinutes: 0,
      status: 'pending',
    };
  }

  res.status(200).json({
    success: true,
    data: timesheet,
  });
});

/**
 * @route   GET /api/timeclock/timesheet/weekly
 * @desc    Get weekly summary for current user
 * @access  Private
 */
const getWeeklySummary = asyncHandler(async (req, res) => {
  const officerId = req.user._id;

  // Calculate week start (Monday) and end (Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const timesheets = await Timesheet.find({
    officer: officerId,
    date: {
      $gte: weekStart.toISOString().split('T')[0],
      $lte: weekEnd.toISOString().split('T')[0],
    },
  });

  // Calculate totals
  let totalMinutes = 0;
  let totalBreakMinutes = 0;
  let overtimeMinutes = 0;
  const daysWorked = timesheets.length;

  timesheets.forEach(ts => {
    totalMinutes += ts.totalMinutesWorked || 0;
    totalBreakMinutes += ts.totalBreakMinutes || 0;
    overtimeMinutes += ts.overtimeMinutes || 0;
  });

  const WEEKLY_STANDARD = 40 * 60; // 40 hours in minutes
  const netWorked = totalMinutes - totalBreakMinutes;
  const regularMinutes = Math.min(netWorked, WEEKLY_STANDARD);
  const weeklyOvertime = Math.max(0, netWorked - WEEKLY_STANDARD);

  res.status(200).json({
    success: true,
    data: {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalHours: Math.round((netWorked / 60) * 100) / 100,
      regularHours: Math.round((regularMinutes / 60) * 100) / 100,
      overtimeHours: Math.round((weeklyOvertime / 60) * 100) / 100,
      daysWorked,
      averageHoursPerDay: daysWorked > 0
        ? Math.round(((netWorked / 60) / daysWorked) * 100) / 100
        : 0,
    },
  });
});

/**
 * @route   GET /api/timeclock/stats
 * @desc    Get time clock statistics
 * @access  Private (Admin/Manager)
 */
const getStats = asyncHandler(async (req, res) => {
  const today = getTodayDate();

  // Get active sessions count
  const activeSessions = await ActiveSession.find({
    clockStatus: { $ne: 'clocked-out' },
  });

  const activeCount = activeSessions.filter(s => s.clockStatus === 'clocked-in').length;
  const onBreakCount = activeSessions.filter(s => s.clockStatus === 'on-break').length;
  const outsideGeofence = activeSessions.filter(s => s.geofenceStatus === 'outside').length;

  // Get today's entries stats
  const todayEntries = await TimeEntry.find({ date: today });
  const clockIns = todayEntries.filter(e => e.type === 'clock-in');

  // Calculate on-time vs late (assuming shift start times)
  // This is simplified - in production, compare against scheduled shift times
  const onTimeClockIns = clockIns.filter(e => {
    const hour = new Date(e.timestamp).getHours();
    return hour < 9; // Consider on-time if before 9 AM
  }).length;

  // Get pending timesheet approvals
  const pendingApprovals = await Timesheet.countDocuments({
    status: 'submitted',
  });

  // Calculate total hours today
  const todayTimesheets = await Timesheet.find({ date: today });
  const totalMinutesToday = todayTimesheets.reduce(
    (sum, ts) => sum + (ts.totalMinutesWorked || 0),
    0
  );

  res.status(200).json({
    success: true,
    data: {
      activeGuardsCount: activeCount,
      guardsOnBreak: onBreakCount,
      outsideGeofence,
      todayHours: Math.round((totalMinutesToday / 60) * 100) / 100,
      onTimeClockIns,
      lateClockIns: clockIns.length - onTimeClockIns,
      pendingApprovals,
      breaksTaken: todayEntries.filter(e => e.type === 'break-start').length,
    },
  });
});

/**
 * @route   GET /api/timeclock/active-guards
 * @desc    Get list of currently active guards
 * @access  Private (Admin/Manager)
 */
const getActiveGuards = asyncHandler(async (req, res) => {
  const sessions = await ActiveSession.find()
    .populate('officer', 'fullName badgeNumber profileImage')
    .populate('site', 'name');

  const today = getTodayDate();

  // Get today's hours for each active guard
  const guardsData = await Promise.all(
    sessions.map(async (session) => {
      const timesheet = await Timesheet.findOne({
        officer: session.officer._id,
        date: today,
      });

      const hoursToday = timesheet
        ? Math.round(((timesheet.totalMinutesWorked || 0) / 60) * 100) / 100
        : 0;

      return {
        _id: session._id,
        officerId: session.officer._id,
        fullName: session.officer.fullName,
        badgeNumber: session.officer.badgeNumber,
        profileImage: session.officer.profileImage,
        clockStatus: session.clockStatus,
        clockedInAt: session.clockedInAt,
        currentSite: session.site?.name,
        currentLocation: session.lastKnownLocation,
        geofenceStatus: session.geofenceStatus,
        hoursToday,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: guardsData,
  });
});

/**
 * @route   POST /api/timeclock/verify-location
 * @desc    Verify if location is within geofence
 * @access  Private
 */
const verifyLocation = asyncHandler(async (req, res) => {
  const { location, siteId } = req.body;

  if (!location || !siteId) {
    res.status(400);
    throw new Error('Location and site ID are required');
  }

  const geofenceStatus = await verifyGeofence(location, siteId);

  res.status(200).json({
    success: true,
    data: {
      geofenceStatus,
      location,
    },
  });
});

/**
 * @route   PATCH /api/timeclock/timesheet/:id/approve
 * @desc    Approve a timesheet
 * @access  Private (Admin/Manager)
 */
const approveTimesheet = asyncHandler(async (req, res) => {
  const timesheet = await Timesheet.findById(req.params.id);

  if (!timesheet) {
    res.status(404);
    throw new Error('Timesheet not found');
  }

  if (timesheet.status !== 'submitted') {
    res.status(400);
    throw new Error('Timesheet must be submitted before approval');
  }

  timesheet.status = 'approved';
  timesheet.approvedBy = req.user._id;
  timesheet.approvedAt = new Date();
  await timesheet.save();

  res.status(200).json({
    success: true,
    data: timesheet,
    message: 'Timesheet approved',
  });
});

/**
 * @route   PATCH /api/timeclock/timesheet/:id/reject
 * @desc    Reject a timesheet
 * @access  Private (Admin/Manager)
 */
const rejectTimesheet = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const timesheet = await Timesheet.findById(req.params.id);

  if (!timesheet) {
    res.status(404);
    throw new Error('Timesheet not found');
  }

  timesheet.status = 'rejected';
  timesheet.rejectionReason = reason;
  await timesheet.save();

  res.status(200).json({
    success: true,
    data: timesheet,
    message: 'Timesheet rejected',
  });
});

// ============================================
// Exports
// ============================================

module.exports = {
  // Clock actions
  clockIn,
  clockOut,
  startBreak,
  endBreak,

  // Status & data
  getClockStatus,
  getTodayEntries,
  getTimeEntries,
  getTodayTimesheet,
  getWeeklySummary,
  getStats,
  getActiveGuards,

  // Utilities
  verifyLocation,

  // Timesheet management
  approveTimesheet,
  rejectTimesheet,
};