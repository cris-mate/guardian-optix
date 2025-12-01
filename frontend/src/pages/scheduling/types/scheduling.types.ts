/**
 * Scheduling Types
 *
 * TypeScript interfaces for the Scheduling page.
 * Includes Shift, ShiftTask, and related types.
 */

// ============================================
// Core Types
// ============================================

export type ShiftType = 'Morning' | 'Afternoon' | 'Night';
export type ShiftStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type TaskFrequency = 'once' | 'hourly' | 'periodic';
export type ViewMode = 'day' | 'week' | 'month';

// ============================================
// Shift Task Interface
// ============================================

export interface ShiftTask {
  _id: string;
  description: string;
  frequency: TaskFrequency;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

// ============================================
// Shift Interface
// ============================================

export interface Shift {
  _id: string;
  officer: {
    _id: string;
    fullName: string;
    badgeNumber?: string;
    phoneNumber?: string;
    profileImage?: string;
  };
  site: {
    _id: string;
    name: string;
    address?: string;
    postCode?: string;
  };
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  shiftType: ShiftType;
  tasks: ShiftTask[];
  notes?: string;
  status: ShiftStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Form Data Interfaces
// ============================================

export interface ShiftFormData {
  officerId: string;
  siteId: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  tasks: Omit<ShiftTask, '_id' | 'completed' | 'completedAt' | 'completedBy'>[];
  notes?: string;
}

export interface TaskFormData {
  description: string;
  frequency: TaskFrequency;
}

// ============================================
// Filter & Pagination
// ============================================

export interface SchedulingFilters {
  viewMode: ViewMode;
  selectedDate: string; // ISO date string
  officerId?: string;
  siteId?: string;
  shiftType?: ShiftType | 'all';
  status?: ShiftStatus | 'all';
}

export interface SchedulingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Statistics
// ============================================

export interface SchedulingStats {
  totalShifts: number;
  scheduledShifts: number;
  inProgressShifts: number;
  completedShifts: number;
  cancelledShifts: number;
  totalHoursScheduled: number;
  coveragePercentage: number;
}

// ============================================
// Available Resources (for dropdowns)
// ============================================

export interface AvailableOfficer {
  _id: string;
  fullName: string;
  badgeNumber?: string;
  guardType?: string;
  availability: boolean;
}

export interface AvailableSite {
  _id: string;
  name: string;
  address?: string;
  postCode?: string;
  clientName?: string;
}

// ============================================
// Calendar Helpers
// ============================================

export interface CalendarDay {
  date: string; // ISO date string
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
// Component Props
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
  availableOfficers: AvailableOfficer[];
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
  availableOfficers: AvailableOfficer[];
  availableSites: AvailableSite[];
  onFiltersChange: (filters: Partial<SchedulingFilters>) => void;
  onReset: () => void;
}