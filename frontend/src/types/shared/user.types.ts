/**
 * User Entity Types
 *
 * Mirrors: backend/models/User.js
 *
 * The User model is the single source for all personnel:
 * Admins, Managers, and Guards.
 */

import type {
  UserRole,
  ManagerType,
  GuardType,
  ShiftType,
} from './common.types';

// ============================================
// Core User Entity
// ============================================

/**
 * Base User entity - matches backend User schema exactly
 */
export interface User {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  postCode: string;
  role: UserRole;
  managerType?: ManagerType;
  guardType?: GuardType;
  availability: boolean;
  shiftTime?: ShiftType | null;
  createdAt: string;
}

// ============================================
// Populated Reference Types
// ============================================

/**
 * Minimal user reference for populated fields
 * Used when a document references a user
 */
export interface UserRef {
  _id: string;
  fullName: string;
}

/**
 * User reference with contact info
 * Used for incident reports, notifications
 */
export interface UserRefWithContact extends UserRef {
  email: string;
  phoneNumber?: string;
}

/**
 * User reference with role info
 * Used for activity logs, audit trails
 */
export interface UserRefWithRole extends UserRef {
  role: UserRole;
}

// ============================================
// Extended User (UI-enriched)
// ============================================

/**
 * Extended user with computed/UI fields
 * Used by Guards page for operational display
 */
export interface UserExtended extends User {
  // Operational status (computed from shifts/time entries)
  status?: 'on-duty' | 'off-duty' | 'on-break' | 'scheduled' | 'late' | 'absent';

  // Badge number (consider adding to backend User model)
  badgeNumber?: string;

  // // Profile
  // profileImage?: string;
  // dateOfBirth?: string;
  // startDate?: string;

  // Derived from Certification collection
  siaLicence?: {
    licenceNumber: string;
    licenceType: string;
    issueDate: string;
    expiryDate: string;
    status: 'valid' | 'expiring-soon' | 'expired';
  };

  // Certification names (from Certification collection)
  certifications?: string[];

  // Computed fields
  lastActiveAt?: string;
  assignedSite?: string;
  assignedTask?: string;
}

// ============================================
// API Payloads
// ============================================

/**
 * Payload for creating a new user
 */
export interface CreateUserPayload {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  postCode: string;
  password: string;
  role: UserRole;
  managerType?: ManagerType;
  guardType?: GuardType;
  availability?: boolean;
  shiftTime?: ShiftType | null;
}

/**
 * Payload for updating a user
 */
export interface UpdateUserPayload extends Partial<Omit<CreateUserPayload, 'password'>> {
  password?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Auth response after login
 */
export interface AuthResponse {
  token: string;
  user: User;
}