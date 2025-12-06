/**
 * TimeClock Controller
 *
 * Handles time clock functionality including clock-in/out,
 * break management, and timesheet operations.
 * Integrates GPS reverse geocoding for location addresses.
 */

const { TimeEntry, Timesheet, ActiveSession } = require('../models/TimeEntry');
const Site = require('../models/Site');
const Shift = require('../models/Shift');
const User = require('../models/User');
const { emitClockAction, emitGeofenceViolation } = require('../socket/socketManager');
const { reverseGeocode } = require('../services/geocodingService');
const asyncHandler = require('../utils/asyncHandler');

// ============================================
// Helper Functions
// ============================================

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = () => new Date().toISOString().split('T')[0];

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * @returns Distance in metres
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in metres
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
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
    if (!site || !site.geofence || !site.geofence.center) return 'unknown';

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      site.geofence.center.latitude,
      site.geofence.center.longitude
    );

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

/**
 * Enrich location with reverse geocoded address
 */
const enrichLocationWithAddress = async (location) => {
  if (!location || !location.latitude || !location.longitude) {
    return location;
  }

  try {
    const geocodeResult = await reverseGeocode(location.latitude, location.longitude);
    return {
      ...location,
      address: geocodeResult.formatted || geocodeResult.shortAddress,
      addressDetails: geocodeResult.address,
      displayName: geocodeResult.displayName,
    };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return {
      ...location,
      address: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
    };
  }
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
  const guardId = req.user._id;
  const today = getTodayDate();

  // Check if already clocked in
  let session = await ActiveSession.findOne({ guard: guardId });
  if (session && session.clockStatus !== 'clocked-out') {
    res.status(400);
    throw new Error('Already clocked in. Please clock out first.');
  }

  // Verify geofence if location provided
  let geofenceStatus = 'unknown';
  if (location && siteId) {
    geofenceStatus = await verifyGeofence(location, siteId);
  }

  // Enrich location with address via reverse geocoding
  const enrichedLocation = await enrichLocationWithAddress(location);

  // Create time entry
  const timeEntry = await TimeEntry.create({
    guard: guardId,
    shift: shiftId,
    site: siteId,
    date: today,
    type: 'clock-in',
    timestamp: new Date(),
    location: enrichedLocation,
    geofenceStatus,
    notes,
  });

  // Update or create active session
  if (!session) {
    session = await ActiveSession.create({
      guard: guardId,
      shift: shiftId,
      site: siteId,
      clockStatus: 'clocked-in',
      clockedInAt: new Date(),
      lastKnownLocation: enrichedLocation,
      geofenceStatus,
    });
  } else {
    session.clockStatus = 'clocked-in';
    session.clockedInAt = new Date();
    session.shift = shiftId;
    session.site = siteId;
    session.lastKnownLocation = enrichedLocation;
    session.geofenceStatus = geofenceStatus;
    session.totalBreakMinutesToday = 0;
    await session.save();
  }

  // Update timesheet
  const timesheet = await Timesheet.getOrCreateForDate(guardId, today);
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

  // Get guard and site names for broadcast
  const [guard, site] = await Promise.all([
    User.findById(guardId).select('fullName'),
    siteId ? Site.findById(siteId).select('name') : null,
  ]);

  res.status(201).json({
    success: true,
    data: {
      entry: timeEntry,
      session: {
        clockStatus: session.clockStatus,
        clockedInAt: session.clockedInAt,
        geofenceStatus: session.geofenceStatus,
      },
      location: enrichedLocation,
    },
    message: 'Clocked in successfully',
  });

  // Emit socket events
  emitClockAction({
    guardId,
    guardName: guard?.fullName || 'Unknown',
    action: 'clock-in',
    siteId,
    siteName: site?.name || 'Unknown Site',
    geofenceStatus,
  });

  if (geofenceStatus === 'outside') {
    emitGeofenceViolation({
      guardId,
      guardName: guard?.fullName || 'Unknown',
      siteId,
      siteName: site?.name || 'Unknown Site',
      location: enrichedLocation,
      action: 'clock-in',
    });
  }
});

/**
 * @route   POST /api/timeclock/clock-out
 * @desc    Clock out for current user
 * @access  Private
 */
