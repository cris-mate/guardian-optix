/**
 * Compliance Page Module
 *
 * Enables clean imports throughout the application.
 *
 * @example
 * import Compliance from '@/pages/compliance';
 * import { useComplianceData } from '@/pages/compliance';
 * import { CERT_STATUS_CONFIG } from '@/pages/compliance';
 */

// Main component
export { default } from './Compliance';
export { default as Compliance } from './Compliance';

// Components
export { default as ComplianceDashboard } from './components/ComplianceDashboard';
export { default as CertificationTracker } from './components/CertificationTracker';
export { default as IncidentReports } from './components/IncidentReports';
export { default as DocumentLibrary } from './components/DocumentLibrary';
export { default as AuditTrail } from './components/AuditTrail';

// Hooks
export { useComplianceData, useMockComplianceData } from './hooks/useComplianceData';

// Types
export type {
  // Certification Types
  CertType,
  CertStatus,
  Certification,

  // Incident Types
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  Incident,

  // Document Types
  DocumentCategory,
  ComplianceDocument,

  // Audit Types
  AuditAction,
  AuditTargetType,
  AuditEntry,

  // Metrics & Alerts
  ComplianceMetrics,
  AlertSeverity,
  ComplianceAlert,

  // Filter Types
  CertificationFilters,
  IncidentFilters,
  DocumentFilters,
} from './types/compliance.types';

// Constants
export {
  CERT_STATUS_CONFIG,
  INCIDENT_SEVERITY_CONFIG,
  INCIDENT_STATUS_CONFIG,
  DOCUMENT_CATEGORY_CONFIG,
} from './types/compliance.types';