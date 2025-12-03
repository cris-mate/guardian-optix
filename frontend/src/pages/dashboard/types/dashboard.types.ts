/**
 * Dashboard Types
 *
 * TypeScript interfaces for the operations dashboard.
 */

// ============================================
// Core Enums & Types
// ============================================

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'attendance' | 'incident' | 'compliance' | 'geofence' | 'system' | 'task';

// Note: Additional statuses for UI component compatibility
export type ShiftStatus = 'scheduled' | 'in-progress' | 'active' | 'upcoming' | 'completed' | 'cancelled' | 'no-show' | 'late';
export type GuardStatus = 'on-duty' | 'off-duty' | 'scheduled' | 'on-break' | 'break' | 'late' | 'absent';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
export type TaskFrequency = 'once' | 'hourly' | 'periodic';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'under-review' | 'resolved' | 'closed';

export type ActivityType =
  | 'clock-in'
  | 'clock-out'
  | 'break-start'
  | 'break-end'
  | 'checkpoint-scan'
  | 'incident-report'
  | 'task-completed'
  | 'geofence-violation'
  | 'shift-swap';

export type GeofenceStatus = 'inside' | 'outside' | 'unknown';
export type ActivitySeverity = 'critical' | 'warning' | 'info' | 'normal';

// ============================================
// Dashboard Metrics
// ============================================

export interface OperationalMetrics {
  activeGuards: number;
  totalScheduled: number;
  shiftsToday: number;
  shiftsCovered: number;
  attendanceRate: number;
  patrolCompletionRate: number;
  openIncidents: number;
  pendingTasks: number;
  geofenceViolations: number;
  complianceScore: number;
}

export interface MetricTrend {
  current: number;
  previous: number;
  changePercent: number;
  direction: 'up' | 'down' | 'stable';
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: MetricTrend;
  status: 'success' | 'warning' | 'danger' | 'neutral';
  icon?: string;
}

// ============================================
// Alerts & Notifications
// ============================================

export interface DashboardAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
  actionUrl?: string;
  relatedEntity?: {
    type: 'guard' | 'shift' | 'site' | 'incident';
    id: string;
    name: string;
  };
  isRead: boolean;
  isDismissed: boolean;
}

// ============================================
// Shift & Schedule Types
// ============================================

export interface ShiftSummary {
  id: string;
  guardId: string | null;
  guardName: string;
  siteName: string;
  siteId: string | null;
  role: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  shiftType: 'Morning' | 'Afternoon' | 'Night';
  tasksTotal: number;
  tasksCompleted: number;
  notes?: string;
}

export interface TodayScheduleOverview {
  totalShifts: number;
  activeShifts: number;
  completedShifts: number;
  scheduledShifts: number;
  cancelledShifts: number;
  upcomingShifts: number;
  noShows: number;
  lateArrivals: number;
  shifts: ShiftSummary[];
}

// ============================================
// Guard Status Types
// ============================================

export interface GuardStatusEntry {
  id: string;
  name: string;
  role: string;
  guardType?: string;
  status: GuardStatus;
  currentSite: string | null;
  shiftTime?: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  availability: boolean;
  lastActivity?: string;
  avatar?: string;
}

// ============================================
// Activity Feed Types
// ============================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  timestamp?: string;
}

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  guardId?: string;
  guardName: string;
  siteName: string | null;
  timestamp: string;
  location?: GeoLocation;
  geofenceStatus?: GeofenceStatus;
  notes?: string;
  // Additional fields used by LiveActivityFeed
  severity?: ActivitySeverity;
  description?: string;
}

// ============================================
// Task Types (embedded in Shifts)
// ============================================

export interface Task {
  id: string;
  shiftId: string;
  title?: string; // Optional title for display
  description: string;
  frequency: TaskFrequency;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo: {
    id: string;
    name: string;
  } | null;
  site: {
    id: string;
    name: string;
  } | null;
  completedAt?: string;
  completedBy?: string;
}

// ============================================
// Incident Types
// ============================================

export interface IncidentSummary {
  id: string;
  title: string;
  incidentType: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  description: string;
  reportedAt: string;
  reportedBy: {
    id: string;
    name: string;
  } | null;
}

// ============================================
// Quick Actions
// ============================================

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  colorScheme: string;
  description?: string;
  requiresPermission?: string;
}

// ============================================
// Dashboard State
// ============================================

