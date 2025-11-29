// Dashboard Type Definitions for Guardian Optix

// ============================================
// Core Enums
// ============================================

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type ShiftStatus = 'active' | 'upcoming' | 'completed' | 'no-show' | 'late';
export type GuardStatus = 'on-duty' | 'off-duty' | 'break' | 'late' | 'absent';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ActivityType =
  | 'clock-in'
  | 'clock-out'
  | 'checkpoint-scan'
  | 'incident-report'
  | 'task-completed'
  | 'geofence-violation'
  | 'break-start'
  | 'break-end'
  | 'shift-swap';

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
  type: 'attendance' | 'incident' | 'compliance' | 'geofence' | 'system' | 'task';
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date | string;
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
// Shift & Schedule
// ============================================

export interface ShiftSummary {
  id: string;
  guardId: string;
  guardName: string;
  siteName: string;
  siteId: string;
  role: string;
  startTime: Date | string;
  endTime: Date | string;
  status: ShiftStatus;
  clockInTime?: Date | string;
  clockOutTime?: Date | string;
  checkpointsCompleted: number;
  checkpointsTotal: number;
  location?: GeoLocation;
}

export interface TodayScheduleOverview {
  totalShifts: number;
  activeShifts: number;
  upcomingShifts: number;
  completedShifts: number;
  noShows: number;
  lateArrivals: number;
  shifts: ShiftSummary[];
}

// ============================================
// Guard/Personnel Status
// ============================================

export interface GuardStatusEntry {
  id: string;
  name: string;
  role: string;
  status: GuardStatus;
  currentSite?: string;
  currentShift?: {
    id: string;
    startTime: Date | string;
    endTime: Date | string;
  };
  lastActivity?: {
    type: ActivityType;
    timestamp: Date | string;
    description: string;
  };
  location?: GeoLocation;
  contactInfo?: {
    phone: string;
    email: string;
  };
  avatar?: string;
}

// ============================================
// Activity Feed
// ============================================

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  timestamp: Date | string;
  guardId?: string;
  guardName?: string;
  siteId?: string;
  siteName?: string;
  description: string;
  metadata?: Record<string, unknown>;
  severity?: 'normal' | 'warning' | 'critical';
}

// ============================================
// Tasks
// ============================================

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | string;
  assignedTo?: {
    id: string;
    name: string;
  };
  site?: {
    id: string;
    name: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt?: Date | string;
  category?: string;
}

// ============================================
// Geolocation
// ============================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date | string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'permitted' | 'restricted';
  coordinates: GeoLocation[];
  radius?: number; // for circular zones
  siteId: string;
}

// ============================================
// Incidents (Summary for Dashboard)
// ============================================

export interface IncidentSummary {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: 'open' | 'under-review' | 'resolved' | 'closed';
  reportedAt: Date | string;
  reportedBy: {
    id: string;
    name: string;
  };
  site: {
    id: string;
    name: string;
  };
  category: string;
}

// ============================================
// Quick Actions
// ============================================

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  color?: string;
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
// Component Props
// ============================================

export interface MetricCardProps {
  metric: DashboardMetric;
  onClick?: () => void;
}

export interface AlertsPanelProps {
  alerts: DashboardAlert[];
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
  maxVisible?: number;
}

export interface ActivityFeedProps {
  activities: ActivityEvent[];
  maxVisible?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export interface ShiftOverviewProps {
  overview: TodayScheduleOverview;
  onShiftClick?: (shift: ShiftSummary) => void;
}

export interface GuardStatusTableProps {
  guards: GuardStatusEntry[];
  onGuardClick?: (guard: GuardStatusEntry) => void;
  showFilters?: boolean;
}

export interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  showAll?: boolean;
}