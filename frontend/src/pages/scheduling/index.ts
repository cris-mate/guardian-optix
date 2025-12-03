/**
 * Scheduling Page Module
 *
 * Enables clean imports throughout the application.
 *
 * @example
 * import Scheduling from '@/pages/scheduling';
 * import { useSchedulingData } from '@/pages/scheduling';
 * import { SHIFT_STATUS_CONFIG } from '@/pages/scheduling';
 */

// Main component
export { default } from './Scheduling';
export { default as Scheduling } from './Scheduling';

// Components
export { default as SchedulingToolbar } from './components/SchedulingToolbar';
export { default as CalendarView } from './components/CalendarView';
export { default as ShiftCard } from './components/ShiftCard';
export { default as ShiftDrawer } from './components/ShiftDrawer';
export { default as AddShiftModal } from './components/AddShiftModal';

// Hooks
export { useSchedulingData } from './hooks/useSchedulingData';

// Types
export type {
  // Core Types
  ViewMode,
  ShiftType,
  ShiftStatus,

  // Shift Types
  ShiftTask,
  Shift,
  ShiftFormData,

  // Filter Types
  SchedulingFilters,
  SchedulingPagination,

  // Stats Types
  SchedulingStats,

  // Reference Types
  AvailableOfficer,
  AvailableSite,

  // Calendar Types
  CalendarDay,
  CalendarWeek,

  // Component Props
  ShiftCardProps,
  ShiftDrawerProps,
  AddShiftModalProps,
  CalendarViewProps,
  SchedulingFiltersProps,
} from './types/scheduling.types';

// Constants
export const SHIFT_STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'blue', icon: 'LuCalendarDays' },
  'in-progress': { label: 'In Progress', color: 'orange', icon: 'LuClock' },
  completed: { label: 'Completed', color: 'green', icon: 'LuCheckCircle' },
  cancelled: { label: 'Cancelled', color: 'red', icon: 'LuXCircle' },
} as const;

export const SHIFT_TYPE_CONFIG = {
  Morning: { label: 'Morning', color: 'yellow', timeRange: '06:00 - 14:00' },
  Afternoon: { label: 'Afternoon', color: 'orange', timeRange: '14:00 - 22:00' },
  Night: { label: 'Night', color: 'purple', timeRange: '22:00 - 06:00' },
} as const;

export const VIEW_MODE_CONFIG = {
  day: { label: 'Day', icon: 'LuCalendar' },
  week: { label: 'Week', icon: 'LuCalendarDays' },
  month: { label: 'Month', icon: 'LuCalendarRange' },
} as const;

export const TASK_PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'gray' },
  medium: { label: 'Medium', color: 'blue' },
  high: { label: 'High', color: 'orange' },
  critical: { label: 'Critical', color: 'red' },
} as const;

export const DEFAULT_SCHEDULING_FILTERS = {
  viewMode: 'week' as const,
  selectedDate: new Date().toISOString().split('T')[0],
  shiftType: 'all' as const,
  status: 'all' as const,
};