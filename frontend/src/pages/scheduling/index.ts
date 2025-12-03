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