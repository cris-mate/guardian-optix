/**
 * Activity Hub Controller
 *
 * Handles system activity tracking, updates/announcements,
 * and activity statistics for the Activity Hub page.
 */

const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Shift = require('../models/Shift');
const Incident = require('../models/Incident');
const { TimeEntry } = require('../models/TimeEntry');
const ComplianceAudit = require('../models/ComplianceAudit');
const { emitActivity } = require('../socket/socketManager');

// ============================================
// Helper Functions
// ============================================

/**
 * Get today's date string
 */
const getTodayDateString = () => new Date().toISOString().split('T')[0];

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
 * Determine severity based on activity type
 */
const getActivitySeverity = (activity) => {
  if (activity.category === 'incident') {
    return activity.incidentSeverity || 'medium';
  }
  if (activity.category === 'compliance' && activity.action?.includes('expired')) {
    return 'warning';
  }
  return 'info';
};

// ============================================
// Main Controller Functions
// ============================================

/**
 * @route   GET /api/activity-hub/activities
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

  // Fetch different activity types in parallel
  const [timeEntries, incidents, auditLogs, shiftChanges] = await Promise.all([
    // Time clock activities
    TimeEntry.find({
      date: { $gte: queryStartDate, $lte: queryEndDate },
    })
      .populate('officer', 'fullName role')
      .populate('site', 'name')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit)),

    // Incident activities
    Incident.find({
      createdAt: { $gte: new Date(queryStartDate), $lte: new Date(queryEndDate + 'T23:59:59Z') },
    })
      .populate('reportedBy', 'fullName role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit)),

    // Compliance audit activities
    ComplianceAudit.find({
      timestamp: { $gte: new Date(queryStartDate), $lte: new Date(queryEndDate + 'T23:59:59Z') },
    })
      .populate('performedBy', 'fullName role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit)),

    // Shift status changes (recent)
    Shift.find({
      date: { $gte: queryStartDate, $lte: queryEndDate },
      status: { $in: ['in-progress', 'completed', 'cancelled'] },
    })
      .populate('officer', 'fullName role')
      .populate('site', 'name')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit)),
  ]);

  // Convert to unified activity format
  const activities = [];

  // Time entries -> activities
  timeEntries.forEach((entry) => {
    activities.push({
      _id: `te-${entry._id}`,
      category: 'shift',
      action: mapTimeEntryAction(entry.type),
      description: `${entry.officer?.fullName || 'Unknown'} ${entry.type.replace('-', ' ')} at ${entry.site?.name || 'Unknown Site'}`,
      timestamp: entry.timestamp,
      severity: entry.geofenceStatus === 'outside' ? 'warning' : 'info',
      actorId: entry.officer?._id,
      actorName: entry.officer?.fullName || 'Unknown',
      actorRole: entry.officer?.role || 'Guard',
      location: entry.site ? {
        siteName: entry.site.name,
        siteId: entry.site._id,
        coordinates: entry.location,
      } : null,
      metadata: {
        geofenceStatus: entry.geofenceStatus,
        entryType: entry.type,
      },
    });
  });

  // Incidents -> activities
  incidents.forEach((incident) => {
    activities.push({
      _id: `inc-${incident._id}`,
      category: 'incident',
      action: 'Incident Reported',
      description: `${incident.severity.toUpperCase()} ${incident.incidentType} incident at ${incident.location}`,
      timestamp: incident.createdAt,
      severity: incident.severity,
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
      action: audit.action.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: audit.details || `${audit.action} performed`,
      timestamp: audit.timestamp,
      severity: 'info',
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
    if (shift.status !== 'scheduled') {
      activities.push({
        _id: `shift-${shift._id}`,
        category: 'shift',
        action: `Shift ${shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}`,
        description: `${shift.officer?.fullName || 'Unknown'}'s shift at ${shift.site?.name || 'Unknown'} is ${shift.status}`,
        timestamp: shift.updatedAt,
        severity: shift.status === 'cancelled' ? 'warning' : 'info',
        actorId: shift.officer?._id,
        actorName: shift.officer?.fullName || 'Unknown',
        actorRole: 'Guard',
        location: shift.site ? {
          siteName: shift.site.name,
          siteId: shift.site._id,
        } : null,
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
 * @route   GET /api/activity-hub/updates
 * @desc    Get system updates and announcements
 * @access  Private
 */
