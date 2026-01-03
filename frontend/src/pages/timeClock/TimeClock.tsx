/**
 * TimeClock Page
 *
 * Digital time tracking for security guards in Guardian Optix.
 * Features GPS-verified clock in/out, break management, and timesheet generation.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Grid,
  GridItem,
  Tabs,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import {
  LuClock,
  LuRefreshCw,
  LuUsers,
  LuFileText,
  LuMapPin,
  LuTriangleAlert,
  LuCalendarDays,
  LuTimer,
} from 'react-icons/lu';
import { usePageTitle } from '../../context/PageContext';
import { useAuth } from '../../context/AuthContext';

// Components
import ClockWidget from './components/ClockWidget';
import TimeEntriesTable from './components/TimeEntriesTable';
import ActiveGuardsList from './components/ActiveGuardsList';
import TimesheetSummary from './components/TimesheetSummary';

// Hooks
import { useTimeClockData } from './hooks/useTimeClockData';

// Types
import type { TimeClockStats, WeeklySummary } from '../../types/timeClock.types';

// ============================================
// Default Stats (for null safety)
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
// Tab Configuration
// ============================================

type TabValue = 'my-time' | 'team';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
  managerOnly?: boolean;
}

const tabs: TabConfig[] = [
  { value: 'my-time', label: 'My Time', icon: LuClock },
  { value: 'team', label: 'Team Overview', icon: LuUsers, managerOnly: true },
];

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
// Error Banner Component
// ============================================

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => (
  <Box
    bg="red.50"
    borderWidth="1px"
    borderColor="red.200"
    borderRadius="lg"
    p={4}
  >
    <HStack justify="space-between">
      <HStack gap={3}>
        <Icon as={LuTriangleAlert} color="red.500" boxSize={5} />
        <Text color="red.700" fontSize="sm">{message}</Text>
      </HStack>
      <Button size="sm" colorPalette="red" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </HStack>
  </Box>
);

// ============================================
// Quick Stats Component
// ============================================

interface QuickStatsProps {
  stats: TimeClockStats;
  isLoading: boolean;
  isManager: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({ stats, isLoading, isManager }) => {
  const formatHours = (hours: number): string => hours.toFixed(1);

  const statItems = isManager
    ? [
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
        value: stats.onTimeClockIns,
        subtext: `${stats.lateClockIns} late`,
        icon: LuTimer,
        color: 'purple',
      },
      {
        label: 'Pending Approvals',
        value: stats.pendingApprovals,
        subtext: 'Timesheets to review',
        icon: LuFileText,
        color: stats.pendingApprovals > 0 ? 'orange' : 'gray',
      },
    ]
    : [
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
        icon: LuCalendarDays,
        color: 'green',
      },
      {
        label: 'This Month',
        value: `${formatHours(stats.monthHours)}h`,
        subtext: 'Total logged',
        icon: LuTimer,
        color: 'purple',
      },
      {
        label: 'Breaks Today',
        value: stats.breaksTaken,
        subtext: 'Breaks taken',
        icon: LuMapPin,
        color: 'orange',
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

  const [activeTab, setActiveTab] = useState<TabValue>('my-time');

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
    activeGuards,
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
    error,
    locationError,
    // Simulation controls
    geofenceConfig,
    simulationEnabled,
    setSimulationEnabled,
    selectedScenario,
    setSelectedScenario,
  } = useTimeClockData();

  // Use default stats if null
  const safeStats = stats ?? DEFAULT_STATS;

  // Use default weeklySummary if null
  const safeWeeklySummary = weeklySummary ?? DEFAULT_WEEKLY_SUMMARY;

  // Filter tabs based on role
  const visibleTabs = tabs.filter((tab) => !tab.managerOnly || isManager);

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

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      {/* Location Alert */}
      <LocationAlert
        error={locationError}
        onRefresh={refreshLocation}
        isLoading={isLocationLoading}
      />

      {/* Quick Stats */}
      <QuickStats
        stats={safeStats}
        isLoading={isLoading && !stats}
        isManager={isManager}
      />

      {/* Tabs */}
      <Box>
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => setActiveTab(e.value as TabValue)}
        >
          <Tabs.List
            bg="white"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            p={1}
          >
            {visibleTabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                px={4}
                py={2}
                borderRadius="md"
                fontWeight="medium"
                color="gray.600"
                _selected={{
                  bg: 'blue.50',
                  color: 'blue.600',
                }}
              >
                <HStack gap={2}>
                  <Icon as={tab.icon} boxSize={4} />
                  <Text>{tab.label}</Text>
                  {tab.value === 'team' && safeStats.activeGuardsCount > 0 && (
                    <Badge colorPalette="green" variant="solid" size="sm">
                      {safeStats.activeGuardsCount}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* My Time Tab */}
          <Tabs.Content value="my-time" pt={4}>
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
                    onClockIn={clockIn}
                    onClockOut={clockOut}
                    onBreakStart={startBreak}
                    onBreakEnd={endBreak}
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
            <Box mt={6}>
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
            </Box>
          </Tabs.Content>

          {/* Team Overview Tab (Manager Only) */}
          {isManager && (
            <Tabs.Content value="team" pt={4}>
              <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
                <GridItem>
                  <Box
                    bg="white"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                    overflow="hidden"
                  >
                    <HStack p={4} borderBottomWidth="1px" borderColor="gray.100">
                      <Icon as={LuUsers} boxSize={5} color="green.500" />
                      <Text fontWeight="semibold" color="gray.700">
                        Active Guards
                      </Text>
                      <Badge colorPalette="green" variant="solid" size="sm">
                        {safeStats.activeGuardsCount}
                      </Badge>
                    </HStack>
                    <Box p={4}>
                      <ActiveGuardsList
                        guards={activeGuards}
                        isLoading={isLoading}
                      />
                    </Box>
                  </Box>
                </GridItem>

                <GridItem>
                  <VStack align="stretch" gap={4}>
                    {/* Team Stats */}
                    <Box
                      bg="white"
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor="gray.200"
                      p={5}
                    >
                      <Text fontWeight="semibold" color="gray.700" mb={4}>
                        Team Summary
                      </Text>
                      <VStack align="stretch" gap={3}>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.500">Active Now</Text>
                          <Text fontWeight="medium">{safeStats.activeGuardsCount}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.500">On Break</Text>
                          <Text fontWeight="medium">{safeStats.guardsOnBreak}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.500">On Time Today</Text>
                          <Text fontWeight="medium" color="green.600">
                            {safeStats.onTimeClockIns}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.500">Late Today</Text>
                          <Text fontWeight="medium" color={safeStats.lateClockIns > 0 ? 'red.500' : 'gray.600'}>
                            {safeStats.lateClockIns}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>

                    {/* Pending Approvals */}
                    <Box
                      bg="white"
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor="gray.200"
                      p={5}
                    >
                      <HStack justify="space-between" mb={4}>
                        <Text fontWeight="semibold" color="gray.700">
                          Pending Approvals
                        </Text>
                        {safeStats.pendingApprovals > 0 && (
                          <Badge colorPalette="orange" variant="solid">
                            {safeStats.pendingApprovals}
                          </Badge>
                        )}
                      </HStack>
                      {safeStats.pendingApprovals === 0 ? (
                        <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                          No timesheets pending approval
                        </Text>
                      ) : (
                        <Button colorPalette="orange" size="sm" w="full">
                          Review Timesheets
                        </Button>
                      )}
                    </Box>

                    {/* Info Card */}
                    <Box
                      bg="green.50"
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor="green.200"
                      p={6}
                      textAlign="center"
                    >
                      <Icon as={LuUsers} boxSize={10} color="green.400" mb={3} />
                      <Text fontWeight="semibold" color="gray.700" mb={2}>
                        Team Management
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Monitor guard attendance, approve timesheets, and track
                        punctuality across your team.
                      </Text>
                    </Box>
                  </VStack>
                </GridItem>
              </Grid>
            </Tabs.Content>
          )}
        </Tabs.Root>
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