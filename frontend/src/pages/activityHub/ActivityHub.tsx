/**
 * Activity Hub Page
 *
 * Central hub for system activity logs (audit trail) and team updates/announcements.
 * Provides real-time visibility into operational events and team communications.
 *
 * Features:
 * - System activity log with filtering (audit trail for compliance)
 * - Updates & announcements with acknowledgement tracking
 * - Summary statistics and metrics
 * - Tab-based navigation between sections
 */

import React, { useEffect, useState } from 'react';
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
  FiActivity,
  FiBell,
  FiRefreshCw,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import { usePageTitle } from '../../context/PageContext';

// Components
import ActivityLog from './components/ActivityLog';
import UpdatesFeed from './components/UpdatesFeed';
import ActivityStats from './components/ActivityStats';

// Hooks
import { useActivityHubData } from './hooks/useActivityHubData';

// ============================================
// Tab Configuration
// ============================================

type TabValue = 'all' | 'activity' | 'updates';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { value: 'all', label: 'Overview', icon: FiActivity },
  { value: 'activity', label: 'Activity Log', icon: FiClock },
  { value: 'updates', label: 'Updates', icon: FiBell },
];

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, isLoading }) => {
  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <HStack justify="space-between" mb={6}>
      <VStack align="flex-start" gap={1}>
        <HStack gap={3}>
          <Icon as={FiActivity} boxSize={6} color="blue.500" />
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            Activity Hub
          </Text>
        </HStack>
        <Text fontSize="sm" color="gray.500">
          System activity logs, updates, and team communications
        </Text>
      </VStack>

      <HStack gap={4}>
        <HStack gap={2}>
          <Box w={2} h={2} borderRadius="full" bg="green.400" />
          <Text fontSize="sm" color="gray.500">
            Last updated: {formatLastUpdated(lastUpdated)}
          </Text>
        </HStack>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <Icon as={FiRefreshCw} mr={2} className={isLoading ? 'spin' : ''} />
          Refresh
        </Button>
      </HStack>
    </HStack>
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
    mb={4}
  >
    <HStack justify="space-between">
      <HStack gap={2}>
        <Icon as={FiAlertCircle} color="red.500" />
        <Text color="red.700">{message}</Text>
      </HStack>
      <Button size="sm" colorPalette="red" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </HStack>
  </Box>
);

// ============================================
// Main Component
// ============================================

const ActivityHub: React.FC = () => {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Set page title
  useEffect(() => {
    setTitle('Activity Hub');
  }, [setTitle]);

  // Fetch data
  const {
    activities,
    updates,
    activityStats,
    updateStats,
    isLoading,
    isLoadingMore,
    error,
    activityFilters,
    updateFilters,
    activityPagination,
    setActivityFilters,
    setUpdateFilters,
    loadMoreActivities,
    markUpdateRead,
    acknowledgeUpdate,
    refetch,
  } = useActivityHubData();

  // Update timestamp on data load
  useEffect(() => {
    if (!isLoading && (activities.length > 0 || updates.length > 0)) {
      setLastUpdated(new Date());
    }
  }, [isLoading, activities.length, updates.length]);

  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (isLoading && activities.length === 0 && updates.length === 0) {
    return (
      <VStack gap={3} align="stretch">
        <Header lastUpdated={null} onRefresh={handleRefresh} isLoading={true} />
        <VStack py={16} gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading activity hub...</Text>
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
      />

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      {/* Stats Overview */}
      <ActivityStats
        activityStats={activityStats}
        updateStats={updateStats}
        isLoading={isLoading}
      />

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
                  <Icon as={tab.icon} />
                  <Text>{tab.label}</Text>
                  {tab.value === 'updates' && updateStats && updateStats.unread > 0 && (
                    <Badge colorPalette="red" variant="solid" size="sm">
                      {updateStats.unread}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Overview Tab - Shows both */}
          <Tabs.Content value="all" pt={4}>
            <Grid
              templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
              gap={6}
            >
              <GridItem>
                <ActivityLog
                  activities={activities.slice(0, 10)}
                  filters={activityFilters}
                  onFiltersChange={setActivityFilters}
                  isLoading={isLoading}
                  onLoadMore={() => setActiveTab('activity')}
                  hasMore={activities.length > 10}
                />
              </GridItem>
              <GridItem>
                <UpdatesFeed
                  updates={updates.slice(0, 5)}
                  filters={updateFilters}
                  onFiltersChange={setUpdateFilters}
                  onMarkRead={markUpdateRead}
                  onAcknowledge={acknowledgeUpdate}
                  isLoading={isLoading}
                  canCreate={false}
                />
              </GridItem>
            </Grid>
          </Tabs.Content>

          {/* Activity Log Tab - Full view */}
          <Tabs.Content value="activity" pt={4}>
            <ActivityLog
              activities={activities}
              filters={activityFilters}
              onFiltersChange={setActivityFilters}
              isLoading={isLoading || isLoadingMore}
              onLoadMore={loadMoreActivities}
              hasMore={activityPagination.page < activityPagination.totalPages}
            />
          </Tabs.Content>

          {/* Updates Tab - Full view */}
          <Tabs.Content value="updates" pt={4}>
            <UpdatesFeed
              updates={updates}
              filters={updateFilters}
              onFiltersChange={setUpdateFilters}
              onMarkRead={markUpdateRead}
              onAcknowledge={acknowledgeUpdate}
              isLoading={isLoading}
              canCreate={true}
            />
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

export default ActivityHub;