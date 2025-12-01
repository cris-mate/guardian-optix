/**
 * Guards Types
 *
 * TypeScript interfaces for the Guards page.
 * Aligned with the unified User model structure.
 */

// Guard specialisation types (matches User model)
export type GuardType = 'Static' | 'Dog Handler' | 'Close Protection' | 'Mobile Patrol';

// Manager specialisation types (matches User model)
export type ManagerType = 'Operations Manager' | 'Account Manager' | 'Business Support Manager';

// User roles (matches User model)
export type UserRole = 'Admin' | 'Manager' | 'Guard';

// Shift types
export type ShiftType = 'Morning' | 'Afternoon' | 'Night' | null;

// Guards status for filtering
export type GuardsStatus = 'active' | 'on-leave' | 'off-duty' | 'suspended';

// SIA Licence status
export type LicenceStatus = 'valid' | 'expiring-soon' | 'expired' | 'pending';

// SIA Licence types
export type SIALicenceType =
  | 'Security Guard'
  | 'Door Supervisor'
  | 'Close Protection'
  | 'CCTV Operator'
  | 'Key Holder';

/**
 * SIA Licence information
 */
export interface SIALicence {
  licenceNumber: string;
  licenceType: SIALicenceType;
  issueDate: string;
  expiryDate: string;
  status: LicenceStatus;
  verifiedAt?: string;
}

/**
 * Emergency contact details
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

/**
 * Guards/Officer interface
 * Extends the User model with operational fields
 */
export interface Guards {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  postCode: string;
  role: UserRole;
  guardType?: GuardType;
  managerType?: ManagerType;
  status: GuardsStatus;

  // Operational fields
  badgeNumber?: string;
  shift: ShiftType;
  availability: boolean;
  assignedTask?: string | null;
  assignedSite?: string | null;

  // Extended profile
  profileImage?: string;
  dateOfBirth?: string;
  startDate?: string;
  emergencyContact?: EmergencyContact;

  // Certifications
  siaLicence?: SIALicence;
  certifications?: string[];

  // Metadata
  createdAt: string;
  updatedAt?: string;
  lastActiveAt?: string;
}

/**
 * Guards list filters
 */
export interface GuardsFilters {
  search: string;
  status: 'all' | GuardsStatus;
  role: 'all' | UserRole;
  guardType: 'all' | GuardType;
  shift: 'all' | ShiftType;
  availability: 'all' | 'available' | 'unavailable';
  licenceStatus: 'all' | LicenceStatus;
  sortBy: 'name' | 'status' | 'role' | 'lastActive' | 'licenceExpiry';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

/**
 * Pagination metadata
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Guards summary statistics
 */
export interface GuardsStats {
  total: number;
  active: number;
  onLeave: number;
  offDuty: number;
  expiringLicences: number;
}

/**
 * Form data for adding/editing guards
 */
export interface GuardsFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  postCode: string;
  role: UserRole;
  guardType?: GuardType;
  managerType?: ManagerType;
  shift?: ShiftType;
  badgeNumber?: string;
  dateOfBirth?: string;
  startDate?: string;
  emergencyContact?: EmergencyContact;
  siaLicenceNumber?: string;
  siaLicenceType?: SIALicenceType;
  siaLicenceExpiry?: string;
}

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: GuardsFilters = {
  search: '',
  status: 'all',
  role: 'all',
  guardType: 'all',
  shift: 'all',
  availability: 'all',
  licenceStatus: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  limit: 20,
};