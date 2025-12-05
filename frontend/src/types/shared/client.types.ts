/**
 * Client Entity Types
 *
 * Mirrors: backend/models/Client.js
 */

import type { Address, ClientStatus } from './common.types';
import type { UserRef } from './user.types';

// ============================================
// Contact Subdocument
// ============================================

/**
 * Client contact person
 * Mirrors backend contactSchema
 */
export interface ClientContact {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle?: string;
  isPrimary: boolean;
}

// ============================================
// Core Client Entity
// ============================================

/**
 * Client entity as stored in database
 */
export interface Client {
  _id: string;
  companyName: string;
  tradingName?: string;
  status: ClientStatus;
  industry?: string;
  logoUrl?: string;
  address: Address;
  contacts: ClientContact[];
  sites: string[]; // ObjectId array
  notes?: string;
  createdBy?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;

  // Virtuals
  primaryContact?: ClientContact;
  totalSites?: number;
}

/**
 * Client with populated sites
 */
export interface ClientPopulated extends Omit<Client, 'sites'> {
  sites: Array<{
    _id: string;
    name: string;
    address: Address;
    status: 'active' | 'inactive';
  }>;
}

// ============================================
// Reference Types
// ============================================

/**
 * Minimal client reference
 */
export interface ClientRef {
  _id: string;
  companyName: string;
  tradingName?: string;
}

// ============================================
// API Payloads
// ============================================

/**
 * Payload for creating a new client
 */
export interface CreateClientPayload {
  companyName: string;
  tradingName?: string;
  status?: ClientStatus;
  industry?: string;
  address: Omit<Address, 'coordinates'>;
  contacts: Omit<ClientContact, '_id'>[];
  notes?: string;
}

/**
 * Payload for updating a client
 */
export interface UpdateClientPayload extends Partial<CreateClientPayload> {}

// ============================================
// Extended Types for UI
// ============================================

/**
 * Client with computed metrics for list display
 */
export interface ClientWithMetrics extends Client {
  activeSites: number;
  totalGuardsAssigned: number;
  incidentsThisMonth: number;
}