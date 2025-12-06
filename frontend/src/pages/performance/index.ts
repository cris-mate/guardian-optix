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

  // Guard Performance
  PerformanceRating,
  GuardPerformance,
  GuardRanking,

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
} from '../../types/performance.types';

// Constants
export {
  TIME_RANGE_OPTIONS,
  PERFORMANCE_THRESHOLDS,
  RATING_CONFIG,
  PATROL_STATUS_CONFIG,
  ATTENDANCE_STATUS_CONFIG,
  DEFAULT_FILTERS,
} from '../../types/performance.types';