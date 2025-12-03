/**
 * Dashboard Types for Guardian Optix
 *
 * Enhanced TypeScript interfaces including late arrivals and no-shows detection.
 */

// ============================================
// Constants
// ============================================

export const REFRESH_INTERVALS = {
  metrics: 30000,      // 30 seconds
  alerts: 15000,       // 15 seconds
  activity: 10000,     // 10 seconds
  guardStatus: 20000,  // 20 seconds
} as const;

export const DEFAULT_DASHBOARD_STATE = {
  metrics: {
    totalGuards: 0,
    activeGuards: 0,
    shiftsToday: 0,
    activeShifts: 0,
    completedShifts: 0,
    scheduledShifts: 0,
    cancelledShifts: 0,
    lateArrivals: 0,
    noShows: 0,
    openIncidents: 0,
    pendingTasks: 0,
    taskCompletionRate: 0,
    attendanceRate: 100,
  },
  alerts: [],
  activities: [],
  guardStatuses: [],
  tasks: [],
  isLoading: true,
  error: null,
} as const;

// ============================================
// Core Metrics
// ============================================

export interface DashboardMetrics {
  totalGuards: number;
  activeGuards: number;
  shiftsToday: number;
  activeShifts: number;
  completedShifts: number;
  scheduledShifts: number;
  cancelledShifts: number;
  lateArrivals: number;
  noShows: number;
  openIncidents: number;
  pendingTasks: number;
  taskCompletionRate: number;
  attendanceRate: number;
}

// ============================================
// Attendance Issues
// ============================================

export type AlertSeverity = 'critical' | 'high' | 'warning' | 'medium' | 'low' | 'info';

export interface LateArrival {
  shiftId: string;
  officerId: string;
  officerName: string;
  siteName: string;
  scheduledStart: string;
  actualClockIn: string;
  minutesLate: number;
  severity: 'high' | 'medium' | 'low';
}

export interface NoShow {
  shiftId: string;
  officerId: string;
  officerName: string;
  siteName: string;
  scheduledStart: string;
  scheduledEnd: string;
  shiftType: 'Morning' | 'Afternoon' | 'Night';
  minutesOverdue: number;
}

export interface AttendanceIssues {
  date: string;
  lateArrivals: {
    count: number;
    details: LateArrival[];
  };
  noShows: {
    count: number;
    details: NoShow[];
  };
}

// ============================================
// Alerts
// ============================================

export type AlertType = 'no-show' | 'late-arrival' | 'incident' | 'geofence' | 'certification' | 'system';

export interface DashboardAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isDismissed: boolean;

  // Optional type-specific fields
  shiftId?: string;
  officerId?: string;
  officerName?: string;
  siteName?: string;
  incidentId?: string;
  scheduledStart?: string;
  actualClockIn?: string;
  minutesLate?: number;
  minutesOverdue?: number;
}

export interface AlertsSummary {
  total: number;
  critical: number;
  high: number;
  warning: number;
}

// ============================================
// Guard Status
// ============================================

export type ClockStatus = 'clocked-in' | 'clocked-out' | 'on-break';
export type GeofenceStatus = 'inside' | 'outside' | 'unknown';

export interface GuardStatusEntry {
  id: string;
  name: string;
  username: string;
  phoneNumber?: string;
  availability: boolean;
  clockStatus: ClockStatus;
  currentSite: string | null;
  geofenceStatus: GeofenceStatus;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  currentShift?: {
    id: string;
    startTime: string;
    endTime: string;
    shiftType: string;
  };
  nextShift?: {
    id: string;
    startTime: string;
    endTime: string;
    siteName: string;
  };
}

export interface GuardStatusSummary {
  total: number;
  clockedIn: number;
  onBreak: number;
  clockedOut: number;
  available: number;
}

// ============================================
// Activity Feed
// ============================================

export type ActivityType = 'clock-action' | 'incident' | 'shift-status' | 'task-complete' | 'alert';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  action: string;
  actorId?: string;
  actorName: string;
  siteName?: string;
  description: string;
  timestamp: string;
  severity?: AlertSeverity;
  geofenceStatus?: GeofenceStatus;
}

// ============================================
// Tasks
// ============================================

export interface Task {
  taskId: string;
  shiftId: string;
  description: string;
  frequency: 'once' | 'hourly' | 'periodic';
  officerId?: string;
  officerName: string;
  siteName: string;
  shiftType: string;
  shiftStatus: string;
  completed?: boolean;
  completedAt?: string;
}

// ============================================
// Schedule Overview
// ============================================

export interface ScheduleOverview {
  date: string;
  totalShifts: number;
  shifts: ShiftSummary[];
  byShiftType: {
    morning: number;
    afternoon: number;
    night: number;
  };
}

export interface ShiftSummary {
  _id: string;
  officer: {
    _id: string;
    fullName: string;
    username: string;
  };
  site: {
    _id: string;
    name: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  tasks: Task[];
}

// ============================================
// Socket Events
// ============================================

export interface SocketClockAction {
  officerId: string;
  officerName: string;
  action: 'clock-in' | 'clock-out' | 'break-start' | 'break-end';
  siteId?: string;
  siteName: string;
  geofenceStatus: GeofenceStatus;
  timestamp: string;
}

export interface SocketShiftUpdate {
  shiftId: string;
  status: string;
  previousStatus?: string;
  officerId?: string;
  officerName?: string;
  siteName?: string;
  timestamp: string;
}

export interface SocketTaskComplete {
  shiftId: string;
  taskId: string;
  taskDescription: string;
  completedBy: string;
  completedByName: string;
  timestamp: string;
}

export interface SocketIncidentReport {
  incidentId: string;
  type: string;
  severity: AlertSeverity;
  location: string;
  reportedBy: string;
  reportedByName: string;
  timestamp: string;
}

export interface SocketGeofenceViolation {
  severity: 'critical';
  officerId: string;
  officerName: string;
  siteId?: string;
  siteName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  action: string;
  timestamp: string;
}

export interface SocketMetricsUpdate {
  metrics: DashboardMetrics;
  timestamp: string;
}

// ============================================
// API Response Types
// ============================================

export interface DashboardMetricsResponse {
  success: boolean;
  data: DashboardMetrics;
  timestamp: string;
}

export interface DashboardAlertsResponse {
  success: boolean;
  data: DashboardAlert[];
  summary: AlertsSummary;
}

export interface GuardStatusesResponse {
  success: boolean;
  data: GuardStatusEntry[];
  summary: GuardStatusSummary;
}

export interface ActivityFeedResponse {
  success: boolean;
  data: ActivityEvent[];
}

export interface PendingTasksResponse {
  success: boolean;
  data: Task[];
  count: number;
}

export interface AttendanceIssuesResponse {
  success: boolean;
  data: AttendanceIssues;
}