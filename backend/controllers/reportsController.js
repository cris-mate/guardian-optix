/**
 * Reports Controller
 *
 * Provides report generation and analytics data.
 * Supports multiple report types and export formats.
 */

const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Incident = require('../models/Incident');
// const Client = require('../models/Client');
// const Site = require('../models/Site');

// ============================================
// Helper Functions
// ============================================

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
    case 'yesterday':
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
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

  return { start, end };
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============================================
// Report Templates (Static Data)
// ============================================

const REPORT_TEMPLATES = [
  {
    id: 'tpl-001',
    name: 'Weekly Operations Summary',
    description: 'Comprehensive overview of shift coverage, patrol completion, and site activity',
    category: 'operational',
    icon: 'LuBarChart3',
    color: 'blue',
    metrics: ['shifts', 'patrols', 'checkpoints', 'hours'],
    isCustom: false,
  },
  {
    id: 'tpl-002',
    name: 'Attendance & Punctuality Report',
    description: 'Detailed breakdown of officer attendance, late arrivals, and hours worked',
    category: 'attendance',
    icon: 'LuClock',
    color: 'green',
    metrics: ['attendance', 'punctuality', 'hours', 'overtime'],
    isCustom: false,
  },
  {
    id: 'tpl-003',
    name: 'Incident Analysis Report',
    description: 'Analysis of incidents by type, severity, site, and response metrics',
    category: 'incidents',
    icon: 'LuAlertTriangle',
    color: 'orange',
    metrics: ['incidents', 'response-time', 'resolution', 'severity'],
    isCustom: false,
  },
  {
    id: 'tpl-004',
    name: 'Client Service Report',
    description: 'Service delivery metrics and compliance scores for client accounts',
    category: 'clients',
    icon: 'LuBriefcase',
    color: 'purple',
    metrics: ['coverage', 'compliance', 'incidents', 'hours'],
    isCustom: false,
  },
  {
    id: 'tpl-005',
    name: 'Compliance Status Report',
    description: 'SIA licence status, training completion, and certification tracking',
    category: 'compliance',
    icon: 'LuShield',
    color: 'teal',
    metrics: ['licences', 'training', 'certifications', 'expiring'],
    isCustom: false,
  },
  {
    id: 'tpl-006',
    name: 'Site Performance Report',
    description: 'Individual site metrics including patrols, incidents, and guard hours',
    category: 'operational',
    icon: 'LuMapPin',
    color: 'blue',
    metrics: ['patrols', 'incidents', 'hours', 'checkpoints'],
    isCustom: false,
  },
  {
    id: 'tpl-007',
    name: 'Monthly Executive Summary',
    description: 'High-level KPIs and trends for executive stakeholders',
    category: 'operational',
    icon: 'LuPieChart',
    color: 'indigo',
    metrics: ['kpis', 'trends', 'highlights', 'recommendations'],
    isCustom: false,
  },
  {
    id: 'tpl-008',
    name: 'Timesheet Export',
    description: 'Export officer hours for payroll processing',
    category: 'attendance',
    icon: 'LuFileSpreadsheet',
    color: 'green',
    metrics: ['hours', 'overtime', 'breaks', 'rates'],
    isCustom: false,
  },
];

// In-memory storage for generated reports (would be database in production)
let generatedReports = [];
let scheduledReports = [];
let userFavorites = {};

// ============================================
// Controller Methods
// ============================================

/**
 * @desc    Get report templates
 * @route   GET /api/reports/templates
 * @access  Private
 */
const getTemplates = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const favorites = userFavorites[userId] || [];

  const templates = REPORT_TEMPLATES.map((template) => ({
    ...template,
    isFavorite: favorites.includes(template.id),
    generationCount: generatedReports.filter(r => r.templateId === template.id).length,
    lastGenerated: generatedReports
      .filter(r => r.templateId === template.id)
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))[0]?.generatedAt,
  }));

  res.json({ data: templates });
});

/**
 * @desc    Get recent generated reports
 * @route   GET /api/reports/recent
 * @access  Private
 */
const getRecentReports = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const reports = generatedReports
    .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
    .slice(0, parseInt(limit));

  res.json({ data: reports });
});

/**
 * @desc    Get scheduled reports
 * @route   GET /api/reports/scheduled
 * @access  Private
 */
const getScheduledReports = asyncHandler(async (req, res) => {
  res.json({ data: scheduledReports });
});

/**
 * @desc    Get report statistics
 * @route   GET /api/reports/stats
 * @access  Private
 */
const getReportStats = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const favorites = userFavorites[userId] || [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const reportsThisMonth = generatedReports.filter(
    r => new Date(r.generatedAt) >= monthStart
  ).length;

  const lastReport = generatedReports
    .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))[0];

  // Find most used template
  const templateCounts = {};
  generatedReports.forEach(r => {
    templateCounts[r.templateId] = (templateCounts[r.templateId] || 0) + 1;
  });

  const mostUsedTemplateId = Object.entries(templateCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  const mostUsedTemplate = REPORT_TEMPLATES.find(t => t.id === mostUsedTemplateId);

  res.json({
    data: {
      reportsGenerated: generatedReports.length,
      reportsThisMonth,
      scheduledReports: scheduledReports.filter(s => s.isActive).length,
      favoriteReports: favorites.length,
      lastReportGenerated: lastReport?.generatedAt,
      mostUsedTemplate: mostUsedTemplate?.name,
    },
  });
});

