/**
 * PerformanceOverview Component
 *
 * Displays summary KPI cards for security operations performance.
 * Shows patrol completion, attendance, incident response, and compliance metrics.
 */

import React from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Icon,
  Progress,
} from '@chakra-ui/react';
import {
  LuRoute,
  LuClock,
  LuTriangleAlert,
  LuMapPin,
  LuCircleCheck,
  LuUsers,
  LuTrendingUp,
  LuTrendingDown,
  LuMinus,
} from 'react-icons/lu';
import type { OverviewMetrics, TrendDirection } from '../types/performance.types';

// ============================================
// Props Interface
// ============================================

interface PerformanceOverviewProps {
  metrics: OverviewMetrics | null;
  isLoading?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const getTrendIcon = (direction: TrendDirection) => {
  switch (direction) {
    case 'up': return LuTrendingUp;
    case 'down': return LuTrendingDown;
    default: return LuMinus;
  }
};

const getTrendColor = (direction: TrendDirection, isPositiveGood = true) => {
  if (direction === 'stable') return 'gray.500';
  if (direction === 'up') return isPositiveGood ? 'green.500' : 'red.500';
  return isPositiveGood ? 'red.500' : 'green.500';
};

const getStatusColor = (value: number, thresholds = { good: 90, warning: 75 }) => {
  if (value >= thresholds.good) return 'green';
  if (value >= thresholds.warning) return 'yellow';
  return 'red';
};

// ============================================
// Metric Card Component
// ============================================

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  progress?: number;
  trend?: {
    direction: TrendDirection;
    value: number;
    isPositiveGood?: boolean;
  };
  details?: { label: string; value: string | number }[];
}

const MetricCard: React.FC<MetricCardProps> = ({
                                                 title,
                                                 value,
                                                 unit,
                                                 icon,
                                                 color,
                                                 subtitle,
                                                 progress,
                                                 trend,
                                                 details,
                                               }) => (
  <Box
    bg="white"
    p={5}
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
    _hover={{ shadow: 'md', borderColor: `${color}.200` }}
    transition="all 0.2s"
  >
    <HStack justify="space-between" align="flex-start" mb={3}>
      <VStack align="flex-start" gap={1}>
        <Text fontSize="sm" color="gray.500" fontWeight="medium">
          {title}
        </Text>
        <HStack align="baseline" gap={1}>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            {value}
          </Text>
          {unit && (
            <Text fontSize="sm" color="gray.500">
              {unit}
            </Text>
          )}
        </HStack>
        {subtitle && (
          <Text fontSize="xs" color="gray.400">
            {subtitle}
          </Text>
        )}
      </VStack>
      <Box
        p={3}
        bg={`${color}.50`}
        borderRadius="lg"
        color={`${color}.500`}
      >
        <Icon as={icon} boxSize={5} />
      </Box>
    </HStack>

    {progress !== undefined && (
      <Box mb={3}>
        <Progress.Root
          value={progress}
          size="sm"
          colorPalette={getStatusColor(progress)}
          borderRadius="full"
        >
          <Progress.Track bg="gray.100">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Box>
    )}

    {trend && (
      <HStack gap={2} mb={details ? 3 : 0}>
        <Icon
          as={getTrendIcon(trend.direction)}
          boxSize={4}
          color={getTrendColor(trend.direction, trend.isPositiveGood !== false)}
        />
        <Text
          fontSize="sm"
          color={getTrendColor(trend.direction, trend.isPositiveGood !== false)}
        >
          {trend.value}% vs last period
        </Text>
      </HStack>
    )}

    {details && details.length > 0 && (
      <HStack
        gap={4}
        pt={3}
        borderTopWidth="1px"
        borderColor="gray.100"
        flexWrap="wrap"
      >
        {details.map((detail, idx) => (
          <VStack key={idx} gap={0} align="flex-start">
            <Text fontSize="xs" color="gray.400">
              {detail.label}
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              {detail.value}
            </Text>
          </VStack>
        ))}
      </HStack>
    )}
  </Box>
);

// ============================================
// Loading Skeleton
// ============================================

