import React from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiMapPin,
  FiShield,
  FiClipboard,
} from 'react-icons/fi';
import type { OperationalMetrics as MetricsType, DashboardMetric } from '../types/dashboard.types';

// ============================================
// Types
// ============================================

interface OperationalMetricsProps {
  metrics: MetricsType | null;
  isLoading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  status: 'success' | 'warning' | 'danger' | 'neutral';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  unit?: string;
  onClick?: () => void;
}

// ============================================
// Status Color Mapping
// ============================================

const statusColors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: 'green.50',
    border: 'green.200',
    icon: 'green.500',
    text: 'green.700',
  },
  warning: {
    bg: 'orange.50',
    border: 'orange.200',
    icon: 'orange.500',
    text: 'orange.700',
  },
  danger: {
    bg: 'red.50',
    border: 'red.200',
    icon: 'red.500',
    text: 'red.700',
  },
  neutral: {
    bg: 'gray.50',
    border: 'gray.200',
    icon: 'gray.500',
    text: 'gray.700',
  },
};

// ============================================
// Stat Card Component
// ============================================

const StatCard: React.FC<StatCardProps> = ({
                                             label,
                                             value,
                                             icon,
                                             status,
                                             trend,
                                             unit,
                                             onClick,
                                           }) => {
  const colors = statusColors[status];

  return (
    <Box
      bg="white"
      p={5}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={colors.border}
      boxShadow="sm"
      transition="all 0.2s"
      cursor={onClick ? 'pointer' : 'default'}
      _hover={onClick ? {
        boxShadow: 'md',
        transform: 'translateY(-2px)',
        borderColor: colors.icon,
      } : undefined}
      onClick={onClick}
    >
      <HStack justify="space-between" align="flex-start">
        <VStack align="flex-start" gap={1}>
          <Text
            fontSize="xs"
            fontWeight="medium"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            {label}
          </Text>
          <HStack align="baseline" gap={1}>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              color={colors.text}
              lineHeight="1"
            >
              {value}
            </Text>
            {unit && (
              <Text fontSize="sm" color="gray.500">
                {unit}
              </Text>
            )}
          </HStack>
          {trend && (
            <HStack gap={1}>
              <Text
                fontSize="xs"
                color={trend.direction === 'up' ? 'green.500' : trend.direction === 'down' ? 'red.500' : 'gray.500'}
              >
                {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
                {' '}{Math.abs(trend.value)}%
              </Text>
              <Text fontSize="xs" color="gray.400">vs last week</Text>
            </HStack>
          )}
        </VStack>
        <Box
          p={3}
          bg={colors.bg}
          borderRadius="lg"
        >
          <Icon as={icon} boxSize={6} color={colors.icon} />
        </Box>
      </HStack>
    </Box>
  );
};

// ============================================
// Loading Skeleton
// ============================================

const StatCardSkeleton: React.FC = () => (
  <Box
    bg="white"
    p={5}
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
  >
    <HStack justify="space-between" align="flex-start">
      <VStack align="flex-start" gap={2}>
        <Box bg="gray.100" h={3} w={20} borderRadius="md" />
        <Box bg="gray.100" h={8} w={16} borderRadius="md" />
      </VStack>
      <Box bg="gray.100" p={3} borderRadius="lg" h={12} w={12} />
    </HStack>
  </Box>
);

// ============================================
// Main Component
// ============================================

const OperationalMetrics: React.FC<OperationalMetricsProps> = ({
                                                                 metrics,
                                                                 isLoading = false
                                                               }) => {
  if (isLoading || !metrics) {
    return (
      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={4}>
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </SimpleGrid>
    );
  }

  // Calculate statuses based on thresholds
  const getAttendanceStatus = (rate: number) => {
    if (rate >= 95) return 'success';
    if (rate >= 85) return 'warning';
    return 'danger';
  };

  const getCoverageStatus = (covered: number, total: number) => {
    const rate = total > 0 ? (covered / total) * 100 : 0;
    if (rate >= 95) return 'success';
    if (rate >= 80) return 'warning';
    return 'danger';
  };

  const getIncidentStatus = (count: number) => {
    if (count === 0) return 'success';
    if (count <= 3) return 'warning';
    return 'danger';
  };

  const getComplianceStatus = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  const metricsConfig: StatCardProps[] = [
    {
      label: 'Active Guards',
      value: `${metrics.activeGuards}/${metrics.totalScheduled}`,
      icon: FiUsers,
      status: getCoverageStatus(metrics.activeGuards, metrics.totalScheduled),
    },
    {
      label: 'Shifts Today',
      value: `${metrics.shiftsCovered}/${metrics.shiftsToday}`,
      icon: FiCalendar,
      status: getCoverageStatus(metrics.shiftsCovered, metrics.shiftsToday),
    },
    {
      label: 'Attendance Rate',
      value: metrics.attendanceRate.toFixed(1),
      unit: '%',
      icon: FiClock,
      status: getAttendanceStatus(metrics.attendanceRate),
    },
    {
      label: 'Patrol Completion',
      value: metrics.patrolCompletionRate.toFixed(1),
      unit: '%',
      icon: FiCheckCircle,
      status: getAttendanceStatus(metrics.patrolCompletionRate),
    },
    {
      label: 'Open Incidents',
      value: metrics.openIncidents,
      icon: FiAlertTriangle,
      status: getIncidentStatus(metrics.openIncidents),
    },
    {
      label: 'Pending Tasks',
      value: metrics.pendingTasks,
      icon: FiClipboard,
      status: metrics.pendingTasks > 10 ? 'warning' : 'neutral',
    },
    {
      label: 'Geofence Alerts',
      value: metrics.geofenceViolations,
      icon: FiMapPin,
      status: metrics.geofenceViolations > 0 ? 'danger' : 'success',
    },
    {
      label: 'Compliance Score',
      value: metrics.complianceScore,
      unit: '%',
      icon: FiShield,
      status: getComplianceStatus(metrics.complianceScore),
    },
  ];

  return (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={4}>
      {metricsConfig.map((metric, index) => (
        <StatCard key={index} {...metric} />
      ))}
    </SimpleGrid>
  );
};

export default OperationalMetrics;