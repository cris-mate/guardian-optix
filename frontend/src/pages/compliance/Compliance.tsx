import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ComplianceDashboard from './components/ComplianceDashboard';
import CertificationTracker from './components/CertificationTracker';
import IncidentReports from './components/IncidentReports';
import AuditTrail from './components/AuditTrail';
import DocumentLibrary from './components/DocumentLibrary';
import './Compliance.css';

type TabType = 'dashboard' | 'certifications' | 'incidents' | 'documents' | 'audit';

const Compliance: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const isManager = user?.role === 'Manager' || user?.role === 'Admin';

  const tabs: { id: TabType; label: string; managerOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'incidents', label: 'Incidents' },
    { id: 'documents', label: 'Documents' },
    { id: 'audit', label: 'Audit Trail', managerOnly: true },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <ComplianceDashboard />;
      case 'certifications': return <CertificationTracker />;
      case 'incidents': return <IncidentReports />;
      case 'documents': return <DocumentLibrary />;
      case 'audit': return isManager ? <AuditTrail /> : null;
      default: return <ComplianceDashboard />;
    }
  };

  return (
    <div className="compliance-page">
      <header className="compliance-header">
        <h1>Compliance Management</h1>
        <p>Track certifications, manage incidents, and ensure regulatory compliance</p>
      </header>

      <nav className="compliance-tabs">
        {tabs
          .filter(tab => !tab.managerOnly || isManager)
          .map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
      </nav>

      <main className="compliance-content">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Compliance;