const getUpdates = asyncHandler(async (req, res) => {
  const { type, priority, limit = 20 } = req.query;

  // For now, return placeholder updates
  // In production, this would fetch from an Updates collection
  const updates = [
    {
      _id: 'update-001',
      type: 'announcement',
      title: 'System Maintenance Scheduled',
      content: 'Guardian Optix will undergo scheduled maintenance on Sunday 2am-4am GMT.',
      priority: 'normal',
      author: {
        _id: 'admin-001',
        fullName: 'System Administrator',
        role: 'Admin',
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      readBy: [],
      acknowledgedBy: [],
    },
    {
      _id: 'update-002',
      type: 'policy',
      title: 'Updated Clock-In Procedures',
      content: 'All officers must ensure GPS is enabled before clocking in. Geofence verification is now mandatory.',
      priority: 'high',
      author: {
        _id: 'admin-001',
        fullName: 'Operations Manager',
        role: 'Manager',
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
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
 * @route   GET /api/activity-hub/stats
 * @desc    Get activity statistics
 * @access  Private
 */
const getStats = asyncHandler(async (req, res) => {
  const today = getTodayDateString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [
    todayTimeEntries,
    weekTimeEntries,
    todayIncidents,
    weekIncidents,
  ] = await Promise.all([
    TimeEntry.countDocuments({ date: today }),
    TimeEntry.countDocuments({ date: { $gte: weekAgo, $lte: today } }),
    Incident.countDocuments({
      createdAt: { $gte: new Date(today) },
    }),
    Incident.countDocuments({
      createdAt: { $gte: new Date(weekAgo) },
    }),
  ]);

  // Calculate activity by category
  const activityStats = {
    totalToday: todayTimeEntries + todayIncidents,
    totalThisWeek: weekTimeEntries + weekIncidents,
    byCategory: {
      shift: todayTimeEntries,
      incident: todayIncidents,
      compliance: 0, // Would count from audit logs
      authentication: 0, // Would count login events
      system: 0,
    },
    bySeverity: {
      info: todayTimeEntries,
      warning: 0,
      critical: todayIncidents,
    },
  };

  const updateStats = {
    total: 2, // Placeholder
    unread: 1,
    requiresAcknowledgement: 1,
    byType: {
      announcement: 1,
      policy: 1,
      alert: 0,
    },
  };

  res.json({
    success: true,
    activityStats,
    updateStats,
  });
});

/**
 * @route   POST /api/activity-hub/updates
 * @desc    Create a new update/announcement
 * @access  Private (Manager/Admin)
 */
const createUpdate = asyncHandler(async (req, res) => {
  const { type, title, content, priority, expiresAt, targetRoles } = req.body;

  // In production, save to Updates collection
  const update = {
    _id: `update-${Date.now()}`,
    type,
    title,
    content,
    priority: priority || 'normal',
    author: {
      _id: req.user._id,
      fullName: req.user.fullName,
      role: req.user.role,
    },
    createdAt: new Date().toISOString(),
    expiresAt,
    targetRoles: targetRoles || ['Guard', 'Manager', 'Admin'],
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
 * @route   PATCH /api/activity-hub/updates/:id/read
 * @desc    Mark an update as read
 * @access  Private
 */
const markUpdateRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // In production, update the Updates collection
  res.json({
    success: true,
    message: 'Update marked as read',
  });
});

/**
 * @route   PATCH /api/activity-hub/updates/:id/acknowledge
 * @desc    Acknowledge an update
 * @access  Private
 */
const acknowledgeUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // In production, update the Updates collection
  res.json({
    success: true,
    message: 'Update acknowledged',
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