const clockOut = asyncHandler(async (req, res) => {
  const { location, notes } = req.body;
  const guardId = req.user._id;
  const today = getTodayDate();

  // Verify user is clocked in
  const session = await ActiveSession.findOne({ guard: guardId });
  if (!session || session.clockStatus === 'clocked-out') {
    res.status(400);
    throw new Error('Not currently clocked in.');
  }

  // If on break, end break first
  if (session.clockStatus === 'on-break') {
    const breakDuration = calculateMinutesWorked(session.currentBreakStartedAt, new Date());
    session.totalBreakMinutesToday += breakDuration;
  }

  // Verify geofence
  const geofenceStatus = session.site
    ? await verifyGeofence(location, session.site)
    : 'unknown';

  // Enrich location with address
  const enrichedLocation = await enrichLocationWithAddress(location);

  // Create time entry
  const timeEntry = await TimeEntry.create({
    guard: guardId,
    shift: session.shift,
    site: session.site,
    date: today,
    type: 'clock-out',
    timestamp: new Date(),
    location: enrichedLocation,
    geofenceStatus,
    notes,
  });

  // Calculate worked time
  const totalMinutesWorked = calculateMinutesWorked(session.clockedInAt, new Date());

  // Update timesheet
  const timesheet = await Timesheet.getOrCreateForDate(guardId, today);
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
  session.lastKnownLocation = enrichedLocation;
  session.geofenceStatus = geofenceStatus;
  await session.save();

  // Get names for broadcast
  const guard = await User.findById(guardId).select('fullName');
  const site = session.site ? await Site.findById(session.site).select('name') : null;

  res.status(201).json({
    success: true,
    data: {
      entry: timeEntry,
      timesheet: {
        totalMinutesWorked: timesheet.totalMinutesWorked,
        totalBreakMinutes: timesheet.totalBreakMinutes,
        hoursWorked: timesheet.hoursWorked,
      },
      location: enrichedLocation,
    },
    message: 'Clocked out successfully',
  });

  // Emit socket events
  emitClockAction({
    guardId,
    guardName: guard?.fullName || 'Unknown',
    action: 'clock-out',
    siteId: session.site,
    siteName: site?.name || 'Unknown Site',
    geofenceStatus,
  });

  if (geofenceStatus === 'outside') {
    emitGeofenceViolation({
      guardId,
      guardName: guard?.fullName || 'Unknown',
      siteId: session.site,
      siteName: site?.name || 'Unknown Site',
      location: enrichedLocation,
      action: 'clock-out',
    });
  }
});

/**
 * @route   POST /api/timeclock/break/start
 * @desc    Start a break
 * @access  Private
 */
const startBreak = asyncHandler(async (req, res) => {
  const { location, breakType = 'paid' } = req.body;
  const guardId = req.user._id;
  const today = getTodayDate();

  // Verify user is clocked in
  const session = await ActiveSession.findOne({ guard: guardId });
  if (!session || session.clockStatus !== 'clocked-in') {
    res.status(400);
    throw new Error('Must be clocked in to start a break.');
  }

  // Verify geofence
  const geofenceStatus = session.site
    ? await verifyGeofence(location, session.site)
    : 'unknown';

  // Enrich location
  const enrichedLocation = await enrichLocationWithAddress(location);

  // Create time entry
  const timeEntry = await TimeEntry.create({
    guard: guardId,
    shift: session.shift,
    site: session.site,
    date: today,
    type: 'break-start',
    timestamp: new Date(),
    location: enrichedLocation,
    geofenceStatus,
  });

  // Update session
  session.clockStatus = 'on-break';
  session.currentBreakStartedAt = new Date();
  session.currentBreakType = breakType;
  session.lastKnownLocation = enrichedLocation;
  await session.save();

  // Update timesheet
  const timesheet = await Timesheet.getOrCreateForDate(guardId, today);
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

  emitClockAction({
    guardId,
    guardName: req.user.fullName,
    action: 'break-start',
    siteId: session.site,
    siteName: 'Unknown Site',
    geofenceStatus,
  });
});

/**
 * @route   POST /api/timeclock/break/end
 * @desc    End a break
 * @access  Private
 */
