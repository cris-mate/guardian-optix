/**
 * Compliance Page
 *
 * Central hub for compliance management in Guardian Optix.
 * Tracks certifications, manages incidents, and ensures regulatory compliance.
 *
 * Features:
 * - Compliance metrics dashboard with key indicators
 * - Certification tracking with expiry alerts
 * - Incident reporting and management
 * - Document library for policies and procedures
 * - Audit trail for managers
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Grid,
  GridItem,
  Tabs,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import {
  LuShield,
  LuRefreshCw,
  LuAward,
  LuTriangleAlert,
  LuFileText,
  LuHistory,
  LuCircleCheck,
  LuCircleAlert,
} from 'react-icons/lu';
import { usePageTitle } from '../../context/PageContext';
import { useAuth } from '../../context/AuthContext';
import { MOCK_CONFIG } from '../../config/api.config';

// Components
import ComplianceDashboard from './components/ComplianceDashboard';
import CertificationTracker from './components/CertificationTracker';
import IncidentReports from './components/IncidentReports';
import DocumentLibrary from './components/DocumentLibrary';
import AuditTrail from './components/AuditTrail';

// Hooks
import { useComplianceData, useMockComplianceData } from './hooks/useComplianceData';

// Types
import type { ComplianceMetrics } from '../../types/compliance.types';

// ============================================
// Configuration
// ============================================

const USE_MOCK_DATA = MOCK_CONFIG.compliance;

// ============================================
// Tab Configuration
// ============================================

type TabValue = 'overview' | 'certifications' | 'incidents' | 'documents' | 'audit';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
  managerOnly?: boolean;
}

const tabs: TabConfig[] = [
  { value: 'overview', label: 'Overview', icon: LuShield },
  { value: 'certifications', label: 'Certifications', icon: LuAward },
  { value: 'incidents', label: 'Incidents', icon: LuTriangleAlert },
  { value: 'documents', label: 'Documents', icon: LuFileText },
  { value: 'audit', label: 'Audit Trail', icon: LuHistory, managerOnly: true },
];

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading }) => (
  <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
    <HStack gap={3}>
      <Box p={2} borderRadius="lg" bg="blue.50" color="blue.600">
        <LuShield size={24} />
      </Box>
      <Box>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          Compliance Management
        </Text>
        <Text fontSize="sm" color="gray.500">
          Track certifications, manage incidents, and ensure regulatory compliance
        </Text>
      </Box>
    </HStack>

    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isLoading}
    >
      <Icon
        as={LuRefreshCw}
        boxSize={4}
        mr={2}
        className={isLoading ? 'spin' : ''}
      />
      {isLoading ? 'Refreshing...' : 'Refresh'}
    </Button>
  </HStack>
);

// ============================================
// Error Banner Component
// ============================================

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => (
  <Box
    bg="red.50"
    borderWidth="1px"
    borderColor="red.200"
    borderRadius="lg"
    p={4}
  >
    <HStack justify="space-between">
      <HStack gap={3}>
        <Icon as={LuCircleAlert} color="red.500" boxSize={5} />
        <Text color="red.700" fontSize="sm">{message}</Text>
      </HStack>
      <Button size="sm" colorPalette="red" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </HStack>
  </Box>
);

// ============================================
// Quick Stats Component
// ============================================

interface QuickStatsProps {
  metrics: ComplianceMetrics;
  isLoading: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({ metrics, isLoading }) => {
  const stats = [
    {
      label: 'Valid Certifications',
      value: metrics.validCertifications,
      icon: LuCircleCheck,
      color: 'green',
    },
    {
      label: 'Expiring Soon',
      value: metrics.certsExpiringSoon,
      icon: LuCircleAlert,
      color: metrics.certsExpiringSoon > 0 ? 'orange' : 'gray',
    },
    {
      label: 'Open Incidents',
      value: metrics.openIncidents,
      icon: LuTriangleAlert,
      color: metrics.openIncidents > 0 ? 'red' : 'gray',
    },
    {
      label: 'Compliance Rate',
      value: `${metrics.complianceRate}%`,
      icon: LuShield,
      color: metrics.complianceRate >= 90 ? 'green' : metrics.complianceRate >= 70 ? 'orange' : 'red',
    },
  ];

  return (
    <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
      {stats.map((stat) => (
        <Box
          key={stat.label}
          bg="white"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          p={5}
          transition="all 0.2s"
          _hover={{ borderColor: `${stat.color}.300`, shadow: 'sm' }}
        >
          {isLoading ? (
            <VStack align="flex-start" gap={2}>
              <Box bg="gray.100" h={4} w={24} borderRadius="md" />
              <Box bg="gray.100" h={8} w={16} borderRadius="md" />
            </VStack>
          ) : (
            <HStack gap={3}>
              <Box p={2} borderRadius="md" bg={`${stat.color}.50`} color={`${stat.color}.600`}>
                <Icon as={stat.icon} boxSize={5} />
              </Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                  {stat.value}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {stat.label}
                </Text>
              </Box>
            </HStack>
          )}
        </Box>
      ))}
    </Grid>
  );
};

// ============================================
// Alerts Panel Component
// ============================================

interface AlertsPanelProps {
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    date: string;
  }>;
  onDismiss: (alertId: string) => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: 'red.50', border: 'red.200', icon: '🚨' };
      case 'warning':
        return { bg: 'orange.50', border: 'orange.200', icon: '⚠️' };
      default:
        return { bg: 'blue.50', border: 'blue.200', icon: 'ℹ️' };
    }
  };

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      <HStack p={4} borderBottomWidth="1px" borderColor="gray.100">
        <Icon as={LuCircleAlert} boxSize={5} color="orange.500" />
        <Text fontWeight="semibold" color="gray.700">
          Action Required
        </Text>
        <Badge colorPalette="orange" variant="solid" size="sm">
          {alerts.length}
        </Badge>
      </HStack>

      <VStack align="stretch" gap={0} p={2}>
        {alerts.map((alert) => {
          const styles = getSeverityStyles(alert.severity);
          return (
            <HStack
              key={alert.id}
              p={3}
              borderRadius="md"
              bg={styles.bg}
              borderWidth="1px"
              borderColor={styles.border}
              m={1}
            >
              <Text fontSize="lg">{styles.icon}</Text>
              <Text flex={1} fontSize="sm" color="gray.800">
                {alert.message}
              </Text>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onDismiss(alert.id)}
              >
                Dismiss
              </Button>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
};

// ============================================
// Main Component
// ============================================

const Compliance: React.FC = () => {
  const { setTitle } = usePageTitle();
  const { user } = useAuth();
  const isManager = user?.role === 'Manager' || user?.role === 'Admin';

  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Set page title
  useEffect(() => {
    setTitle('Compliance');
  }, [setTitle]);

  // Use either real or mock data hook
  const complianceData = USE_MOCK_DATA
    ? useMockComplianceData()
    : useComplianceData();

  const {
    metrics,
    alerts,
    certifications,
    incidents,
    isLoading,
    error,
    refetch,
    dismissAlert,
  } = complianceData;

  // Filter tabs based on role
  const visibleTabs = tabs.filter((tab) => !tab.managerOnly || isManager);

  // Counts for badges
  const expiringSoonCount = certifications.filter(
    (c) => c.status === 'expiring-soon'
  ).length;
  const openIncidentsCount = incidents.filter(
    (i) => i.status === 'open' || i.status === 'under-review'
  ).length;

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (isLoading && !metrics.validCertifications) {
    return (
      <VStack gap={4} align="stretch">
        <Header onRefresh={handleRefresh} isLoading={true} />
        <VStack py={16} gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading compliance data...</Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Header */}
      <Header onRefresh={handleRefresh} isLoading={isLoading} />

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      {/* Quick Stats */}
      <QuickStats metrics={metrics} isLoading={isLoading && !metrics.validCertifications} />

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <AlertsPanel alerts={alerts} onDismiss={dismissAlert} />
      )}

      {/* Tabs */}
      <Box>
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => setActiveTab(e.value as TabValue)}
        >
          <Tabs.List
            bg="white"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            p={1}
          >
            {visibleTabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                px={4}
                py={2}
                borderRadius="md"
                fontWeight="medium"
                color="gray.600"
                _selected={{
                  bg: 'blue.50',
                  color: 'blue.600',
                }}
              >
                <HStack gap={2}>
                  <Icon as={tab.icon} boxSize={4} />
                  <Text>{tab.label}</Text>
                  {tab.value === 'certifications' && expiringSoonCount > 0 && (
                    <Badge colorPalette="orange" variant="solid" size="sm">
                      {expiringSoonCount}
                    </Badge>
                  )}
                  {tab.value === 'incidents' && openIncidentsCount > 0 && (
                    <Badge colorPalette="red" variant="solid" size="sm">
                      {openIncidentsCount}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Content value="overview" pt={4}>
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
              <GridItem>
                <ComplianceDashboard />
              </GridItem>
              <GridItem>
                <VStack align="stretch" gap={4}>
                  {/* Quick Links */}
                  <Box
                    bg="white"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                    p={5}
                  >
                    <Text fontWeight="semibold" color="gray.700" mb={4}>
                      Quick Actions
                    </Text>
                    <VStack align="stretch" gap={2}>
                      <Button
                        variant="outline"
                        justifyContent="flex-start"
                        onClick={() => setActiveTab('certifications')}
                      >
                        <Icon as={LuAward} boxSize={4} mr={2} />
                        View Certifications
                      </Button>
                      <Button
                        variant="outline"
                        justifyContent="flex-start"
                        onClick={() => setActiveTab('incidents')}
                      >
                        <Icon as={LuTriangleAlert} boxSize={4} mr={2} />
                        Report Incident
                      </Button>
                      <Button
                        variant="outline"
                        justifyContent="flex-start"
                        onClick={() => setActiveTab('documents')}
                      >
                        <Icon as={LuFileText} boxSize={4} mr={2} />
                        Browse Documents
                      </Button>
                    </VStack>
                  </Box>

                  {/* Info Card */}
                  <Box
                    bg="blue.50"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="blue.200"
                    p={6}
                    textAlign="center"
                  >
                    <Icon as={LuShield} boxSize={10} color="blue.400" mb={3} />
                    <Text fontWeight="semibold" color="gray.700" mb={2}>
                      Stay Compliant
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Regular compliance checks help avoid penalties and ensure
                      all officers meet SIA requirements.
                    </Text>
                  </Box>
                </VStack>
              </GridItem>
            </Grid>
          </Tabs.Content>

          {/* Certifications Tab */}
          <Tabs.Content value="certifications" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              <CertificationTracker />
            </Box>
          </Tabs.Content>

          {/* Incidents Tab */}
          <Tabs.Content value="incidents" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              <IncidentReports />
            </Box>
          </Tabs.Content>

          {/* Documents Tab */}
          <Tabs.Content value="documents" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              <DocumentLibrary />
            </Box>
          </Tabs.Content>

          {/* Audit Trail Tab (Manager Only) */}
          {isManager && (
            <Tabs.Content value="audit" pt={4}>
              <Box
                bg="white"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="gray.200"
                overflow="hidden"
              >
                <AuditTrail />
              </Box>
            </Tabs.Content>
          )}
        </Tabs.Root>
      </Box>

      {/* CSS for spinner animation */}
      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </VStack>
  );
};

export default Compliance;