import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import ComplianceDashboard from './components/ComplianceDashboard';
import CertificationTracker from './components/CertificationTracker';
import IncidentReports from './components/IncidentReports';
import AuditTrail from './components/AuditTrail';
import DocumentLibrary from './components/DocumentLibrary';

const Compliance: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('dashboard');
  const isManager = user?.role === 'Manager' || user?.role === 'Admin';

  return (
    <Container maxW="1400px" py={6}>
      {/* Header */}
      <Box mb={6}>
        <Heading as="h1" size="lg" color="gray.800" mb={2}>
          Compliance Management
        </Heading>
        <Text color="gray.500" fontSize="sm">
          Track certifications, manage incidents, and ensure regulatory compliance
        </Text>
      </Box>

      {/* Tabs */}
      <Box bg="white" borderRadius="xl" shadow="sm" overflow="hidden">
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => setActiveTab(e.value)}
          variant="enclosed"
          colorPalette="blue"
        >
          <Tabs.List borderBottom="2px solid" borderColor="gray.200" px={4}>
            <Tabs.Trigger value="dashboard">Overview</Tabs.Trigger>
            <Tabs.Trigger value="certifications">Certifications</Tabs.Trigger>
            <Tabs.Trigger value="incidents">Incidents</Tabs.Trigger>
            <Tabs.Trigger value="documents">Documents</Tabs.Trigger>
            {isManager && <Tabs.Trigger value="audit">Audit Trail</Tabs.Trigger>}
          </Tabs.List>

          <Box p={6}>
            <Tabs.Content value="dashboard">
              <ComplianceDashboard />
            </Tabs.Content>
            <Tabs.Content value="certifications">
              <CertificationTracker />
            </Tabs.Content>
            <Tabs.Content value="incidents">
              <IncidentReports />
            </Tabs.Content>
            <Tabs.Content value="documents">
              <DocumentLibrary />
            </Tabs.Content>
            {isManager && (
              <Tabs.Content value="audit">
                <AuditTrail />
              </Tabs.Content>
            )}
          </Box>
        </Tabs.Root>
      </Box>
    </Container>
  );
};

export default Compliance;