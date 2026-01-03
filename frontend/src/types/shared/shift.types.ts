/**
 * Shift Entity Types
 *
 * Mirrors: backend/models/Shift.js
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
// Guard Reference (nullable for unassigned shifts)
// ============================================

export type ShiftGuardRef = (UserRef & {
  siaLicenceNumber?: string;
  phoneNumber?: string;
  email?: string;
}) | null;

// ============================================
// Core Shift Entity
// ============================================

/**
 * Shift entity as stored in database
 * guard and site are ObjectId references
 */
export interface ShiftBase {
  _id: string;
  guard: string | null;
  site: string;
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  status: ShiftStatus;
  tasks: ShiftTask[];
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shift with populated references
 */
export interface Shift {
  _id: string;
  guard: ShiftGuardRef;
  site: SiteRef & {
    address?: string;
    postCode?: string;
  };
  date: string;
  shiftType: ShiftType;
  status: ShiftStatus;
  tasks: ShiftTask[];
  notes?: string;
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
  guard: string | null;
  site: string;
  date: string;
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
  guardName: string | null;
  guardId: string | null;
  siteName: string;
  siteId: string | null;
  date: string;
  shiftType: ShiftType;
  status: ShiftStatus;
  tasksTotal: number;
  tasksCompleted: number;
  notes?: string;
}