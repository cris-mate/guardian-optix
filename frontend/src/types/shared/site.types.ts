/**
 * Site Entity Types
 *
 * Mirrors: backend/models/Site.js
 *
 * Sites are locations where security officers work,
 * linked to Clients.
 */

import type { Address, GeofenceConfig } from './common.types';

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
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  specialInstructions?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
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

// ============================================
// API Payloads
// ============================================

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