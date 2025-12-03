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

// Components
export { default as ClockWidget } from './components/ClockWidget';
export { default as TimeEntriesTable } from './components/TimeEntriesTable';
export { default as ActiveGuardsList } from './components/ActiveGuardsList';
export { default as TimesheetSummary } from './components/TimesheetSummary';

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
} from './types/timeClock.types';

// Constants
export const CLOCK_STATUS_CONFIG = {
  'clocked-out': { label: 'Clocked Out', color: 'gray', bg: 'gray.100' },
  'clocked-in': { label: 'On Duty', color: 'green', bg: 'green.100' },
  'on-break': { label: 'On Break', color: 'orange', bg: 'orange.100' },
} as const;

export const ENTRY_TYPE_CONFIG = {
  'clock-in': { label: 'Clock In', color: 'green', icon: 'LuLogIn' },
  'clock-out': { label: 'Clock Out', color: 'red', icon: 'LuLogOut' },
  'break-start': { label: 'Break Start', color: 'orange', icon: 'LuCoffee' },
  'break-end': { label: 'Break End', color: 'blue', icon: 'LuPlay' },
} as const;

export const GEOFENCE_STATUS_CONFIG = {
  inside: { label: 'Verified', color: 'green', icon: 'LuCircleCheck' },
  outside: { label: 'Outside', color: 'red', icon: 'LuTriangleAlert' },
  unknown: { label: 'Unknown', color: 'gray', icon: 'LuMapPin' },
} as const;

export const TIMESHEET_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'gray' },
  submitted: { label: 'Submitted', color: 'blue' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
} as const;