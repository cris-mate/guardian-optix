/**
 * Performance Types
 *
 * TypeScript interfaces for security guard performance tracking.
 * Aligned with industry standards from TrackTik/Connecteam.
 */

// ============================================
// Time Range & Filters
// ============================================

export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'custom';

export type PerformanceCategory = 'patrol' | 'attendance' | 'incidents' | 'compliance';

export type TrendDirection = 'up' | 'down' | 'stable';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PerformanceFilters {
  timeRange: TimeRange;
  dateRange?: DateRange;
  guardId?: string;
  siteId?: string;
  category?: PerformanceCategory;
}

// ============================================
// Summary Metrics (Overview)
// ============================================

export interface OverviewMetrics {
  patrolCompletion: {
    rate: number;
    completed: number;
    scheduled: number;
    trend: TrendDirection;
    trendValue: number;
  };
  attendance: {
    rate: number;
    onTime: number;
    late: number;
    noShow: number;
    trend: TrendDirection;
    trendValue: number;
  };
  incidentResponse: {
    averageTime: number; // in minutes
    resolvedWithinSLA: number;
    total: number;
    trend: TrendDirection;
    trendValue: number;
  };
  checkpointScans: {
    completed: number;
    missed: number;
    rate: number;
    trend: TrendDirection;
    trendValue: number;
  };
  geofenceCompliance: {
    rate: number;
    violations: number;
    trend: TrendDirection;
    trendValue: number;
  };
  shiftCompletion: {
    rate: number;
    completed: number;
    early: number;
    incomplete: number;
  };
}

// ============================================
// Individual Guard Performance
// ============================================

export type PerformanceRating = 'excellent' | 'good' | 'average' | 'needs-improvement' | 'poor';

export interface GuardPerformance {
  guardId: string;
  guardName: string;
  profileImage?: string;
  badgeNumber?: string;
  guardType?: string;
  site?: string;

  // Overall Score (0-100)
  overallScore: number;
  rating: PerformanceRating;
  rank?: number;

  // Individual Metrics
  metrics: {
    patrolCompletion: number;
    attendanceRate: number;
    punctualityRate: number;
    incidentResponseAvg: number; // minutes
    checkpointAccuracy: number;
    geofenceCompliance: number;
    shiftCompletion: number;
    trainingCompletion: number;
  };

  // Trends
  trends: {
    overall: TrendDirection;
    value: number;
  };

  // Recent Activity Summary
  recentActivity: {
    shiftsCompleted: number;
    patrolsCompleted: number;
    incidentsHandled: number;
    lastActive: string;
  };
}

export interface GuardRanking {
  guardId: string;
  guardName: string;
  profileImage?: string;
  rank: number;
  previousRank?: number;
  overallScore: number;
  topMetric: {
    name: string;
    value: number;
  };
}

// ============================================
// Patrol Performance
// ============================================

export type PatrolStatus = 'completed' | 'in-progress' | 'missed' | 'partial';

export interface PatrolRecord {
  id: string;
  tourName: string;
  guardId: string;
  guardName: string;
  site: string;
  scheduledTime: string;
  startTime?: string;
  endTime?: string;
  status: PatrolStatus;
  checkpoints: {
    total: number;
    scanned: number;
    missed: number;
  };
  duration?: number; // minutes
  expectedDuration: number;
  exceptions: number;
  notes?: string;
}

export interface PatrolMetrics {
  summary: {
    totalTours: number;
    completed: number;
    partial: number;
    missed: number;
    completionRate: number;
  };
  checkpointStats: {
    totalScans: number;
    missedScans: number;
    avgScanTime: number; // seconds
    scanAccuracy: number;
  };
  byGuard: {
    guardId: string;
    guardName: string;
    tours: number;
    completed: number;
    rate: number;
  }[];
  bySite: {
    siteId: string;
    siteName: string;
    tours: number;
    completed: number;
    rate: number;
  }[];
  recentPatrols: PatrolRecord[];
}

// ============================================
// Attendance Performance
// ============================================

