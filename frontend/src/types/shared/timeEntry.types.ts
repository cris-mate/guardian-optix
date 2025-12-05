/**
 * TimeEntry Entity Types
 *
 * Mirrors: backend/models/TimeEntry.js
 *
 * The backend exports three models:
 * - TimeEntry: Individual clock events
 * - Timesheet: Daily aggregation
 * - ActiveSession: Current clock state
 */

import type {
  EntryType,
  BreakType,
  GeofenceStatus,
  TimesheetStatus,
  GPSLocation,
} from './common.types';
import type { UserRef } from './user.types';
import type { SiteRef } from './site.types';

// ============================================
// Time Entry (Individual Events)
// ============================================

/**
 * Individual time clock entry
 * Mirrors backend TimeEntrySchema
 */
export interface TimeEntry {
  _id: string;
  officer: string | UserRef;
  site?: string | SiteRef;
  date: string; // YYYY-MM-DD
  type: EntryType;
  timestamp: string;
  location?: GPSLocation;
  geofenceStatus: GeofenceStatus;
  notes?: string;
  isManualEntry: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

/**
 * Time entry with populated references (API response)
 */
export interface TimeEntryPopulated {
  _id: string;
  officer: UserRef;
  site?: SiteRef;
  date: string;
  type: EntryType;
  timestamp: string;
  location?: GPSLocation;
  geofenceStatus: GeofenceStatus;
  notes?: string;
  isManualEntry: boolean;
  approvedBy?: UserRef;
  approvedAt?: string;
  createdAt: string;

  // Flattened for UI convenience
  officerId?: string;
  officerName?: string;
  siteId?: string;
  siteName?: string;
}

// ============================================
// Break Record
// ============================================

/**
 * Break period within a shift
 */
export interface BreakRecord {
  _id: string;
  startTime: string;
  endTime?: string;
  breakType: BreakType;
  duration?: number; // minutes
  location?: GPSLocation;
}

// ============================================
// Active Session
// ============================================

/**
 * Currently active clock session
 * Mirrors backend ActiveSessionSchema
 */
export interface ActiveSession {
  _id: string;
  officer: string | UserRef;
  shift?: string;
  site?: string | SiteRef;
  clockInTime: string;
  clockInLocation?: GPSLocation;
  currentBreak?: {
    startTime: string;
    breakType: BreakType;
  };
  breaks: BreakRecord[];
  lastKnownLocation?: GPSLocation;
  lastLocationUpdate?: string;
  geofenceStatus: GeofenceStatus;
}

// ============================================
// Timesheet (Daily Aggregation)
// ============================================

/**
 * Daily timesheet aggregation
 * Mirrors backend TimesheetSchema
 */
export interface Timesheet {
  _id: string;
  officer: string | UserRef;
  date: string;
  entries: TimeEntry[];
  breaks: BreakRecord[];
  totalMinutesWorked: number;
  totalBreakMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  status: TimesheetStatus;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;

  // Virtuals
  hoursWorked?: number;
  overtimeHours?: number;
}

/**
 * Today's timesheet for current user
 */
export interface TodayTimesheet {
  date: string;
  officerId: string;
  officerName: string;
  entries: TimeEntryPopulated[];
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
// Weekly Summary
// ============================================

/**
 * Weekly hours summary
 */
export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  daysWorked: number;
  avgHoursPerDay: number;
}

// ============================================
// API Payloads
// ============================================

/**
 * Payload for clock actions
 */
export interface ClockActionPayload {
  type: EntryType;
  location?: GPSLocation;
  siteId?: string;
  shiftId?: string;
  notes?: string;
}

/**
 * Payload for manual time entry
 */
export interface ManualEntryPayload {
  officerId: string;
  siteId?: string;
  date: string;
  type: EntryType;
  timestamp: string;
  notes?: string;
}