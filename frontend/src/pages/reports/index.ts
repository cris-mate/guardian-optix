/**
 * Reports Page Module
 *
 * Enables clean imports throughout the application.
 *
 * @example
 * import Reports from '@/pages/reports';
 * import { useReportsData } from '@/pages/reports';
 */

// Main component
export { default } from './Reports';
export { default as Reports } from './Reports';

// Components
export { default as ReportQuickStats } from './components/ReportQuickStats';
export { default as ReportTemplates } from './components/ReportTemplates';
export { default as RecentReports } from './components/RecentReports';
export { default as ScheduledReports } from './components/ScheduledReports';

// Hooks
export { useReportsData } from './hooks/useReportsData';

// Types
export type {
  // Time & Filters
  TimeRange,
  ReportCategory,
  ExportFormat,
  ReportStatus,
  DateRange,
  ReportFilters,

  // Templates
  ReportTemplate,
  ScheduledReport,

  // Generated Reports
  GeneratedReport,

  // Operational Data
  ShiftSummary,
  PatrolSummary,
  SiteActivitySummary,
  OperationalReportData,

  // Attendance Data
  AttendanceSummary,
  OfficerAttendance,
  AttendanceReportData,

  // Incident Data
  IncidentSeverity,
  IncidentCategory,
  IncidentSummary,
  IncidentByCategory,
  IncidentBySeverity,
  IncidentBySite,
  IncidentReportData,

  // Client Data
  ClientServiceSummary,
  ClientReportData,

  // Compliance Data
  CertificationStatus,
  ComplianceOfficer,
  ComplianceReportData,

  // Quick Stats
  ReportQuickStats as ReportQuickStatsType,

  // API Response
  ReportsResponse,
} from './types/reports.types';

// Constants
export {
  TIME_RANGE_OPTIONS,
  REPORT_CATEGORY_CONFIG,
  EXPORT_FORMAT_CONFIG,
  INCIDENT_CATEGORY_LABELS,
  DEFAULT_FILTERS,
} from './types/reports.types';