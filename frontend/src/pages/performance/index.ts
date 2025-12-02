/**
 * Performance Page Module
 *
 * Enables clean imports throughout the application.
 *
 * @example
 * import Performance from '@/pages/performance';
 * import { usePerformanceData } from '@/pages/performance';
 */

// Main component
export { default } from './Performance';
export { default as Performance } from './Performance';

// Components
export { default as PerformanceOverview } from './components/PerformanceOverview';
export { default as OfficerRankings } from './components/OfficerRankings';
export { default as PatrolPerformance } from './components/PatrolPerformance';
export { default as AttendancePerformance } from './components/AttendancePerformance';
export { default as PerformanceAlerts } from './components/PerformanceAlerts';

// Hooks
export { usePerformanceData } from './hooks/usePerformanceData';

// Types
export type {
  // Time & Filters
  TimeRange,
  PerformanceCategory,
  TrendDirection,
  DateRange,
  PerformanceFilters,

  // Overview Metrics
  OverviewMetrics,

  // Officer Performance
  PerformanceRating,
  OfficerPerformance,
  OfficerRanking,

  // Patrol Performance
  PatrolStatus,
  PatrolRecord,
  PatrolMetrics,

  // Attendance Performance
  AttendanceStatus,
  AttendanceRecord,
  AttendanceMetrics,

  // Incident Response
  IncidentSeverity,
  IncidentResponseRecord,
  IncidentMetrics,

  // Alerts
  AlertSeverity,
  PerformanceAlert,

  // API Response
  PerformanceResponse,
} from './types/performance.types';

// Constants
export {
  TIME_RANGE_OPTIONS,
  PERFORMANCE_THRESHOLDS,
  RATING_CONFIG,
  PATROL_STATUS_CONFIG,
  ATTENDANCE_STATUS_CONFIG,
  DEFAULT_FILTERS,
} from './types/performance.types';