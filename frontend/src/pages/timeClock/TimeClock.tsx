/**
 * TimeClock Page
 *
 * Digital time tracking for security guards in Guardian Optix.
 * Features GPS-verified clock in/out, break management, and timesheet generation.
 *
 * Features:
 * - GPS-verified clock in/out with geofence compliance
 * - GPS simulation mode for testing (Admin/Manager only)
 * - Break management (paid/unpaid)
 * - Real-time location tracking
 * - Today's time entries with location data
 * - Timesheet summary (daily/weekly)
 */

import React, { useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Grid,
  GridItem,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import {
  LuClock,
  LuRefreshCw,
  LuUsers,
  LuFileText,
  LuMapPin,
  LuTimer,
  LuShieldAlert,
} from 'react-icons/lu';
import { usePageTitle } from '../../context/PageContext';
import { useAuth } from '../../context/AuthContext';

// Components
import ClockWidget from './components/ClockWidget';
import TimeEntriesTable from './components/TimeEntriesTable';
import TimesheetSummary from './components/TimesheetSummary';

// Hooks
import { useTimeClockData } from './hooks/useTimeClockData';

// Types
import type { TimeClockStats, WeeklySummary } from '../../types/timeClock.types';

// ============================================
// Default Values (for null safety)
// ============================================

const DEFAULT_STATS: TimeClockStats = {
  todayHours: 0,
  weekHours: 0,
  monthHours: 0,
  overtimeThisWeek: 0,
  breaksTaken: 0,
  onTimeClockIns: 0,
  lateClockIns: 0,
  activeGuardsCount: 0,
  guardsOnBreak: 0,
  pendingApprovals: 0,
};

const DEFAULT_WEEKLY_SUMMARY: WeeklySummary = {
  weekStart: new Date().toISOString(),
  weekEnd: new Date().toISOString(),
  totalHours: 0,
  regularHours: 0,
  overtimeHours: 0,
  daysWorked: 0,
  averageHoursPerDay: 0,
};

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading }) => (
  <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
    <HStack gap={3}>
      <Box p={2} borderRadius="lg" bg="blue.50" color="blue.600">
        <LuClock size={24} />
      </Box>
      <Box>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          Time Clock
        </Text>
        <Text fontSize="sm" color="gray.500">
          Track your hours and manage timesheets
        </Text>
      </Box>
    </HStack>

    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isLoading}
      color="green.600"
      borderColor="green.300"
      _hover={{ bg: 'green.50', borderColor: 'green.400' }}
    >
      <Icon
        as={LuRefreshCw}
        boxSize={4}
        mr={2}
        className={isLoading ? 'spin' : ''}
      />
      {isLoading ? 'Refreshing...' : 'Refresh'}
    </Button>
  </HStack>
);

// ============================================
// Quick Stats Component (Manager View)
// ============================================

