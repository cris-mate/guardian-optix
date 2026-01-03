/**
 * Guards Page Types
 *
 * UI-specific types for the Guards page.
 * Entity types imported from shared.
 */

// ============================================
// Import Shared Entity Types
// ============================================

import type {
  UserRole,
  GuardType,
  CertStatus,
  UserExtended,
  PaginationMeta,
} from '@/types/shared';

// ============================================
// Re-export for backward compatibility
// ============================================

export type { UserRole, GuardType };

// SIA Licence types (UI display)
export type LicenceStatus = CertStatus;

export type SIALicenceType =
  | 'Security Guard'
  | 'Door Supervisor'
  | 'Close Protection'
  | 'CCTV Operator';

// Operational status (computed, not in backend)
export type GuardsStatus =
  | 'on-duty'
  | 'off-duty'
  | 'on-break'
  | 'late'
  | 'absent'
  | 'scheduled';

// Guards requires status (always computed for display)
export interface Guards extends Omit<UserExtended, 'status'> {
  status: GuardsStatus;

  // Last completed/in-progress shift (from API)
  lastShift?: {
    date: string;
    siteName?: string;
    shiftType?: string;
  } | null;
}

// ============================================
// UI-Specific Types
// ============================================

/**
 * Guards list filters - UI state only
 */
export interface GuardsFilters {
  search: string;
  status: 'all' | GuardsStatus;
  role: 'all' | UserRole;
  guardType: 'all' | GuardType;
  availability: 'all' | 'available' | 'unavailable';
  licenceStatus: 'all' | LicenceStatus;
  sortBy: 'name' | 'status' | 'role' | 'lastActive' | 'licenceExpiry';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: GuardsFilters = {
  search: '',
  status: 'all',
  role: 'all',
  guardType: 'all',
  availability: 'all',
  licenceStatus: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  limit: 20,
};

/**
 * Pagination - use shared type
 */
export type Pagination = PaginationMeta;

/**
 * Guards summary statistics - UI computed
 */
export interface GuardsStats {
  total: number;
  onDuty: number;
  offDuty: number;
  onBreak: number;
  late: number;
  absent: number;
  scheduled: number;
  availableToday: number;
  unassignedThisWeek: number;
  expiringLicences: number;
}

/**
 * Default stats values
 */
export const DEFAULT_STATS: GuardsStats = {
  total: 0,
  onDuty: 0,
  offDuty: 0,
  onBreak: 0,
  late: 0,
  absent: 0,
  scheduled: 0,
  availableToday: 0,
  unassignedThisWeek: 0,
  expiringLicences: 0,
};

/**
 * Form data for adding/editing guards
 * Maps to CreateUserPayload
 */
export interface GuardsFormData {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  postCode: string;
  password?: string;
  role: "Guard";
  guardType?: GuardType;
  availability?: boolean;
  siaLicenceNumber?: string;
  siaLicenceType?: SIALicenceType;
  siaLicenceExpiry?: string;
}

// ============================================
// Component Props (Always Local)
// ============================================

export interface GuardsTableProps {
  guards: Guards[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onEdit: (guard: Guards) => void;
  selectedId?: string;
  filters: GuardsFilters;
  onFiltersChange: (filters: Partial<GuardsFilters>) => void;
}

export interface GuardsFiltersProps {
  filters: GuardsFilters;
  onFiltersChange: (filters: Partial<GuardsFilters>) => void;
  onReset: () => void;
}

export interface GuardsDetailsDrawerProps {
  guard: Guards | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (guard: Guards) => void;
  isLoading?: boolean;
}

export interface AddGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GuardsFormData) => Promise<void>;
  isSubmitting?: boolean;
}