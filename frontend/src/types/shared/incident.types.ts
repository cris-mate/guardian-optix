/**
 * Incident Entity Types
 *
 * Mirrors: backend/models/Incident.js
 */

import type {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from './common.types';
import type { UserRef } from './user.types';

// ============================================
// Core Incident Entity
// ============================================

/**
 * Incident entity as stored in database
 */
export interface IncidentBase {
  _id: string;
  reportedBy: string; // ObjectId
  location: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  description: string;
  witnesses: string[];
  evidenceUrls: string[];
  status: IncidentStatus;
  actionTaken?: string;
  resolvedBy?: string; // ObjectId
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Incident with populated references
 */
export interface Incident {
  _id: string;
  reportedBy: UserRef;
  location: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  description: string;
  witnesses?: string[];
  evidenceUrls?: string[];
  status: IncidentStatus;
  actionTaken?: string;
  resolvedBy?: UserRef;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// API Payloads
// ============================================

/**
 * Payload for creating a new incident
 */
export interface CreateIncidentPayload {
  location: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  description: string;
  witnesses?: string[];
  evidenceUrls?: string[];
}

/**
 * Payload for updating an incident
 */
export interface UpdateIncidentPayload {
  status?: IncidentStatus;
  actionTaken?: string;
  severity?: IncidentSeverity;
}

// ============================================
// Summary Types
// ============================================

/**
 * Lightweight incident summary for lists/dashboards
 */
export interface IncidentSummary {
  _id: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  description: string;
  reportedAt: string;
  reportedBy: UserRef | null;
}