interface QuickStatsProps {
  stats: TimeClockStats;
  geofenceViolations: number;
  isLoading: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({ stats, geofenceViolations, isLoading }) => {
  const formatHours = (hours: number): string => hours.toFixed(1);

  // On-Time Clock-Ins = Active Guards - 1 (as per requirement)
  // const onTimeClockIns = Math.max(0, stats.activeGuardsCount - 1);

  const statItems = [
    {
      label: 'Active Guards',
      value: stats.activeGuardsCount,
      subtext: `${stats.guardsOnBreak} on break`,
      icon: LuUsers,
      color: 'green',
    },
    {
      label: 'Total Hours Today',
      value: `${formatHours(stats.todayHours)}h`,
      subtext: 'All guards combined',
      icon: LuClock,
      color: 'blue',
    },
    {
      label: 'On-Time Clock-Ins',
      value: stats.onTimeClockIns ?? 0,
      subtext: `${stats.lateClockIns ?? 0} late`,
      icon: LuTimer,
      color: 'purple',
    },
    {
      label: 'Geofence Violations',
      value: geofenceViolations,
      subtext: 'Today',
      icon: LuShieldAlert,
      color: geofenceViolations > 0 ? 'red' : 'gray',
    },
  ];

  return (
    <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
      {statItems.map((stat) => (
        <Box
          key={stat.label}
          bg="white"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          p={5}
          transition="all 0.2s"
          _hover={{ borderColor: `${stat.color}.300`, shadow: 'sm' }}
        >
          {isLoading ? (
            <VStack align="flex-start" gap={2}>
              <Box bg="gray.100" h={4} w={20} borderRadius="md" />
              <Box bg="gray.100" h={8} w={14} borderRadius="md" />
              <Box bg="gray.100" h={3} w={16} borderRadius="md" />
            </VStack>
          ) : (
            <HStack justify="space-between" align="start">
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.500">
                  {stat.label}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                  {stat.value}
                </Text>
                {stat.subtext && (
                  <Text fontSize="xs" color="gray.400">
                    {stat.subtext}
                  </Text>
                )}
              </VStack>
              <Box
                p={2}
                borderRadius="lg"
                bg={`${stat.color}.50`}
                color={`${stat.color}.500`}
              >
                <Icon as={stat.icon} boxSize={5} />
              </Box>
            </HStack>
          )}
        </Box>
      ))}
    </Grid>
  );
};

// ============================================
// Guard Personal Stats Component
// ============================================

interface PersonalStatsProps {
  stats: TimeClockStats;
  isLoading: boolean;
}

const PersonalStats: React.FC<PersonalStatsProps> = ({ stats, isLoading }) => {
  const formatHours = (hours: number): string => hours.toFixed(1);

  const statItems = [
    {
      label: 'Today',
      value: `${formatHours(stats.todayHours)}h`,
      subtext: 'Hours worked',
      icon: LuClock,
      color: 'blue',
    },
    {
      label: 'This Week',
      value: `${formatHours(stats.weekHours)}h`,
      subtext: `${formatHours(stats.overtimeThisWeek)}h overtime`,
      icon: LuTimer,
      color: 'green',
    },
    {
      label: 'Breaks Today',
      value: stats.breaksTaken,
      subtext: 'Breaks taken',
      icon: LuMapPin,
      color: 'orange',
    },
    {
      label: 'This Month',
      value: `${formatHours(stats.monthHours)}h`,
      subtext: 'Total logged',
      icon: LuFileText,
      color: 'purple',
    },
  ];

  return (
    <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
      {statItems.map((stat) => (
        <Box
          key={stat.label}
          bg="white"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          p={5}
          transition="all 0.2s"
          _hover={{ borderColor: `${stat.color}.300`, shadow: 'sm' }}
        >
          {isLoading ? (
            <VStack align="flex-start" gap={2}>
              <Box bg="gray.100" h={4} w={20} borderRadius="md" />
              <Box bg="gray.100" h={8} w={14} borderRadius="md" />
              <Box bg="gray.100" h={3} w={16} borderRadius="md" />
            </VStack>
          ) : (
            <HStack justify="space-between" align="start">
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.500">
                  {stat.label}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                  {stat.value}
                </Text>
                {stat.subtext && (
                  <Text fontSize="xs" color="gray.400">
                    {stat.subtext}
                  </Text>
                )}
              </VStack>
              <Box
                p={2}
                borderRadius="lg"
                bg={`${stat.color}.50`}
                color={`${stat.color}.500`}
              >
                <Icon as={stat.icon} boxSize={5} />
              </Box>
            </HStack>
          )}
        </Box>
      ))}
    </Grid>
  );
};

// ============================================
// Location Alert Component
// ============================================

interface LocationAlertProps {
  error: string | null;
  onRefresh: () => void;
  isLoading: boolean;
}

const LocationAlert: React.FC<LocationAlertProps> = ({ error, onRefresh, isLoading }) => {
  if (!error) return null;

  return (
    <Box
      bg="orange.50"
      borderWidth="1px"
      borderColor="orange.200"
      borderRadius="lg"
      p={4}
    >
      <HStack justify="space-between">
        <HStack gap={3}>
          <Icon as={LuMapPin} color="orange.500" boxSize={5} />
          <VStack align="start" gap={0}>
            <Text color="orange.700" fontSize="sm" fontWeight="medium">
              Location Required
            </Text>
            <Text color="orange.600" fontSize="xs">
              {error}
            </Text>
          </VStack>
        </HStack>
        <Button
          size="sm"
          colorPalette="orange"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <Icon as={LuRefreshCw} boxSize={3} mr={1} className={isLoading ? 'spin' : ''} />
          Retry
        </Button>
      </HStack>
    </Box>
  );
};

// ============================================
// Main Component
// ============================================

const TimeClock: React.FC = () => {
  const { setTitle } = usePageTitle();
  const { user } = useAuth();
  const isManager = user?.role === 'Admin' || user?.role === 'Manager';

  // Set page title
  useEffect(() => {
    setTitle('Time Clock');
  }, [setTitle]);

  // Data hook
  const {
    clockStatus,
    activeShift,
    currentLocation,
    geofenceStatus,
    timeEntries,
    todayTimesheet,
    weeklySummary,
    stats,
    isLoading,
    isClockingIn,
    isClockingOut,
    isProcessingBreak,
    isLocationLoading,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    refreshLocation,
    refetch,
    locationError,
    // Simulation controls
    geofenceConfig,
    simulationEnabled,
    setSimulationEnabled,
    selectedScenario,
    setSelectedScenario,
    // Geofence violations
    geofenceViolations,
  } = useTimeClockData();

  // Use default values if null
  const safeStats = stats ?? DEFAULT_STATS;
  const safeWeeklySummary = weeklySummary ?? DEFAULT_WEEKLY_SUMMARY;

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (isLoading && !stats) {
    return (
      <VStack gap={4} align="stretch">
        <Header onRefresh={handleRefresh} isLoading={true} />
        <VStack py={16} gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading time clock...</Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Header */}
      <Header onRefresh={handleRefresh} isLoading={isLoading} />

      {/* Location Alert */}
      <LocationAlert
        error={locationError}
        onRefresh={refreshLocation}
        isLoading={isLocationLoading}
      />

      {/* Stats - Different for Managers vs Guards */}
      {isManager ? (
        <QuickStats
          stats={safeStats}
          geofenceViolations={geofenceViolations ?? 0}
          isLoading={isLoading && !stats}
        />
      ) : (
        <PersonalStats
          stats={safeStats}
          isLoading={isLoading && !stats}
        />
      )}

      {/* Main Content Grid */}
      <Grid
        templateColumns={{ base: '1fr', lg: '320px 1fr 320px' }}
        gap={6}
      >
        {/* Clock Widget */}
        <GridItem>
          <Box
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            shadow="sm"
            overflow="hidden"
            h="full"
          >
            <ClockWidget
              clockStatus={clockStatus}
              activeShift={activeShift}
              currentLocation={currentLocation}
              geofenceStatus={geofenceStatus}
              isClockingIn={isClockingIn}
              isClockingOut={isClockingOut}
              isProcessingBreak={isProcessingBreak}
              isLocationLoading={isLocationLoading}
              onClockIn={() => clockIn()}
              onClockOut={() => clockOut()}
              onBreakStart={() => startBreak()}
              onBreakEnd={() => endBreak()}
              onRefreshLocation={refreshLocation}
              // Simulation props
              geofenceConfig={geofenceConfig}
              simulationEnabled={simulationEnabled}
              onSimulationEnabledChange={setSimulationEnabled}
              selectedScenario={selectedScenario}
              onScenarioChange={setSelectedScenario}
            />
          </Box>
        </GridItem>

        {/* Today's Time Entries */}
        <GridItem>
          <Box
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            shadow="sm"
            overflow="hidden"
            h="full"
          >
            <HStack p={4} borderBottomWidth="1px" borderColor="gray.100">
              <Icon as={LuClock} boxSize={5} color="blue.500" />
              <Text fontWeight="semibold" color="gray.700">
                Today's Entries
              </Text>
              {timeEntries.length > 0 && (
                <Badge colorPalette="blue" variant="subtle" size="sm">
                  {timeEntries.length}
                </Badge>
              )}
            </HStack>
            <Box p={4}>
              <TimeEntriesTable
                entries={timeEntries}
                isLoading={isLoading}
              />
            </Box>
          </Box>
        </GridItem>

        {/* Timesheet Summary */}
        <GridItem>
          <Box
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            shadow="sm"
            overflow="hidden"
            h="full"
          >
            <HStack p={4} borderBottomWidth="1px" borderColor="gray.100">
              <Icon as={LuFileText} boxSize={5} color="purple.500" />
              <Text fontWeight="semibold" color="gray.700">
                Timesheet Summary
              </Text>
            </HStack>
            <Box p={4}>
              <TimesheetSummary
                todayTimesheet={todayTimesheet}
                weeklySummary={safeWeeklySummary}
                isLoading={isLoading}
              />
            </Box>
          </Box>
        </GridItem>
      </Grid>

      {/* Quick Info Card */}
      <Box
        bg="blue.50"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="blue.200"
        p={6}
      >
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
          <HStack gap={3}>
            <Icon as={LuMapPin} boxSize={6} color="blue.500" />
            <VStack align="start" gap={0}>
              <Text fontWeight="medium" color="gray.700" fontSize="sm">
                GPS Verification
              </Text>
              <Text fontSize="xs" color="gray.500">
                Location verified at clock in/out
              </Text>
            </VStack>
          </HStack>
          <HStack gap={3}>
            <Icon as={LuTimer} boxSize={6} color="blue.500" />
            <VStack align="start" gap={0}>
              <Text fontWeight="medium" color="gray.700" fontSize="sm">
                Break Tracking
              </Text>
              <Text fontSize="xs" color="gray.500">
                Paid and unpaid breaks logged
              </Text>
            </VStack>
          </HStack>
          <HStack gap={3}>
            <Icon as={LuFileText} boxSize={6} color="blue.500" />
            <VStack align="start" gap={0}>
              <Text fontWeight="medium" color="gray.700" fontSize="sm">
                Auto Timesheets
              </Text>
              <Text fontSize="xs" color="gray.500">
                Weekly summaries generated
              </Text>
            </VStack>
          </HStack>
        </Grid>
      </Box>

      {/* CSS for spinner animation */}
      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </VStack>
  );
};

export default TimeClock;