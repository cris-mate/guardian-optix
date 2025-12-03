/**
 * useReportsData Hook
 *
 * Custom hook for fetching and managing reports data.
 * Supports mock data for development and real API integration.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ReportFilters,
  ReportTemplate,
  GeneratedReport,
  ScheduledReport,
  ReportQuickStats,
  OperationalReportData,
  AttendanceReportData,
  IncidentReportData,
  ExportFormat,
  ReportCategory,
} from '../types/reports.types';

// Toggle for development - set to false when backend is ready
const USE_MOCK_DATA = true;

// ============================================
// Mock Data Generators
// ============================================

const generateMockTemplates = (): ReportTemplate[] => [
  {
    id: 'tpl-001',
    name: 'Weekly Operations Summary',
    description: 'Comprehensive overview of shift coverage, patrol completion, and site activity',
    category: 'operational',
    icon: 'LuBarChart3',
    color: 'blue',
    metrics: ['shifts', 'patrols', 'checkpoints', 'hours'],
    isCustom: false,
    isFavorite: true,
    lastGenerated: new Date(Date.now() - 86400000).toISOString(),
    generationCount: 24,
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
    isFavorite: true,
    lastGenerated: new Date(Date.now() - 172800000).toISOString(),
    generationCount: 18,
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
    isFavorite: false,
    lastGenerated: new Date(Date.now() - 604800000).toISOString(),
    generationCount: 12,
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
    isFavorite: false,
    lastGenerated: new Date(Date.now() - 259200000).toISOString(),
    generationCount: 8,
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
    isFavorite: true,
    lastGenerated: new Date(Date.now() - 432000000).toISOString(),
    generationCount: 15,
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
    isFavorite: false,
    generationCount: 6,
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
    isFavorite: true,
    lastGenerated: new Date(Date.now() - 2592000000).toISOString(),
    generationCount: 4,
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
    isFavorite: false,
    lastGenerated: new Date(Date.now() - 604800000).toISOString(),
    generationCount: 20,
  },
];

const generateMockRecentReports = (): GeneratedReport[] => [
  {
    id: 'rpt-001',
    templateId: 'tpl-001',
    templateName: 'Weekly Operations Summary',
    category: 'operational',
    dateRange: {
      start: new Date(Date.now() - 604800000),
      end: new Date(),
    },
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
    generatedBy: 'John Manager',
    status: 'ready',
    format: 'pdf',
    fileSize: 245000,
    downloadUrl: '/api/reports/download/rpt-001',
    expiresAt: new Date(Date.now() + 604800000).toISOString(),
  },
  {
    id: 'rpt-002',
    templateId: 'tpl-002',
    templateName: 'Attendance & Punctuality Report',
    category: 'attendance',
    dateRange: {
      start: new Date(Date.now() - 2592000000),
      end: new Date(),
    },
    generatedAt: new Date(Date.now() - 86400000).toISOString(),
    generatedBy: 'Sarah Admin',
    status: 'ready',
    format: 'xlsx',
    fileSize: 128000,
    downloadUrl: '/api/reports/download/rpt-002',
    expiresAt: new Date(Date.now() + 518400000).toISOString(),
  },
  {
    id: 'rpt-003',
    templateId: 'tpl-003',
    templateName: 'Incident Analysis Report',
    category: 'incidents',
    dateRange: {
      start: new Date(Date.now() - 2592000000),
      end: new Date(),
    },
    generatedAt: new Date(Date.now() - 172800000).toISOString(),
    generatedBy: 'John Manager',
    status: 'ready',
    format: 'pdf',
    fileSize: 312000,
    downloadUrl: '/api/reports/download/rpt-003',
    expiresAt: new Date(Date.now() + 432000000).toISOString(),
  },
  {
    id: 'rpt-004',
    templateId: 'tpl-005',
    templateName: 'Compliance Status Report',
    category: 'compliance',
    dateRange: {
      start: new Date(Date.now() - 604800000),
      end: new Date(),
    },
    generatedAt: new Date(Date.now() - 259200000).toISOString(),
    generatedBy: 'Sarah Admin',
    status: 'ready',
    format: 'pdf',
    fileSize: 198000,
    downloadUrl: '/api/reports/download/rpt-004',
  },
];

const generateMockScheduledReports = (): ScheduledReport[] => [
  {
    id: 'sch-001',
    templateId: 'tpl-001',
    templateName: 'Weekly Operations Summary',
    frequency: 'weekly',
    nextRun: new Date(Date.now() + 259200000).toISOString(),
    recipients: ['manager@guardianoptix.com', 'ops@guardianoptix.com'],
    format: 'pdf',
    isActive: true,
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    createdBy: 'John Manager',
  },
  {
    id: 'sch-002',
    templateId: 'tpl-005',
    templateName: 'Compliance Status Report',
    frequency: 'monthly',
    nextRun: new Date(Date.now() + 1728000000).toISOString(),
    recipients: ['compliance@guardianoptix.com'],
    format: 'pdf',
    isActive: true,
    createdAt: new Date(Date.now() - 5184000000).toISOString(),
    createdBy: 'Sarah Admin',
  },
  {
    id: 'sch-003',
    templateId: 'tpl-008',
    templateName: 'Timesheet Export',
    frequency: 'weekly',
    nextRun: new Date(Date.now() + 432000000).toISOString(),
    recipients: ['payroll@guardianoptix.com'],
    format: 'xlsx',
    isActive: true,
    createdAt: new Date(Date.now() - 7776000000).toISOString(),
    createdBy: 'Sarah Admin',
  },
];

const generateMockQuickStats = (): ReportQuickStats => ({
  reportsGenerated: 156,
  reportsThisMonth: 12,
  scheduledReports: 3,
  favoriteReports: 4,
  lastReportGenerated: new Date(Date.now() - 3600000).toISOString(),
  mostUsedTemplate: 'Weekly Operations Summary',
});

const generateMockOperationalData = (): OperationalReportData => ({
  period: {
    start: new Date(Date.now() - 604800000),
    end: new Date(),
  },
  shifts: {
    totalShifts: 124,
    completedShifts: 118,
    activeShifts: 4,
    cancelledShifts: 2,
    completionRate: 95.2,
    totalHours: 992,
    overtimeHours: 24,
  },
  patrols: {
    totalPatrols: 248,
    completedPatrols: 231,
    partialPatrols: 12,
    missedPatrols: 5,
    completionRate: 93.1,
    totalCheckpoints: 1984,
    scannedCheckpoints: 1921,
    checkpointAccuracy: 96.8,
  },
  siteActivity: [
    { siteId: 's1', siteName: 'Corporate HQ', clientName: 'Acme Corp', totalShifts: 42, totalPatrols: 84, totalIncidents: 2, guardHours: 336, complianceScore: 98 },
    { siteId: 's2', siteName: 'Warehouse District', clientName: 'Logistics Ltd', totalShifts: 28, totalPatrols: 56, totalIncidents: 4, guardHours: 224, complianceScore: 94 },
    { siteId: 's3', siteName: 'Tech Park', clientName: 'Tech Solutions', totalShifts: 21, totalPatrols: 42, totalIncidents: 1, guardHours: 168, complianceScore: 96 },
    { siteId: 's4', siteName: 'Mall Complex', clientName: 'Retail Group', totalShifts: 21, totalPatrols: 42, totalIncidents: 5, guardHours: 168, complianceScore: 91 },
    { siteId: 's5', siteName: 'Business Centre', clientName: 'Property Mgmt', totalShifts: 12, totalPatrols: 24, totalIncidents: 0, guardHours: 96, complianceScore: 100 },
  ],
  topPerformingSites: [],
  sitesNeedingAttention: [],
});

const generateMockAttendanceData = (): AttendanceReportData => ({
  period: {
    start: new Date(Date.now() - 2592000000),
    end: new Date(),
  },
  summary: {
    totalShifts: 480,
    attendanceRate: 97.5,
    punctualityRate: 92.3,
    onTimeArrivals: 443,
    lateArrivals: 25,
    noShows: 12,
    earlyDepartures: 8,
    avgLateMinutes: 11,
  },
  byOfficer: [
    { officerId: 'o1', officerName: 'James Wilson', badgeNumber: 'GO-1001', shiftsScheduled: 24, shiftsWorked: 24, hoursWorked: 192, overtimeHours: 4, punctualityRate: 100, lateCount: 0, noShowCount: 0 },
    { officerId: 'o2', officerName: 'Sarah Chen', badgeNumber: 'GO-1002', shiftsScheduled: 22, shiftsWorked: 22, hoursWorked: 176, overtimeHours: 8, punctualityRate: 95.5, lateCount: 1, noShowCount: 0 },
    { officerId: 'o3', officerName: 'Michael Brown', badgeNumber: 'GO-1003', shiftsScheduled: 20, shiftsWorked: 19, hoursWorked: 152, overtimeHours: 0, punctualityRate: 84.2, lateCount: 3, noShowCount: 1 },
    { officerId: 'o4', officerName: 'Emily Davis', badgeNumber: 'GO-1004', shiftsScheduled: 18, shiftsWorked: 18, hoursWorked: 144, overtimeHours: 2, punctualityRate: 88.9, lateCount: 2, noShowCount: 0 },
    { officerId: 'o5', officerName: 'Robert Taylor', badgeNumber: 'GO-1005', shiftsScheduled: 16, shiftsWorked: 15, hoursWorked: 120, overtimeHours: 0, punctualityRate: 75, lateCount: 4, noShowCount: 1 },
  ],
  dailyBreakdown: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
    scheduled: 16 + Math.floor(Math.random() * 4),
    attended: 15 + Math.floor(Math.random() * 4),
    late: Math.floor(Math.random() * 3),
    noShow: Math.random() > 0.7 ? 1 : 0,
  })),
  trends: {
    attendanceRate: [96.2, 97.1, 95.8, 98.0, 97.5, 96.9, 97.5],
    punctualityRate: [90.5, 91.2, 89.8, 93.2, 92.1, 91.8, 92.3],
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
  },
});

const generateMockIncidentData = (): IncidentReportData => ({
  period: {
    start: new Date(Date.now() - 2592000000),
    end: new Date(),
  },
  summary: {
    totalIncidents: 28,
    openIncidents: 3,
    resolvedIncidents: 25,
    avgResponseTime: 4.2,
    avgResolutionTime: 45,
    slaCompliance: 92.9,
  },
  byCategory: [
    { category: 'suspicious-activity', label: 'Suspicious Activity', count: 8, percentage: 28.6 },
    { category: 'trespassing', label: 'Trespassing', count: 6, percentage: 21.4 },
    { category: 'theft', label: 'Theft', count: 4, percentage: 14.3 },
    { category: 'vandalism', label: 'Vandalism', count: 4, percentage: 14.3 },
    { category: 'equipment-failure', label: 'Equipment Failure', count: 3, percentage: 10.7 },
    { category: 'other', label: 'Other', count: 3, percentage: 10.7 },
  ],
  bySeverity: [
    { severity: 'critical', count: 1, avgResponseTime: 2.1, slaCompliance: 100 },
    { severity: 'high', count: 5, avgResponseTime: 3.2, slaCompliance: 100 },
    { severity: 'medium', count: 12, avgResponseTime: 4.5, slaCompliance: 91.7 },
    { severity: 'low', count: 10, avgResponseTime: 5.8, slaCompliance: 90 },
  ],
  bySite: [
    { siteId: 's1', siteName: 'Corporate HQ', incidentCount: 5, criticalCount: 0, avgResponseTime: 3.8 },
    { siteId: 's2', siteName: 'Warehouse District', incidentCount: 8, criticalCount: 1, avgResponseTime: 4.1 },
    { siteId: 's3', siteName: 'Tech Park', incidentCount: 4, criticalCount: 0, avgResponseTime: 4.5 },
    { siteId: 's4', siteName: 'Mall Complex', incidentCount: 9, criticalCount: 0, avgResponseTime: 4.0 },
    { siteId: 's5', siteName: 'Business Centre', incidentCount: 2, criticalCount: 0, avgResponseTime: 5.2 },
  ],
  timeline: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 6) + 1,
    critical: Math.random() > 0.9 ? 1 : 0,
    high: Math.floor(Math.random() * 2),
    medium: Math.floor(Math.random() * 3),
    low: Math.floor(Math.random() * 2),
  })),
  recentIncidents: [
    { id: 'inc-1', title: 'Unauthorized vehicle in loading bay', severity: 'medium', site: 'Warehouse District', reportedAt: new Date(Date.now() - 7200000).toISOString(), status: 'resolved' },
    { id: 'inc-2', title: 'Fire alarm activation - false alarm', severity: 'high', site: 'Corporate HQ', reportedAt: new Date(Date.now() - 86400000).toISOString(), status: 'resolved' },
    { id: 'inc-3', title: 'Suspicious individual near entrance', severity: 'medium', site: 'Mall Complex', reportedAt: new Date(Date.now() - 172800000).toISOString(), status: 'open' },
  ],
});

// ============================================
// Hook State Interface
// ============================================

interface ReportsState {
  templates: ReportTemplate[];
  recentReports: GeneratedReport[];
  scheduledReports: ScheduledReport[];
  quickStats: ReportQuickStats | null;
  operationalData: OperationalReportData | null;
  attendanceData: AttendanceReportData | null;
  incidentData: IncidentReportData | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ============================================
// Hook Implementation
// ============================================

export const useReportsData = (initialFilters: ReportFilters = { timeRange: 'month' }) => {
  const [state, setState] = useState<ReportsState>({
    templates: [],
    recentReports: [],
    scheduledReports: [],
    quickStats: null,
    operationalData: null,
    attendanceData: null,
    incidentData: null,
    isLoading: true,
    isGenerating: false,
    error: null,
    lastUpdated: null,
  });

  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ReportCategory | 'all'>('all');

  // Fetch all reports data
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 800));

        setState({
          templates: generateMockTemplates(),
          recentReports: generateMockRecentReports(),
          scheduledReports: generateMockScheduledReports(),
          quickStats: generateMockQuickStats(),
          operationalData: generateMockOperationalData(),
          attendanceData: generateMockAttendanceData(),
          incidentData: generateMockIncidentData(),
          isLoading: false,
          isGenerating: false,
          error: null,
          lastUpdated: new Date(),
        });
      } else {
        const [templates, recent, scheduled, stats] = await Promise.all([
          fetch('/api/reports/templates').then(r => r.json()),
          fetch('/api/reports/recent').then(r => r.json()),
          fetch('/api/reports/scheduled').then(r => r.json()),
          fetch('/api/reports/stats').then(r => r.json()),
        ]);

        setState({
          templates: templates.data,
          recentReports: recent.data,
          scheduledReports: scheduled.data,
          quickStats: stats.data,
          operationalData: null,
          attendanceData: null,
          incidentData: null,
          isLoading: false,
          isGenerating: false,
          error: null,
          lastUpdated: new Date(),
        });
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load reports data',
      }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return state.templates;
    return state.templates.filter(t => t.category === activeCategory);
  }, [state.templates, activeCategory]);

  // Get favorite templates
  const favoriteTemplates = useMemo(() => {
    return state.templates.filter(t => t.isFavorite);
  }, [state.templates]);

  // Get selected template
  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return state.templates.find(t => t.id === selectedTemplateId) || null;
  }, [selectedTemplateId, state.templates]);

  // Generate report
  const generateReport = useCallback(async (
    templateId: string,
    format: ExportFormat = 'pdf',
    dateRange?: { start: Date; end: Date }
  ) => {
    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const template = state.templates.find(t => t.id === templateId);
        const newReport: GeneratedReport = {
          id: `rpt-${Date.now()}`,
          templateId,
          templateName: template?.name || 'Custom Report',
          category: template?.category || 'operational',
          dateRange: dateRange || {
            start: new Date(Date.now() - 604800000),
            end: new Date(),
          },
          generatedAt: new Date().toISOString(),
          generatedBy: 'Current User',
          status: 'ready',
          format,
          fileSize: Math.floor(Math.random() * 300000) + 100000,
          downloadUrl: `/api/reports/download/rpt-${Date.now()}`,
        };

        setState(prev => ({
          ...prev,
          recentReports: [newReport, ...prev.recentReports],
          isGenerating: false,
          quickStats: prev.quickStats ? {
            ...prev.quickStats,
            reportsGenerated: prev.quickStats.reportsGenerated + 1,
            reportsThisMonth: prev.quickStats.reportsThisMonth + 1,
            lastReportGenerated: new Date().toISOString(),
          } : null,
        }));

        return newReport;
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, format, dateRange }),
      });

      const data = await response.json();
      setState(prev => ({
        ...prev,
        recentReports: [data.report, ...prev.recentReports],
        isGenerating: false,
      }));

      return data.report;
    } catch (err) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: 'Failed to generate report',
      }));
      throw err;
    }
  }, [state.templates]);

  // Toggle favorite
  const toggleFavorite = useCallback((templateId: string) => {
    setState(prev => ({
      ...prev,
      templates: prev.templates.map(t =>
        t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
      ),
    }));
  }, []);

  // Delete scheduled report
  const deleteScheduledReport = useCallback((scheduleId: string) => {
    setState(prev => ({
      ...prev,
      scheduledReports: prev.scheduledReports.filter(s => s.id !== scheduleId),
    }));
  }, []);

  return {
    // Data
    templates: filteredTemplates,
    allTemplates: state.templates,
    favoriteTemplates,
    recentReports: state.recentReports,
    scheduledReports: state.scheduledReports,
    quickStats: state.quickStats,
    operationalData: state.operationalData,
    attendanceData: state.attendanceData,
    incidentData: state.incidentData,
    selectedTemplate,

    // State
    isLoading: state.isLoading,
    isGenerating: state.isGenerating,
    error: state.error,
    lastUpdated: state.lastUpdated,

    // Filters
    filters,
    setFilters,
    activeCategory,
    setActiveCategory,
    selectedTemplateId,
    setSelectedTemplateId,

    // Actions
    refetch: fetchData,
    generateReport,
    toggleFavorite,
    deleteScheduledReport,
  };
};

export default useReportsData;