/**
 * Dashboard Page
 *
 * Main operations dashboard providing real-time overview of security operations.
 * Features 4 core KPIs, tabbed content sections, and auto-refresh polling.
 *
 * Design follows consistent patterns from Guards, Clients, and other pages.
 * Fetches real data from /api/dashboard endpoints.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Spinner,
  Grid,
  Badge,
  Tabs,
} from '@chakra-ui/react';
import {
  LuUsers,
  LuCalendarCheck,
  LuTriangleAlert,
  LuShieldCheck,
  LuLayoutDashboard,
  LuActivity,
  LuClipboardList,
  LuCircleAlert,
} from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../context/PageContext';
import { useDashboardData } from './hooks/useDashboardData';
import { QuickStatsCard, PageHeader } from '../../components/common';

// Sub-components (existing files)
import LiveActivityFeed from './components/LiveActivityFeed';
import ShiftOverview from './components/ShiftOverview';
import GuardStatusTable from './components/GuardStatusTable';
import UpcomingTasks from './components/UpcomingTasks';
import AlertsPanel from './components/AlertsPanel';
import QuickActions from './components/QuickActions';

import type {
  GuardStatusEntry,
  Task,
  OperationalMetrics,
} from '../../types/dashboard.types';

// ============================================
// Types
// ============================================

type TabValue = 'overview' | 'activity' | 'tasks' | 'alerts';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

// ============================================
// Quick Stats Grid Component
// ============================================

interface QuickStatsProps {
  metrics: OperationalMetrics | null;
  isLoading: boolean;
  onNavigate: (path: string) => void;
}

const QuickStats: React.FC<QuickStatsProps> = ({ metrics, isLoading, onNavigate }) => {
  const stats = [
    {
      label: 'Guards On Duty',
      value: metrics?.activeGuards ?? 0,
      icon: LuUsers,
      color: 'blue' as const,
      subtext: `of ${metrics?.totalScheduled ?? 0} scheduled`,
      path: '/guards',
    },
    {
      label: 'Shift Coverage',
      value: metrics?.shiftsCovered ?? 0,
      icon: LuCalendarCheck,
      color: 'green' as const,
      subtext: `of ${metrics?.shiftsToday ?? 0} shifts today`,
      path: '/scheduling',
    },
    {
      label: 'Open Incidents',
      value: metrics?.openIncidents ?? 0,
      icon: LuTriangleAlert,
      color: 'orange' as const,
      subtext: 'requiring attention',
      path: '/compliance?tab=incidents',
    },
    {
      label: 'Compliance Rate',
      value: `${metrics?.complianceScore ?? 0}%`,
      icon: LuShieldCheck,
      color: 'teal' as const,
      subtext: 'SIA certification health',
      path: '/compliance',
    },
  ];

  return (
    <Grid
      templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
      gap={4}
    >
      {stats.map((stat) => (
        <QuickStatsCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          subtext={stat.subtext}
          isLoading={isLoading}
          onClick={() => onNavigate(stat.path)}
        />
      ))}
    </Grid>
  );
};

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
      <HStack gap={2}>
        <Icon as={LuCircleAlert} color="red.500" />
        <Text color="red.700" fontSize="sm">
          {message}
        </Text>
      </HStack>
      <Button size="sm" colorPalette="red" variant="ghost" onClick={onRetry}>
        Retry
      </Button>
    </HStack>
  </Box>
);

// ============================================
// Main Dashboard Component
// ============================================

const Dashboard: React.FC = () => {
  const { setTitle } = usePageTitle();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Set page title
  useEffect(() => {
    setTitle('Dashboard');
  }, [setTitle]);

  // Data hook - fetches real data with auto-refresh polling
  const {
    metrics,
    alerts,
    scheduleOverview,
    guardStatuses,
    activityFeed,
    pendingTasks,
    isLoading,
    error,
    refresh,
    dismissAlert,
    markAlertRead,
    completeTask,
  } = useDashboardData({ autoRefresh: true });

  // Tab configuration with badges
  const tabs: TabConfig[] = [
    { value: 'overview', label: 'Overview', icon: LuLayoutDashboard },
    {
      value: 'activity',
      label: 'Activity',
      icon: LuActivity,
      badge: activityFeed.length,
    },
    {
      value: 'tasks',
      label: 'Tasks',
      icon: LuClipboardList,
      badge: pendingTasks.length,
    },
    {
      value: 'alerts',
      label: 'Alerts',
      icon: LuCircleAlert,
      badge: alerts.filter((a) => !a.isRead).length,
    },
  ];

  // Handlers
  const handleGuardClick = useCallback((guard: GuardStatusEntry) => {
    navigate(`/guards/${guard._id}`);
  }, [navigate]);

  const handleTaskClick = useCallback((task: Task) => {
    console.log('Task clicked:', task._id);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Loading state
  if (isLoading && !metrics) {
    return (
      <VStack gap={4} align="stretch">
        <PageHeader
          title="Dashboard"
          description="Real-time security operations overview"
          icon={LuLayoutDashboard}
          iconColor="blue"
          onRefresh={refresh}
          isLoading={true}
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
      {/* Page Header with Refresh */}
      <PageHeader
        title="Dashboard"
        description="Real-time security operations overview"
        icon={LuLayoutDashboard}
        iconColor="blue"
        onRefresh={refresh}
        isLoading={isLoading}
      />

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {/* Quick Stats - 4 Core KPIs */}
      <QuickStats
        metrics={metrics}
        isLoading={isLoading && !metrics}
        onNavigate={handleNavigate}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Tabbed Content */}
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
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <Badge
                      colorPalette={tab.value === 'alerts' ? 'red' : 'blue'}
                      variant="solid"
                      borderRadius="full"
                      fontSize="xs"
                      px={2}
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Content value="overview" pt={4}>
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={4}>
              {/* Left Column */}
              <VStack gap={4} align="stretch">
                <ShiftOverview
                  overview={scheduleOverview}
                  isLoading={isLoading}
                />
                <GuardStatusTable
                  guards={guardStatuses}
                  onGuardClick={handleGuardClick}
                  maxVisible={5}
                />
              </VStack>

              {/* Right Column */}
              <LiveActivityFeed
                activities={activityFeed}
                maxVisible={10}
                onViewAll={() => navigate('/activity-hub')}
              />
            </Grid>
          </Tabs.Content>

          {/* Activity Tab */}
          <Tabs.Content value="activity" pt={4}>
            <LiveActivityFeed
              activities={activityFeed}
              maxVisible={20}
              showViewAll={false}
            />
          </Tabs.Content>

          {/* Tasks Tab */}
          <Tabs.Content value="tasks" pt={4}>
            <UpcomingTasks
              tasks={pendingTasks}
              onTaskClick={handleTaskClick}
              onTaskComplete={completeTask}
              maxVisible={20}
            />
          </Tabs.Content>

          {/* Alerts Tab */}
          <Tabs.Content value="alerts" pt={4}>
            <AlertsPanel
              alerts={alerts}
              onDismiss={dismissAlert}
              onMarkRead={markAlertRead}
              showViewAll={false}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Box>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </VStack>
  );
};

export default Dashboard;