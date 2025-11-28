import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';

interface AuditEntry {
  _id: string;
  action: string;
  performedBy: { _id: string; fullName: string };
  targetType: string;
  details: string;
  timestamp: string;
}

const AuditTrail: React.FC = () => {
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    fetchAuditTrail();
  }, [page]);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/compliance/audit?page=${page}&limit=${limit}`);

      if (page === 1) {
        setAudits(response.data);
      } else {
        setAudits(prev => [...prev, ...response.data]);
      }

      setHasMore(response.data.length === limit);
    } catch (err) {
      setError('Failed to load audit trail');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string): string => {
    const icons: Record<string, string> = {
      'document-viewed': '👁️',
      'document-signed': '✍️',
      'cert-uploaded': '📤',
      'cert-verified': '✅',
      'incident-reported': '🚨',
      'checklist-completed': '☑️',
      'policy-acknowledged': '📋'
    };
    return icons[action] || '📝';
  };

  const getActionLabel = (action: string): string => {
    return action
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && page === 1) return <div className="loading">Loading audit trail...</div>;

  return (
    <div className="audit-trail">
      <div className="section-header">
        <h2>Compliance Audit Trail</h2>
        <p className="section-subtitle">
          Complete log of all compliance-related activities
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="audit-list">
        {audits.length === 0 ? (
          <p className="no-data">No audit entries found</p>
        ) : (
          <>
            {audits.map(entry => (
              <div key={entry._id} className="audit-entry">
                <div className="audit-icon">
                  {getActionIcon(entry.action)}
                </div>
                <div className="audit-content">
                  <div className="audit-header">
                    <span className="audit-action">{getActionLabel(entry.action)}</span>
                    <span className="audit-target-type">{entry.targetType}</span>
                  </div>
                  <p className="audit-details">{entry.details}</p>
                  <div className="audit-meta">
                    <span className="audit-user">
                      By: {entry.performedBy?.fullName || 'System'}
                    </span>
                    <span className="audit-timestamp">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                className="btn-load-more"
                onClick={() => setPage(prev => prev + 1)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;