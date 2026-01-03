/**
 * TimeClock Controller
 *
 * Handles time clock functionality including clock-in/out,
 * break management, and timesheet operations.
 * Integrates GPS reverse geocoding and geofence verification with simulation support.
 */

const { TimeEntry, Timesheet, ActiveSession } = require('../models/TimeEntry');
const Site = require('../models/Site');
const Shift = require('../models/Shift');
const User = require('../models/User');
const { emitClockAction, emitGeofenceViolation } = require('../socket/socketManager');
const { reverseGeocode } = require('../services/geocodingService');
const {
  verifyGeofence,
  getTestScenarios,
  canUserSimulate,
} = require('../services/geofenceService');
const asyncHandler = require('../utils/asyncHandler');

// ============================================
// Helper Functions
// ============================================

/**
 * Get today's date
 */
const getTodayDate = () => new Date().toISOString().split('T')[0];

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
  if (!location?.latitude || !location?.longitude) {
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
// Geofence Configuration Endpoint
// ============================================

/**
 * @route   GET /api/timeClock/geofence-config
 * @desc    Get geofence configuration for current user
 * @access  Private
 */
const getGeofenceConfig = asyncHandler(async (req, res) => {
  const userRole = req.user.role;

  res.json({
    success: true,
    data: {
      simulationEnabled: canUserSimulate(userRole),
      testScenarios: canUserSimulate(userRole) ? getTestScenarios() : [],
      enforcement: process.env.NODE_ENV === 'production' ? 'strict' : 'permissive',
    },
  });
});

// ============================================
// Clock Actions
// ============================================

/**
 * @route   POST /api/timeClock/clock-in
 * @desc    Clock in for current user
 * @access  Private
 */
const clockIn = asyncHandler(async (req, res) => {
  const { location, siteId, shiftId, notes, simulationScenario } = req.body;
  const guardId = req.user._id;
  const userRole = req.user.role;
  const today = getTodayDate();

  // Check if already clocked in
  let session = await ActiveSession.findOne({ guard: guardId });
  if (session && session.clockStatus !== 'clocked-out') {
    res.status(400);
    throw new Error('Already clocked in. Please clock out first.');
  }

  // Verify geofence (with simulation support)
  const geofenceResult = await verifyGeofence(location, siteId, {
    simulationScenario,
    userRole,
  });

  // Determine location to use (simulated or actual)
  const locationToEnrich = geofenceResult.isSimulated
    ? geofenceResult.coordinates?.checked
    : location;

  // Enrich location with address
  const enrichedLocation = await enrichLocationWithAddress(locationToEnrich);

  // Create time entry
  const timeEntry = await TimeEntry.create({
    guard: guardId,
    shift: shiftId,
    site: siteId,
    date: today,
    type: 'clock-in',
    timestamp: new Date(),
    location: enrichedLocation,
    geofenceStatus: geofenceResult.status,
    geofenceDistance: geofenceResult.distance,
    isSimulated: geofenceResult.isSimulated,
    simulationScenario: geofenceResult.simulationScenario,
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
      geofenceStatus: geofenceResult.status,
    });
  } else {
    session.clockStatus = 'clocked-in';
    session.clockedInAt = new Date();
    session.shift = shiftId;
    session.site = siteId;
    session.lastKnownLocation = enrichedLocation;
    session.geofenceStatus = geofenceResult.status;
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

  // Build response
  const responseData = {
    entry: timeEntry,
    session: {
      clockStatus: session.clockStatus,
      clockedInAt: session.clockedInAt,
      geofenceStatus: geofenceResult.status,
    },
    location: enrichedLocation,
    geofence: {
      status: geofenceResult.status,
      distance: geofenceResult.distance,
      message: geofenceResult.message,
    },
  };

  // Add simulation info if applicable
  if (geofenceResult.isSimulated) {
    responseData.simulation = {
      enabled: true,
      scenario: geofenceResult.simulationScenario,
      warning: 'This entry used simulated GPS coordinates',
    };
  }

  res.status(201).json({
    success: true,
    data: responseData,
    message: geofenceResult.status === 'outside'
      ? `Clocked in (${geofenceResult.message})`
      : 'Clocked in successfully',
  });

  // Emit socket events
  emitClockAction({
    guardId,
    guardName: guard?.fullName || 'Unknown',
    action: 'clock-in',
    siteId,
    siteName: site?.name || 'Unknown Site',
    geofenceStatus: geofenceResult.status,
    isSimulated: geofenceResult.isSimulated,
  });

  if (geofenceResult.status === 'outside') {
    emitGeofenceViolation({
      guardId,
      guardName: guard?.fullName || 'Unknown',
      siteId,
      siteName: site?.name || 'Unknown Site',
      location: enrichedLocation,
      distance: geofenceResult.distance,
      action: 'clock-in',
      isSimulated: geofenceResult.isSimulated,
    });
  }
});

/**
 * @route   POST /api/timeClock/clock-out
 * @desc    Clock out for current user
 * @access  Private
 */
const clockOut = asyncHandler(async (req, res) => {
  const { location, notes, simulationScenario } = req.body;
  const guardId = req.user._id;
  const userRole = req.user.role;
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

  // Verify geofence (with simulation support)
  const geofenceResult = await verifyGeofence(location, session.site, {
    simulationScenario,
    userRole,
  });

  // Determine location to use
  const locationToEnrich = geofenceResult.isSimulated
    ? geofenceResult.coordinates?.checked
    : location;

  // Enrich location with address
  const enrichedLocation = await enrichLocationWithAddress(locationToEnrich);

  // Create time entry
  const timeEntry = await TimeEntry.create({
    guard: guardId,
    shift: session.shift,
    site: session.site,
    date: today,
    type: 'clock-out',
    timestamp: new Date(),
    location: enrichedLocation,
    geofenceStatus: geofenceResult.status,
    geofenceDistance: geofenceResult.distance,
    isSimulated: geofenceResult.isSimulated,
    simulationScenario: geofenceResult.simulationScenario,
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
  session.geofenceStatus = geofenceResult.status;
  await session.save();

  // Get names for broadcast
  const guard = await User.findById(guardId).select('fullName');
  const site = session.site ? await Site.findById(session.site).select('name') : null;

  // Build response
  const responseData = {
    entry: timeEntry,
    timesheet: {
      totalMinutesWorked: timesheet.totalMinutesWorked,
      totalBreakMinutes: timesheet.totalBreakMinutes,
      hoursWorked: timesheet.hoursWorked,
    },
    location: enrichedLocation,
    geofence: {
      status: geofenceResult.status,
      distance: geofenceResult.distance,
      message: geofenceResult.message,
    },
  };

  if (geofenceResult.isSimulated) {
    responseData.simulation = {
      enabled: true,
      scenario: geofenceResult.simulationScenario,
      warning: 'This entry used simulated GPS coordinates',
    };
  }

  res.status(201).json({
    success: true,
    data: responseData,
    message: 'Clocked out successfully',
  });

  // Emit socket events
  emitClockAction({
    guardId,
    guardName: guard?.fullName || 'Unknown',
    action: 'clock-out',
    siteId: session.site,
    siteName: site?.name || 'Unknown Site',
    geofenceStatus: geofenceResult.status,
    isSimulated: geofenceResult.isSimulated,
  });

  if (geofenceResult.status === 'outside') {
    emitGeofenceViolation({
      guardId,
      guardName: guard?.fullName || 'Unknown',
      siteId: session.site,
      siteName: site?.name || 'Unknown Site',
      location: enrichedLocation,
      distance: geofenceResult.distance,
      action: 'clock-out',
      isSimulated: geofenceResult.isSimulated,
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

  // Verify geofence (no simulation for breaks - simpler)
  const geofenceResult = await verifyGeofence(location, session.site, {});

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
    geofenceStatus: geofenceResult.status,
    geofenceDistance: geofenceResult.distance,
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
    geofenceStatus: geofenceResult.status,
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
  const geofenceResult = await verifyGeofence(location, session.site, {});

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
    geofenceStatus: geofenceResult.status,
    geofenceDistance: geofenceResult.distance,
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
    guardId,
    guardName: req.user.fullName,
    action: 'break-end',
    siteId: session.site,
    siteName: 'Unknown Site',
    geofenceStatus: geofenceResult.status,
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
 * @route   GET /api/timeClock/entries/today
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
 * @route   GET /api/timeClock/entries
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
    .populate('guard', 'fullName siaLicenceNumber')
    .populate('site', 'name')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: entries,
  });
});

/**
 * @route   GET /api/timeClock/timesheet/today
 * @desc    Get today's timesheet
 * @access  Private
 */
const getTodayTimesheet = asyncHandler(async (req, res) => {
  const guardId = req.user._id;
  const today = getTodayDate();

  let timesheet = await Timesheet.findOne({ guard: guardId, date: today }).populate('entries');

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
 * @route   GET /api/timeClock/timesheet/weekly
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

  const dailySummary = timesheets.map((ts) => {
    totalMinutes += ts.totalMinutesWorked || 0;
    totalBreakMinutes += ts.totalBreakMinutes || 0;
    if (ts.totalMinutesWorked > 0) daysWorked++;

    return {
      date: ts.date,
      hoursWorked: Math.round(((ts.totalMinutesWorked || 0) / 60) * 100) / 100,
      breakMinutes: ts.totalBreakMinutes || 0,
      status: ts.status,
    };
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
 * @route   GET /api/timeClock/stats
 * @desc    Get time clock statistics
 * @access  Private (Manager/Admin)
 */
const getStats = asyncHandler(async (req, res) => {
  const today = getTodayDate();

  const [activeSessions, onBreak, todayTimesheets] = await Promise.all([
    ActiveSession.countDocuments({ clockStatus: { $ne: 'clocked-out' } }),
    ActiveSession.countDocuments({ clockStatus: 'on-break' }),
    Timesheet.find({ date: today }),
  ]);

  const totalMinutesToday = todayTimesheets.reduce(
    (sum, ts) => sum + (ts.totalMinutesWorked || 0),
    0
  );

  res.json({
    success: true,
    data: {
      guardsOnDuty: activeSessions,
      onBreak,
      clockedOut: 0,
      totalHoursToday: Math.round((totalMinutesToday / 60) * 100) / 100,
      lateArrivals: 0,
      activeBreaks: onBreak,
    },
  });
});

/**
 * @route   GET /api/timeClock/active-guards
 * @desc    Get list of currently active guards
 * @access  Private (Manager/Admin)
 */
const getActiveGuards = asyncHandler(async (req, res) => {
  const today = getTodayDate();

  const sessions = await ActiveSession.find({
    clockStatus: { $ne: 'clocked-out' },
  })
    .populate('guard', 'fullName siaLicenceNumber')
    .populate('site', 'name');

  const guardsData = await Promise.all(
    sessions.map(async (session) => {
      const timesheet = await Timesheet.findOne({
        guard: session.guard._id,
        date: today,
      });

      return {
        _id: session._id,
        guardId: session.guard._id,
        fullName: session.guard.fullName,
        siaLicenceNumber: session.guard.siaLicenceNumber,
        profileImage: session.guard.profileImage,
        clockStatus: session.clockStatus,
        clockedInAt: session.clockedInAt,
        currentSite: session.site?.name,
        currentLocation: session.lastKnownLocation,
        geofenceStatus: session.geofenceStatus,
        hoursToday: timesheet
          ? Math.round(((timesheet.totalMinutesWorked || 0) / 60) * 100) / 100
          : 0,
      };
    })
  );

  res.json({
    success: true,
    data: guardsData,
  });
});

/**
 * @route   POST /api/timeClock/verify-location
 * @desc    Verify if location is within geofence and get address
 * @access  Private
 */
const verifyLocation = asyncHandler(async (req, res) => {
  const { location, siteId } = req.body;

  if (!location) {
    res.status(400);
    throw new Error('Location is required');
  }

  // Use geofence service for verification
  const geofenceResult = await verifyGeofence(location, siteId, {});

  // Reverse geocode the location
  const enrichedLocation = await enrichLocationWithAddress(location);

  res.json({
    success: true,
    data: {
      geofenceStatus: geofenceResult.status,
      geofenceDistance: geofenceResult.distance,
      location: enrichedLocation,
    },
  });
});

/**
 * @route   PATCH /api/timeClock/timesheet/:id/approve
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
 * @route   PATCH /api/timeClock/timesheet/:id/reject
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
  getGeofenceConfig,

  // Timesheet management
  approveTimesheet,
  rejectTimesheet,
};