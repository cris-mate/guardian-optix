/**
 * Common Types & Enums
 *
 * Shared enums and utility types used across multiple entities.
 * Mirror backend schema enum values.
 */

// ============================================
// User & Role Enums
// ============================================

export type UserRole = 'Admin' | 'Manager' | 'Guard';

export type ManagerType =
  | 'Operations Manager'
  | 'Account Manager'
  | 'Business Support Manager';

export type GuardType =
  | 'Static'
  | 'Dog Handler'
  | 'Close Protection'
  | 'Mobile Patrol';

// ============================================
// Shift Enums
// ============================================

export type ShiftType = 'Morning' | 'Afternoon' | 'Night';

export type ShiftStatus = 'unassigned' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export type TaskFrequency = 'once' | 'hourly' | 'periodic';

export type TaskPriority = 'low' | 'medium' | 'high';

// ============================================
// Incident Enums
// ============================================

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 'open' | 'under-review' | 'resolved' | 'closed';

export type IncidentType =
  | 'security-breach'
  | 'theft'
  | 'vandalism'
  | 'trespassing'
  | 'suspicious-activity'
  | 'medical-emergency'
  | 'fire-alarm'
  | 'equipment-failure'
  | 'unauthorized-access'
  | 'property-damage'
  | 'assault'
  | 'other';

// ============================================
// Time Clock Enums
// ============================================

export type ClockStatus = 'clocked-out' | 'clocked-in' | 'on-break';

export type EntryType = 'clock-in' | 'clock-out' | 'break-start' | 'break-end';

export type BreakType = 'paid' | 'unpaid';

export type TimesheetStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export type GeofenceStatus = 'inside' | 'outside' | 'unknown';

// ============================================
// Certification Enums
// ============================================

export type CertType =
  | 'SIA License'
  | 'First Aid'
  | 'Fire Safety'
  | 'CCTV'
  | 'Door Supervisor'
  | 'Close Protection';

export type CertStatus = 'valid' | 'expiring-soon' | 'expired';

// ============================================
// Client Enums
// ============================================

export type ClientStatus = 'active' | 'inactive' | 'prospect';

// ============================================
// Common Structures
// ============================================

/**
 * Standard address structure used across Site, Client, etc.
 */
export interface Address {
  street: string;
  city: string;
  postCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * GPS location from device
 */
export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address?: string;
}

/**
 * Geofence configuration for sites
 */
export interface GeofenceConfig {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  isEnabled: boolean;
}

// ============================================
// API Response Wrappers
// ============================================

/**
 * Standard pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * API error response
 */
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}