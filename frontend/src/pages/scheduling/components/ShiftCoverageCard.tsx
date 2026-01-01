/**
 * ShiftCoverageCard Component
 *
 * Displays shift coverage statistics.
 * Shows total shifts, unassigned count, and sites needing attention.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  Spinner,
  Icon,
} from '@chakra-ui/react';
import {
  LuCalendarClock,
  LuUserX,
  LuTriangleAlert,
  LuCircleCheck,
  LuMapPin,
} from 'react-icons/lu';
import type { ActivityHubStats } from '../hooks/useShiftCoverage';

// ============================================
// Types
// ============================================

interface ShiftCoverageCardProps {
  stats: ActivityHubStats | null;
  isLoading: boolean;
}

// ============================================
// Sub-components
// ============================================

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color = 'gray.600' }) => (
  <HStack gap={3} p={3} bg="gray.50" borderRadius="md" flex={1}>
    <Box p={2} borderRadius="md" bg={`${color.split('.')[0]}.100`}>
      <Icon as={icon} boxSize={5} color={color} />
    </Box>
    <Box>
      <Text fontSize="xs" color="gray.500" fontWeight="medium">
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="bold" color={color}>
        {value}
      </Text>
    </Box>
  </HStack>
);

// ============================================
// Main Component
// ============================================

const ShiftCoverageCard: React.FC<ShiftCoverageCardProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <Box bg="white" p={6} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.100">
        <HStack justify="center" py={8}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.500">Loading coverage stats...</Text>
        </HStack>
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  const { summary, attention, dateRange } = stats;
  const coverageColor = summary.coveragePercentage >= 90
    ? 'green'
    : summary.coveragePercentage >= 70
      ? 'yellow'
      : 'red';

  return (
    <Box bg="white" p={6} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.100">
      <VStack align="stretch" gap={4}>
        {/* Header */}
        <HStack justify="space-between">
          <HStack gap={2}>
            <Icon as={LuCalendarClock} boxSize={5} color="blue.500" />
            <Text fontWeight="semibold" fontSize="lg">
              Shift Coverage
            </Text>
          </HStack>
          <Badge colorPalette="gray" variant="subtle" fontSize="xs">
            Next {dateRange.days} days
          </Badge>
        </HStack>

        {/* Coverage Progress */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.600">
              Overall Coverage
            </Text>
            <Text fontWeight="bold" color={`${coverageColor}.600`}>
              {summary.coveragePercentage}%
            </Text>
          </HStack>
          <Progress.Root value={summary.coveragePercentage} size="lg" borderRadius="full">
            <Progress.Track bg="gray.100">
              <Progress.Range bg={`${coverageColor}.500`} />
            </Progress.Track>
          </Progress.Root>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {summary.assignedShifts} of {summary.totalShifts} shifts assigned
          </Text>
        </Box>

        {/* Stats Grid */}
        <HStack gap={3} flexWrap="wrap">
          <StatItem
            icon={LuCalendarClock}
            label="Total Shifts"
            value={summary.totalShifts}
            color="blue.600"
          />
          <StatItem
            icon={LuUserX}
            label="Unassigned"
            value={summary.unassignedShifts}
            color={summary.unassignedShifts > 0 ? 'orange.600' : 'green.600'}
          />
          <StatItem
            icon={LuCircleCheck}
            label="Completed"
            value={summary.completedShifts}
            color="green.600"
          />
        </HStack>

        {/* Sites Needing Attention */}
        {attention.sitesNeedingCoverage > 0 && (
          <Box bg="orange.50" p={4} borderRadius="lg" border="1px" borderColor="orange.200">
            <HStack gap={2} mb={3}>
              <Icon as={LuTriangleAlert} color="orange.500" />
              <Text fontWeight="medium" color="orange.700" fontSize="sm">
                {attention.sitesNeedingCoverage} site{attention.sitesNeedingCoverage !== 1 ? 's' : ''} need coverage
              </Text>
            </HStack>
            <VStack align="stretch" gap={2}>
              {attention.urgentUnassigned.map((site) => (
                <HStack
                  key={site._id}
                  justify="space-between"
                  p={2}
                  bg="white"
                  borderRadius="md"
                  fontSize="sm"
                >
                  <HStack gap={2}>
                    <Icon as={LuMapPin} color="gray.400" boxSize={4} />
                    <Text fontWeight="medium">{site.siteName}</Text>
                  </HStack>
                  <Badge colorPalette="orange" variant="subtle">
                    {site.count} shift{site.count !== 1 ? 's' : ''}
                  </Badge>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* All Covered Message */}
        {attention.sitesNeedingCoverage === 0 && summary.totalShifts > 0 && (
          <Box bg="green.50" p={4} borderRadius="lg" border="1px" borderColor="green.200">
            <HStack gap={2}>
              <Icon as={LuCircleCheck} color="green.500" />
              <Text fontWeight="medium" color="green.700" fontSize="sm">
                All shifts are assigned for the next {dateRange.days} days
              </Text>
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ShiftCoverageCard;