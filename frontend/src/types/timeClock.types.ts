/**
 * TimeClock Types
 *
 * TypeScript interfaces for the TimeClock page.
 * Includes time entries, breaks, GPS data, and timesheet structures.
 */

// ============================================
// Core Types
// ============================================

export type ClockStatus = 'clocked-out' | 'clocked-in' | 'on-break';
export type BreakType = 'paid' | 'unpaid';
export type EntryType = 'clock-in' | 'clock-out' | 'break-start' | 'break-end';
export type TimesheetStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export type GeofenceStatus = 'inside' | 'outside' | 'unknown';

// ============================================
// GPS Location Interface
// ============================================

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number; // metres
  timestamp: string;
  address?: string;
}

// ============================================
// Geofence Interface
// ============================================

export interface Geofence {
  siteId: string;
  siteName: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // metres
}

// ============================================
// Time Entry Interface
// ============================================

export interface TimeEntry {
  _id: string;
  guardId: string;
  guardName: string;
  type: EntryType;
  timestamp: string;
  location?: GPSLocation;
  geofenceStatus: GeofenceStatus;
  siteId?: string;
  siteName?: string;
  notes?: string;
  isManualEntry?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

// ============================================
// Break Record Interface
// ============================================

export interface BreakRecord {
  _id: string;
  startTime: string;
  endTime?: string;
  breakType: BreakType;
  duration?: number; // minutes
  location?: GPSLocation;
}

// ============================================
// Active Shift Interface
// ============================================

export interface ActiveShift {
  _id: string;
  shiftId: string;
  guardId: string;
  guardName: string;
  badgeNumber?: string;
  site: {
    _id: string;
    name: string;
    address?: string;
    postCode?: string;
  };
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  clockStatus: ClockStatus;
  currentLocation?: GPSLocation;
  geofenceStatus: GeofenceStatus;
  breaks: BreakRecord[];
  totalBreakMinutes: number;
  totalWorkedMinutes: number;
}

// ============================================
// Today's Timesheet Interface
// ============================================

export interface TodayTimesheet {
  date: string;
  guardId: string;
  guardName: string;
  entries: TimeEntry[];
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakMinutes: number;
  status: TimesheetStatus;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

// ============================================
// Weekly Summary Interface
// ============================================

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  daysWorked: number;
  averageHoursPerDay: number;
}

// ============================================
// Statistics Interface
// ============================================

export interface TimeClockStats {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  overtimeThisWeek: number;
  breaksTaken: number;
  onTimeClockIns: number;
  lateClockIns: number;
  activeGuardsCount: number;
  guardsOnBreak: number;
  pendingApprovals: number;
}

// ============================================
// Active Guard (for Manager View)
// ============================================

export interface ActiveGuard {
  _id: string;
  guardId: string;
  fullName: string;
  badgeNumber?: string;
  profileImage?: string;
  clockStatus: ClockStatus;
  clockedInAt?: string;
  currentSite?: string;
  currentLocation?: GPSLocation;
  geofenceStatus: GeofenceStatus;
  hoursToday: number;
}

// ============================================
// Clock Action Payload
// ============================================

export interface ClockActionPayload {
  type: 'clock-in' | 'clock-out' | 'break-start' | 'break-end';
  location?: GPSLocation;
  siteId?: string;
  notes?: string;
  breakType?: BreakType;
}

// ============================================
// Filter & Pagination
// ============================================

export interface TimeClockFilters {
  dateRange: 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  guardId?: string;
  siteId?: string;
  status?: TimesheetStatus | 'all';
}

export interface TimeClockPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Component Props
// ============================================

export interface ClockWidgetProps {
  currentTime: Date;
  clockStatus: ClockStatus;
  activeShift: ActiveShift | null;
  isLoading: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  onBreakStart: (breakType: BreakType) => void;
  onBreakEnd: () => void;
}

export interface TimeEntriesTableProps {
  entries: TimeEntry[];
  isLoading: boolean;
  onEntryClick?: (entry: TimeEntry) => void;
}

export interface ActiveGuardsListProps {
  guards: ActiveGuard[];
  isLoading: boolean;
  onGuardClick?: (guard: ActiveGuard) => void;
}

export interface TimesheetPreviewProps {
  timesheet: TodayTimesheet | null;
  isLoading: boolean;
  onSubmit?: () => void;
}