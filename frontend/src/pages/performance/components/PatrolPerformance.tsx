/**
 * PatrolPerformance Component
 *
 * Displays patrol completion metrics, checkpoint scanning stats,
 * and recent patrol records for security operations.
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
  LuRoute,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuMapPin,
  LuCircleAlert,
  LuUser,
} from 'react-icons/lu';
import type {
  PatrolMetrics,
  PatrolRecord,
  PatrolStatus,
} from '../types/performance.types';

// ============================================
// Props Interface
// ============================================

interface PatrolPerformanceProps {
  metrics: PatrolMetrics | null;
  isLoading?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
};

const getStatusConfig = (status: PatrolStatus) => {
  const config: Record<PatrolStatus, { label: string; color: string; icon: React.ElementType }> = {
    completed: { label: 'Completed', color: 'green', icon: LuCircleCheck },
    'in-progress': { label: 'In Progress', color: 'blue', icon: LuClock },
    partial: { label: 'Partial', color: 'yellow', icon: LuCircleAlert },
    missed: { label: 'Missed', color: 'red', icon: LuCircleX },
  };
  return config[status];
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
}

const SummaryCard: React.FC<SummaryCardProps> = ({
                                                   title,
                                                   value,
                                                   subtitle,
                                                   icon,
                                                   color,
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
        <Text fontSize="xl" fontWeight="bold" color="gray.800">
          {value}
        </Text>
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
// Patrol Record Row Component
// ============================================

interface PatrolRowProps {
  patrol: PatrolRecord;
}

const PatrolRow: React.FC<PatrolRowProps> = ({ patrol }) => {
  const statusConfig = getStatusConfig(patrol.status);
  const checkpointRate = patrol.checkpoints.total > 0
    ? (patrol.checkpoints.scanned / patrol.checkpoints.total) * 100
    : 0;

  return (
    <Table.Row _hover={{ bg: 'gray.50' }}>
      <Table.Cell>
        <VStack align="flex-start" gap={0}>
          <Text fontWeight="medium" color="gray.800">
            {patrol.tourName}
          </Text>
          <HStack gap={1} color="gray.500" fontSize="xs">
            <Icon as={LuMapPin} boxSize={3} />
            <Text>{patrol.site}</Text>
          </HStack>
        </VStack>
      </Table.Cell>

      <Table.Cell>
        <HStack gap={2}>
          <Icon as={LuUser} boxSize={4} color="gray.400" />
          <Text fontSize="sm" color="gray.600">
            {patrol.officerName}
          </Text>
        </HStack>
      </Table.Cell>

      <Table.Cell>
        <VStack align="flex-start" gap={0}>
          <Text fontSize="sm" color="gray.700">
            {formatTime(patrol.scheduledTime)}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {formatDate(patrol.scheduledTime)}
          </Text>
        </VStack>
      </Table.Cell>

      <Table.Cell>
        <VStack align="flex-start" gap={1}>
          <HStack gap={2}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              {patrol.checkpoints.scanned}/{patrol.checkpoints.total}
            </Text>
            {patrol.checkpoints.missed > 0 && (
              <Badge colorPalette="red" variant="subtle" size="sm">
                {patrol.checkpoints.missed} missed
              </Badge>
            )}
          </HStack>
          <Progress.Root
            value={checkpointRate}
            size="xs"
            colorPalette={checkpointRate === 100 ? 'green' : checkpointRate >= 75 ? 'yellow' : 'red'}
            w={20}
          >
            <Progress.Track bg="gray.100">
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </VStack>
      </Table.Cell>

      <Table.Cell>
        {patrol.duration ? (
          <HStack gap={1}>
            <Text fontSize="sm" color="gray.700">
              {patrol.duration} min
            </Text>
            <Text fontSize="xs" color="gray.400">
              / {patrol.expectedDuration}
            </Text>
          </HStack>
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
        {patrol.exceptions > 0 ? (
          <Badge colorPalette="orange" variant="subtle">
            {patrol.exceptions} exception{patrol.exceptions > 1 ? 's' : ''}
          </Badge>
        ) : (
          <Text fontSize="sm" color="gray.400">None</Text>
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
// Officer Breakdown Component
// ============================================

interface OfficerBreakdownProps {
  data: PatrolMetrics['byOfficer'];
}

const OfficerBreakdown: React.FC<OfficerBreakdownProps> = ({ data }) => (
  <Box
    bg="white"
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
    overflow="hidden"
  >
    <Box p={4} borderBottomWidth="1px" borderColor="gray.100">
      <Text fontWeight="semibold" color="gray.800">
        By Officer
      </Text>
    </Box>
    <VStack align="stretch" gap={0} divideY="1px" divideColor="gray.100">
      {data.slice(0, 5).map((officer) => (
        <HStack key={officer.officerId} p={3} justify="space-between">
          <VStack align="flex-start" gap={0}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              {officer.officerName}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {officer.completed}/{officer.tours} patrols
            </Text>
          </VStack>
          <HStack gap={2}>
            <Progress.Root
              value={officer.rate}
              size="sm"
              colorPalette={officer.rate >= 90 ? 'green' : officer.rate >= 75 ? 'yellow' : 'red'}
              w={16}
            >
              <Progress.Track bg="gray.100">
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" w={12} textAlign="right">
              {officer.rate.toFixed(0)}%
            </Text>
          </HStack>
        </HStack>
      ))}
    </VStack>
  </Box>
);

// ============================================
// Site Breakdown Component
// ============================================

interface SiteBreakdownProps {
  data: PatrolMetrics['bySite'];
}

const SiteBreakdown: React.FC<SiteBreakdownProps> = ({ data }) => (
  <Box
    bg="white"
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
    overflow="hidden"
  >
    <Box p={4} borderBottomWidth="1px" borderColor="gray.100">
      <Text fontWeight="semibold" color="gray.800">
        By Site
      </Text>
    </Box>
    <VStack align="stretch" gap={0} divideY="1px" divideColor="gray.100">
      {data.slice(0, 5).map((site) => (
        <HStack key={site.siteId} p={3} justify="space-between">
          <VStack align="flex-start" gap={0}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              {site.siteName}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {site.completed}/{site.tours} patrols
            </Text>
          </VStack>
          <HStack gap={2}>
            <Progress.Root
              value={site.rate}
              size="sm"
              colorPalette={site.rate >= 90 ? 'green' : site.rate >= 75 ? 'yellow' : 'red'}
              w={16}
            >
              <Progress.Track bg="gray.100">
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" w={12} textAlign="right">
              {site.rate.toFixed(0)}%
            </Text>
          </HStack>
        </HStack>
      ))}
    </VStack>
  </Box>
);

// ============================================
// Main Component
// ============================================

const PatrolPerformance: React.FC<PatrolPerformanceProps> = ({
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
          title="Completion Rate"
          value={`${metrics.summary.completionRate.toFixed(1)}%`}
          subtitle={`${metrics.summary.completed} of ${metrics.summary.totalTours} tours`}
          icon={LuRoute}
          color="blue"
        />
        <SummaryCard
          title="Checkpoint Accuracy"
          value={`${metrics.checkpointStats.scanAccuracy.toFixed(1)}%`}
          subtitle={`${metrics.checkpointStats.missedScans} missed scans`}
          icon={LuCircleCheck}
          color="green"
        />
        <SummaryCard
          title="Avg Scan Time"
          value={`${metrics.checkpointStats.avgScanTime}s`}
          subtitle="per checkpoint"
          icon={LuClock}
          color="purple"
        />
        <SummaryCard
          title="Partial/Missed"
          value={metrics.summary.partial + metrics.summary.missed}
          subtitle={`${metrics.summary.partial} partial, ${metrics.summary.missed} missed`}
          icon={LuCircleAlert}
          color="orange"
        />
      </SimpleGrid>

      {/* Breakdown Sections */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        <OfficerBreakdown data={metrics.byOfficer} />
        <SiteBreakdown data={metrics.bySite} />
      </SimpleGrid>

      {/* Recent Patrols Table */}
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
              Recent Patrols
            </Text>
            <Badge colorPalette="blue" variant="subtle">
              Last 24 hours
            </Badge>
          </HStack>
        </Box>

        {metrics.recentPatrols.length > 0 ? (
          <Box overflowX="auto">
            <Table.Root variant="line">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Tour</Table.ColumnHeader>
                  <Table.ColumnHeader>Officer</Table.ColumnHeader>
                  <Table.ColumnHeader>Scheduled</Table.ColumnHeader>
                  <Table.ColumnHeader>Checkpoints</Table.ColumnHeader>
                  <Table.ColumnHeader>Duration</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Exceptions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {metrics.recentPatrols.map((patrol) => (
                  <PatrolRow key={patrol.id} patrol={patrol} />
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        ) : (
          <Flex justify="center" py={8}>
            <VStack gap={2}>
              <Icon as={LuRoute} boxSize={8} color="gray.300" />
              <Text color="gray.500">No patrols recorded yet</Text>
            </VStack>
          </Flex>
        )}
      </Box>
    </VStack>
  );
};

export default PatrolPerformance;