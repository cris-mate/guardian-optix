/**
 * AttendancePerformance Component
 *
 * Displays attendance metrics, punctuality rates,
 * and recent attendance records for security officers.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  SimpleGrid,
  Table,
  Progress,
  Flex,
} from '@chakra-ui/react';
import {
  LuClock,
  LuCircleCheck,
  LuTriangleAlert,
  LuCircleX,
  LuUser,
  LuMapPin,
  LuCalendar,
  LuTrendingDown,
  LuTrendingUp,
} from 'react-icons/lu';
import type {
  AttendanceMetrics,
  AttendanceRecord,
  AttendanceStatus,
} from '../../../types/performance.types';

// ============================================
// Props Interface
// ============================================

interface AttendancePerformanceProps {
  metrics: AttendanceMetrics | null;
  isLoading?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const formatTime = (time: string) => {
  // Handle HH:mm format
  if (time.includes(':') && !time.includes('T')) {
    return time;
  }
  // Handle ISO format
  return new Date(time).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
};

const getStatusConfig = (status: AttendanceStatus) => {
  const config: Record<AttendanceStatus, { label: string; color: string; icon: React.ElementType }> = {
    'on-time': { label: 'On Time', color: 'green', icon: LuCircleCheck },
    late: { label: 'Late', color: 'orange', icon: LuClock },
    early: { label: 'Early', color: 'blue', icon: LuClock },
    'no-show': { label: 'No Show', color: 'red', icon: LuCircleX },
    excused: { label: 'Excused', color: 'gray', icon: LuCalendar },
  };
  return config[status];
};

const formatVariance = (minutes: number) => {
  if (minutes === 0) return 'On time';
  const absMinutes = Math.abs(minutes);
  if (minutes < 0) return `${absMinutes}m early`;
  return `${absMinutes}m late`;
};

// ============================================
// Summary Card Component
// ============================================

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: {
    direction: 'up' | 'down';
    isPositive?: boolean;
  };
}

const SummaryCard: React.FC<SummaryCardProps> = ({
                                                   title,
                                                   value,
                                                   subtitle,
                                                   icon,
                                                   color,
                                                   trend,
                                                 }) => (
  <Box
    bg="white"
    p={4}
    borderRadius="lg"
    borderWidth="1px"
    borderColor="gray.200"
  >
    <HStack justify="space-between" align="flex-start">
      <VStack align="flex-start" gap={1}>
        <Text fontSize="sm" color="gray.500">
          {title}
        </Text>
        <HStack gap={2} align="baseline">
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            {value}
          </Text>
          {trend && (
            <Icon
              as={trend.direction === 'up' ? LuTrendingUp : LuTrendingDown}
              boxSize={4}
              color={
                trend.isPositive !== undefined
                  ? trend.isPositive ? 'green.500' : 'red.500'
                  : trend.direction === 'up' ? 'green.500' : 'red.500'
              }
            />
          )}
        </HStack>
        {subtitle && (
          <Text fontSize="xs" color="gray.400">
            {subtitle}
          </Text>
        )}
      </VStack>
      <Box p={2} bg={`${color}.50`} borderRadius="md">
        <Icon as={icon} boxSize={5} color={`${color}.500`} />
      </Box>
    </HStack>
  </Box>
);

// ============================================
// Attendance Record Row Component
// ============================================

interface AttendanceRowProps {
  record: AttendanceRecord;
}

const AttendanceRow: React.FC<AttendanceRowProps> = ({ record }) => {
  const statusConfig = getStatusConfig(record.status);

  return (
    <Table.Row _hover={{ bg: 'gray.50' }}>
      <Table.Cell>
        <VStack align="flex-start" gap={0}>
          <Text fontWeight="medium" color="gray.800">
            {record.officerName}
          </Text>
          <HStack gap={1} color="gray.500" fontSize="xs">
            <Icon as={LuMapPin} boxSize={3} />
            <Text>{record.site}</Text>
          </HStack>
        </VStack>
      </Table.Cell>

      <Table.Cell>
        <Text fontSize="sm" color="gray.600">
          {formatDate(record.date)}
        </Text>
      </Table.Cell>

      <Table.Cell>
        <VStack align="flex-start" gap={0}>
          <Text fontSize="sm" color="gray.700">
            {record.scheduledStart} - {record.scheduledEnd}
          </Text>
          {record.actualStart && (
            <Text fontSize="xs" color="gray.400">
              Actual: {formatTime(record.actualStart)}
              {record.actualEnd ? ` - ${formatTime(record.actualEnd)}` : ' (ongoing)'}
            </Text>
          )}
        </VStack>
      </Table.Cell>

      <Table.Cell>
        <HStack gap={2}>
          <Badge
            colorPalette={record.variance === 0 ? 'green' : record.variance < 0 ? 'blue' : 'orange'}
            variant="subtle"
          >
            {formatVariance(record.variance)}
          </Badge>
        </HStack>
      </Table.Cell>

      <Table.Cell>
        {record.hoursWorked !== undefined ? (
          <Text fontSize="sm" color="gray.700">
            {record.hoursWorked.toFixed(1)}h
          </Text>
        ) : (
          <Text fontSize="sm" color="gray.400">-</Text>
        )}
      </Table.Cell>

      <Table.Cell>
        <Badge
          colorPalette={statusConfig.color}
          variant="subtle"
        >
          <HStack gap={1}>
            <Icon as={statusConfig.icon} boxSize={3} />
            <Text>{statusConfig.label}</Text>
          </HStack>
        </Badge>
      </Table.Cell>

      <Table.Cell>
        {record.isGeofenceVerified ? (
          <Badge colorPalette="green" variant="subtle">
            <HStack gap={1}>
              <Icon as={LuCircleCheck} boxSize={3} />
              <Text>Verified</Text>
            </HStack>
          </Badge>
        ) : (
          <Badge colorPalette="gray" variant="subtle">
            Unverified
          </Badge>
        )}
      </Table.Cell>
    </Table.Row>
  );
};

// ============================================
// Loading Skeleton
// ============================================

const LoadingSkeleton: React.FC = () => (
  <VStack align="stretch" gap={4}>
    <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Box key={i} bg="white" p={4} borderRadius="lg" borderWidth="1px" borderColor="gray.200">
          <VStack align="flex-start" gap={2}>
            <Box bg="gray.100" h={3} w={20} borderRadius="md" />
            <Box bg="gray.100" h={6} w={12} borderRadius="md" />
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
    <Box bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200" h={64} />
  </VStack>
);

// ============================================
// Officer Punctuality Breakdown
// ============================================

interface OfficerPunctualityProps {
  data: AttendanceMetrics['byOfficer'];
}

const OfficerPunctuality: React.FC<OfficerPunctualityProps> = ({ data }) => {
  // Sort by punctuality rate descending
  const sortedData = [...data].sort((a, b) => b.punctualityRate - a.punctualityRate);

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      <Box p={4} borderBottomWidth="1px" borderColor="gray.100">
        <Text fontWeight="semibold" color="gray.800">
          Punctuality by Officer
        </Text>
      </Box>
      <VStack align="stretch" gap={0} divideY="1px" divideColor="gray.100">
        {sortedData.map((officer) => (
          <HStack key={officer.officerId} p={3} justify="space-between">
            <VStack align="flex-start" gap={0}>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                {officer.officerName}
              </Text>
              <HStack gap={3} fontSize="xs" color="gray.400">
                <Text>{officer.shifts} shifts</Text>
                <Text>•</Text>
                <Text color={officer.late > 0 ? 'orange.500' : 'gray.400'}>
                  {officer.late} late
                </Text>
                <Text>•</Text>
                <Text color={officer.noShow > 0 ? 'red.500' : 'gray.400'}>
                  {officer.noShow} no-show
                </Text>
              </HStack>
            </VStack>
            <HStack gap={2}>
              <Progress.Root
                value={officer.punctualityRate}
                size="sm"
                colorPalette={
                  officer.punctualityRate >= 95
                    ? 'green'
                    : officer.punctualityRate >= 80
                      ? 'yellow'
                      : 'red'
                }
                w={16}
              >
                <Progress.Track bg="gray.100">
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={
                  officer.punctualityRate >= 95
                    ? 'green.600'
                    : officer.punctualityRate >= 80
                      ? 'yellow.600'
                      : 'red.600'
                }
                w={12}
                textAlign="right"
              >
                {officer.punctualityRate.toFixed(0)}%
              </Text>
            </HStack>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

// ============================================
// Attendance Distribution Chart
// ============================================

interface AttendanceDistributionProps {
  summary: AttendanceMetrics['summary'];
}

const AttendanceDistribution: React.FC<AttendanceDistributionProps> = ({ summary }) => {
  const total = summary.totalShifts;
  const distribution = [
    { label: 'On Time', value: summary.onTime, color: 'green.500' },
    { label: 'Late', value: summary.late, color: 'orange.500' },
    { label: 'Early', value: summary.early, color: 'blue.500' },
    { label: 'No Show', value: summary.noShow, color: 'red.500' },
  ];

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      <Box p={4} borderBottomWidth="1px" borderColor="gray.100">
        <Text fontWeight="semibold" color="gray.800">
          Attendance Distribution
        </Text>
      </Box>
      <VStack align="stretch" p={4} gap={3}>
        {/* Stacked bar */}
        <HStack h={8} borderRadius="md" overflow="hidden" gap={0}>
          {distribution.map((item, idx) => {
            const width = total > 0 ? (item.value / total) * 100 : 0;
            if (width === 0) return null;
            return (
              <Box
                key={idx}
                bg={item.color}
                h="full"
                w={`${width}%`}
                minW={item.value > 0 ? '2px' : 0}
              />
            );
          })}
        </HStack>

        {/* Legend */}
        <SimpleGrid columns={2} gap={2}>
          {distribution.map((item, idx) => (
            <HStack key={idx} gap={2}>
              <Box w={3} h={3} borderRadius="sm" bg={item.color} />
              <Text fontSize="sm" color="gray.600">
                {item.label}
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                {item.value}
              </Text>
              <Text fontSize="xs" color="gray.400">
                ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
              </Text>
            </HStack>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

// ============================================
// Main Component
// ============================================

const AttendancePerformance: React.FC<AttendancePerformanceProps> = ({
                                                                       metrics,
                                                                       isLoading = false,
                                                                     }) => {
  if (isLoading || !metrics) {
    return <LoadingSkeleton />;
  }

  return (
    <VStack align="stretch" gap={6}>
      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <SummaryCard
          title="Attendance Rate"
          value={`${metrics.summary.attendanceRate.toFixed(1)}%`}
          subtitle={`${metrics.summary.totalShifts - metrics.summary.noShow} of ${metrics.summary.totalShifts} shifts`}
          icon={LuUser}
          color="blue"
        />
        <SummaryCard
          title="Punctuality Rate"
          value={`${metrics.summary.punctualityRate.toFixed(1)}%`}
          subtitle={`${metrics.summary.onTime} on-time arrivals`}
          icon={LuClock}
          color="green"
        />
        <SummaryCard
          title="Late Arrivals"
          value={metrics.lateArrivals.count}
          subtitle={`Avg ${metrics.lateArrivals.avgMinutesLate} min late`}
          icon={LuTriangleAlert}
          color="orange"
          trend={{
            direction: metrics.lateArrivals.trend === 'down' ? 'down' : 'up',
            isPositive: metrics.lateArrivals.trend === 'down',
          }}
        />
        <SummaryCard
          title="No Shows"
          value={metrics.summary.noShow}
          subtitle="this period"
          icon={LuCircleX}
          color="red"
        />
      </SimpleGrid>

      {/* Breakdown Sections */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        <OfficerPunctuality data={metrics.byOfficer} />
        <AttendanceDistribution summary={metrics.summary} />
      </SimpleGrid>

      {/* Recent Records Table */}
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        <Box p={4} borderBottomWidth="1px" borderColor="gray.100">
          <HStack justify="space-between">
            <Text fontWeight="semibold" color="gray.800">
              Recent Attendance
            </Text>
            <Badge colorPalette="blue" variant="subtle">
              Last 48 hours
            </Badge>
          </HStack>
        </Box>

        {metrics.recentRecords.length > 0 ? (
          <Box overflowX="auto">
            <Table.Root variant="line">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Officer</Table.ColumnHeader>
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader>Shift</Table.ColumnHeader>
                  <Table.ColumnHeader>Variance</Table.ColumnHeader>
                  <Table.ColumnHeader>Hours</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>GPS</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {metrics.recentRecords.map((record) => (
                  <AttendanceRow key={record.id} record={record} />
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        ) : (
          <Flex justify="center" py={8}>
            <VStack gap={2}>
              <Icon as={LuCalendar} boxSize={8} color="gray.300" />
              <Text color="gray.500">No attendance records yet</Text>
            </VStack>
          </Flex>
        )}
      </Box>
    </VStack>
  );
};

export default AttendancePerformance;