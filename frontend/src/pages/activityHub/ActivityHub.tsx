/**
 * Activity Hub Page
 *
 * Central hub for system activity monitoring, updates, and team communications.
 * Provides operational overview, activity tracking, and announcements.
 *
 * Features:
 * - Operational stats dashboard
 * - Searchable activity log
 * - Updates/announcements feed
 * - Real-time Socket.io updates
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Input,
  Grid,
  Tabs,
  Spinner,
  Badge,
  Flex,
} from '@chakra-ui/react';
import {
  LuActivity,
  LuRefreshCw,
  LuSearch,
  LuShield,
  LuTriangleAlert,
  LuCalendarX,
  LuBadgeAlert,
  LuLayoutGrid,
  LuList,
  LuBell,
} from 'react-icons/lu';
import { usePageTitle } from '../../context/PageContext';

// Components
import ActivityLog from './components/ActivityLog';
import UpdatesFeed from './components/UpdatesFeed';

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
  { value: 'all', label: 'Overview', icon: LuLayoutGrid },
  { value: 'activity', label: 'Activity Log', icon: LuList },
  { value: 'updates', label: 'Updates', icon: LuBell },
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
        <LuActivity size={24} />
      </Box>
      <Box>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          Activity Hub
        </Text>
        <Text fontSize="sm" color="gray.500">
          System activity logs, updates, and communications
        </Text>
      </Box>
    </HStack>

    <HStack gap={2}>
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
  </HStack>
);

// ============================================
// Quick Stats Component
// ============================================

interface QuickStatsProps {
  guardsOnDuty: number;
  openIncidents: number;
  coverageGaps: number;
  complianceAlerts: number;
  isLoading: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({
                                                 guardsOnDuty,
                                                 openIncidents,
                                                 coverageGaps,
                                                 complianceAlerts,
                                                 isLoading,
                                               }) => {
  const statCards = [
    { label: 'Guards On Duty', value: guardsOnDuty, icon: LuShield, color: 'green' },
    { label: 'Open Incidents', value: openIncidents, icon: LuTriangleAlert, color: openIncidents > 0 ? 'orange' : 'gray' },
    { label: 'Coverage Gaps', value: coverageGaps, icon: LuCalendarX, color: coverageGaps > 0 ? 'red' : 'gray' },
    { label: 'Compliance Alerts', value: complianceAlerts, icon: LuBadgeAlert, color: complianceAlerts > 0 ? 'purple' : 'gray' },
  ];

  return (
    <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
      {statCards.map((stat) => (
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
            </VStack>
          ) : (
            <HStack gap={3}>
              <Box p={2} borderRadius="md" bg={`${stat.color}.50`} color={`${stat.color}.600`}>
                <Icon as={stat.icon} boxSize={5} />
              </Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                  {stat.value}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {stat.label}
                </Text>
              </Box>
            </HStack>
          )}
        </Box>
      ))}
    </Grid>
  );
};

// ============================================
// Search Bar Component
// ============================================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      p={4}
    >
      <HStack gap={3}>
        <Box position="relative" flex={1} maxW="400px">
          <Box
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            color="gray.400"
            zIndex={1}
          >
            <LuSearch size={18} />
          </Box>
          <Input
            placeholder="Search activities, updates, or events..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            pl={10}
          />
        </Box>
        <Button type="submit" colorPalette="blue">
          Search
        </Button>
      </HStack>
    </Box>
  );
};

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  tabValue: TabValue;
}

const EmptyState: React.FC<EmptyStateProps> = ({ tabValue }) => {
  const getEmptyMessage = () => {
    switch (tabValue) {
      case 'activity':
        return 'No activity recorded yet';
      case 'updates':
        return 'No updates or announcements';
      default:
        return 'No data available';
    }
  };

  return (
    <Flex justify="center" align="center" py={16}>
      <VStack gap={4}>
        <Box color="gray.400">
          <LuActivity size={48} />
        </Box>
        <Text color="gray.500" fontSize="lg">
          {getEmptyMessage()}
        </Text>
      </VStack>
    </Flex>
  );
};

// ============================================
// Main Component
// ============================================

const ActivityHub: React.FC = () => {
  const { setTitle } = usePageTitle();

  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [searchInput, setSearchInput] = useState('');

  // Set page title
  useEffect(() => {
    setTitle('Activity Hub');
  }, [setTitle]);

  // Fetch data using the hook
  const {
    activities,
    updates,
    updateStats,
    operationalStats,
    isLoading,
    isLoadingMore,
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

  // Handlers
  const handleSearch = useCallback(() => {
    setActivityFilters({ search: searchInput });
    setUpdateFilters({ search: searchInput });
  }, [searchInput, setActivityFilters, setUpdateFilters]);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Computed values
  const guardsOnDuty = operationalStats?.guardsOnDuty ?? 0;
  const openIncidents = operationalStats?.openIncidents ?? 0;
  const coverageGaps = operationalStats?.unassignedShifts ?? 0;
  const complianceAlerts = operationalStats?.complianceAlerts ?? 0;
  const unreadUpdates = updateStats?.unread ?? 0;

  // Loading state
  if (isLoading && activities.length === 0) {
    return (
      <VStack gap={4} align="stretch">
        <Header onRefresh={handleRefresh} isLoading={true} />
        <VStack py={16} gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading activity data...</Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Header */}
      <Header onRefresh={handleRefresh} isLoading={isLoading} />

      {/* Quick Stats */}
      <QuickStats
        guardsOnDuty={guardsOnDuty}
        openIncidents={openIncidents}
        coverageGaps={coverageGaps}
        complianceAlerts={complianceAlerts}
        isLoading={isLoading && activities.length === 0}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSearch={handleSearch}
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
                  {tab.value === 'updates' && unreadUpdates > 0 && (
                    <Badge colorPalette="red" variant="solid" size="sm">
                      {unreadUpdates}
                    </Badge>
                  )}
                  {tab.value === 'activity' && activities.length > 0 && (
                    <Badge colorPalette="blue" variant="subtle" size="sm">
                      {activities.length}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Content value="all" pt={4}>
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
              <Box
                bg="white"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="gray.200"
                overflow="hidden"
              >
                {activities.length === 0 ? (
                  <EmptyState tabValue="activity" />
                ) : (
                  <ActivityLog
                    activities={activities.slice(0, 10)}
                    filters={activityFilters}
                    onFiltersChange={setActivityFilters}
                    isLoading={isLoading}
                    onLoadMore={() => setActiveTab('activity')}
                    hasMore={activities.length > 10}
                  />
                )}
              </Box>
              <Box
                bg="white"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="gray.200"
                overflow="hidden"
              >
                {updates.length === 0 ? (
                  <EmptyState tabValue="updates" />
                ) : (
                  <UpdatesFeed
                    updates={updates.slice(0, 5)}
                    filters={updateFilters}
                    onFiltersChange={setUpdateFilters}
                    onMarkRead={markUpdateRead}
                    onAcknowledge={acknowledgeUpdate}
                    isLoading={isLoading}
                    canCreate={false}
                  />
                )}
              </Box>
            </Grid>
          </Tabs.Content>

          {/* Activity Log Tab */}
          <Tabs.Content value="activity" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              {activities.length === 0 ? (
                <EmptyState tabValue="activity" />
              ) : (
                <ActivityLog
                  activities={activities}
                  filters={activityFilters}
                  onFiltersChange={setActivityFilters}
                  isLoading={isLoading || isLoadingMore}
                  onLoadMore={loadMoreActivities}
                  hasMore={activityPagination.page < activityPagination.totalPages}
                />
              )}
            </Box>
          </Tabs.Content>

          {/* Updates Tab */}
          <Tabs.Content value="updates" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              {updates.length === 0 ? (
                <EmptyState tabValue="updates" />
              ) : (
                <UpdatesFeed
                  updates={updates}
                  filters={updateFilters}
                  onFiltersChange={setUpdateFilters}
                  onMarkRead={markUpdateRead}
                  onAcknowledge={acknowledgeUpdate}
                  isLoading={isLoading}
                  canCreate={true}
                />
              )}
            </Box>
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