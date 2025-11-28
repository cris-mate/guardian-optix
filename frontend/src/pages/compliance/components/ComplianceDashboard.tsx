import React from 'react';
import { useComplianceData } from '../hooks/useComplianceData';

interface MetricCard {
  label: string;
  value: number;
  status: 'success' | 'warning' | 'danger' | 'neutral';
  trend?: string;
}

const ComplianceDashboard: React.FC = () => {
  const { metrics, alerts, loading, error } = useComplianceData();

  if (loading) return <div className="loading-spinner">Loading compliance data...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const getStatusClass = (status: string) => `metric-card metric-${status}`;

  return (
    <div className="compliance-dashboard">
      {/* Metrics Grid */}
      <section className="metrics-grid">
        <div className={getStatusClass(metrics.certsExpiringSoon > 0 ? 'warning' : 'success')}>
          <span className="metric-value">{metrics.validCertifications}</span>
          <span className="metric-label">Valid Certifications</span>
        </div>
        <div className={getStatusClass(metrics.certsExpiringSoon > 3 ? 'danger' : 'warning')}>
          <span className="metric-value">{metrics.certsExpiringSoon}</span>
          <span className="metric-label">Expiring Within 30 Days</span>
        </div>
        <div className={getStatusClass(metrics.openIncidents > 5 ? 'danger' : 'neutral')}>
          <span className="metric-value">{metrics.openIncidents}</span>
          <span className="metric-label">Open Incidents</span>
        </div>
        <div className={getStatusClass('success')}>
          <span className="metric-value">{metrics.complianceRate}%</span>
          <span className="metric-label">Compliance Rate</span>
        </div>
      </section>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <section className="alerts-section">
          <h3>Action Required</h3>
          <ul className="alerts-list">
            {alerts.map((alert, idx) => (
              <li key={idx} className={`alert-item alert-${alert.severity}`}>
                <span className="alert-icon">{alert.severity === 'critical' ? '⚠️' : 'ℹ️'}</span>
                <span className="alert-message">{alert.message}</span>
                <span className="alert-date">{new Date(alert.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent Activity */}
      <section className="recent-activity">
        <h3>Recent Compliance Activity</h3>
        {/* Activity list component */}
      </section>
    </div>
  );
};

export default ComplianceDashboard;