/**
 * Dashboard Page
 *
 * Central operations hub for Guardian Optix.
 * Provides real-time operational overview with live updates via Socket.io.
 *
 * Features:
 * - Key operational metrics (4 core KPIs)
 * - Real-time activity feed with socket updates
 * - Guard status monitoring
 * - Shift overview and alerts
 * - Quick actions for common tasks
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  LuLayoutDashboard,
  LuRefreshCw,
  LuActivity,
  LuUsers,
  LuCalendarClock,
  LuTriangleAlert,
  LuWifi,
  LuWifiOff,
} from 'react-icons/lu';
import { toaster } from '../../components/ui/toaster';
import { usePageTitle } from '../../context/PageContext';

// Components
import QuickActions from './components/QuickActions';
import AlertsPanel from './components/AlertsPanel';
import LiveActivityFeed from './components/LiveActivityFeed';
import ShiftOverview from './components/ShiftOverview';
import GuardStatusTable from './components/GuardStatusTable';
import UpcomingTasks from './components/UpcomingTasks';

// Hooks
import { useDashboardData, useMockDashboardData } from './hooks/useDashboardData';
import { useDashboardSocket } from '../../hooks/useSocket';

// Types
import type { GuardStatusEntry, Task, ActivityEvent } from '../../types/dashboard.types';

// ============================================
// Configuration
// ============================================

const USE_MOCK_DATA = true;

// ============================================
// Tab Configuration
// ============================================

type TabValue = 'overview' | 'activity' | 'guards' | 'schedule';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { value: 'overview', label: 'Overview', icon: LuLayoutDashboard },
  { value: 'activity', label: 'Activity', icon: LuActivity },
  { value: 'guards', label: 'Guards', icon: LuUsers },
  { value: 'schedule', label: 'Schedule', icon: LuCalendarClock },
];

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
  isConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, isLoading, isConnected }) => {
  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
      <HStack gap={3}>
        <Box p={2} borderRadius="lg" bg="blue.50" color="blue.600">
          <LuLayoutDashboard size={24} />
        </Box>
        <Box>
          <HStack gap={2}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Operations Dashboard
            </Text>
            <ConnectionBadge isConnected={isConnected} />
          </HStack>
          <HStack gap={2} fontSize="sm" color="gray.500">
            <Text>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            {lastUpdated && (
              <>
                <Text>•</Text>
                <Text>Updated {formatTime(lastUpdated)}</Text>
              </>
            )}
          </HStack>
        </Box>
      </HStack>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
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
};

// ============================================
// Connection Badge Component
// ============================================

interface ConnectionBadgeProps {
  isConnected: boolean;
}

const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ isConnected }) => (
  <Badge
    colorPalette={isConnected ? 'green' : 'red'}
    variant="subtle"
    px={2}
    py={1}
    borderRadius="full"
  >
    <HStack gap={1}>
      <Icon as={isConnected ? LuWifi : LuWifiOff} boxSize={3} />
      <Text fontSize="xs">{isConnected ? 'Live' : 'Offline'}</Text>
    </HStack>
  </Badge>
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
// Quick Stats Component (4 Core KPIs)
// ============================================

interface QuickStatsProps {
  metrics: {
    activeGuards: number;
    totalScheduled: number;
    shiftsToday: number;
    shiftsCovered: number;
    openIncidents: number;
    pendingTasks: number;
  } | null;
  isLoading: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({ metrics, isLoading }) => {
  const stats = [
    {
      label: 'Active Guards',
      value: metrics?.activeGuards ?? 0,
      subtext: `of ${metrics?.totalScheduled ?? 0} scheduled`,
      color: 'blue',
      status: metrics && metrics.activeGuards < metrics.totalScheduled ? 'warning' : 'success',
    },
    {
      label: 'Shifts Today',
      value: metrics?.shiftsCovered ?? 0,
      subtext: `of ${metrics?.shiftsToday ?? 0} total`,
      color: 'green',
      status: metrics && metrics.shiftsCovered < metrics.shiftsToday ? 'warning' : 'success',
    },
    {
      label: 'Open Incidents',
      value: metrics?.openIncidents ?? 0,
      subtext: 'requiring attention',
      color: 'orange',
      status: metrics && metrics.openIncidents > 0 ? 'warning' : 'success',
    },
    {
      label: 'Pending Tasks',
      value: metrics?.pendingTasks ?? 0,
      subtext: 'to complete today',
      color: 'purple',
      status: metrics && metrics.pendingTasks > 5 ? 'warning' : 'success',
    },
  ];

  return (
    <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
      {stats.map((stat) => (
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
              <Box bg="gray.100" h={4} w={24} borderRadius="md" />
              <Box bg="gray.100" h={8} w={16} borderRadius="md" />
              <Box bg="gray.100" h={3} w={20} borderRadius="md" />
            </VStack>
          ) : (
            <VStack align="flex-start" gap={1}>
              <Text fontSize="sm" color="gray.500" fontWeight="medium">
                {stat.label}
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color={`${stat.color}.600`}>
                {stat.value}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {stat.subtext}
              </Text>
            </VStack>
          )}
        </Box>
      ))}
    </Grid>
  );
};

// ============================================
// Main Dashboard Component
// ============================================

const Dashboard: React.FC = () => {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Set page title
  useEffect(() => {
    setTitle('Dashboard');
  }, [setTitle]);

  // Use either real or mock data hook
  const dashboardData = USE_MOCK_DATA
    ? useMockDashboardData()
    : useDashboardData();

  const {
    metrics,
    alerts,
    scheduleOverview,
    guardStatuses,
    activityFeed,
    pendingTasks,
    isLoading,
    error,
    lastUpdated,
    refresh,
    dismissAlert,
    markAlertRead,
    completeTask,
  } = dashboardData;

  // Real-time activity state
  const [realtimeActivity, setRealtimeActivity] = useState<ActivityEvent[]>([]);

  // ============================================
  // Socket Event Handlers
  // ============================================

  const handleClockAction = useCallback((data: {
    officerId: string;
    officerName: string;
    action: string;
    siteName: string;
    timestamp: string;
  }) => {
    const activityItem: ActivityEvent = {
      _id: `realtime-${Date.now()}`,
      type: data.action as ActivityEvent['type'],
      guardId: data.officerId,
      guardName: data.officerName,
      siteName: data.siteName,
      timestamp: data.timestamp,
      description: `${data.officerName} ${
        data.action === 'clock-in' ? 'clocked in at' : 'clocked out from'
      } ${data.siteName}`,
    };

    setRealtimeActivity(prev => [activityItem, ...prev].slice(0, 20));

    toaster.create({
      title: data.action === 'clock-in' ? 'Officer Clocked In' : 'Officer Clocked Out',
      description: `${data.officerName} - ${data.siteName}`,
      type: 'info',
      duration: 4000,
    });
  }, []);

  const handleGeofenceViolation = useCallback((data: {
    severity: string;
    officerName: string;
    siteName: string;
    timestamp: string;
  }) => {
    const activityItem: ActivityEvent = {
      _id: `geofence-${Date.now()}`,
      type: 'geofence-violation',
      guardName: data.officerName,
      siteName: data.siteName,
      timestamp: data.timestamp,
      severity: 'critical',
      description: `${data.officerName} is outside ${data.siteName} geofence`,
    };

    setRealtimeActivity(prev => [activityItem, ...prev].slice(0, 20));

    toaster.create({
      title: '⚠️ Geofence Violation',
      description: `${data.officerName} is outside ${data.siteName} boundary`,
      type: 'error',
      duration: 8000,
    });
  }, []);

  const handleIncidentReported = useCallback((data: {
    incidentId: string;
    type: string;
    severity: string;
    timestamp: string;
  }) => {
    const severityToast: Record<string, 'error' | 'warning' | 'info'> = {
      critical: 'error',
      high: 'error',
      medium: 'warning',
      low: 'info',
    };

    toaster.create({
      title: `🚨 New ${data.severity.toUpperCase()} Incident`,
      description: `${data.type} reported`,
      type: severityToast[data.severity] || 'info',
      duration: 10000,
    });

    refresh();
  }, [refresh]);

  const handleShiftUpdate = useCallback((data: {
    shiftId: string;
    status: string;
    officerName: string;
    timestamp: string;
  }) => {
    const activityItem: ActivityEvent = {
      _id: `shift-${Date.now()}`,
      type: 'clock-in',
      guardName: data.officerName,
      siteName: null,
      timestamp: data.timestamp,
      description: `${data.officerName}'s shift status: ${data.status}`,
    };

    setRealtimeActivity(prev => [activityItem, ...prev].slice(0, 20));
  }, []);

  const handleActivityNew = useCallback((data: unknown) => {
    const activityData = data as Partial<ActivityEvent>;
    const activityItem: ActivityEvent = {
      _id: activityData._id || `activity-${Date.now()}`,
      type: activityData.type || 'clock-in',
      guardId: activityData.guardId,
      guardName: activityData.guardName || 'Unknown',
      siteName: activityData.siteName || null,
      timestamp: activityData.timestamp || new Date().toISOString(),
      description: activityData.description,
      severity: activityData.severity,
    };

    setRealtimeActivity(prev => [activityItem, ...prev].slice(0, 20));
  }, []);

  const handleMetricsUpdate = useCallback(() => {
    refresh();
  }, [refresh]);

  // Socket connection
  const { isConnected } = useDashboardSocket({
    onClockAction: handleClockAction,
    onAlertGeofence: handleGeofenceViolation,
    onIncidentReported: handleIncidentReported,
    onShiftUpdate: handleShiftUpdate,
    onActivityNew: handleActivityNew,
    onMetricsUpdate: handleMetricsUpdate,
  });

  // Merged activity feed
  const combinedActivityFeed = React.useMemo(() => {
    const merged = [...realtimeActivity, ...activityFeed];
    const uniqueMap = new Map<string, ActivityEvent>();
    merged.forEach(item => {
      if (!uniqueMap.has(item._id)) {
        uniqueMap.set(item._id, item);
      }
    });
    return Array.from(uniqueMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, [realtimeActivity, activityFeed]);

  // Handlers
  const handleGuardClick = (guard: GuardStatusEntry) => {
    console.log('Guard clicked:', guard._id);
  };

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task._id);
  };

  const handleRefresh = () => {
    refresh();
  };

  // Loading state
  if (isLoading && !metrics) {
    return (
      <VStack gap={4} align="stretch">
        <Header
          lastUpdated={null}
          onRefresh={handleRefresh}
          isLoading={true}
          isConnected={isConnected}
        />
        <VStack py={16} gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading dashboard...</Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Header */}
      <Header
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isConnected={isConnected}
      />

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      {/* Quick Stats (4 Core KPIs) */}
      <QuickStats metrics={metrics} isLoading={isLoading && !metrics} />

      {/* Quick Actions */}
      <QuickActions onRefresh={refresh} isRefreshing={isLoading} />

      {/* Tabs */}
      <Box mt={2}>
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
            {tabs.map((tab) => (
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
                  {tab.value === 'activity' && combinedActivityFeed.length > 0 && (
                    <Badge colorPalette="blue" variant="solid" size="sm">
                      {combinedActivityFeed.length}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Content value="overview" pt={4}>
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
              <GridItem>
                <VStack align="stretch" gap={4}>
                  {/* Alerts Panel */}
                  {alerts.filter(a => !a.isDismissed).length > 0 && (
                    <AlertsPanel
                      alerts={alerts}
                      onDismiss={dismissAlert}
                      onMarkRead={markAlertRead}
                      maxVisible={4}
                    />
                  )}

                  {/* Shift Overview */}
                  <ShiftOverview
                    overview={scheduleOverview}
                    isLoading={isLoading && !scheduleOverview}
                  />
                </VStack>
              </GridItem>

              <GridItem>
                <VStack align="stretch" gap={4}>
                  {/* Live Activity Feed (compact) */}
                  <LiveActivityFeed
                    activities={combinedActivityFeed}
                    maxVisible={5}
                    isLive={isConnected}
                  />

                  {/* Upcoming Tasks */}
                  <UpcomingTasks
                    tasks={pendingTasks}
                    onTaskClick={handleTaskClick}
                    onTaskComplete={completeTask}
                    maxVisible={4}
                  />
                </VStack>
              </GridItem>
            </Grid>
          </Tabs.Content>

          {/* Activity Tab */}
          <Tabs.Content value="activity" pt={4}>
            <LiveActivityFeed
              activities={combinedActivityFeed}
              maxVisible={20}
              isLive={isConnected}
            />
          </Tabs.Content>

          {/* Guards Tab */}
          <Tabs.Content value="guards" pt={4}>
            <GuardStatusTable
              guards={guardStatuses}
              onGuardClick={handleGuardClick}
              showFilters={true}
              maxVisible={15}
            />
          </Tabs.Content>

          {/* Schedule Tab */}
          <Tabs.Content value="schedule" pt={4}>
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
              <GridItem>
                <ShiftOverview
                  overview={scheduleOverview}
                  isLoading={isLoading && !scheduleOverview}
                />
              </GridItem>
              <GridItem>
                <VStack align="stretch" gap={4}>
                  <UpcomingTasks
                    tasks={pendingTasks}
                    onTaskClick={handleTaskClick}
                    onTaskComplete={completeTask}
                    maxVisible={8}
                  />

                  {/* Info Card */}
                  <Box
                    bg="blue.50"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="blue.200"
                    p={6}
                    textAlign="center"
                  >
                    <Icon as={LuCalendarClock} boxSize={10} color="blue.400" mb={3} />
                    <Text fontWeight="semibold" color="gray.700" mb={2}>
                      Full Scheduling
                    </Text>
                    <Text fontSize="sm" color="gray.500" mb={4}>
                      View the complete schedule, create shifts, and manage assignments
                      in the Scheduling module.
                    </Text>
                    <Link to="/scheduling">
                      <Button colorPalette="blue" size="sm">
                        <Icon as={LuCalendarClock} boxSize={4} mr={2} />
                        Open Scheduling
                      </Button>
                    </Link>
                  </Box>
                </VStack>
              </GridItem>
            </Grid>
          </Tabs.Content>
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

export default Dashboard;