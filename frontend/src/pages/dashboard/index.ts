/**
 * Dashboard Page Module
 *
 * Enables clean imports throughout the application.
 *
 * @example
 * import Dashboard from '@/pages/dashboard';
 * import { useDashboardData } from '@/pages/dashboard';
 * import { GUARD_STATUS_CONFIG } from '@/pages/dashboard';
 */

// Main component
export { default } from './Dashboard';
export { default as Dashboard } from './Dashboard';

// Hooks
export { useDashboardData, useMockDashboardData } from './hooks/useDashboardData';

// Types
export type {
  // Core Types
  AlertSeverity,
  AlertType,
  ShiftStatus,
  GuardStatus,
  TaskPriority,
  TaskStatus,
  TaskFrequency,
  IncidentSeverity,
  IncidentStatus,
  ActivityType,
  ActivitySeverity,
  GeofenceStatus,

  // Data Types
  MetricTrend,
  DashboardMetric,
  DashboardAlert,
  ShiftSummary,
  TodayScheduleOverview,
  GuardStatusEntry,
  GeoLocation,
  ActivityEvent,
  Task,
  IncidentSummary,
  QuickAction,

  // State Types
  DashboardState,
  DashboardDataResponse,

  // Component Props
  MetricCardProps,
  AlertsPanelProps,
  ActivityFeedProps,
  ShiftOverviewProps,
  GuardStatusTableProps,
  TaskListProps,
} from './types/dashboard.types';

// Constants
export {
  ALERT_SEVERITY_CONFIG,
  ALERT_TYPE_CONFIG,
  SHIFT_STATUS_CONFIG,
  GUARD_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  INCIDENT_SEVERITY_CONFIG,
  ACTIVITY_TYPE_CONFIG,
  REFRESH_INTERVALS,
  DEFAULT_DASHBOARD_STATE,
} from './types/dashboard.types';