const MetricCardSkeleton: React.FC = () => (
  <Box
    bg="white"
    p={5}
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
  >
    <HStack justify="space-between" align="flex-start">
      <VStack align="flex-start" gap={2}>
        <Box bg="gray.100" h={3} w={24} borderRadius="md" />
        <Box bg="gray.100" h={8} w={16} borderRadius="md" />
      </VStack>
      <Box bg="gray.100" p={3} borderRadius="lg" h={11} w={11} />
    </HStack>
  </Box>
);

// ============================================
// Main Component
// ============================================

const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({
                                                                   metrics,
                                                                   isLoading = false,
                                                                 }) => {
  if (isLoading || !metrics) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
      {/* Patrol Completion */}
      <MetricCard
        title="Patrol Completion"
        value={metrics.patrolCompletion.rate.toFixed(1)}
        unit="%"
        icon={LuRoute}
        color="blue"
        progress={metrics.patrolCompletion.rate}
        trend={{
          direction: metrics.patrolCompletion.trend,
          value: metrics.patrolCompletion.trendValue,
        }}
        details={[
          { label: 'Completed', value: metrics.patrolCompletion.completed },
          { label: 'Scheduled', value: metrics.patrolCompletion.scheduled },
        ]}
      />

      {/* Attendance Rate */}
      <MetricCard
        title="Attendance Rate"
        value={metrics.attendance.rate.toFixed(1)}
        unit="%"
        icon={LuUsers}
        color="green"
        progress={metrics.attendance.rate}
        trend={{
          direction: metrics.attendance.trend,
          value: metrics.attendance.trendValue,
        }}
        details={[
          { label: 'On Time', value: metrics.attendance.onTime },
          { label: 'Late', value: metrics.attendance.late },
          { label: 'No Show', value: metrics.attendance.noShow },
        ]}
      />

      {/* Incident Response */}
      <MetricCard
        title="Avg Response Time"
        value={metrics.incidentResponse.averageTime.toFixed(1)}
        unit="min"
        icon={LuTriangleAlert}
        color="orange"
        subtitle={`${metrics.incidentResponse.resolvedWithinSLA}/${metrics.incidentResponse.total} within SLA`}
        trend={{
          direction: metrics.incidentResponse.trend,
          value: metrics.incidentResponse.trendValue,
          isPositiveGood: false,
        }}
      />

      {/* Checkpoint Scans */}
      <MetricCard
        title="Checkpoint Accuracy"
        value={metrics.checkpointScans.rate.toFixed(1)}
        unit="%"
        icon={LuCircleCheck}
        color="purple"
        progress={metrics.checkpointScans.rate}
        trend={{
          direction: metrics.checkpointScans.trend,
          value: metrics.checkpointScans.trendValue,
        }}
        details={[
          { label: 'Scanned', value: metrics.checkpointScans.completed },
          { label: 'Missed', value: metrics.checkpointScans.missed },
        ]}
      />

      {/* Geofence Compliance */}
      <MetricCard
        title="Geofence Compliance"
        value={metrics.geofenceCompliance.rate.toFixed(1)}
        unit="%"
        icon={LuMapPin}
        color="teal"
        progress={metrics.geofenceCompliance.rate}
        trend={{
          direction: metrics.geofenceCompliance.trend,
          value: metrics.geofenceCompliance.trendValue,
        }}
        details={[
          { label: 'Violations', value: metrics.geofenceCompliance.violations },
        ]}
      />

      {/* Shift Completion */}
      <MetricCard
        title="Shift Completion"
        value={metrics.shiftCompletion.rate.toFixed(1)}
        unit="%"
        icon={LuClock}
        color="cyan"
        progress={metrics.shiftCompletion.rate}
        details={[
          { label: 'Completed', value: metrics.shiftCompletion.completed },
          { label: 'Early Exit', value: metrics.shiftCompletion.early },
          { label: 'Incomplete', value: metrics.shiftCompletion.incomplete },
        ]}
      />
    </SimpleGrid>
  );
};

export default PerformanceOverview;