/**
 * TimeClock Page
 *
 * Digital time tracking for security officers.
 * Features GPS-verified clock in/out, break management,
 * and accurate timesheet generation.
 *
 * Key Features:
 * - GPS-verified clock in/out with geofence compliance
 * - Break management (paid/unpaid)
 * - Real-time location tracking
 * - Today's time entries with location data
 * - Timesheet summary (daily/weekly)
 * - Active guards overview (manager view)
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  Badge,
  Tabs,
  Spinner,
  Alert,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import {
  LuClock,
  LuRefreshCw,
  LuUsers,
  LuFileText,
  LuMapPin,
  LuTriangleAlert,
} from 'react-icons/lu';

// Hooks
import { useAuth } from '../../context/AuthContext';
import { useTimeClockData } from './hooks/useTimeClockData';

// Components
import ClockWidget from './components/ClockWidget';
import TimeEntriesTable from './components/TimeEntriesTable';
import ActiveGuardsList from './components/ActiveGuardsList';
import TimesheetSummary from './components/TimesheetSummary';

// Types
import type { TimeClockStats } from './types/timeClock.types';

// ============================================
// Stats Card Component
// ============================================

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorScheme?: string;
  subtext?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
                                               label,
                                               value,
                                               icon,
                                               colorScheme = 'gray',
                                               subtext,
                                             }) => (
  <Box
    bg="white"
    p={4}
    borderRadius="lg"
    borderWidth="1px"
    borderColor="gray.200"
  >
    <HStack justify="space-between" align="start">
      <VStack align="start" gap={1}>
        <Text fontSize="sm" color="gray.500">
          {label}
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          {value}
        </Text>
        {subtext && (
          <Text fontSize="xs" color="gray.500">
            {subtext}
          </Text>
        )}
      </VStack>
      <Box
        p={2}
        borderRadius="lg"
        bg={`${colorScheme}.50`}
        color={`${colorScheme}.500`}
      >
        {icon}
      </Box>
    </HStack>
  </Box>
);

// ============================================
// Main Component
// ============================================

const TimeClock: React.FC = () => {
  const { user } = useAuth();
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
    clearError,
  } = useTimeClockData();

  const [activeTab, setActiveTab] = useState<string>('my-time');

  // Check if user has manager/admin permissions
  const isManager = user?.role === 'Admin' || user?.role === 'Manager';

  // Format hours for display
  const formatHoursValue = (hours: number): string => {
    return hours.toFixed(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxW="container.xl" py={6}>
        <Flex justify="center" align="center" minH="60vh">
          <VStack gap={4}>
            <Spinner size="xl" color="blue.500" />
            <Text color="gray.500">Loading time clock...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={3}>
          <Box p={2} borderRadius="lg" bg="green.50" color="green.600">
            <LuClock size={24} />
          </Box>
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Time Clock
            </Text>
            <Text fontSize="sm" color="gray.500">
              GPS-verified time tracking
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <LuRefreshCw size={14} />
            Refresh
          </Button>
        </HStack>
      </Flex>

      {/* Error Alerts */}
      {error && (
        <Alert.Root status="error" mb={4} borderRadius="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
          <Button size="sm" variant="ghost" onClick={clearError}>
            Dismiss
          </Button>
        </Alert.Root>
      )}

      {locationError && (
        <Alert.Root status="warning" mb={4} borderRadius="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Location Warning</Alert.Title>
            <Alert.Description>{locationError}</Alert.Description>
          </Alert.Content>
          <Button size="sm" variant="ghost" onClick={refreshLocation}>
            Retry
          </Button>
        </Alert.Root>
      )}

      {/* Stats Overview (Manager View) */}
      {isManager && (
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
          gap={4}
          mb={6}
        >
          <StatsCard
            label="Active Guards"
            value={stats.activeGuardsCount}
            icon={<LuUsers size={20} />}
            colorScheme="green"
            subtext={`${stats.guardsOnBreak} on break`}
          />
          <StatsCard
            label="Total Hours Today"
            value={`${formatHoursValue(stats.todayHours)}h`}
            icon={<LuClock size={20} />}
            colorScheme="blue"
          />
          <StatsCard
            label="On-Time Clock-Ins"
            value={stats.onTimeClockIns}
            icon={<LuMapPin size={20} />}
            colorScheme="purple"
            subtext={`${stats.lateClockIns} late`}
          />
          <StatsCard
            label="Pending Approvals"
            value={stats.pendingApprovals}
            icon={<LuFileText size={20} />}
            colorScheme="orange"
          />
        </Grid>
      )}

      {/* Main Content Tabs */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value)}
        variant="line"
      >
        <Tabs.List mb={6} borderBottomWidth="1px" borderColor="gray.200">
          <Tabs.Trigger value="my-time" px={4} py={3}>
            <HStack gap={2}>
              <LuClock size={16} />
              <Text>My Time</Text>
            </HStack>
          </Tabs.Trigger>
          {isManager && (
            <Tabs.Trigger value="team" px={4} py={3}>
              <HStack gap={2}>
                <LuUsers size={16} />
                <Text>Team Overview</Text>
                {stats.activeGuardsCount > 0 && (
                  <Badge colorPalette="green" variant="subtle" size="sm">
                    {stats.activeGuardsCount}
                  </Badge>
                )}
              </HStack>
            </Tabs.Trigger>
          )}
        </Tabs.List>

        {/* My Time Tab */}
        <Tabs.Content value="my-time">
          <Grid
            templateColumns={{ base: '1fr', lg: '400px 1fr' }}
            gap={6}
          >
            {/* Left Column - Clock Widget & Summary */}
            <VStack align="stretch" gap={6}>
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
                onBreakStart={startBreak}
                onBreakEnd={endBreak}
                onRefreshLocation={refreshLocation}
              />

              <TimesheetSummary
                todayTimesheet={todayTimesheet}
                weeklySummary={weeklySummary}
                isLoading={isLoading}
              />
            </VStack>

            {/* Right Column - Time Entries */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <HStack gap={2}>
                  <LuFileText size={18} color="var(--chakra-colors-gray-500)" />
                  <Text fontWeight="semibold" color="gray.700">
                    Today&apos;s Time Entries
                  </Text>
                </HStack>
                <Badge colorPalette="blue" variant="subtle">
                  {timeEntries.length} entries
                </Badge>
              </HStack>

              <TimeEntriesTable
                entries={timeEntries}
                isLoading={isLoading}
              />

              {/* Geofence Compliance Note */}
              <Box
                mt={4}
                p={4}
                bg="blue.50"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="blue.200"
              >
                <HStack gap={3}>
                  <LuMapPin size={20} color="var(--chakra-colors-blue-500)" />
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" fontWeight="medium" color="blue.700">
                      GPS Verification Active
                    </Text>
                    <Text fontSize="xs" color="blue.600">
                      All clock-ins and clock-outs are verified against your assigned site&apos;s geofence boundary.
                      Location data is recorded for compliance and audit purposes.
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </Box>
          </Grid>
        </Tabs.Content>

        {/* Team Overview Tab (Manager Only) */}
        {isManager && (
          <Tabs.Content value="team">
            <Box>
              <HStack justify="space-between" mb={4}>
                <HStack gap={2}>
                  <LuUsers size={18} color="var(--chakra-colors-gray-500)" />
                  <Text fontWeight="semibold" color="gray.700">
                    Guard Status
                  </Text>
                </HStack>
                <HStack gap={2}>
                  {activeGuards.filter(g => g.geofenceStatus === 'outside').length > 0 && (
                    <Badge colorPalette="red" variant="subtle">
                      <HStack gap={1}>
                        <LuTriangleAlert size={12} />
                        <Text>
                          {activeGuards.filter(g => g.geofenceStatus === 'outside').length} outside boundary
                        </Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>
              </HStack>

              <ActiveGuardsList
                guards={activeGuards}
                isLoading={isLoading}
              />
            </Box>
          </Tabs.Content>
        )}
      </Tabs.Root>
    </Container>
  );
};

export default TimeClock;