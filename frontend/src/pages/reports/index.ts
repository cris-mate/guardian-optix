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
  ShiftStateSummary,
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
  IncidentStateSummary,
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

  // API Response
  ReportsResponse,
} from '../../types/reports.types';

// Constants
export {
  TIME_RANGE_OPTIONS,
  REPORT_CATEGORY_CONFIG,
  EXPORT_FORMAT_CONFIG,
  INCIDENT_CATEGORY_LABELS,
  DEFAULT_FILTERS,
} from '../../types/reports.types';