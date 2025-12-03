import React from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  VStack,
  HStack,
  List,
  Spinner,
  Alert,
} from '@chakra-ui/react';
import { useComplianceData } from '../hooks/useComplianceData';

interface MetricCardProps {
  value: number | string;
  label: string;
  status: 'success' | 'warning' | 'danger' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ value, label, status }) => {
  const borderColors = {
    success: 'green.400',
    warning: 'orange.400',
    danger: 'red.400',
    neutral: 'blue.400',
  };

  const bgGradients = {
    success: 'linear(to-br, green.50, gray.50)',
    warning: 'linear(to-br, orange.50, gray.50)',
    danger: 'linear(to-br, red.50, gray.50)',
    neutral: 'linear(to-br, blue.50, gray.50)',
  };

  return (
    <Box
      bg="gray.50"
      bgGradient={bgGradients[status]}
      borderRadius="lg"
      p={5}
      borderLeftWidth="4px"
      borderLeftColor={borderColors[status]}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
    >
      <Text fontSize="3xl" fontWeight="bold" color="gray.800" lineHeight="1.2">
        {value}
      </Text>
      <Text fontSize="sm" color="gray.500" mt={1}>
        {label}
      </Text>
    </Box>
  );
};

const ComplianceDashboard: React.FC = () => {
  const { metrics, alerts, isLoading, error } = useComplianceData();

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="gray.500">Loading compliance data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error" borderRadius="md">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{error}</Alert.Title>
        </Alert.Content>
      </Alert.Root>
    );
  }

  return (
    <VStack gap={8} align="stretch">
      {/* Metrics Grid */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <MetricCard
          value={metrics.validCertifications}
          label="Valid Certifications"
          status={metrics.certsExpiringSoon > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          value={metrics.certsExpiringSoon}
          label="Expiring Within 30 Days"
          status={metrics.certsExpiringSoon > 3 ? 'danger' : 'warning'}
        />
        <MetricCard
          value={metrics.openIncidents}
          label="Open Incidents"
          status={metrics.openIncidents > 5 ? 'danger' : 'neutral'}
        />
        <MetricCard
          value={`${metrics.complianceRate}%`}
          label="Compliance Rate"
          status="success"
        />
      </SimpleGrid>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Box>
          <Heading as="h3" size="sm" mb={3} color="gray.700">
            Action Required
          </Heading>
          <List.Root gap={2} listStyle="none">
            {alerts.map((alert, idx) => (
              <List.Item key={idx}>
                <HStack
                  p={3}
                  borderRadius="md"
                  bg={alert.severity === 'critical' ? 'red.50' : alert.severity === 'warning' ? 'orange.50' : 'blue.50'}
                  borderWidth="1px"
                  borderColor={alert.severity === 'critical' ? 'red.200' : alert.severity === 'warning' ? 'orange.200' : 'blue.200'}
                >
                  <Text fontSize="lg">
                    {alert.severity === 'critical' ? '⚠️' : 'ℹ️'}
                  </Text>
                  <Text flex={1} fontSize="sm" color="gray.800">
                    {alert.message}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {new Date(alert.date).toLocaleDateString()}
                  </Text>
                </HStack>
              </List.Item>
            ))}
          </List.Root>
        </Box>
      )}

      {/* Recent ActivityHub Placeholder */}
      <Box>
        <Heading as="h3" size="sm" mb={3} color="gray.700">
          Recent Compliance Activity
        </Heading>
        <Box bg="gray.50" p={6} borderRadius="md" textAlign="center">
          <Text color="gray.400" fontSize="sm">Activity feed coming soon</Text>
        </Box>
      </Box>
    </VStack>
  );
};

export default ComplianceDashboard;