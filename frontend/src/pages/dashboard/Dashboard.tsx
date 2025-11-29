import React, { useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  SimpleGrid,
  Grid,
  GridItem,
  Spinner,
  Alert,
  Button,
} from '@chakra-ui/react';
import { FiRefreshCw, FiClock, FiAlertCircle } from 'react-icons/fi';

// Components
import OperationalMetrics from './components/OperationalMetrics';
import QuickActions from './components/QuickActions';
import AlertsPanel from './components/AlertsPanel';
import LiveActivityFeed from './components/LiveActivityFeed';
import ShiftOverview from './components/ShiftOverview';
import GuardStatusTable from './components/GuardStatusTable';
import UpcomingTasks from './components/UpcomingTasks';

// Hooks
import { useDashboardData, useMockDashboardData } from './hooks/useDashboardData';

// Types
import type { GuardStatusEntry, Task } from './types/dashboard.types';

// ============================================
// Configuration
// ============================================

// Set to true to use mock data during development
const USE_MOCK_DATA = true;

// ============================================
// Main Dashboard Component
// ============================================

const Dashboard: React.FC = () => {
  // Use either real or mock data hook
  const dashboardData = USE_MOCK_DATA ? useMockDashboardData() : useDashboardData();

  const {
    metrics,
    alerts,
    scheduleOverview,
    guardStatuses,
    activityFeed,
    pendingTasks,
    recentIncidents,
    isLoading,
    error,
    lastUpdated,
    refresh,
    dismissAlert,
    markAlertRead,
    completeTask,
  } = dashboardData;

  // Format last updated time
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handlers
  const handleGuardClick = (guard: GuardStatusEntry) => {
    // Navigate to guard profile or open details modal
    console.log('Guard clicked:', guard.id);
  };

  const handleTaskClick = (task: Task) => {
    // Navigate to task details
    console.log('Task clicked:', task.id);
  };

  // Error State
  if (error && !metrics) {
    return (
      <Box p={8}>
        <Alert.Root status="error" variant="subtle" borderRadius="lg">
          <Alert.Indicator>
            <Icon as={FiAlertCircle} />
          </Alert.Indicator>
          <Box flex={1}>
            <Alert.Title>Unable to load dashboard</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Box>
          <Button
            size="sm"
            colorScheme="red"
            variant="outline"
            onClick={() => refresh()}
          >
            Retry
          </Button>
        </Alert.Root>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      p={{ base: 4, md: 6 }}
    >
      {/* Page Header */}
      <HStack
        justify="space-between"
        align="center"
        mb={6}
        flexWrap="wrap"
        gap={4}
      >
        <VStack align="flex-start" gap={1}>
          <Heading as="h1" size="lg" color="gray.800">
            Operations Dashboard
          </Heading>
          <HStack gap={2}>
            <Icon as={FiClock} boxSize={4} color="gray.400" />
            <Text fontSize="sm" color="gray.500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            {lastUpdated && (
              <Text fontSize="xs" color="gray.400">
                • Updated {formatLastUpdated(lastUpdated)}
              </Text>
            )}
          </HStack>
        </VStack>

        <Button
          size="sm"
          variant="outline"
          colorScheme="gray"
          onClick={() => refresh()}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="xs" mr={2} />
              Refreshing...
            </>
          ) : (
            <>
              <Icon as={FiRefreshCw} mr={2} />
              Refresh
            </>
          )}
        </Button>
      </HStack>

      {/* Loading Overlay */}
      {isLoading && metrics && (
        <Box
          position="fixed"
          top={4}
          right={4}
          bg="white"
          px={4}
          py={2}
          borderRadius="full"
          boxShadow="md"
          zIndex={1000}
        >
          <HStack gap={2}>
            <Spinner size="sm" color="blue.500" />
            <Text fontSize="sm" color="gray.600">Updating...</Text>
          </HStack>
        </Box>
      )}

      <VStack gap={6} align="stretch">
        {/* Quick Actions Bar */}
        <QuickActions
          onRefresh={refresh}
          isRefreshing={isLoading}
        />

        {/* Operational Metrics */}
        <OperationalMetrics
          metrics={metrics}
          isLoading={isLoading && !metrics}
        />

        {/* Main Content Grid */}
        <Grid
          templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
          gap={6}
        >
          {/* Left Column - Primary Content */}
          <GridItem>
            <VStack gap={6} align="stretch">
              {/* Alerts Panel - Prominent if alerts exist */}
              {alerts.filter(a => !a.isDismissed).length > 0 && (
                <AlertsPanel
                  alerts={alerts}
                  onDismiss={dismissAlert}
                  onMarkRead={markAlertRead}
                  maxVisible={4}
                />
              )}

              {/* Schedule Overview */}
              <ShiftOverview
                overview={scheduleOverview}
                isLoading={isLoading && !scheduleOverview}
              />

              {/* Guard Status Table */}
              <GuardStatusTable
                guards={guardStatuses}
                onGuardClick={handleGuardClick}
                showFilters={true}
                maxVisible={8}
              />
            </VStack>
          </GridItem>

          {/* Right Column - Secondary Content */}
          <GridItem>
            <VStack gap={6} align="stretch">
              {/* Live Activity Feed */}
              <LiveActivityFeed
                activities={activityFeed}
                maxVisible={8}
                isLive={!USE_MOCK_DATA}
              />

              {/* Upcoming Tasks */}
              <UpcomingTasks
                tasks={pendingTasks}
                onTaskClick={handleTaskClick}
                onTaskComplete={completeTask}
                maxVisible={5}
              />
            </VStack>
          </GridItem>
        </Grid>

        {/* Footer Stats / Summary Row */}
        <Box
          bg="white"
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <HStack justify="center" gap={8} flexWrap="wrap">
            <Text fontSize="xs" color="gray.500">
              <Text as="span" fontWeight="semibold" color="gray.700">
                {metrics?.activeGuards || 0}
              </Text>
              {' '}guards on duty
            </Text>
            <Text fontSize="xs" color="gray.500">
              <Text as="span" fontWeight="semibold" color="gray.700">
                {metrics?.shiftsToday || 0}
              </Text>
              {' '}shifts today
            </Text>
            <Text fontSize="xs" color="gray.500">
              <Text as="span" fontWeight="semibold" color="gray.700">
                {activityFeed.length}
              </Text>
              {' '}events logged
            </Text>
            <Text fontSize="xs" color="gray.500">
              <Text as="span" fontWeight="semibold" color="gray.700">
                {metrics?.complianceScore || 0}%
              </Text>
              {' '}compliance
            </Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default Dashboard;