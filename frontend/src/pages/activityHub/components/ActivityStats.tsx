/**
 * ActivityStats Component
 *
 * Displays operational statistics for the Activity Hub dashboard.
 * Shows security-relevant metrics
 * - Guards On Duty (real-time)
 * - Open Incidents
 * - Coverage Gaps (unassigned shifts)
 * - Compliance Alerts
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  SimpleGrid,
  Badge,
  Skeleton,
} from '@chakra-ui/react';
import {
  LuShield,
  LuTriangleAlert,
  LuCalendarX,
  LuBadgeAlert,
  LuTrendingUp,
  LuTrendingDown,
  LuMinus,
  LuActivity,
} from 'react-icons/lu';
import type { ActivityStats as ActivityStatsType, UpdateStats } from '../../../types/activityHub.types';
import type { OperationalStats } from '../hooks/useActivityHubData';

// ============================================
// Types
// ============================================

interface ActivityStatsProps {
  activityStats: ActivityStatsType | null;
  updateStats: UpdateStats | null;
  operationalStats: OperationalStats | null;
  isLoading?: boolean;
}

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  badge?: {
    text: string;
    colorPalette: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({
                                             label,
                                             value,
                                             icon: IconComponent,
                                             color,
                                             subtitle,
                                             trend,
                                             badge,
                                           }) => {
  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return LuTrendingUp;
      case 'down':
        return LuTrendingDown;
      default:
        return LuMinus;
    }
  };

  const getTrendColor = () => {
    // For incidents/alerts, down is good. For guards on duty, up is good.
    if (label.includes('Incident') || label.includes('Alert') || label.includes('Gap')) {
      return trend?.direction === 'down' ? 'green.500' : trend?.direction === 'up' ? 'red.500' : 'gray.400';
    }
    return trend?.direction === 'up' ? 'green.500' : trend?.direction === 'down' ? 'red.500' : 'gray.400';
  };

  return (
    <Box
      bg="white"
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ boxShadow: 'md', borderColor: 'gray.300' }}
    >
      <HStack justify="space-between" mb={3}>
        <Box p={2} borderRadius="lg" bg={`${color}.50`}>
          <Icon as={IconComponent} boxSize={5} color={`${color}.500`} />
        </Box>
        {badge && (
          <Badge colorPalette={badge.colorPalette} variant="subtle" size="sm">
            {badge.text}
          </Badge>
        )}
      </HStack>

      <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1.2">
        {value}
      </Text>

      <HStack gap={2} mt={1}>
        <Text fontSize="sm" color="gray.500">
          {label}
        </Text>
        {trend && (
          <HStack gap={1}>
            <Icon as={getTrendIcon()} color={getTrendColor()} boxSize={3} />
            <Text fontSize="xs" color={getTrendColor()}>
              {trend.value}%
            </Text>
          </HStack>
        )}
      </HStack>

      {subtitle && (
        <Text fontSize="xs" color="gray.400" mt={1}>
          {subtitle}
        </Text>
      )}
    </Box>
  );
};

// ============================================
// Loading Skeleton
// ============================================

const StatCardSkeleton: React.FC = () => (
  <Box
    bg="white"
    p={4}
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
  >
    <HStack justify="space-between" mb={3}>
      <Skeleton height="36px" width="36px" borderRadius="lg" />
    </HStack>
    <Skeleton height="32px" width="60px" mb={2} />
    <Skeleton height="16px" width="100px" />
  </Box>
);

// ============================================
// Category Breakdown Component
// ============================================

interface CategoryBreakdownProps {
  byCategory: Record<string, number>;
}

const CATEGORY_DISPLAY: Record<string, { label: string; color: string }> = {
  shift: { label: 'Shift Activity', color: 'green.400' },
  incident: { label: 'Incidents', color: 'orange.400' },
  compliance: { label: 'Compliance', color: 'purple.400' },
  patrol: { label: 'Patrols', color: 'teal.400' },
  authentication: { label: 'Authentication', color: 'blue.400' },
  geofence: { label: 'Geofence', color: 'red.400' },
  task: { label: 'Tasks', color: 'cyan.400' },
  system: { label: 'System', color: 'gray.400' },
};

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ byCategory }) => {
  const categories = Object.entries(byCategory)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (categories.length === 0) {
    return (
      <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
        No activity recorded today
      </Text>
    );
  }

  const total = categories.reduce((sum, [, count]) => sum + count, 0);

  return (
    <VStack align="stretch" gap={2}>
      {categories.map(([category, count]) => {
        const config = CATEGORY_DISPLAY[category];
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <HStack key={category} gap={3}>
            <Box
              w={3}
              h={3}
              borderRadius="full"
              bg={config?.color || 'gray.400'}
              flexShrink={0}
            />
            <Text fontSize="sm" color="gray.600" flex={1}>
              {config?.label || category}
            </Text>
            <Text fontSize="sm" fontWeight="medium" color="gray.800">
              {count}
            </Text>
            <Text fontSize="xs" color="gray.400" w={10} textAlign="right">
              {percentage}%
            </Text>
          </HStack>
        );
      })}
    </VStack>
  );
};

// ============================================
// Severity Indicator Component
// ============================================

interface SeverityIndicatorProps {
  bySeverity: Record<string, number>;
}

const SeverityIndicator: React.FC<SeverityIndicatorProps> = ({ bySeverity }) => {
  return (
    <HStack gap={4} justify="center">
      <VStack gap={0}>
        <Text fontSize="lg" fontWeight="bold" color="red.500">
          {bySeverity.critical || 0}
        </Text>
        <Text fontSize="xs" color="gray.500">
          Critical
        </Text>
      </VStack>
      <Box h={8} w="1px" bg="gray.200" />
      <VStack gap={0}>
        <Text fontSize="lg" fontWeight="bold" color="orange.500">
          {bySeverity.warning || 0}
        </Text>
        <Text fontSize="xs" color="gray.500">
          Warning
        </Text>
      </VStack>
      <Box h={8} w="1px" bg="gray.200" />
      <VStack gap={0}>
        <Text fontSize="lg" fontWeight="bold" color="blue.500">
          {bySeverity.info || 0}
        </Text>
        <Text fontSize="xs" color="gray.500">
          Info
        </Text>
      </VStack>
    </HStack>
  );
};

// ============================================
// Main Component
// ============================================

const ActivityStats: React.FC<ActivityStatsProps> = ({
                                                       activityStats,
                                                       updateStats,
                                                       operationalStats,
                                                       isLoading = false,
                                                     }) => {
  // Show loading skeletons
  if (isLoading) {
    return (
      <VStack align="stretch" gap={4}>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </SimpleGrid>
      </VStack>
    );
  }

  // Calculate values with fallbacks
  const guardsOnDuty = operationalStats?.guardsOnDuty ?? 0;
  const guardsOnBreak = operationalStats?.guardsOnBreak ?? 0;
  const openIncidents = operationalStats?.openIncidents ?? 0;
  const unassignedShifts = operationalStats?.unassignedShifts ?? 0;
  const complianceAlerts = operationalStats?.complianceAlerts ?? 0;

  return (
    <VStack align="stretch" gap={4}>
      {/* Main Operational Stats Row */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        {/* Guards On Duty */}
        <StatCard
          label="Guards On Duty"
          value={guardsOnDuty}
          icon={LuShield}
          color="green"
          subtitle={guardsOnBreak > 0 ? `${guardsOnBreak} on break` : 'All active'}
          badge={
            guardsOnDuty > 0
              ? { text: 'Live', colorPalette: 'green' }
              : undefined
          }
        />

        {/* Open Incidents */}
        <StatCard
          label="Open Incidents"
          value={openIncidents}
          icon={LuTriangleAlert}
          color="orange"
          subtitle={
            activityStats?.recentCritical
              ? `${activityStats.recentCritical} critical today`
              : 'No critical today'
          }
          badge={
            openIncidents > 0
              ? { text: 'Action Required', colorPalette: 'orange' }
              : { text: 'All Clear', colorPalette: 'green' }
          }
        />

        {/* Coverage Gaps */}
        <StatCard
          label="Coverage Gaps"
          value={unassignedShifts}
          icon={LuCalendarX}
          color="red"
          subtitle="Unassigned shifts today"
          badge={
            unassignedShifts > 0
              ? { text: 'Needs Attention', colorPalette: 'red' }
              : { text: 'Fully Covered', colorPalette: 'green' }
          }
        />

        {/* Compliance Alerts */}
        <StatCard
          label="Compliance Alerts"
          value={complianceAlerts}
          icon={LuBadgeAlert}
          color="purple"
          subtitle="Expiring/expired certs"
          badge={
            complianceAlerts > 0
              ? { text: 'Review Required', colorPalette: 'purple' }
              : undefined
          }
        />
      </SimpleGrid>

      {/* Detailed Breakdown Row */}
      {activityStats && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {/* Activity by Category */}
          <Box
            bg="white"
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <HStack gap={2} mb={4}>
              <Icon as={LuActivity} color="blue.500" />
              <Text fontWeight="semibold" color="gray.800">
                Today's Activity
              </Text>
              <Badge colorPalette="blue" variant="subtle" size="sm" ml="auto">
                {activityStats.today.total} events
              </Badge>
            </HStack>
            <CategoryBreakdown byCategory={activityStats.today.byCategory} />
          </Box>

          {/* Severity Overview */}
          <Box
            bg="white"
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <HStack gap={2} mb={4}>
              <Icon as={LuTriangleAlert} color="orange.500" />
              <Text fontWeight="semibold" color="gray.800">
                Severity Overview
              </Text>
            </HStack>
            <SeverityIndicator bySeverity={activityStats.today.bySeverity} />

            <Box mt={4} pt={4} borderTopWidth="1px" borderColor="gray.100">
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">
                  Week Total
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="gray.800">
                  {activityStats.week.total} events
                </Text>
              </HStack>
              {updateStats && (
                <HStack justify="space-between" mt={2}>
                  <Text fontSize="sm" color="gray.500">
                    Unread Updates
                  </Text>
                  <Badge
                    colorPalette={updateStats.unread > 0 ? 'blue' : 'gray'}
                    variant="subtle"
                  >
                    {updateStats.unread}
                  </Badge>
                </HStack>
              )}
            </Box>
          </Box>
        </SimpleGrid>
      )}
    </VStack>
  );
};

export default ActivityStats;