/**
 * PerformanceAlerts Component
 *
 * Displays performance-related alerts and exceptions requiring attention.
 * Shows attendance issues, patrol failures, and compliance warnings.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  IconButton,
  Flex,
} from '@chakra-ui/react';
import {
  LuBell,
  LuTriangleAlert,
  LuCircleAlert,
  LuInfo,
  LuX,
  LuExternalLink,
  LuClock,
  LuRoute,
  LuMapPin,
  LuGraduationCap,
} from 'react-icons/lu';
import type { PerformanceAlert, AlertSeverity } from '../../../types/performance.types';

// ============================================
// Props Interface
// ============================================

interface PerformanceAlertsProps {
  alerts: PerformanceAlert[];
  onDismiss?: (alertId: string) => void;
  onMarkRead?: (alertId: string) => void;
  isLoading?: boolean;
  compact?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const getSeverityConfig = (severity: AlertSeverity) => {
  const config: Record<AlertSeverity, { color: string; icon: React.ElementType; bg: string }> = {
    critical: { color: 'red', icon: LuTriangleAlert, bg: 'red.50' },
    warning: { color: 'orange', icon: LuCircleAlert, bg: 'orange.50' },
    info: { color: 'blue', icon: LuInfo, bg: 'blue.50' },
  };
  return config[severity];
};

const getTypeIcon = (type: PerformanceAlert['type']) => {
  const icons: Record<PerformanceAlert['type'], React.ElementType> = {
    attendance: LuClock,
    patrol: LuRoute,
    geofence: LuMapPin,
    incident: LuTriangleAlert,
    training: LuGraduationCap,
  };
  return icons[type];
};

const formatTimeAgo = (isoString: string) => {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

// ============================================
// Alert Item Component
// ============================================

interface AlertItemProps {
  alert: PerformanceAlert;
  onDismiss?: () => void;
  onMarkRead?: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onDismiss, onMarkRead }) => {
  const severityConfig = getSeverityConfig(alert.severity);
  const TypeIcon = getTypeIcon(alert.type);

  return (
    <Box
      p={4}
      bg={alert.isRead ? 'white' : severityConfig.bg}
      borderLeftWidth="4px"
      borderLeftColor={`${severityConfig.color}.500`}
      borderRadius="md"
      transition="all 0.2s"
      _hover={{ shadow: 'sm' }}
      onClick={onMarkRead}
      cursor={!alert.isRead ? 'pointer' : 'default'}
    >
      <HStack justify="space-between" align="flex-start" gap={4}>
        <HStack align="flex-start" gap={3} flex={1}>
          <Box
            p={2}
            bg={`${severityConfig.color}.100`}
            borderRadius="md"
            color={`${severityConfig.color}.600`}
          >
            <Icon as={severityConfig.icon} boxSize={4} />
          </Box>

          <VStack align="flex-start" gap={1} flex={1}>
            <HStack gap={2} flexWrap="wrap">
              <Text fontWeight="semibold" color="gray.800" fontSize="sm">
                {alert.title}
              </Text>
              {!alert.isRead && (
                <Box w={2} h={2} borderRadius="full" bg={`${severityConfig.color}.500`} />
              )}
              {alert.actionRequired && (
                <Badge colorPalette="red" variant="solid" size="sm">
                  Action Required
                </Badge>
              )}
            </HStack>

            <Text fontSize="sm" color="gray.600">
              {alert.message}
            </Text>

            <HStack gap={3} fontSize="xs" color="gray.400" flexWrap="wrap">
              <HStack gap={1}>
                <Icon as={TypeIcon} boxSize={3} />
                <Text textTransform="capitalize">{alert.type}</Text>
              </HStack>

              {alert.guardName && (
                <Text>• {alert.guardName}</Text>
              )}

              {alert.site && (
                <Text>• {alert.site}</Text>
              )}

              <Text>• {formatTimeAgo(alert.timestamp)}</Text>
            </HStack>
          </VStack>
        </HStack>

        <HStack gap={1}>
          {alert.actionUrl && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette={severityConfig.color}
              asChild
            >
              <a href={alert.actionUrl}>
                <Icon as={LuExternalLink} boxSize={3} mr={1} />
                View
              </a>
            </Button>
          )}

          {onDismiss && (
            <IconButton
              size="xs"
              variant="ghost"
              colorPalette="gray"
              aria-label="Dismiss alert"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
            >
              <Icon as={LuX} boxSize={4} />
            </IconButton>
          )}
        </HStack>
      </HStack>
    </Box>
  );
};

// ============================================
// Loading Skeleton
// ============================================

const AlertSkeleton: React.FC = () => (
  <Box
    p={4}
    bg="gray.50"
    borderLeftWidth="4px"
    borderLeftColor="gray.200"
    borderRadius="md"
  >
    <HStack gap={3}>
      <Box bg="gray.100" p={2} borderRadius="md" h={8} w={8} />
      <VStack align="flex-start" gap={2} flex={1}>
        <Box bg="gray.100" h={4} w={40} borderRadius="md" />
        <Box bg="gray.100" h={3} w="80%" borderRadius="md" />
        <Box bg="gray.100" h={3} w={32} borderRadius="md" />
      </VStack>
    </HStack>
  </Box>
);

// ============================================
// Empty State Component
// ============================================

const EmptyState: React.FC = () => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    py={8}
    px={4}
    bg="gray.50"
    borderRadius="lg"
    borderWidth="1px"
    borderColor="gray.200"
    borderStyle="dashed"
  >
    <Icon as={LuBell} boxSize={10} color="gray.300" mb={3} />
    <Text fontWeight="medium" color="gray.600" mb={1}>
      No alerts
    </Text>
    <Text fontSize="sm" color="gray.400" textAlign="center">
      All performance metrics are within acceptable ranges
    </Text>
  </Flex>
);

// ============================================
// Summary Header Component
// ============================================

interface SummaryHeaderProps {
  alerts: PerformanceAlert[];
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ alerts }) => {
  const critical = alerts.filter(a => a.severity === 'critical').length;
  const warning = alerts.filter(a => a.severity === 'warning').length;
  const info = alerts.filter(a => a.severity === 'info').length;
  const unread = alerts.filter(a => !a.isRead).length;

  return (
    <HStack
      p={4}
      borderBottomWidth="1px"
      borderColor="gray.100"
      justify="space-between"
      flexWrap="wrap"
      gap={2}
    >
      <HStack gap={2}>
        <Icon as={LuBell} boxSize={5} color="gray.600" />
        <Text fontWeight="semibold" color="gray.800">
          Performance Alerts
        </Text>
        {unread > 0 && (
          <Badge colorPalette="blue" variant="solid">
            {unread} new
          </Badge>
        )}
      </HStack>

      <HStack gap={3}>
        {critical > 0 && (
          <HStack gap={1}>
            <Box w={2} h={2} borderRadius="full" bg="red.500" />
            <Text fontSize="sm" color="gray.600">
              {critical} critical
            </Text>
          </HStack>
        )}
        {warning > 0 && (
          <HStack gap={1}>
            <Box w={2} h={2} borderRadius="full" bg="orange.500" />
            <Text fontSize="sm" color="gray.600">
              {warning} warning
            </Text>
          </HStack>
        )}
        {info > 0 && (
          <HStack gap={1}>
            <Box w={2} h={2} borderRadius="full" bg="blue.500" />
            <Text fontSize="sm" color="gray.600">
              {info} info
            </Text>
          </HStack>
        )}
      </HStack>
    </HStack>
  );
};

// ============================================
// Main Component
// ============================================

const PerformanceAlerts: React.FC<PerformanceAlertsProps> = ({
                                                               alerts,
                                                               onDismiss,
                                                               onMarkRead,
                                                               isLoading = false,
                                                               compact = false,
                                                             }) => {
  // Sort alerts: unread first, then by severity, then by timestamp
  const sortedAlerts = [...alerts].sort((a, b) => {
    // Unread first
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;

    // Then by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }

    // Then by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const displayedAlerts = compact ? sortedAlerts.slice(0, 3) : sortedAlerts;

  if (isLoading) {
    return (
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        <Box p={4} borderBottomWidth="1px" borderColor="gray.100">
          <Box bg="gray.100" h={5} w={40} borderRadius="md" />
        </Box>
        <VStack align="stretch" gap={2} p={4}>
          {Array.from({ length: 3 }).map((_, i) => (
            <AlertSkeleton key={i} />
          ))}
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      <SummaryHeader alerts={alerts} />

      {alerts.length === 0 ? (
        <Box p={4}>
          <EmptyState />
        </Box>
      ) : (
        <VStack align="stretch" gap={2} p={4}>
          {displayedAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={onDismiss ? () => onDismiss(alert.id) : undefined}
              onMarkRead={onMarkRead ? () => onMarkRead(alert.id) : undefined}
            />
          ))}

          {compact && alerts.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              colorPalette="blue"
              alignSelf="center"
            >
              View all {alerts.length} alerts
            </Button>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default PerformanceAlerts;