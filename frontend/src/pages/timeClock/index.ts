/**
 * TimeClock Page Module
 *
 * Enables clean imports throughout the application.
 *
 * @example
 * import TimeClock from '@/pages/timeClock';
 * import { useTimeClockData } from '@/pages/timeClock';
 * import { CLOCK_STATUS_CONFIG } from '@/pages/timeClock';
 */

// Main component
export { default } from './TimeClock';

// Hooks
export { useTimeClockData } from './hooks/useTimeClockData';

// Types
export type {
  // Status Types
  ClockStatus,
  BreakType,
  GeofenceStatus,
  TimesheetStatus,
  EntryType,

  // Location Types
  GPSLocation,

  // Time Entry Types
  TimeEntry,
  BreakRecord,

  // Shift Types
  ActiveShift,

  // Timesheet Types
  TodayTimesheet,
  WeeklySummary,

  // Statistics
  TimeClockStats,

  // Team Types
  ActiveGuard,

  // Action Types
  ClockActionPayload,

  // Filter Types
  TimeClockFilters,
  TimeClockPagination,

  // Component Props
  ClockWidgetProps,
  TimeEntriesTableProps,
} from '../../types/timeClock.types';