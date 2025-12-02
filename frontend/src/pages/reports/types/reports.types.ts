/**
 * Reports Types
 *
 * TypeScript interfaces for analytics reports and data exports.
 */

// ============================================
// Time Range & Filters
// ============================================

export type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export type ReportCategory = 'operational' | 'attendance' | 'incidents' | 'clients' | 'compliance';

export type ExportFormat = 'pdf' | 'csv' | 'xlsx';

export type ReportStatus = 'ready' | 'generating' | 'scheduled' | 'failed';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ReportFilters {
  timeRange: TimeRange;
  dateRange?: DateRange;
  category?: ReportCategory;
  siteIds?: string[];
  officerIds?: string[];
  clientIds?: string[];
}

// ============================================
// Report Templates
// ============================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  icon: string;
  color: string;
  metrics: string[];
  isCustom: boolean;
  isFavorite: boolean;
  lastGenerated?: string;
  generationCount: number;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  templateName: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRun: string;
  recipients: string[];
  format: ExportFormat;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

// ============================================
// Generated Reports
// ============================================

export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  category: ReportCategory;
  dateRange: DateRange;
  generatedAt: string;
  generatedBy: string;
  status: ReportStatus;
  format: ExportFormat;
  fileSize?: number;
  downloadUrl?: string;
  expiresAt?: string;
}

// ============================================
// Operational Report Data
// ============================================

export interface ShiftSummary {
  totalShifts: number;
  completedShifts: number;
  activeShifts: number;
  cancelledShifts: number;
  completionRate: number;
  totalHours: number;
  overtimeHours: number;
}

export interface PatrolSummary {
  totalPatrols: number;
  completedPatrols: number;
  partialPatrols: number;
  missedPatrols: number;
  completionRate: number;
  totalCheckpoints: number;
  scannedCheckpoints: number;
  checkpointAccuracy: number;
}

export interface SiteActivitySummary {
  siteId: string;
  siteName: string;
  clientName: string;
  totalShifts: number;
  totalPatrols: number;
  totalIncidents: number;
  guardHours: number;
  complianceScore: number;
}

export interface OperationalReportData {
  period: DateRange;
  shifts: ShiftSummary;
  patrols: PatrolSummary;
  siteActivity: SiteActivitySummary[];
  topPerformingSites: SiteActivitySummary[];
  sitesNeedingAttention: SiteActivitySummary[];
}

// ============================================
// Attendance Report Data
// ============================================

export interface AttendanceSummary {
  totalShifts: number;
  attendanceRate: number;
  punctualityRate: number;
  onTimeArrivals: number;
  lateArrivals: number;
  noShows: number;
  earlyDepartures: number;
  avgLateMinutes: number;
}

export interface OfficerAttendance {
  officerId: string;
  officerName: string;
  badgeNumber?: string;
  shiftsScheduled: number;
  shiftsWorked: number;
  hoursWorked: number;
  overtimeHours: number;
  punctualityRate: number;
  lateCount: number;
  noShowCount: number;
}

export interface AttendanceReportData {
  period: DateRange;
  summary: AttendanceSummary;
  byOfficer: OfficerAttendance[];
  dailyBreakdown: {
    date: string;
    scheduled: number;
    attended: number;
    late: number;
    noShow: number;
  }[];
  trends: {
    attendanceRate: number[];
    punctualityRate: number[];
    labels: string[];
  };
}

// ============================================
// Incident Report Data
// ============================================

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IncidentCategory =
  | 'security-breach'
  | 'theft'
  | 'vandalism'
  | 'trespassing'
  | 'suspicious-activity'
  | 'medical'
  | 'fire'
  | 'equipment-failure'
  | 'other';

export interface IncidentSummary {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  slaCompliance: number;
}

export interface IncidentByCategory {
  category: IncidentCategory;
  label: string;
  count: number;
  percentage: number;
}

export interface IncidentBySeverity {
  severity: IncidentSeverity;
  count: number;
  avgResponseTime: number;
  slaCompliance: number;
}

export interface IncidentBySite {
  siteId: string;
  siteName: string;
  incidentCount: number;
  criticalCount: number;
  avgResponseTime: number;
}

