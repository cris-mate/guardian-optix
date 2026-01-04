/**
 * Activity Hub Controller
 *
 * Handles system activity tracking, updates,
 * and activity statistics for the Activity Hub page.
 *
 * Provides database-driven stats.
 */

const asyncHandler = require('../utils/asyncHandler');
const Shift = require('../models/Shift');
const Incident = require('../models/Incident');
const { TimeEntry, ActiveSession } = require('../models/TimeEntry');
const ComplianceAudit = require('../models/ComplianceAudit');
const Certification = require('../models/Certification');
const { emitActivity } = require('../socket/socketManager');

// ============================================
// Helper Functions
// ============================================

/**
 * Get today's date (YYYY-MM-DD format)
 */
const getTodayDateString = () => new Date().toISOString().split('T')[0];

/**
 * Get date string for N days ago
 */
const getDaysAgoDateString = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

/**
 * Map time entry type to activity action
 */
const mapTimeEntryAction = (type) => {
  const actionMap = {
    'clock-in': 'Clock In',
    'clock-out': 'Clock Out',
    'break-start': 'Break Started',
    'break-end': 'Break Ended',
  };
  return actionMap[type] || type;
};

/**
 * Map aggregation results to category counts
 * Returns a complete object with all categories initialized to 0
 */
const mapCategories = (aggregationResults, categoryField = '_id') => {
  const categories = {
    authentication: 0,
    shift: 0,
    patrol: 0,
    incident: 0,
    compliance: 0,
    geofence: 0,
    task: 0,
    system: 0,
  };

  aggregationResults.forEach((result) => {
    const category = result[categoryField];
    if (category && categories.hasOwnProperty(category)) {
      categories[category] = result.count;
    }
  });

  return categories;
};

/**
 * Map aggregation results to severity counts
 * Returns a complete object with all severities initialized to 0
 */
const mapSeverities = (aggregationResults, severityField = '_id') => {
  const severities = {
    info: 0,
    warning: 0,
    critical: 0,
  };

  aggregationResults.forEach((result) => {
    const severity = result[severityField];
    if (severity === 'low' || severity === 'info') {
      severities.info += result.count;
    } else if (severity === 'medium' || severity === 'warning') {
      severities.warning += result.count;
    } else if (severity === 'high' || severity === 'critical') {
      severities.critical += result.count;
    }
  });

  return severities;
};

/**
 * Get count of unread updates for a user
 * In production, this would query an Updates collection
 */
const getUnreadUpdatesCount = async (userId) => {
  // Placeholder - would query Updates collection where userId not in readBy array
  // Return a realistic count based on recent activity
  try {
    // Count recent incidents not acknowledged as a proxy
    const recentIncidents = await Incident.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      status: { $in: ['open', 'under-review'] },
    });
    return Math.min(recentIncidents, 5);
  } catch {
    return 0;
  }
};

/**
 * Get count of updates pending acknowledgement for a user
 * In production, this would query an Updates collection
 */
const getPendingAckCount = async (userId) => {
  // Placeholder - would query Updates where requiresAcknowledgement=true
  // and userId not in acknowledgedBy array
  try {
    // Count high-severity open incidents as proxy for urgent acknowledgements
    const urgentIncidents = await Incident.countDocuments({
      severity: { $in: ['high', 'critical'] },
      status: 'open',
    });
    return urgentIncidents;
  } catch {
    return 0;
  }
};

/**
 * Generate daily breakdown for the past N days
 */