export type AttendanceStatus = 'on-time' | 'late' | 'early' | 'no-show' | 'excused';

export interface AttendanceRecord {
  id: string;
  guardId: string;
  guardName: string;
  site: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: AttendanceStatus;
  variance: number; // minutes (negative = early, positive = late)
  hoursWorked?: number;
  breaksTaken?: number;
  overtimeMinutes?: number;
  isGeofenceVerified: boolean;
}

export interface AttendanceMetrics {
  summary: {
    totalShifts: number;
    onTime: number;
    late: number;
    early: number;
    noShow: number;
    punctualityRate: number;
    attendanceRate: number;
  };
  lateArrivals: {
    count: number;
    avgMinutesLate: number;
    trend: TrendDirection;
  };
  earlyDepartures: {
    count: number;
    avgMinutesEarly: number;
  };
  byGuard: {
    guardId: string;
    guardName: string;
    shifts: number;
    onTime: number;
    late: number;
    noShow: number;
    punctualityRate: number;
  }[];
  recentRecords: AttendanceRecord[];
}

// ============================================
// Incident Response Performance
// ============================================

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IncidentResponseRecord {
  id: string;
  incidentId: string;
  guardId: string;
  guardName: string;
  site: string;
  severity: IncidentSeverity;
  reportedAt: string;
  respondedAt?: string;
  resolvedAt?: string;
  responseTime: number; // minutes
  resolutionTime?: number; // minutes
  metSLA: boolean;
  category: string;
}

export interface IncidentMetrics {
  summary: {
    totalIncidents: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    slaCompliance: number;
    resolvedWithinHour: number;
  };
  bySeverity: Record<IncidentSeverity, {
    count: number;
    avgResponseTime: number;
    slaCompliance: number;
  }>;
  byGuard: {
    guardId: string;
    guardName: string;
    incidents: number;
    avgResponseTime: number;
    slaCompliance: number;
  }[];
  recentIncidents: IncidentResponseRecord[];
}

// ============================================
// Performance Alerts & Exceptions
// ============================================

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface PerformanceAlert {
  id: string;
  type: 'attendance' | 'patrol' | 'geofence' | 'incident' | 'training';
  severity: AlertSeverity;
  title: string;
  message: string;
  guardId?: string;
  guardName?: string;
  site?: string;
  timestamp: string;
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
}

// ============================================
// API Response Types
// ============================================

export interface PerformanceResponse {
  overview: OverviewMetrics;
  guards: GuardPerformance[];
  rankings: GuardRanking[];
  patrols: PatrolMetrics;
  attendance: AttendanceMetrics;
  incidents: IncidentMetrics;
  alerts: PerformanceAlert[];
  lastUpdated: string;
}

// ============================================
// Constants & Configurations
// ============================================

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'custom', label: 'Custom Range' },
];

export const PERFORMANCE_THRESHOLDS = {
  excellent: 90,
  good: 75,
  average: 60,
  needsImprovement: 40,
} as const;

export const RATING_CONFIG: Record<PerformanceRating, { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: 'green' },
  good: { label: 'Good', color: 'blue' },
  average: { label: 'Average', color: 'yellow' },
  'needs-improvement': { label: 'Needs Improvement', color: 'orange' },
  poor: { label: 'Poor', color: 'red' },
};

export const PATROL_STATUS_CONFIG: Record<PatrolStatus, { label: string; color: string }> = {
  completed: { label: 'Completed', color: 'green' },
  'in-progress': { label: 'In Progress', color: 'blue' },
  partial: { label: 'Partial', color: 'yellow' },
  missed: { label: 'Missed', color: 'red' },
};

export const ATTENDANCE_STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string }> = {
  'on-time': { label: 'On Time', color: 'green' },
  late: { label: 'Late', color: 'orange' },
  early: { label: 'Early', color: 'blue' },
  'no-show': { label: 'No Show', color: 'red' },
  excused: { label: 'Excused', color: 'gray' },
};

export const DEFAULT_FILTERS: PerformanceFilters = {
  timeRange: 'week',
};