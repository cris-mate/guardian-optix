/**
 * Site Entity Types
 *
 * Mirrors: backend/models/Site.js
 *
 * Sites are locations where security guards work and are linked to Clients.
 * Includes coverage requirements for scheduling.
 */

import type { Address, GeofenceConfig } from './common.types';

// ============================================
// Type Definitions
// ============================================

export type ShiftType = 'Morning' | 'Afternoon' | 'Night';

export type GuardType =
  | 'Static'
  | 'Mobile Patrol'
  | 'CCTV Operator'
  | 'Door Supervisor'
  | 'Close Protection';

// ============================================
// Requirements Sub-types
// ============================================

/**
 * Individual shift requirement within a site
 */
export interface ShiftRequirement {
  shiftType: ShiftType;
  guardsRequired: number;
  guardType: GuardType;
  requiredCertifications?: string[];
}

/**
 * Coverage requirements for a site
 * Defines contract period and staffing needs
 */
export interface SiteRequirements {
  contractStart: string; // ISO date string
  contractEnd: string | null; // null = ongoing
  isOngoing: boolean;
  shiftsPerDay: ShiftRequirement[];
  daysOfWeek: number[]; // 1=Mon, 2=Tue...7=Sun
}

/**
 * Form-friendly version of requirements
 */
export interface SiteRequirementsFormData {
  contractStart: string;
  contractEnd: string;
  isOngoing: boolean;
  shiftsPerDay: Array<{
    shiftType: ShiftType;
    guardsRequired: number;
    guardType: string;
    requiredCertifications: string[];
  }>;
  daysOfWeek: number[];
}

// ============================================
// Core Site Entity
// ============================================

/**
 * Site entity as stored in database
 */
export interface Site {
  _id: string;
  name: string;
  client: string; // ObjectId reference to Client
  address: Address;
  geofence?: GeofenceConfig;
  siteType?: string;
  status: 'active' | 'inactive';
  requirements?: SiteRequirements | null;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  specialInstructions?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;

  // Virtuals from backend
  fullAddress?: string;
  totalDailyGuards?: number;
  isContractActive?: boolean;
}

/**
 * Site with populated client reference
 */
export interface SitePopulated extends Omit<Site, 'client'> {
  client: {
    _id: string;
    companyName: string;
    tradingName?: string;
  };
}

// ============================================
// Reference Types
// ============================================

/**
 * Minimal site reference for populated fields
 */
export interface SiteRef {
  _id: string;
  name: string;
}

/**
 * Site reference with address info
 */
export interface SiteRefWithAddress extends SiteRef {
  address?: string;
  postCode?: string;
}

/**
 * Site reference with requirements summary
 */
export interface SiteRefWithRequirements extends SiteRef {
  requirements?: {
    isOngoing: boolean;
    contractStart: string;
    contractEnd: string | null;
    totalDailyGuards: number;
  };
}

// ============================================
// API Payloads
// ============================================

/**
 * Geofence input format
 */
export interface GeofenceInput {
  latitude: string;
  longitude: string;
  radius: string;
}

/**
 * Payload for creating a new site
 */
export interface CreateSitePayload {
  name: string;
  client: string;
  address: Omit<Address, 'coordinates'>;
  geofence?: Omit<GeofenceConfig, 'isEnabled'> & { isEnabled?: boolean };
  siteType?: string;
  status?: 'active' | 'inactive';
  requirements?: SiteRequirementsFormData | null;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  specialInstructions?: string;
}

/**
 * Payload for updating a site
 */
export interface UpdateSitePayload extends Partial<CreateSitePayload> {}

// ============================================
// List/Dropdown Types
// ============================================

/**
 * Site option for dropdowns/selects
 */
export interface SiteOption {
  _id: string;
  name: string;
  address?: string;
  postCode?: string;
  clientName?: string;
}

/**
 * Site option with requirements info for scheduling
 */
export interface SiteOptionWithRequirements extends SiteOption {
  requirements?: {
    shiftsPerDay: ShiftRequirement[];
    daysOfWeek: number[];
  };
  isContractActive?: boolean;
}

// ============================================
// Statistics Types
// ============================================

/**
 * Site statistics response
 */
export interface SiteStats {
  total: number;
  active: number;
  inactive: number;
  withActiveContracts: number;
  byType: Record<string, number>;
}

// ============================================
// Constants
// ============================================

/**
 * Available site types
 */
export const SITE_TYPES = [
  'Office',
  'Retail',
  'Industrial',
  'Residential',
  'Event Venue',
  'Construction',
  'Healthcare',
  'Education',
  'Government',
  'Other',
] as const;

export type SiteType = (typeof SITE_TYPES)[number];

/**
 * Shift times mapping (mirrors backend SHIFT_TIMES)
 */
export const SHIFT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  Morning: { start: '06:00', end: '14:00' },
  Afternoon: { start: '14:00', end: '22:00' },
  Night: { start: '22:00', end: '06:00' },
};

/**
 * Guard types for site requirements
 */
export const GUARD_TYPES: GuardType[] = [
  'Static',
  'Mobile Patrol',
  'CCTV Operator',
  'Door Supervisor',
  'Close Protection',
];

/**
 * Days of week mapping (ISO 8601: 1=Mon, 7=Sun)
 */
export const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 7, label: 'Sunday', short: 'Sun' },
] as const;