/**
 * Compliance Types
 *
 * TypeScript interfaces for the Compliance module.
 */

// ============================================
// Certification Types
// ============================================

export type CertType =
  | 'SIA License'
  | 'First Aid'
  | 'Fire Safety'
  | 'CCTV'
  | 'Door Supervisor'
  | 'Close Protection';

export type CertStatus = 'valid' | 'expiring-soon' | 'expired';

export interface Certification {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  certType: CertType;
  certNumber: string;
  issueDate: string;
  expiryDate: string;
  status: CertStatus;
  documentUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

// ============================================
// Incident Types
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

export interface Incident {
  _id: string;
  reportedBy: {
    _id: string;
    fullName: string;
  };
  location: string;
  incidentType: string;
  severity: IncidentSeverity;
  description: string;
  status: IncidentStatus;
  witnesses?: string[];
  actionTaken?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: {
    _id: string;
    fullName: string;
  };
}

// ============================================
// Document Types
// ============================================

export type DocumentCategory =
  | 'policies'
  | 'procedures'
  | 'training'
  | 'health-safety'
  | 'contracts'
  | 'templates'
  | 'other';

export interface ComplianceDocument {
  _id: string;
  name: string;
  category: DocumentCategory;
  description?: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;
  uploadedBy: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt?: string;
  version?: string;
  tags?: string[];
}

// ============================================
// Audit Types
// ============================================

export type AuditAction =
  | 'document-uploaded'
  | 'document-updated'
  | 'document-viewed'
  | 'document-signed'
  | 'document-deleted'
  | 'cert-uploaded'
  | 'cert-updated'
  | 'cert-deleted'
  | 'cert-verified'
  | 'incident-reported'
  | 'incident-updated'
  | 'incident-verified'
;

export type AuditTargetType = 'Certification' | 'Incident' | 'Document';

export interface AuditEntry {
  _id: string;
  action: AuditAction | string;
  performedBy: {
    _id: string;
    fullName: string;
  };
  targetId: string;
  targetType: AuditTargetType | string;
  details: string;
  timestamp: string;
}

// ============================================
// Metrics & Alerts
// ============================================

export interface ComplianceMetrics {
  validCertifications: number;
  certsExpiringSoon: number;
  expiredCerts: number;
  openIncidents: number;
  complianceRate: number;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface ComplianceAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  date: string;
}

// ============================================
// Filter Types
// ============================================

export interface CertificationFilters {
  status: CertStatus | 'all';
  certType?: CertType;
  search?: string;
}

export interface IncidentFilters {
  status: IncidentStatus | 'all';
  severity?: IncidentSeverity;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface DocumentFilters {
  category: DocumentCategory | 'all';
  search?: string;
}

// ============================================
// Configuration Constants
// ============================================

export const CERT_STATUS_CONFIG: Record<
  CertStatus,
  { label: string; colorPalette: string }
> = {
  valid: { label: 'Valid', colorPalette: 'green' },
  'expiring-soon': { label: 'Expiring Soon', colorPalette: 'orange' },
  expired: { label: 'Expired', colorPalette: 'red' },
};

export const INCIDENT_SEVERITY_CONFIG: Record<
  IncidentSeverity,
  { label: string; colorPalette: string }
> = {
  low: { label: 'Low', colorPalette: 'gray' },
  medium: { label: 'Medium', colorPalette: 'blue' },
  high: { label: 'High', colorPalette: 'orange' },
  critical: { label: 'Critical', colorPalette: 'red' },
};

export const INCIDENT_STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; colorPalette: string }
> = {
  open: { label: 'Open', colorPalette: 'red' },
  'under-review': { label: 'Under Review', colorPalette: 'orange' },
  resolved: { label: 'Resolved', colorPalette: 'green' },
  closed: { label: 'Closed', colorPalette: 'gray' },
};

export const DOCUMENT_CATEGORY_CONFIG: Record<
  DocumentCategory,
  { label: string; colorPalette: string }
> = {
  policies: { label: 'Policies', colorPalette: 'blue' },
  procedures: { label: 'Procedures', colorPalette: 'purple' },
  training: { label: 'Training', colorPalette: 'green' },
  'health-safety': { label: 'Health & Safety', colorPalette: 'red' },
  contracts: { label: 'Contracts', colorPalette: 'orange' },
  templates: { label: 'Templates', colorPalette: 'teal' },
  other: { label: 'Other', colorPalette: 'gray' },
};