export interface IncidentReportData {
  period: DateRange;
  summary: IncidentSummary;
  byCategory: IncidentByCategory[];
  bySeverity: IncidentBySeverity[];
  bySite: IncidentBySite[];
  timeline: {
    date: string;
    count: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }[];
  recentIncidents: {
    id: string;
    title: string;
    severity: IncidentSeverity;
    site: string;
    reportedAt: string;
    status: string;
  }[];
}

// ============================================
// Client Report Data
// ============================================

export interface ClientServiceSummary {
  clientId: string;
  clientName: string;
  activeSites: number;
  totalShifts: number;
  shiftsCompleted: number;
  patrolCompletion: number;
  incidentCount: number;
  guardHours: number;
  complianceScore: number;
  lastActivityAt: string;
}

export interface ClientReportData {
  period: DateRange;
  totalClients: number;
  activeClients: number;
  totalSites: number;
  totalGuardHours: number;
  avgComplianceScore: number;
  clients: ClientServiceSummary[];
  topClients: ClientServiceSummary[];
}

// ============================================
// Compliance Report Data
// ============================================

export interface CertificationStatus {
  type: string;
  total: number;
  valid: number;
  expiringSoon: number;
  expired: number;
}

export interface ComplianceOfficer {
  officerId: string;
  officerName: string;
  badgeNumber?: string;
  siaLicenceStatus: 'valid' | 'expiring-soon' | 'expired';
  siaExpiryDate?: string;
  trainingCompletion: number;
  certifications: number;
  complianceScore: number;
}

export interface ComplianceReportData {
  period: DateRange;
  overallScore: number;
  siaCompliance: number;
  trainingCompliance: number;
  certificationStatus: CertificationStatus[];
  officerCompliance: ComplianceOfficer[];
  expiringCertifications: {
    officerId: string;
    officerName: string;
    certificationType: string;
    expiryDate: string;
    daysRemaining: number;
  }[];
  auditTrail: {
    id: string;
    action: string;
    performedBy: string;
    timestamp: string;
    details: string;
  }[];
}

// ============================================
// Quick Stats for Dashboard
// ============================================

export interface ReportQuickStats {
  reportsGenerated: number;
  reportsThisMonth: number;
  scheduledReports: number;
  favoriteReports: number;
  lastReportGenerated?: string;
  mostUsedTemplate?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ReportsResponse {
  templates: ReportTemplate[];
  recentReports: GeneratedReport[];
  scheduledReports: ScheduledReport[];
  quickStats: ReportQuickStats;
}

// ============================================
// Constants & Configurations
// ============================================

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export const REPORT_CATEGORY_CONFIG: Record<ReportCategory, { label: string; color: string; icon: string }> = {
  operational: { label: 'Operational', color: 'blue', icon: 'LuBarChart3' },
  attendance: { label: 'Attendance', color: 'green', icon: 'LuClock' },
  incidents: { label: 'Incidents', color: 'orange', icon: 'LuAlertTriangle' },
  clients: { label: 'Clients', color: 'purple', icon: 'LuBriefcase' },
  compliance: { label: 'Compliance', color: 'teal', icon: 'LuShield' },
};

export const EXPORT_FORMAT_CONFIG: Record<ExportFormat, { label: string; icon: string; mimeType: string }> = {
  pdf: { label: 'PDF', icon: 'LuFileText', mimeType: 'application/pdf' },
  csv: { label: 'CSV', icon: 'LuTable', mimeType: 'text/csv' },
  xlsx: { label: 'Excel', icon: 'LuSheet', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
};

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  'security-breach': 'Security Breach',
  'theft': 'Theft',
  'vandalism': 'Vandalism',
  'trespassing': 'Trespassing',
  'suspicious-activity': 'Suspicious Activity',
  'medical': 'Medical Emergency',
  'fire': 'Fire/Alarm',
  'equipment-failure': 'Equipment Failure',
  'other': 'Other',
};

export const DEFAULT_FILTERS: ReportFilters = {
  timeRange: 'month',
};