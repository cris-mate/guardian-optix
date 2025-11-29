/**
 * Dashboard Page Module
 *
 * It enables clean imports throughout the application
 */
export { default } from './Dashboard';
export { default as Dashboard } from './Dashboard';

// Components
export { default as OperationalMetrics } from './components/OperationalMetrics';
export { default as QuickActions, QuickActionsCompact } from './components/QuickActions';
export { default as AlertsPanel } from './components/AlertsPanel';
export { default as LiveActivityFeed } from './components/LiveActivityFeed';
export { default as ShiftOverview } from './components/ShiftOverview';
export { default as GuardStatusTable } from './components/GuardStatusTable';
export { default as UpcomingTasks } from './components/UpcomingTasks';

// Hooks
export { useDashboardData, useMockDashboardData } from './hooks/useDashboardData';

// Types
export type {
  // Core Types
  AlertSeverity,
  ShiftStatus,
  GuardStatus,
  TaskPriority,
  TaskStatus,
  IncidentSeverity,
  ActivityType,

  // Data Types
  OperationalMetrics as OperationalMetricsData,
  MetricTrend,
  DashboardMetric,
  DashboardAlert,
  ShiftSummary,
  TodayScheduleOverview,
  GuardStatusEntry,
  ActivityEvent,
  Task,
  GeoLocation,
  GeofenceZone,
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