const generateDailyBreakdown = async (days = 7) => {
  const breakdown = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    // Count activities for this day
    const [timeEntryCount, incidentCount] = await Promise.all([
      TimeEntry.countDocuments({ date: dateString }),
      Incident.countDocuments({
        createdAt: {
          $gte: new Date(dateString),
          $lt: new Date(new Date(dateString).getTime() + 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    breakdown.push({
      date: dateString,
      count: timeEntryCount + incidentCount,
    });
  }

  return breakdown;
};

// ============================================
// Main Controller Functions
// ============================================

/**
 * @route   GET /api/activityHub/activities
 * @desc    Get system activities with filtering
 * @access  Private
 */
const getActivities = asyncHandler(async (req, res) => {
  const {
    category,
    severity,
    startDate,
    endDate,
    limit = 50,
    page = 1,
  } = req.query;

  const today = getTodayDateString();
  const queryStartDate = startDate || today;
  const queryEndDate = endDate || today;

  // Fetch different activity types
  const [timeEntries, incidents, auditLogs, shiftChanges] = await Promise.all([
    // Time clock activities
    TimeEntry.find({
      date: { $gte: queryStartDate, $lte: queryEndDate },
    })
      .populate('guard', 'fullName role')
      .populate('site', 'name')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean(),

    // Incident activities
    Incident.find({
      createdAt: {
        $gte: new Date(queryStartDate),
        $lte: new Date(queryEndDate + 'T23:59:59Z'),
      },
    })
      .populate('reportedBy', 'fullName role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean(),

    // Compliance audit activities
    ComplianceAudit.find({
      timestamp: {
        $gte: new Date(queryStartDate),
        $lte: new Date(queryEndDate + 'T23:59:59Z'),
      },
    })
      .populate('performedBy', 'fullName role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean(),

    // Shift status changes (recent)
    Shift.find({
      date: { $gte: queryStartDate, $lte: queryEndDate },
      status: { $in: ['in-progress', 'completed', 'cancelled'] },
    })
      .populate('guard', 'fullName role')
      .populate('site', 'name')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .lean(),
  ]);

  // Convert to unified activity format
  const activities = [];

  // Time entries -> activities
  timeEntries.forEach((entry) => {
    activities.push({
      _id: `te-${entry._id}`,
      category: 'shift',
      action: mapTimeEntryAction(entry.type),
      description: `${entry.guard?.fullName || 'Unknown'} ${entry.type.replace('-', ' ')} at ${entry.site?.name || 'Unknown Site'}`,
      timestamp: entry.timestamp,
      severity: entry.geofenceStatus === 'outside' ? 'warning' : 'info',
      actorId: entry.guard?._id,
      actorName: entry.guard?.fullName || 'Unknown',
      actorRole: entry.guard?.role || 'Guard',
      location: entry.site
        ? {
          siteName: entry.site.name,
          siteId: entry.site._id,
          coordinates: entry.location,
        }
        : null,
      metadata: {
        geofenceStatus: entry.geofenceStatus,
        entryType: entry.type,
      },
    });
  });

  // Incidents -> activities
  incidents.forEach((incident) => {
    // Map incident severity to activity severity
    let activitySeverity = 'info';
    if (incident.severity === 'high' || incident.severity === 'critical') {
      activitySeverity = 'critical';
    } else if (incident.severity === 'medium') {
      activitySeverity = 'warning';
    }

    activities.push({
      _id: `inc-${incident._id}`,
      category: 'incident',
      action: 'Incident Reported',
      description: `${incident.severity.toUpperCase()} ${incident.incidentType} incident at ${incident.location}`,
      timestamp: incident.createdAt,
      severity: activitySeverity,
      actorId: incident.reportedBy?._id,
      actorName: incident.reportedBy?.fullName || 'Unknown',
      actorRole: incident.reportedBy?.role || 'Guard',
      location: {
        siteName: incident.location,
      },
      metadata: {
        incidentId: incident._id,
        incidentType: incident.incidentType,
        status: incident.status,
      },
    });
  });

  // Audit logs -> activities
  auditLogs.forEach((audit) => {
    activities.push({
      _id: `audit-${audit._id}`,
      category: 'compliance',
      action: audit.action
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      description: audit.details || `${audit.action} performed`,
      timestamp: audit.timestamp,
      severity: audit.action.includes('expired') ? 'warning' : 'info',
      actorId: audit.performedBy?._id,
      actorName: audit.performedBy?.fullName || 'System',
      actorRole: audit.performedBy?.role || 'System',
      metadata: {
        targetId: audit.targetId,
        targetType: audit.targetType,
      },
    });
  });

  // Shift changes -> activities
  shiftChanges.forEach((shift) => {
    if (shift.status !== 'scheduled' && shift.status !== 'unassigned') {
      activities.push({
        _id: `shift-${shift._id}`,
        category: 'shift',
        action: `Shift ${shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}`,
        description: `${shift.guard?.fullName || 'Unassigned'}'s shift at ${shift.site?.name || 'Unknown'} is ${shift.status}`,
        timestamp: shift.updatedAt,
        severity: shift.status === 'cancelled' ? 'warning' : 'info',
        actorId: shift.guard?._id,
        actorName: shift.guard?.fullName || 'Unassigned',
        actorRole: 'Guard',
        location: shift.site
          ? {
            siteName: shift.site.name,
            siteId: shift.site._id,
          }
          : null,
        metadata: {
          shiftId: shift._id,
          shiftType: shift.shiftType,
          status: shift.status,
        },
      });
    }
  });

  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Apply filters
  let filtered = activities;

  if (category && category !== 'all') {
    filtered = filtered.filter((a) => a.category === category);
  }

  if (severity && severity !== 'all') {
    filtered = filtered.filter((a) => a.severity === severity);
  }

  // Paginate
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginated = filtered.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: paginated,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / parseInt(limit)),
    },
  });
});

/**
 * @route   GET /api/activityHub/updates
 * @desc    Get system updates and announcements
 * @access  Private
 */
const getUpdates = asyncHandler(async (req, res) => {
  const { type, priority, limit = 20 } = req.query;

  // For now, return placeholder updates
  // In production would fetch from an Updates collection
  const updates = [
    {
      _id: 'update-001',
      type: 'announcement',
      title: 'System Maintenance Scheduled',
      content:
        'Guardian Optix will undergo scheduled maintenance on Sunday 2am-4am GMT.',
      priority: 'medium',
      authorId: 'admin-001',
      authorName: 'System Administrator',
      authorRole: 'Admin',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      targetAudience: 'all',
      requiresAcknowledgement: false,
      isPinned: false,
      readBy: [],
      acknowledgedBy: [],
    },
    {
      _id: 'update-002',
      type: 'policy',
      title: 'Updated Clock-In Procedures',
      content:
        'All guards must ensure GPS is enabled before clocking in. Geofence verification is now mandatory.',
      priority: 'high',
      authorId: 'admin-001',
      authorName: 'Operations Manager',
      authorRole: 'Manager',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      targetAudience: 'guards',
      requiresAcknowledgement: true,
      isPinned: true,
      readBy: [],
      acknowledgedBy: [],
    },
  ];

  let filtered = updates;

  if (type && type !== 'all') {
    filtered = filtered.filter((u) => u.type === type);
  }

  if (priority && priority !== 'all') {
    filtered = filtered.filter((u) => u.priority === priority);
  }

  res.json({
    success: true,
    data: filtered.slice(0, parseInt(limit)),
  });
});

/**
 * @route   GET /api/activityHub/stats
 * @desc    Get activity statistics for Activity Hub dashboard
 * @access  Private
 *
 * Returns data matching frontend ActivityStats and UpdateStats interfaces
 */
const getStats = asyncHandler(async (req, res) => {
  const today = getTodayDateString();
  const weekAgo = getDaysAgoDateString(7);

  // Run all queries in parallel for performance
  const [
    // Today's time entries by type
    todayTimeEntries,
    // Today's incidents by severity
    todayIncidentsBySeverity,
    // Week total time entries
    weekTimeEntries,
    // Week total incidents
    weekIncidents,
    // Guards currently on duty
    guardsOnDuty,
    // Guards on break
    guardsOnBreak,
    // Unassigned shifts today
    unassignedShifts,
    // Open incidents (any status needing attention)
    openIncidents,
    // Compliance alerts (expiring/expired certs)
    complianceAlerts,
    // Daily breakdown for chart
    dailyBreakdown,
  ] = await Promise.all([
    // Today's time entries aggregated
    TimeEntry.aggregate([
      { $match: { date: today } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),

    // Today's incidents by severity
    Incident.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(today) },
        },
      },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),

    // Week time entries count
    TimeEntry.countDocuments({
      date: { $gte: weekAgo, $lte: today },
    }),

    // Week incidents count
    Incident.countDocuments({
      createdAt: { $gte: new Date(weekAgo) },
    }),

    // Active sessions - clocked in
    ActiveSession.countDocuments({ clockStatus: 'clocked-in' }),

    // Active sessions - on break
    ActiveSession.countDocuments({ clockStatus: 'on-break' }),

    // Unassigned shifts today
    Shift.countDocuments({ status: 'unassigned', date: today }),

    // Open incidents
    Incident.countDocuments({ status: { $in: ['open', 'under-review'] } }),

    // Expiring/expired certifications
    Certification.countDocuments({
      status: { $in: ['expiring-soon', 'expired'] },
    }).catch(() => 0), // Handle if Certification model doesn't exist

    // Daily breakdown
    generateDailyBreakdown(7),
  ]);

  // Calculate today's total from time entries
  const todayTimeEntryTotal = todayTimeEntries.reduce(
    (sum, entry) => sum + entry.count,
    0
  );
  const todayIncidentTotal = todayIncidentsBySeverity.reduce(
    (sum, entry) => sum + entry.count,
    0
  );
  const todayTotal = todayTimeEntryTotal + todayIncidentTotal;

  // Map time entry types to categories
  const byCategory = {
    authentication: 0,
    shift: todayTimeEntryTotal,
    patrol: 0,
    incident: todayIncidentTotal,
    compliance: 0,
    geofence: 0,
    task: 0,
    system: 0,
  };

  // Map severities
  const bySeverity = mapSeverities(todayIncidentsBySeverity);
  // Add time entries as info-level activities
  bySeverity.info += todayTimeEntryTotal;

  // Get critical count
  const recentCritical =
    todayIncidentsBySeverity.find(
      (s) => s._id === 'critical' || s._id === 'high'
    )?.count || 0;

  // Calculate pending acknowledgements (open high-priority incidents)
  const pendingAcknowledgements = await Incident.countDocuments({
    severity: { $in: ['high', 'critical'] },
    status: 'open',
  });

  // Build response matching frontend interfaces
  const activityStats = {
    today: {
      total: todayTotal,
      byCategory,
      bySeverity,
    },
    week: {
      total: weekTimeEntries + weekIncidents,
      dailyBreakdown,
    },
    recentCritical,
    pendingAcknowledgements,
  };

  // Update stats - would come from Updates collection in production
  const unreadCount = await getUnreadUpdatesCount(req.user?._id);
  const pendingAckCount = await getPendingAckCount(req.user?._id);

  const updateStats = {
    total: 2, // Placeholder - would count from Updates collection
    unread: unreadCount,
    pendingAcknowledgement: pendingAckCount,
    byType: {
      announcement: 1,
      policy: 1,
      schedule: 0,
      alert: 0,
      recognition: 0,
      general: 0,
    },
  };

  // Additional operational stats for the dashboard cards
  const operationalStats = {
    guardsOnDuty,
    guardsOnBreak,
    unassignedShifts,
    openIncidents,
    complianceAlerts,
  };

  res.json({
    success: true,
    activityStats,
    updateStats,
    operationalStats,
  });
});

/**
 * @route   POST /api/activityHub/updates
 * @desc    Create a new update/announcement
 * @access  Private (Manager/Admin)
 */
const createUpdate = asyncHandler(async (req, res) => {
  const {
    type,
    title,
    content,
    priority,
    expiresAt,
    targetAudience,
    targetIds,
    requiresAcknowledgement,
    isPinned,
  } = req.body;

  // Validate required fields
  if (!type || !title || !content) {
    res.status(400);
    throw new Error('Type, title, and content are required');
  }

  // In production, save to Updates collection
  const update = {
    _id: `update-${Date.now()}`,
    type,
    title,
    content,
    priority: priority || 'medium',
    authorId: req.user._id,
    authorName: req.user.fullName,
    authorRole: req.user.role,
    createdAt: new Date().toISOString(),
    expiresAt,
    targetAudience: targetAudience || 'all',
    targetIds,
    requiresAcknowledgement: requiresAcknowledgement || false,
    isPinned: isPinned || false,
    readBy: [],
    acknowledgedBy: [],
  };

  // Emit real-time notification
  emitActivity({
    type: 'update-created',
    updateType: type,
    title,
    priority,
    createdBy: req.user.fullName,
  });

  res.status(201).json({
    success: true,
    data: update,
  });
});

/**
 * @route   PATCH /api/activityHub/updates/:id/read
 * @desc    Mark an update as read
 * @access  Private
 */
const markUpdateRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // In production, update the Updates collection
  res.json({
    success: true,
    message: 'Update marked as read',
    updateId: id,
    userId,
  });
});

/**
 * @route   PATCH /api/activityHub/updates/:id/acknowledge
 * @desc    Acknowledge an update
 * @access  Private
 */
const acknowledgeUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // In production, update the Updates collection
  res.json({
    success: true,
    message: 'Update acknowledged',
    updateId: id,
    userId,
  });
});

module.exports = {
  getActivities,
  getUpdates,
  getStats,
  createUpdate,
  markUpdateRead,
  acknowledgeUpdate,
};