export interface DashboardState {
  metrics: OperationalMetrics | null;
  alerts: DashboardAlert[];
  scheduleOverview: TodayScheduleOverview | null;
  guardStatuses: GuardStatusEntry[];
  activityFeed: ActivityEvent[];
  pendingTasks: Task[];
  recentIncidents: IncidentSummary[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ============================================
// API Response Types
// ============================================

export interface DashboardDataResponse {
  success: boolean;
  data: {
    metrics: OperationalMetrics;
    alerts: DashboardAlert[];
    scheduleOverview: TodayScheduleOverview;
    guardStatuses: GuardStatusEntry[];
    activityFeed: ActivityEvent[];
    pendingTasks: Task[];
    recentIncidents: IncidentSummary[];
  };
  timestamp: string;
}

// ============================================
// Component Props Types
// ============================================

export interface MetricCardProps {
  metric: DashboardMetric;
  onClick?: () => void;
}

export interface AlertsPanelProps {
  alerts: DashboardAlert[];
  onDismiss: (alertId: string) => void;
  onMarkRead: (alertId: string) => void;
  maxVisible?: number;
  showViewAll?: boolean;
}

export interface ActivityFeedProps {
  activities: ActivityEvent[];
  maxVisible?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export interface ShiftOverviewProps {
  overview: TodayScheduleOverview | null;
  onShiftClick?: (shift: ShiftSummary) => void;
  isLoading?: boolean;
}

export interface GuardStatusTableProps {
  guards: GuardStatusEntry[];
  onGuardClick?: (guard: GuardStatusEntry) => void;
  showFilters?: boolean;
  isLoading?: boolean;
}

export interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  showAll?: boolean;
  isLoading?: boolean;
}

// ============================================
// Constants & Configurations
// ============================================

export const ALERT_SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; icon: string }> = {
  critical: { label: 'Critical', color: 'red', icon: 'FiAlertTriangle' },
  warning: { label: 'Warning', color: 'orange', icon: 'FiAlertCircle' },
  info: { label: 'Info', color: 'blue', icon: 'FiInfo' },
};

export const ALERT_TYPE_CONFIG: Record<AlertType, { label: string; icon: string }> = {
  attendance: { label: 'Attendance', icon: 'FiClock' },
  incident: { label: 'Incident', icon: 'FiAlertCircle' },
  compliance: { label: 'Compliance', icon: 'FiShield' },
  geofence: { label: 'Geofence', icon: 'FiMapPin' },
  system: { label: 'System', icon: 'FiBell' },
  task: { label: 'Task', icon: 'FiCheckSquare' },
};

export const SHIFT_STATUS_CONFIG: Record<ShiftStatus, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'blue' },
  'in-progress': { label: 'In Progress', color: 'green' },
  active: { label: 'Active', color: 'green' },
  upcoming: { label: 'Upcoming', color: 'blue' },
  completed: { label: 'Completed', color: 'gray' },
  cancelled: { label: 'Cancelled', color: 'red' },
  'no-show': { label: 'No Show', color: 'red' },
  late: { label: 'Late', color: 'orange' },
};

export const GUARD_STATUS_CONFIG: Record<GuardStatus, { label: string; color: string }> = {
  'on-duty': { label: 'On Duty', color: 'green' },
  'off-duty': { label: 'Off Duty', color: 'gray' },
  scheduled: { label: 'Scheduled', color: 'blue' },
  'on-break': { label: 'On Break', color: 'yellow' },
  break: { label: 'On Break', color: 'yellow' },
  late: { label: 'Late', color: 'orange' },
  absent: { label: 'Absent', color: 'red' },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  high: { label: 'High', color: 'red' },
  medium: { label: 'Medium', color: 'orange' },
  low: { label: 'Low', color: 'gray' },
};

export const INCIDENT_SEVERITY_CONFIG: Record<IncidentSeverity, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'red' },
  high: { label: 'High', color: 'orange' },
  medium: { label: 'Medium', color: 'yellow' },
  low: { label: 'Low', color: 'gray' },
};

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { label: string; color: string; icon: string }> = {
  'clock-in': { label: 'Clock In', color: 'green', icon: 'FiLogIn' },
  'clock-out': { label: 'Clock Out', color: 'gray', icon: 'FiLogOut' },
  'break-start': { label: 'Break Start', color: 'yellow', icon: 'FiCoffee' },
  'break-end': { label: 'Break End', color: 'blue', icon: 'FiPlay' },
  'checkpoint-scan': { label: 'Checkpoint', color: 'purple', icon: 'FiMapPin' },
  'incident-report': { label: 'Incident', color: 'red', icon: 'FiAlertTriangle' },
  'task-completed': { label: 'Task Done', color: 'green', icon: 'FiCheckCircle' },
  'geofence-violation': { label: 'Geofence Alert', color: 'red', icon: 'FiAlertCircle' },
  'shift-swap': { label: 'Shift Swap', color: 'blue', icon: 'FiRefreshCw' },
};

export const REFRESH_INTERVALS = {
  metrics: 30000, // 30 seconds
  activity: 10000, // 10 seconds
  alerts: 15000, // 15 seconds
} as const;

export const DEFAULT_DASHBOARD_STATE: DashboardState = {
  metrics: null,
  alerts: [],
  scheduleOverview: null,
  guardStatuses: [],
  activityFeed: [],
  pendingTasks: [],
  recentIncidents: [],
  isLoading: true,
  error: null,
  lastUpdated: null,
};