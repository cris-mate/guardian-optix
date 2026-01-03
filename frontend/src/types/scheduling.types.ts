/**
 * Scheduling Page Types
 *
 * UI-specific types for the Scheduling page.
 * Entity types imported from shared.
 */

// ============================================
// Import Shared Entity Types
// ============================================

import type {
  ShiftType,
  ShiftStatus,
  TaskFrequency,
  TaskPriority,
  Shift,
  ShiftTask,
  PaginationMeta,
} from '@/types/shared';

// ============================================
// Re-export for backward compatibility
// ============================================

export type {
  ShiftType,
  ShiftStatus,
  TaskFrequency,
  TaskPriority,
  Shift,
  ShiftTask,
};

// ============================================
// UI-Specific Types (Stay Local)
// ============================================

export type ViewMode = 'day' | 'week' | 'month';

/**
 * Form data for creating shifts
 * Maps to CreateShiftPayload
 */
export interface ShiftFormData {
  guardId: string;
  siteId: string;
  date: string;
  shiftType: ShiftType;
  tasks: TaskFormData[];
  notes?: string;
}

/**
 * Task form data
 */
export interface TaskFormData {
  title?: string;
  description: string;
  frequency: TaskFrequency;
  priority: TaskPriority;
}

/**
 * Scheduling page filters - UI state
 */
export interface SchedulingFilters {
  viewMode: ViewMode;
  selectedDate: string;
  guardId?: string;
  siteId?: string;
  shiftType?: ShiftType | 'all';
  status?: ShiftStatus | 'all';
}

/**
 * Pagination - use shared type
 */
export type SchedulingPagination = PaginationMeta;

/**
 * Statistics for scheduling overview
 */
export interface SchedulingStats {
  totalShifts: number;
  unassignedShifts: number;
  scheduledShifts: number;
  inProgressShifts: number;
  completedShifts: number;
  cancelledShifts: number;
  totalHoursScheduled: number;
  coveragePercentage: number;
}

/**
 * Available guard for dropdowns
 */
export interface AvailableGuard {
  _id: string;
  fullName: string;
  siaLicenceNumber?: string;
  guardType?: string;
  availability: boolean;
}

/**
 * Available site for dropdowns
 */
export interface AvailableSite {
  _id: string;
  name: string;
  address?: string;
  postCode?: string;
  clientName?: string;
}

// ============================================
// Calendar Types (UI-specific)
// ============================================

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  shifts: Shift[];
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

// ============================================
// Component Props (Always Local)
// ============================================

export interface ShiftCardProps {
  shift: Shift;
  isCompact?: boolean;
  onClick?: (shift: Shift) => void;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shiftId: string) => void;
}

export interface ShiftDrawerProps {
  shift: Shift | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (shift: Shift) => void;
  onTaskComplete?: (shiftId: string, taskId: string, completed: boolean) => void;
  isLoading?: boolean;
}

export interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftFormData) => Promise<void>;
  availableGuards: AvailableGuard[];
  availableSites: AvailableSite[];
  selectedDate?: string;
  isSubmitting?: boolean;
}

export interface CalendarViewProps {
  shifts: Shift[];
  viewMode: ViewMode;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onShiftClick: (shift: Shift) => void;
  isLoading?: boolean;
}

export interface SchedulingFiltersProps {
  filters: SchedulingFilters;
  stats: SchedulingStats;
  availableGuards: AvailableGuard[];
  availableSites: AvailableSite[];
  onFiltersChange: (filters: Partial<SchedulingFilters>) => void;
  onReset: () => void;
}