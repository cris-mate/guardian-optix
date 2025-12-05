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
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronRight,
  FiTrendingUp,
} from 'react-icons/fi';
import type { TodayScheduleOverview, ShiftStatus } from '../../../types/dashboard.types';

// ============================================
// Types
// ============================================

interface ShiftOverviewProps {
  overview: TodayScheduleOverview | null;
  isLoading?: boolean;
}

// ============================================
// Status Badge Configuration
// ============================================

const statusConfig: Record<ShiftStatus, {
  colorScheme: string;
  label: string;
}> = {
  scheduled: { colorScheme: 'blue', label: 'Scheduled' },
  'in-progress': { colorScheme: 'green', label: 'In Progress' },
  completed: { colorScheme: 'gray', label: 'Completed' },
  cancelled: { colorScheme: 'red', label: 'Cancelled' },
};

// ============================================
// Mini Stat Component
// ============================================

interface MiniStatProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorScheme?: string;
  isAlert?: boolean;
}

const MiniStat: React.FC<MiniStatProps> = ({
                                             label,
                                             value,
                                             icon,
                                             colorScheme = 'gray',
                                             isAlert = false,
                                           }) => (
  <VStack
    align="center"
    p={3}
    bg={isAlert && value > 0 ? `${colorScheme}.50` : 'gray.50'}
    borderRadius="lg"
    borderWidth={isAlert && value > 0 ? '1px' : '0'}
    borderColor={isAlert && value > 0 ? `${colorScheme}.200` : 'transparent'}
  >
    <Icon
      as={icon}
      boxSize={5}
      color={isAlert && value > 0 ? `${colorScheme}.500` : 'gray.400'}
    />
    <Text
      fontSize="2xl"
      fontWeight="bold"
      color={isAlert && value > 0 ? `${colorScheme}.600` : 'gray.700'}
    >
      {value}
    </Text>
    <Text fontSize="xs" color="gray.500" textAlign="center">
      {label}
    </Text>
  </VStack>
);

// ============================================
// Loading Skeleton
// ============================================

const ShiftOverviewSkeleton: React.FC = () => (
  <Box
    bg="white"
    p={5}
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
  >
    <VStack gap={4} align="stretch">
      <Box bg="gray.100" h={5} w={40} borderRadius="md" />
      <SimpleGrid columns={4} gap={3}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i} bg="gray.50" h={24} borderRadius="lg" />
        ))}
      </SimpleGrid>
      <Box bg="gray.100" h={4} borderRadius="full" />
    </VStack>
  </Box>
);

// ============================================
// Main Component
// ============================================

const ShiftOverview: React.FC<ShiftOverviewProps> = ({
                                                       overview,
                                                       isLoading = false
                                                     }) => {
  const navigate = useNavigate();

  if (isLoading || !overview) {
    return <ShiftOverviewSkeleton />;
  }

  const coveragePercent = overview.totalShifts > 0
    ? Math.round(((overview.activeShifts + overview.completedShifts) / overview.totalShifts) * 100)
    : 0;

  const hasIssues = overview.noShows > 0 || overview.lateArrivals > 0;

  return (
    <Box
      bg="white"
      p={5}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={hasIssues ? 'orange.200' : 'gray.200'}
      boxShadow="sm"
    >
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <HStack gap={2}>
          <Icon as={FiCalendar} color="blue.500" />
          <Text fontWeight="semibold" color="gray.800">
            Today's Schedule
          </Text>
          {hasIssues && (
            <Badge colorScheme="orange" variant="subtle">
              Attention Needed
            </Badge>
          )}
        </HStack>
        <Button
          size="xs"
          variant="ghost"
          colorScheme="blue"
          onClick={() => navigate('/schedules')}
        >
          View Schedule
          <Icon as={FiChevronRight} ml={1} />
        </Button>
      </HStack>

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={4}>
        <MiniStat
          label="Active Shifts"
          value={overview.activeShifts}
          icon={FiUsers}
          colorScheme="green"
        />
        <MiniStat
          label="Upcoming"
          value={overview.upcomingShifts}
          icon={FiClock}
          colorScheme="blue"
        />
        <MiniStat
          label="No-Shows"
          value={overview.noShows}
          icon={FiAlertCircle}
          colorScheme="red"
          isAlert
        />
        <MiniStat
          label="Late Arrivals"
          value={overview.lateArrivals}
          icon={FiClock}
          colorScheme="orange"
          isAlert
        />
      </SimpleGrid>

      {/* Coverage Progress */}
      <VStack align="stretch" gap={2}>
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.600">
            Shift Coverage
          </Text>
          <HStack gap={1}>
            <Icon
              as={coveragePercent >= 90 ? FiCheckCircle : FiTrendingUp}
              boxSize={4}
              color={coveragePercent >= 90 ? 'green.500' : 'orange.500'}
            />
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color={coveragePercent >= 90 ? 'green.600' : 'orange.600'}
            >
              {coveragePercent}%
            </Text>
          </HStack>
        </HStack>
        <Box h={2} bg="gray.100" borderRadius="full" overflow="hidden">
          <Box
            h="full"
            bg={coveragePercent >= 90 ? 'green.500' : 'orange.500'}
            w={`${coveragePercent}%`}
            transition="width 0.3s ease"
          />
        </Box>
        <HStack justify="space-between">
          <Text fontSize="xs" color="gray.500">
            {overview.activeShifts + overview.completedShifts} of {overview.totalShifts} shifts covered
          </Text>
          <Text fontSize="xs" color="gray.500">
            {overview.completedShifts} completed
          </Text>
        </HStack>
      </VStack>

      {/* Alert for issues */}
      {hasIssues && (
        <Box
          mt={4}
          p={3}
          bg="orange.50"
          borderRadius="md"
          borderWidth="1px"
          borderColor="orange.200"
        >
          <HStack gap={2}>
            <Icon as={FiAlertCircle} color="orange.500" />
            <Text fontSize="sm" color="orange.700">
              {overview.noShows > 0 && `${overview.noShows} no-show${overview.noShows > 1 ? 's' : ''}`}
              {overview.noShows > 0 && overview.lateArrivals > 0 && ' and '}
              {overview.lateArrivals > 0 && `${overview.lateArrivals} late arrival${overview.lateArrivals > 1 ? 's' : ''}`}
              {' '}require attention
            </Text>
          </HStack>
        </Box>
      )}
    </Box>
  );
};

export default ShiftOverview;