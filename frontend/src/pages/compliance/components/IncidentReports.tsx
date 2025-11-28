import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { Incident } from '../types/compliance.types';

type FilterStatus = 'all' | 'open' | 'under-review' | 'resolved' | 'closed';

const IncidentReports: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    incidentType: 'security-breach',
    severity: 'medium',
    description: '',
    witnesses: ''
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/compliance/incidents');
      setIncidents(response.data);
    } catch (err) {
      setError('Failed to load incidents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        witnesses: formData.witnesses.split(',').map(w => w.trim()).filter(Boolean)
      };
      await api.post('/compliance/incidents', payload);
      setShowForm(false);
      setFormData({
        location: '',
        incidentType: 'security-breach',
        severity: 'medium',
        description: '',
        witnesses: ''
      });
      fetchIncidents();
    } catch (err) {
      setError('Failed to submit incident report');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredIncidents = filter === 'all'
    ? incidents
    : incidents.filter(i => i.status === filter);

  const getSeverityClass = (severity: string) => {
    const classes: Record<string, string> = {
      low: 'severity-low',
      medium: 'severity-medium',
      high: 'severity-high',
      critical: 'severity-critical'
    };
    return classes[severity] || 'severity-medium';
  };

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      open: 'status-open',
      'under-review': 'status-review',
      resolved: 'status-resolved',
      closed: 'status-closed'
    };
    return classes[status] || 'status-open';
  };

  if (loading) return <div className="loading">Loading incidents...</div>;

  return (
    <div className="incident-reports">
      <div className="section-header">
        <h2>Incident Reports</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Report Incident'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Incident Report Form */}
      {showForm && (
        <div className="incident-form-container">
          <h3>New Incident Report</h3>
          <form onSubmit={handleSubmit} className="incident-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Main Entrance, Building A"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="incidentType">Incident Type *</label>
                <select
                  id="incidentType"
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="security-breach">Security Breach</option>
                  <option value="injury">Injury</option>
                  <option value="property-damage">Property Damage</option>
                  <option value="unauthorized-access">Unauthorized Access</option>
                  <option value="equipment-failure">Equipment Failure</option>
                  <option value="policy-violation">Policy Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="severity">Severity *</label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="witnesses">Witnesses (comma-separated)</label>
                <input
                  type="text"
                  id="witnesses"
                  name="witnesses"
                  value={formData.witnesses}
                  onChange={handleInputChange}
                  placeholder="e.g., John Smith, Jane Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Provide detailed description of the incident..."
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Controls */}
      <div className="filter-controls">
        {(['all', 'open', 'under-review', 'resolved', 'closed'] as FilterStatus[]).map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.replace('-', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Incidents List */}
      <div className="incidents-list">
        {filteredIncidents.length === 0 ? (
          <p className="no-data">No incidents found</p>
        ) : (
          filteredIncidents.map(incident => (
            <div key={incident._id} className="incident-card">
              <div className="incident-header">
                <span className={`severity-badge ${getSeverityClass(incident.severity)}`}>
                  {incident.severity.toUpperCase()}
                </span>
                <span className={`status-badge ${getStatusClass(incident.status)}`}>
                  {incident.status.replace('-', ' ')}
                </span>
                <span className="incident-date">
                  {new Date(incident.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="incident-body">
                <h4>{incident.incidentType.replace('-', ' ')}</h4>
                <p className="incident-location">📍 {incident.location}</p>
                <p className="incident-description">{incident.description}</p>
              </div>
              <div className="incident-footer">
                <span>Reported by: {incident.reportedBy.fullName}</span>
                <button className="btn-sm">View Details</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IncidentReports;