import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';
import { ComplianceMetrics, ComplianceAlert, Certification, Incident } from '../types/compliance.types';

interface ComplianceData {
  metrics: ComplianceMetrics;
  alerts: ComplianceAlert[];
  certifications: Certification[];
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const defaultMetrics: ComplianceMetrics = {
  validCertifications: 0,
  certsExpiringSoon: 0,
  expiredCerts: 0,
  openIncidents: 0,
  complianceRate: 100
};

export const useComplianceData = (): ComplianceData => {
  const [metrics, setMetrics] = useState<ComplianceMetrics>(defaultMetrics);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateAlerts = (certs: Certification[], incidents: Incident[]): ComplianceAlert[] => {
    const alerts: ComplianceAlert[] = [];

    // Expiring certifications alerts
    const expiringSoon = certs.filter(c => c.status === 'expiring-soon');
    const expired = certs.filter(c => c.status === 'expired');

    if (expired.length > 0) {
      alerts.push({
        severity: 'critical',
        message: `${expired.length} certification(s) have expired and require immediate renewal`,
        date: new Date().toISOString()
      });
    }

    if (expiringSoon.length > 0) {
      alerts.push({
        severity: 'warning',
        message: `${expiringSoon.length} certification(s) expiring within 30 days`,
        date: new Date().toISOString()
      });
    }

    // Critical incidents alert
    const criticalIncidents = incidents.filter(
      i => i.severity === 'critical' && i.status === 'open'
    );
    if (criticalIncidents.length > 0) {
      alerts.push({
        severity: 'critical',
        message: `${criticalIncidents.length} critical incident(s) require attention`,
        date: new Date().toISOString()
      });
    }

    return alerts.sort((a, b) =>
      a.severity === 'critical' ? -1 : b.severity === 'critical' ? 1 : 0
    );
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsRes, certsRes, incidentsRes] = await Promise.all([
        api.get('/compliance/metrics'),
        api.get('/compliance/certifications'),
        api.get('/compliance/incidents?status=open,under-review')
      ]);

      setMetrics(metricsRes.data);
      setCertifications(certsRes.data);
      setIncidents(incidentsRes.data);
      setAlerts(generateAlerts(certsRes.data, incidentsRes.data));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load compliance data';
      setError(message);
      console.error('Compliance data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    metrics,
    alerts,
    certifications,
    incidents,
    loading,
    error,
    refetch: fetchData
  };


};

export { api };