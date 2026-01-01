/**
 * Scheduling Page Module
 *
 * Enables clean imports throughout the application.
 *
 * @example
 * import Scheduling from '@/pages/scheduling';
 * import { useSchedulingData, useShiftCoverage, ShiftCoverageCard } from '@/pages/scheduling';
 */

// Main component
export { default } from './Scheduling';
export { default as Scheduling } from './Scheduling';

// Components
export { default as ShiftCoverageCard } from './components/ShiftCoverageCard';

// Hooks
export { useSchedulingData } from './hooks/useSchedulingData';
export { useShiftCoverage } from './hooks/useShiftCoverage';
export { useGenerateShifts } from './hooks/useGenerateShifts';

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
  AvailableGuard,
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
} from '../../types/scheduling.types';

// Types from useShiftCoverage
export type {
  ShiftCoverageStats,
  SiteNeedingCoverage,
  ActivityHubStats,
} from './hooks/useShiftCoverage';