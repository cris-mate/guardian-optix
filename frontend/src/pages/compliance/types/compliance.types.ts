export interface Certification {
  _id: string;
  userId: { _id: string; fullName: string; email: string };
  certType: 'SIA License' | 'First Aid' | 'Fire Safety' | 'CCTV' | 'Door Supervisor' | 'Close Protection';
  certNumber: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring-soon' | 'expired';
  documentUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Incident {
  _id: string;
  reportedBy: { _id: string; fullName: string };
  location: string;
  incidentType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'under-review' | 'resolved' | 'closed';
  createdAt: string;
}

export interface ComplianceMetrics {
  validCertifications: number;
  certsExpiringSoon: number;
  expiredCerts: number;
  openIncidents: number;
  complianceRate: number;
}

export interface ComplianceAlert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  date: string;
}