import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
} from '@chakra-ui/react';
import {
  FiAlertTriangle,
  FiAlertCircle,
  FiInfo,
  FiX,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiShield,
  FiUser,
  FiBell,
} from 'react-icons/fi';
import type { DashboardAlert, AlertSeverity } from '../types/dashboard.types';

// ============================================
// Types
// ============================================

interface AlertsPanelProps {
  alerts: DashboardAlert[];
  onDismiss: (alertId: string) => void;
  onMarkRead: (alertId: string) => void;
  maxVisible?: number;
  showViewAll?: boolean;
}

// ============================================
// Severity Configuration
// ============================================

const severityConfig: Record<AlertSeverity, {
  icon: React.ElementType;
  bg: string;
  border: string;
  iconColor: string;
  badge: string;
}> = {
  critical: {
    icon: FiAlertTriangle,
    bg: 'red.50',
    border: 'red.200',
    iconColor: 'red.500',
    badge: 'red',
  },
  warning: {
    icon: FiAlertCircle,
    bg: 'orange.50',
    border: 'orange.200',
    iconColor: 'orange.500',
    badge: 'orange',
  },
  info: {
    icon: FiInfo,
    bg: 'blue.50',
    border: 'blue.200',
    iconColor: 'blue.500',
    badge: 'blue',
  },
};

// Type icon mapping
const typeIcons: Record<string, React.ElementType> = {
  attendance: FiClock,
  geofence: FiMapPin,
  compliance: FiShield,
  incident: FiAlertCircle,
  system: FiBell,
  task: FiUser,
};

// ============================================
// Alert Item Component
// ============================================

interface AlertItemProps {
  alert: DashboardAlert;
  onDismiss: () => void;
  onAction?: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onDismiss, onAction }) => {
  const config = severityConfig[alert.severity];
  const TypeIcon = typeIcons[alert.type] || FiInfo;

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box
      p={4}
      bg={alert.isRead ? 'white' : config.bg}
      borderWidth="1px"
      borderColor={config.border}
      borderRadius="lg"
      position="relative"
      opacity={alert.isDismissed ? 0.5 : 1}
      transition="all 0.2s"
      _hover={{ borderColor: config.iconColor }}
    >
      <HStack align="flex-start" gap={3}>
        {/* Icon */}
        <Box
          p={2}
          bg={config.bg}
          borderRadius="md"
          flexShrink={0}
        >
          <Icon as={TypeIcon} boxSize={5} color={config.iconColor} />
        </Box>

        {/* Content */}
        <VStack align="flex-start" flex={1} gap={1}>
          <HStack justify="space-between" w="full">
            <HStack gap={2}>
              <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                {alert.title}
              </Text>
              <Badge colorScheme={config.badge} size="sm" variant="subtle">
                {alert.severity}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              {formatTimestamp(alert.timestamp)}
            </Text>
          </HStack>

          <Text fontSize="sm" color="gray.600" lineHeight="short">
            {alert.message}
          </Text>

          {/* Related Entity */}
          {alert.relatedEntity && (
            <HStack gap={1} mt={1}>
              <Icon as={FiUser} boxSize={3} color="gray.400" />
              <Text fontSize="xs" color="gray.500">
                {alert.relatedEntity.name}
              </Text>
            </HStack>
          )}

          {/* Actions */}
          <HStack gap={2} mt={2}>
            {alert.actionRequired && alert.actionUrl && (
              <Button
                size="xs"
                colorScheme={config.badge}
                variant="solid"
                onClick={onAction}
              >
                <Text>Take Action</Text>
                <Icon as={FiChevronRight} ml={1} />
              </Button>
            )}
            <Button
              size="xs"
              variant="ghost"
              colorScheme="gray"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </HStack>
        </VStack>

        {/* Close Button */}
        <Box
          as="button"
          position="absolute"
          top={2}
          right={2}
          p={1}
          borderRadius="md"
          cursor="pointer"
          _hover={{ bg: 'gray.100' }}
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          <Icon as={FiX} boxSize={4} color="gray.400" />
        </Box>
      </HStack>
    </Box>
  );
};

// ============================================
// Main Component
// ============================================

const AlertsPanel: React.FC<AlertsPanelProps> = ({
                                                   alerts,
                                                   onDismiss,
                                                   onMarkRead,
                                                   maxVisible = 5,
                                                   showViewAll = true,
                                                 }) => {
  const navigate = useNavigate();

  // Filter out dismissed alerts and sort by severity/timestamp
  const activeAlerts = alerts
    .filter(alert => !alert.isDismissed)
    .sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const visibleAlerts = activeAlerts.slice(0, maxVisible);
  const remainingCount = activeAlerts.length - maxVisible;

  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  // Handle action navigation
  const handleAction = (alert: DashboardAlert) => {
    if (alert.actionUrl) {
      onMarkRead(alert._id);
      navigate(alert.actionUrl);
    }
  };

  if (activeAlerts.length === 0) {
    return (
      <Box
        bg="white"
        p={6}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        textAlign="center"
      >
        <Icon as={FiBell} boxSize={8} color="gray.300" mb={2} />
        <Text color="gray.500" fontSize="sm">No active alerts</Text>
        <Text color="gray.400" fontSize="xs">All systems operating normally</Text>
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      p={5}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
    >
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <HStack gap={3}>
          <Text fontWeight="semibold" color="gray.800">
            Alerts & Notifications
          </Text>
          <HStack gap={1}>
            {criticalCount > 0 && (
              <Badge colorScheme="red" variant="solid" borderRadius="full">
                {criticalCount} critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge colorScheme="orange" variant="subtle" borderRadius="full">
                {warningCount} warning
              </Badge>
            )}
          </HStack>
        </HStack>
        {showViewAll && activeAlerts.length > 0 && (
          <Button
            size="xs"
            variant="ghost"
            colorScheme="blue"
            onClick={() => navigate('/alerts')}
          >
            View All
            <Icon as={FiChevronRight} ml={1} />
          </Button>
        )}
      </HStack>

      {/* Alert List */}
      <VStack gap={3} align="stretch">
        {visibleAlerts.map(alert => (
          <AlertItem
            key={alert._id}
            alert={alert}
            onDismiss={() => onDismiss(alert._id)}
            onAction={() => handleAction(alert)}
          />
        ))}
      </VStack>

      {/* Show more indicator */}
      {remainingCount > 0 && (
        <Box mt={3} textAlign="center">
          <Button
            size="sm"
            variant="outline"
            colorScheme="gray"
            onClick={() => navigate('/alerts')}
          >
            +{remainingCount} more alerts
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AlertsPanel;