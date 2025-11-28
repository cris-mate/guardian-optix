import React, { useState } from 'react';
import { api } from '@/utils/api';
import { Certification } from '@/pages/compliance/types/compliance.types';

const CertificationTracker: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [filter, setFilter] = useState<'all' | 'valid' | 'expiring-soon' | 'expired'>('all');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchCertifications = async () => {
      try {
        const response = await api.get('/compliance/certifications');
        setCertifications(response.data);
      } catch (err) {
        console.error('Failed to load certifications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertifications();
  }, []);

  const filteredCerts = filter === 'all'
    ? certifications
    : certifications.filter(c => c.status === filter);

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      'valid': { class: 'badge-success', label: 'Valid' },
      'expiring-soon': { class: 'badge-warning', label: 'Expiring Soon' },
      'expired': { class: 'badge-danger', label: 'Expired' }
    };
    return badges[status] || badges['valid'];
  };

  if (loading) return <div>Loading certifications...</div>;

  return (
    <div className="certification-tracker">
      <div className="tracker-header">
        <h2>Guard Certifications</h2>
        <div className="filter-controls">
          {['all', 'valid', 'expiring-soon', 'expired'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f as typeof filter)}
            >
              {f.replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <table className="cert-table">
        <thead>
        <tr>
          <th>Guard</th>
          <th>Certification Type</th>
          <th>License Number</th>
          <th>Expiry Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        {filteredCerts.map(cert => {
          const badge = getStatusBadge(cert.status);
          const daysLeft = getDaysUntilExpiry(cert.expiryDate);
          return (
            <tr key={cert._id} className={cert.status === 'expired' ? 'row-expired' : ''}>
              <td>{cert.userId.fullName}</td>
              <td>{cert.certType}</td>
              <td>{cert.certNumber}</td>
              <td>
                {new Date(cert.expiryDate).toLocaleDateString()}
                {daysLeft > 0 && daysLeft <= 30 && (
                  <span className="days-warning"> ({daysLeft} days left)</span>
                )}
              </td>
              <td><span className={`badge ${badge.class}`}>{badge.label}</span></td>
              <td>
                <button className="btn-sm">View</button>
                <button className="btn-sm btn-primary">Renew</button>
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  );
};

export default CertificationTracker;