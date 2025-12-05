/**
 * Shared Types - Barrel Export
 *
 * Central export point for all shared entity types.
 * Import from '@/types/shared' for clean access.
 *
 * @example
 * import { User, Shift, ShiftStatus, ApiResponse } from '@/types/shared';
 */

// ============================================
// Common Types & Enums
// ============================================

export type {
  // User & Role Enums
  UserRole,
  ManagerType,
  GuardType,

  // Shift Enums
  ShiftType,
  ShiftStatus,
  TaskFrequency,
  TaskPriority,

  // Incident Enums
  IncidentSeverity,
  IncidentStatus,
  IncidentType,

  // Time Clock Enums
  ClockStatus,
  EntryType,
  BreakType,
  TimesheetStatus,
  GeofenceStatus,

  // Certification Enums
  CertType,
  CertStatus,

  // Client Enums
  ClientStatus,

  // Common Structures
  Address,
  GPSLocation,
  GeofenceConfig,

  // API Response Types
  PaginationMeta,
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from './common.types';

// ============================================
// User Types
// ============================================

export type {
  User,
  UserRef,
  UserRefWithContact,
  UserRefWithRole,
  UserExtended,
  CreateUserPayload,
  UpdateUserPayload,
  LoginCredentials,
  AuthResponse,
} from './user.types';

// ============================================
// Shift Types
// ============================================

export type {
  ShiftTask,
  ShiftTaskInput,
  ShiftBase,
  Shift,
  CreateShiftPayload,
  UpdateShiftPayload,
  CompleteTaskPayload,
  ShiftSummary,
} from './shift.types';

// ============================================
// Site Types
// ============================================

export type {
  Site,
  SitePopulated,
  SiteRef,
  SiteRefWithAddress,
  CreateSitePayload,
  UpdateSitePayload,
  SiteOption,
} from './site.types';

// ============================================
// Incident Types
// ============================================

export type {
  IncidentBase,
  Incident,
  CreateIncidentPayload,
  UpdateIncidentPayload,
  IncidentSummary,
} from './incident.types';

// ============================================
// Time Entry Types
// ============================================

export type {
  TimeEntry,
  TimeEntryPopulated,
  BreakRecord,
  ActiveSession,
  Timesheet,
  TodayTimesheet,
  WeeklySummary,
  ClockActionPayload,
  ManualEntryPayload,
} from './timeEntry.types';

// ============================================
// Certification Types
// ============================================

export type {
  CertificationBase,
  Certification,
  CreateCertificationPayload,
  UpdateCertificationPayload,
  VerifyCertificationPayload,
} from './certification.types';

// ============================================
// Client Types
// ============================================

export type {
  ClientContact,
  Client,
  ClientPopulated,
  ClientRef,
  CreateClientPayload,
  UpdateClientPayload,
  ClientWithMetrics,
} from './client.types';