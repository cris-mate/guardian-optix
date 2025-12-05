/**
 * Certification Entity Types
 *
 * Mirrors: backend/models/Certification.js
 */

import type { CertType, CertStatus } from './common.types';
import type { UserRef } from './user.types';

// ============================================
// Core Certification Entity
// ============================================

/**
 * Certification entity as stored in database
 */
export interface CertificationBase {
  _id: string;
  userId: string; // ObjectId
  certType: CertType;
  certNumber: string;
  issueDate: string;
  expiryDate: string;
  status: CertStatus;
  documentUrl?: string;
  verifiedBy?: string; // ObjectId
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Certification with populated references
 */
export interface Certification {
  _id: string;
  userId: UserRef & { email: string };
  certType: CertType;
  certNumber: string;
  issueDate: string;
  expiryDate: string;
  status: CertStatus;
  documentUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// API Payloads
// ============================================

/**
 * Payload for creating a new certification
 */
export interface CreateCertificationPayload {
  userId: string;
  certType: CertType;
  certNumber: string;
  issueDate: string;
  expiryDate: string;
  documentUrl?: string;
}

/**
 * Payload for updating a certification
 */
export interface UpdateCertificationPayload {
  certNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  documentUrl?: string;
}

/**
 * Payload for verifying a certification
 */
export interface VerifyCertificationPayload {
  certificationId: string;
}