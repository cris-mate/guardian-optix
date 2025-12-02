/**
 * useComplianceData Hook
 *
 * Manages compliance data fetching with mock data fallback.
 * Provides certifications, incidents, documents, and metrics.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../utils/api';
import type {
  ComplianceMetrics,
  ComplianceAlert,
  Certification,
  Incident,
  ComplianceDocument,
  AuditEntry,
} from '../types/compliance.types';

// ============================================
// Configuration
// ============================================

const USE_MOCK_DATA = true; // Toggle for development

// ============================================
// Mock Data
// ============================================

const MOCK_CERTIFICATIONS: Certification[] = [
  {
    _id: 'cert-001',
    userId: { _id: 'user-001', fullName: 'James Wilson', email: 'j.wilson@guardian.com' },
    certType: 'SIA License',
    certNumber: 'SIA-2024-001234',
    issueDate: '2023-01-15',
    expiryDate: '2026-01-15',
    status: 'valid',
  },
  {
    _id: 'cert-002',
    userId: { _id: 'user-002', fullName: 'Sarah Chen', email: 's.chen@guardian.com' },
    certType: 'First Aid',
    certNumber: 'FA-2023-005678',
    issueDate: '2023-06-01',
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'expiring-soon',
  },
  {
    _id: 'cert-003',
    userId: { _id: 'user-003', fullName: 'Michael Brown', email: 'm.brown@guardian.com' },
    certType: 'Door Supervisor',
    certNumber: 'DS-2021-009012',
    issueDate: '2021-03-20',
    expiryDate: '2024-03-20',
    status: 'expired',
  },
  {
    _id: 'cert-004',
    userId: { _id: 'user-004', fullName: 'Emma Davis', email: 'e.davis@guardian.com' },
    certType: 'CCTV',
    certNumber: 'CCTV-2024-003456',
    issueDate: '2024-02-01',
    expiryDate: '2027-02-01',
    status: 'valid',
  },
  {
    _id: 'cert-005',
    userId: { _id: 'user-005', fullName: 'Robert Taylor', email: 'r.taylor@guardian.com' },
    certType: 'Close Protection',
    certNumber: 'CP-2023-007890',
    issueDate: '2023-09-15',
    expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'expiring-soon',
  },
];

const MOCK_INCIDENTS: Incident[] = [
  {
    _id: 'inc-001',
    reportedBy: { _id: 'user-001', fullName: 'James Wilson' },
    location: 'Westfield Shopping Centre - North Entrance',
    incidentType: 'security-breach',
    severity: 'high',
    description: 'Unauthorized individual attempted to access restricted area. Escorted off premises.',
    status: 'under-review',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'inc-002',
    reportedBy: { _id: 'user-002', fullName: 'Sarah Chen' },
    location: 'Tech Park Building A - Lobby',
    incidentType: 'theft',
    severity: 'medium',
    description: 'Laptop reported stolen from reception desk. CCTV footage being reviewed.',
    status: 'open',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'inc-003',
    reportedBy: { _id: 'user-003', fullName: 'Michael Brown' },
    location: 'Financial District - Tower 3',
    incidentType: 'medical-emergency',
    severity: 'critical',
    description: 'Employee collapsed in lobby. Ambulance called, first aid administered.',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'inc-004',
    reportedBy: { _id: 'user-004', fullName: 'Emma Davis' },
    location: 'Retail Park - Car Park B',
    incidentType: 'vandalism',
    severity: 'low',
    description: 'Graffiti discovered on external wall. Maintenance team notified for cleanup.',
    status: 'closed',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_DOCUMENTS: ComplianceDocument[] = [
  {
    _id: 'doc-001',
    name: 'Employee Handbook 2024',
    category: 'policies',
    description: 'Company policies, procedures, and employee guidelines',
    fileType: 'pdf',
    fileSize: 2500000,
    uploadedBy: { _id: 'admin', fullName: 'System Admin' },
    createdAt: '2024-01-15T10:00:00Z',
    version: '2.1',
  },
  {
    _id: 'doc-002',
    name: 'Health & Safety Guidelines',
    category: 'health-safety',
    description: 'Workplace health and safety requirements and procedures',
    fileType: 'pdf',
    fileSize: 1800000,
    uploadedBy: { _id: 'admin', fullName: 'System Admin' },
    createdAt: '2024-02-01T09:30:00Z',
    version: '1.5',
  },
  {
    _id: 'doc-003',
    name: 'SIA Licence Requirements',
    category: 'training',
    description: 'SIA licensing requirements, renewal process, and compliance',
    fileType: 'pdf',
    fileSize: 950000,
    uploadedBy: { _id: 'admin', fullName: 'System Admin' },
    createdAt: '2024-01-20T14:00:00Z',
    version: '3.0',
  },
  {
    _id: 'doc-004',
    name: 'Incident Reporting Procedures',
    category: 'procedures',
    description: 'Step-by-step guide for incident documentation and reporting',
    fileType: 'pdf',
    fileSize: 1200000,
    uploadedBy: { _id: 'admin', fullName: 'System Admin' },
    createdAt: '2024-03-01T11:00:00Z',
    version: '1.2',
  },
];

const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  {
    _id: 'audit-001',
    action: 'cert-uploaded',
    performedBy: { _id: 'admin', fullName: 'System Admin' },
    targetId: 'cert-001',
    targetType: 'Certification',
    details: 'Added SIA License for James Wilson',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'audit-002',
    action: 'incident-reported',
    performedBy: { _id: 'user-001', fullName: 'James Wilson' },
    targetId: 'inc-001',
    targetType: 'Incident',
    details: 'Reported security-breach at Westfield Shopping Centre',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'audit-003',
    action: 'document-uploaded',
    performedBy: { _id: 'admin', fullName: 'System Admin' },
    targetId: 'doc-001',
    targetType: 'Document',
    details: 'Uploaded Employee Handbook 2024',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// Helper Functions
// ============================================

const generateAlerts = (
  certs: Certification[],
  incidents: Incident[]
): ComplianceAlert[] => {
  const alerts: ComplianceAlert[] = [];

  const expiringSoon = certs.filter((c) => c.status === 'expiring-soon');
  const expired = certs.filter((c) => c.status === 'expired');

  if (expired.length > 0) {
    alerts.push({
      id: 'alert-expired',
      severity: 'critical',
      message: `${expired.length} certification(s) have expired and require immediate renewal`,
      date: new Date().toISOString(),
    });
  }

  if (expiringSoon.length > 0) {
    alerts.push({
      id: 'alert-expiring',
      severity: 'warning',
      message: `${expiringSoon.length} certification(s) expiring within 30 days`,
      date: new Date().toISOString(),
    });
  }

  const criticalIncidents = incidents.filter(
    (i) => i.severity === 'critical' && i.status === 'open'
  );
  if (criticalIncidents.length > 0) {
    alerts.push({
      id: 'alert-critical',
      severity: 'critical',
      message: `${criticalIncidents.length} critical incident(s) require attention`,
      date: new Date().toISOString(),
    });
  }

  const openIncidents = incidents.filter((i) => i.status === 'open');
  if (openIncidents.length > 3) {
    alerts.push({
      id: 'alert-open',
      severity: 'warning',
      message: `${openIncidents.length} open incidents pending review`,
      date: new Date().toISOString(),
    });
  }

  return alerts.sort((a, b) =>
    a.severity === 'critical' ? -1 : b.severity === 'critical' ? 1 : 0
  );
};

const calculateMetrics = (
  certs: Certification[],
  incidents: Incident[]
): ComplianceMetrics => {
  const validCerts = certs.filter((c) => c.status === 'valid').length;
  const expiringSoon = certs.filter((c) => c.status === 'expiring-soon').length;
  const expired = certs.filter((c) => c.status === 'expired').length;
  const openIncidents = incidents.filter(
    (i) => i.status === 'open' || i.status === 'under-review'
  ).length;

  const totalCerts = validCerts + expiringSoon + expired;
  const complianceRate = totalCerts
    ? Math.round((validCerts / totalCerts) * 100)
    : 100;

  return {
    validCertifications: validCerts,
    certsExpiringSoon: expiringSoon,
    expiredCerts: expired,
    openIncidents,
    complianceRate,
  };
};

// ============================================
// Hook Interface
// ============================================

interface UseComplianceDataReturn {
  // Data
  metrics: ComplianceMetrics;
  alerts: ComplianceAlert[];
  certifications: Certification[];
  incidents: Incident[];
  documents: ComplianceDocument[];
  auditEntries: AuditEntry[];

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  refetch: () => void;
  dismissAlert: (alertId: string) => void;
}

// ============================================
// Main Hook
// ============================================

export const useComplianceData = (): UseComplianceDataReturn => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [certsRes, incidentsRes, docsRes, auditRes] = await Promise.all([
        api.get('/compliance/certifications'),
        api.get('/compliance/incidents'),
        api.get('/compliance/documents'),
        api.get('/compliance/audit').catch(() => ({ data: { audits: [] } })),
      ]);

      setCertifications(certsRes.data);
      setIncidents(incidentsRes.data);
      setDocuments(docsRes.data);
      setAuditEntries(auditRes.data.audits || auditRes.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load compliance data';
      setError(message);
      console.error('Compliance data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate metrics from data
  const metrics = useMemo(
    () => calculateMetrics(certifications, incidents),
    [certifications, incidents]
  );

  // Generate alerts from data
  const alerts = useMemo(() => {
    const allAlerts = generateAlerts(certifications, incidents);
    return allAlerts.filter((a) => !dismissedAlerts.has(a.id));
  }, [certifications, incidents, dismissedAlerts]);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  }, []);

  return {
    metrics,
    alerts,
    certifications,
    incidents,
    documents,
    auditEntries,
    isLoading,
    error,
    refetch: fetchData,
    dismissAlert,
  };
};

// ============================================
// Mock Data Hook (for development)
// ============================================

export const useMockComplianceData = (): UseComplianceDataReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const metrics = useMemo(
    () => calculateMetrics(MOCK_CERTIFICATIONS, MOCK_INCIDENTS),
    []
  );

  const alerts = useMemo(() => {
    const allAlerts = generateAlerts(MOCK_CERTIFICATIONS, MOCK_INCIDENTS);
    return allAlerts.filter((a) => !dismissedAlerts.has(a.id));
  }, [dismissedAlerts]);

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  }, []);

  return {
    metrics,
    alerts,
    certifications: MOCK_CERTIFICATIONS,
    incidents: MOCK_INCIDENTS,
    documents: MOCK_DOCUMENTS,
    auditEntries: MOCK_AUDIT_ENTRIES,
    isLoading,
    error: null,
    refetch: () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 500);
    },
    dismissAlert,
  };
};

// ============================================
// Default Export (switches based on config)
// ============================================

export default USE_MOCK_DATA ? useMockComplianceData : useComplianceData;