/**
 * @desc    Generate a report
 * @route   POST /api/reports/generate
 * @access  Private
 */
const generateReport = asyncHandler(async (req, res) => {
  const { templateId, format = 'pdf', dateRange } = req.body;
  const userId = req.user._id.toString();
  const userName = req.user.fullName || req.user.username;

  const template = REPORT_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    res.status(404);
    throw new Error('Report template not found');
  }

  // Calculate date range
  const range = dateRange || getDateRange('month');

  // Create report record
  const report = {
    id: `rpt-${Date.now()}`,
    templateId,
    templateName: template.name,
    category: template.category,
    dateRange: range,
    generatedAt: new Date().toISOString(),
    generatedBy: userName,
    status: 'ready',
    format,
    fileSize: Math.floor(Math.random() * 300000) + 100000,
    downloadUrl: `/api/reports/download/rpt-${Date.now()}`,
    expiresAt: new Date(Date.now() + 604800000).toISOString(), // 7 days
  };

  generatedReports.unshift(report);

  res.status(201).json({ data: report });
});

/**
 * @desc    Toggle template favorite status
 * @route   POST /api/reports/templates/:id/favorite
 * @access  Private
 */
const toggleFavorite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  if (!userFavorites[userId]) {
    userFavorites[userId] = [];
  }

  const index = userFavorites[userId].indexOf(id);
  if (index > -1) {
    userFavorites[userId].splice(index, 1);
  } else {
    userFavorites[userId].push(id);
  }

  res.json({ isFavorite: userFavorites[userId].includes(id) });
});

/**
 * @desc    Create scheduled report
 * @route   POST /api/reports/scheduled
 * @access  Private
 */
const createScheduledReport = asyncHandler(async (req, res) => {
  const { templateId, frequency, recipients, format = 'pdf' } = req.body;
  const userId = req.user._id.toString();
  const userName = req.user.fullName || req.user.username;

  const template = REPORT_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    res.status(404);
    throw new Error('Report template not found');
  }

  // Calculate next run time
  const now = new Date();
  let nextRun;
  switch (frequency) {
    case 'daily':
      nextRun = new Date(now.getTime() + 86400000);
      break;
    case 'weekly':
      nextRun = new Date(now.getTime() + 604800000);
      break;
    case 'monthly':
      nextRun = new Date(now);
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
    default:
      nextRun = new Date(now.getTime() + 604800000);
  }

  const schedule = {
    id: `sch-${Date.now()}`,
    templateId,
    templateName: template.name,
    frequency,
    nextRun: nextRun.toISOString(),
    recipients,
    format,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: userName,
  };

  scheduledReports.push(schedule);

  res.status(201).json({ data: schedule });
});

/**
 * @desc    Delete scheduled report
 * @route   DELETE /api/reports/scheduled/:id
 * @access  Private
 */
const deleteScheduledReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const index = scheduledReports.findIndex(s => s.id === id);
  if (index === -1) {
    res.status(404);
    throw new Error('Scheduled report not found');
  }

  scheduledReports.splice(index, 1);

  res.json({ message: 'Scheduled report deleted' });
});

/**
 * @desc    Get operational report data
 * @route   GET /api/reports/data/operational
 * @access  Private
 */
const getOperationalData = asyncHandler(async (req, res) => {
  const { timeRange = 'month' } = req.query;
  const { start, end } = getDateRange(timeRange);

  const [schedules, incidents] = await Promise.all([
    Schedule.find({
      startTime: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    }).lean(),
    Incident.find({
      createdAt: { $gte: start, $lte: end },
    }).lean(),
  ]);

  // Calculate shift metrics
  const totalShifts = schedules.length;
  const completedShifts = schedules.filter(s => s.status === 'completed').length;
  const activeShifts = schedules.filter(s => s.status === 'active').length;
  const cancelledShifts = schedules.filter(s => s.status === 'cancelled').length;

  // Calculate hours (assuming 8-hour shifts)
  const totalHours = completedShifts * 8;
  const overtimeHours = schedules.filter(s => s.overtime).reduce((sum, s) => sum + (s.overtimeHours || 0), 0);

  res.json({
    data: {
      period: { start, end },
      shifts: {
        totalShifts,
        completedShifts,
        activeShifts,
        cancelledShifts,
        completionRate: totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0,
        totalHours,
        overtimeHours,
      },
      patrols: {
        totalPatrols: Math.floor(schedules.length * 2),
        completedPatrols: Math.floor(schedules.length * 1.8),
        partialPatrols: Math.floor(schedules.length * 0.15),
        missedPatrols: Math.floor(schedules.length * 0.05),
        completionRate: 93.1,
        totalCheckpoints: schedules.length * 16,
        scannedCheckpoints: Math.floor(schedules.length * 15.5),
        checkpointAccuracy: 96.8,
      },
      incidents: {
        total: incidents.length,
      },
    },
  });
});

/**
 * @desc    Download report file
 * @route   GET /api/reports/download/:id
 * @access  Private
 */
const downloadReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = generatedReports.find(r => r.id === id);
  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  // In production, this would serve the actual file
  // For now, return a placeholder response
  res.json({
    message: 'Download started',
    report: {
      id: report.id,
      name: report.templateName,
      format: report.format,
    },
  });
});

module.exports = {
  getTemplates,
  getRecentReports,
  getScheduledReports,
  getReportStats,
  generateReport,
  toggleFavorite,
  createScheduledReport,
  deleteScheduledReport,
  getOperationalData,
  downloadReport,
};