const endBreak = asyncHandler(async (req, res) => {
  const { location } = req.body;
  const guardId = req.user._id;
  const today = getTodayDate();

  // Verify user is on break
  const session = await ActiveSession.findOne({ guard: guardId });
  if (!session || session.clockStatus !== 'on-break') {
    res.status(400);
    throw new Error('Not currently on break.');
  }

  // Calculate break duration
  const breakDuration = calculateMinutesWorked(session.currentBreakStartedAt, new Date());

  // Verify geofence
  const geofenceStatus = session.site
    ? await verifyGeofence(location, session.site)
    : 'unknown';

  // Enrich location
  const enrichedLocation = await enrichLocationWithAddress(location);

  // Create time entry
  const timeEntry = await TimeEntry.create({
    guard: guardId,
    shift: session.shift,
    site: session.site,
    date: today,
    type: 'break-end',
    timestamp: new Date(),
    location: enrichedLocation,
    geofenceStatus,
  });

  // Update timesheet with break record
  const timesheet = await Timesheet.getOrCreateForDate(guardId, today);
  timesheet.entries.push(timeEntry._id);
  timesheet.breaks.push({
    startTime: session.currentBreakStartedAt,
    endTime: new Date(),
    breakType: session.currentBreakType,
    duration: breakDuration,
    location: enrichedLocation,
  });
  await timesheet.save();

  // Update session
  session.clockStatus = 'clocked-in';
  session.totalBreakMinutesToday += breakDuration;
  session.currentBreakStartedAt = null;
  session.currentBreakType = null;
  session.lastKnownLocation = enrichedLocation;
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

  emitClockAction({
    guardId: guardId,
    guardName: req.user.fullName,
    action: 'break-end',
    siteId: session.site,
    siteName: 'Unknown Site',
    geofenceStatus,
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
  const guardId = req.user._id;

  const session = await ActiveSession.findOne({ guard: guardId })
    .populate('site', 'name address postCode')
    .populate('shift', 'startTime endTime shiftType');

  if (!session) {
    return res.json({
      success: true,
      data: {
        clockStatus: 'clocked-out',
        session: null,
      },
    });
  }

  res.json({
    success: true,
    data: {
      clockStatus: session.clockStatus,
      clockedInAt: session.clockedInAt,
      site: session.site,
      shift: session.shift,
      geofenceStatus: session.geofenceStatus,
      lastKnownLocation: session.lastKnownLocation,
      totalBreakMinutesToday: session.totalBreakMinutesToday,
      currentBreakStartedAt: session.currentBreakStartedAt,
      currentBreakType: session.currentBreakType,
    },
  });
});

/**
 * @route   GET /api/timeclock/entries/today
 * @desc    Get today's time entries for current user
 * @access  Private
 */
const getTodayEntries = asyncHandler(async (req, res) => {
  const guardId = req.user._id;
  const today = getTodayDate();

  const entries = await TimeEntry.find({
    guard: guardId,
    date: today,
  })
    .populate('site', 'name')
    .sort({ timestamp: -1 });

  res.json({
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
  const { startDate, endDate, guardId, type, limit = 50 } = req.query;

  const query = {};

  // If not admin/manager, only show own entries
  if (req.user.role === 'Guard') {
    query.guard = req.user._id;
  } else if (guardId) {
    query.guard = guardId;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  if (type) query.type = type;

  const entries = await TimeEntry.find(query)
    .populate('guard', 'fullName badgeNumber')
    .populate('site', 'name')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: entries,
  });
});

/**
 * @route   GET /api/timeclock/timesheet/today
 * @desc    Get today's timesheet
 * @access  Private
 */
const getTodayTimesheet = asyncHandler(async (req, res) => {
  const guardId = req.user._id;
  const today = getTodayDate();

  let timesheet = await Timesheet.findOne({ guard: guardId, date: today })
    .populate('entries');

  if (!timesheet) {
    timesheet = {
      date: today,
      clockInTime: null,
      clockOutTime: null,
      totalMinutesWorked: 0,
      totalBreakMinutes: 0,
      entries: [],
      breaks: [],
      status: 'pending',
    };
  }

  res.json({
    success: true,
    data: timesheet,
  });
});

/**
 * @route   GET /api/timeclock/timesheet/weekly
 * @desc    Get weekly summary
 * @access  Private
 */
const getWeeklySummary = asyncHandler(async (req, res) => {
  const guardId = req.user._id;

  // Get dates for current week (Monday to Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDate = monday.toISOString().split('T')[0];
  const endDate = sunday.toISOString().split('T')[0];

  const timesheets = await Timesheet.find({
    guard: guardId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  // Calculate weekly totals
  let totalMinutes = 0;
  let totalBreakMinutes = 0;
  let daysWorked = 0;

  const dailySummary = [];

  timesheets.forEach((ts) => {
    totalMinutes += ts.totalMinutesWorked || 0;
    totalBreakMinutes += ts.totalBreakMinutes || 0;
    if (ts.totalMinutesWorked > 0) daysWorked++;

    dailySummary.push({
      date: ts.date,
      hoursWorked: Math.round(((ts.totalMinutesWorked || 0) / 60) * 100) / 100,
      breakMinutes: ts.totalBreakMinutes || 0,
      status: ts.status,
    });
  });

  res.json({
    success: true,
    data: {
      weekStart: startDate,
      weekEnd: endDate,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      totalBreakHours: Math.round((totalBreakMinutes / 60) * 100) / 100,
      daysWorked,
      dailySummary,
    },
  });
});

/**
 * @route   GET /api/timeclock/stats
 * @desc    Get time clock statistics
 * @access  Private (Manager/Admin)
 */
const getStats = asyncHandler(async (req, res) => {
  const today = getTodayDate();

  const [activeSessions, todayEntries] = await Promise.all([
    ActiveSession.countDocuments({ clockStatus: { $ne: 'clocked-out' } }),
    TimeEntry.find({ date: today, type: 'clock-in' }),
  ]);

  // Calculate stats
  const guardsOnDuty = activeSessions;
  const onBreak = await ActiveSession.countDocuments({ clockStatus: 'on-break' });

  // Calculate total hours today
  const todayTimesheets = await Timesheet.find({ date: today });
  const totalMinutesToday = todayTimesheets.reduce((sum, ts) => sum + (ts.totalMinutesWorked || 0), 0);

  res.json({
    success: true,
    data: {
      guardsOnDuty,
      onBreak,
      clockedOut: 0, // Would need to calculate based on expected vs actual
      totalHoursToday: Math.round((totalMinutesToday / 60) * 100) / 100,
      lateArrivals: 0, // Would come from dashboard controller
      activeBreaks: onBreak,
    },
  });
});

/**
 * @route   GET /api/timeclock/active-guards
 * @desc    Get list of currently active guards
 * @access  Private (Manager/Admin)
 */
const getActiveGuards = asyncHandler(async (req, res) => {
  const today = getTodayDate();

  const sessions = await ActiveSession.find({
    clockStatus: { $ne: 'clocked-out' },
  })
    .populate('guard', 'fullName badgeNumber profileImage')
    .populate('site', 'name');

  const guardsData = await Promise.all(
    sessions.map(async (session) => {
      const timesheet = await Timesheet.findOne({
        guard: session.guard._id,
        date: today,
      });

      const hoursToday = timesheet
        ? Math.round(((timesheet.totalMinutesWorked || 0) / 60) * 100) / 100
        : 0;

      return {
        _id: session._id,
        guardId: session.guard._id,
        fullName: session.guard.fullName,
        badgeNumber: session.guard.badgeNumber,
        profileImage: session.guard.profileImage,
        clockStatus: session.clockStatus,
        clockedInAt: session.clockedInAt,
        currentSite: session.site?.name,
        currentLocation: session.lastKnownLocation,
        geofenceStatus: session.geofenceStatus,
        hoursToday,
      };
    })
  );

  res.json({
    success: true,
    data: guardsData,
  });
});

/**
 * @route   POST /api/timeclock/verify-location
 * @desc    Verify if location is within geofence and get address
 * @access  Private
 */
const verifyLocation = asyncHandler(async (req, res) => {
  const { location, siteId } = req.body;

  if (!location) {
    res.status(400);
    throw new Error('Location is required');
  }

  // Get geofence status if site provided
  let geofenceStatus = 'unknown';
  if (siteId) {
    geofenceStatus = await verifyGeofence(location, siteId);
  }

  // Reverse geocode the location
  const enrichedLocation = await enrichLocationWithAddress(location);

  res.json({
    success: true,
    data: {
      geofenceStatus,
      location: enrichedLocation,
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

  res.json({
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

  res.json({
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