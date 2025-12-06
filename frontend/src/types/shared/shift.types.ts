/**
 * Shift Entity Types
 *
 * Mirrors: backend/models/Shift.js
 *
 * Shifts include embedded Task subdocuments.
 */

import type {
  ShiftType,
  ShiftStatus,
  TaskFrequency,
  TaskPriority,
} from './common.types';
import type { UserRef } from './user.types';
import type { SiteRef } from './site.types';

// ============================================
// Task Subdocument
// ============================================

/**
 * Task embedded within a Shift
 * Mirrors: backend TaskSchema subdocument
 */
export interface ShiftTask {
  _id: string;
  title?: string;
  description: string;
  frequency: TaskFrequency;
  priority: TaskPriority;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

/**
 * Task creation payload (without generated fields)
 */
export interface ShiftTaskInput {
  title?: string;
  description: string;
  frequency: TaskFrequency;
  priority: TaskPriority;
}

// ============================================
// Core Shift Entity
// ============================================

/**
 * Shift entity as stored in database
 * guard and site are ObjectId references
 */
export interface ShiftBase {
  _id: string;
  guard: string;
  site: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  shiftType: ShiftType;
  tasks: ShiftTask[];
  notes?: string;
  status: ShiftStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shift with populated references
 * This is what the API returns after .populate()
 */
export interface Shift {
  _id: string;
  guard: UserRef & {
    badgeNumber?: string;
    phoneNumber?: string;
    profileImage?: string;
  };
  site: SiteRef & {
    address?: string;
    postCode?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  tasks: ShiftTask[];
  notes?: string;
  status: ShiftStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;

  // Virtuals from backend
  durationHours?: number;
  tasksCompleted?: number;
  tasksTotal?: number;
}

// ============================================
// API Payloads
// ============================================

/**
 * Payload for creating a new shift
 */
export interface CreateShiftPayload {
  guard: string; // ObjectId
  site: string; // ObjectId
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  tasks?: ShiftTaskInput[];
  notes?: string;
}

/**
 * Payload for updating a shift
 */
export interface UpdateShiftPayload extends Partial<CreateShiftPayload> {
  status?: ShiftStatus;
}

/**
 * Payload for completing a task within a shift
 */
export interface CompleteTaskPayload {
  shiftId: string;
  taskId: string;
  completed: boolean;
}

// ============================================
// Summary Types (for dashboards/lists)
// ============================================

/**
 * Lightweight shift summary for dashboard display
 */
export interface ShiftSummary {
  _id: string;
  guardName: string;
  guardId: string | null;
  siteName: string;
  siteId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  status: ShiftStatus;
  tasksTotal: number;
  tasksCompleted: number;
  notes?: string;
}