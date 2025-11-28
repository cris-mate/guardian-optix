import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';

interface ComplianceDocument {
  _id: string;
  title: string;
  category: 'policy' | 'procedure' | 'manual' | 'form' | 'certificate';
  description: string;
  fileUrl: string;
  version: string;
  lastUpdated: string;
  requiresAcknowledgment: boolean;
  acknowledgedBy: string[];
  uploadedBy: { fullName: string };
}

type CategoryFilter = 'all' | ComplianceDocument['category'];

const DocumentLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/compliance/documents');
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (docId: string) => {
    try {
      await api.post(`/compliance/documents/${docId}/acknowledge`);
      await fetchDocuments();
    } catch (err) {
      setError('Failed to acknowledge document');
    }
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      policy: '📜',
      procedure: '📋',
      manual: '📖',
      form: '📄',
      certificate: '🏆'
    };
    return icons[category] || '📁';
  };

  const getCategoryLabel = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.category === filter;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories: CategoryFilter[] = ['all', 'policy', 'procedure', 'manual', 'form', 'certificate'];

  if (loading) return <div className="loading">Loading documents...</div>;

  return (
    <div className="document-library">
      <div className="section-header">
        <h2>Document Library</h2>
        <p className="section-subtitle">
          Access policies, procedures, and compliance documentation
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Search and Filter */}
      <div className="library-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat === 'all' ? 'All' : getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="documents-grid">
        {filteredDocuments.length === 0 ? (
          <p className="no-data">No documents found</p>
        ) : (
          filteredDocuments.map(doc => (
            <div key={doc._id} className="document-card">
              <div className="document-icon">
                {getCategoryIcon(doc.category)}
              </div>
              <div className="document-content">
                <h4 className="document-title">{doc.title}</h4>
                <span className="document-category">
                  {getCategoryLabel(doc.category)}
                </span>
                <p className="document-description">{doc.description}</p>
                <div className="document-meta">
                  <span className="document-version">v{doc.version}</span>
                  <span className="document-date">
                    Updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="document-actions">

                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-sm btn-primary"
              <a>
                View
              </a>
              <button className="btn-sm">Download</button>
              {doc.requiresAcknowledgment && (
                <button
                  className="btn-sm btn-acknowledge"
                  onClick={() => handleAcknowledge(doc._id)}
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
          ))
          )}
      </div>
    </div>
  );
};

export default DocumentLibrary;