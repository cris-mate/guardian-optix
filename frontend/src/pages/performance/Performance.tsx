/**
 * Performance Page
 *
 * Central hub for guard performance monitoring and analytics.
 * Tracks patrol completion, attendance, incident response, and compliance metrics.
 *
 * Features:
 * - Overview dashboard with key performance indicators
 * - Guard rankings and individual performance details
 * - Patrol completion tracking with checkpoint metrics
 * - Attendance and punctuality analysis
 * - Performance alerts and exceptions
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
  Select,
  createListCollection,
} from '@chakra-ui/react';
import {
  LuActivity,
  LuRefreshCw,
  LuTrophy,
  LuRoute,
  LuClock,
  LuCircleAlert,
  LuChartBar,
} from 'react-icons/lu';
import { usePageTitle } from '../../context/PageContext';

// Components
import PerformanceOverview from './components/PerformanceOverview';
import GuardRankings from './components/GuardRankings';
import PatrolPerformance from './components/PatrolPerformance';
import AttendancePerformance from './components/AttendancePerformance';
import PerformanceAlerts from './components/PerformanceAlerts';

// Hooks
import { usePerformanceData } from './hooks/usePerformanceData';

// Types
import type { TimeRange } from '../../types/performance.types';

// ============================================
// Tab Configuration
// ============================================

type TabValue = 'overview' | 'patrols' | 'attendance' | 'guards';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { value: 'overview', label: 'Overview', icon: LuChartBar },
  { value: 'patrols', label: 'Patrols', icon: LuRoute },
  { value: 'attendance', label: 'Attendance', icon: LuClock },
  { value: 'guards', label: 'Rankings', icon: LuTrophy },
];

// Time Range Options
const timeRangeCollection = createListCollection({
  items: [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
  ],
});

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const Header: React.FC<HeaderProps> = ({
                                         lastUpdated,
                                         onRefresh,
                                         isLoading,
                                         timeRange,
                                         onTimeRangeChange,
                                       }) => {
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
    <HStack justify="space-between" mb={6} flexWrap="wrap" gap={4}>
      <VStack align="flex-start" gap={1}>
        <HStack gap={3}>
          <Icon as={LuActivity} boxSize={6} color="purple.500" />
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            Performance
          </Text>
        </HStack>
        <Text fontSize="sm" color="gray.500">
          Monitor security guard performance, patrol completion, and attendance metrics
        </Text>
      </VStack>

      <HStack gap={4} flexWrap="wrap">
        {/* Time Range Selector */}
        <Select.Root
          collection={timeRangeCollection}
          value={[timeRange]}
          onValueChange={(e) => onTimeRangeChange(e.value[0] as TimeRange)}
          size="sm"
          width="150px"
        >
          <Select.Trigger>
            <Select.ValueText placeholder="Select period" />
          </Select.Trigger>
          <Select.Content>
            {timeRangeCollection.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        {/* Last Updated */}
        <HStack gap={2}>
          <Box w={2} h={2} borderRadius="full" bg="green.400" />
          <Text fontSize="sm" color="gray.500">
            Updated: {formatLastUpdated(lastUpdated)}
          </Text>
        </HStack>

        {/* Refresh Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          color="green.600"
          borderColor="green.300"
          _hover={{ bg: 'green.50', borderColor: 'green.400' }}
        >
          <Icon as={LuRefreshCw} mr={2} className={isLoading ? 'spin' : ''} />
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
        <Icon as={LuCircleAlert} color="red.500" />
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

const Performance: React.FC = () => {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Set page title
  useEffect(() => {
    setTitle('Performance');
  }, [setTitle]);

  // Fetch data
  const {
    overview,
    guards,
    rankings,
    patrols,
    attendance,
    alerts,
    isLoading,
    error,
    filters,
    setFilters,
    selectedGuardId,
    setSelectedGuardId,
    refetch,
    dismissAlert,
    markAlertRead,
  } = usePerformanceData();

  // Update timestamp on data load
  useEffect(() => {
    if (!isLoading && overview) {
      setLastUpdated(new Date());
    }
  }, [isLoading, overview]);

  const handleRefresh = () => {
    refetch();
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setFilters({ ...filters, timeRange: range });
  };

  // Loading state
  if (isLoading && !overview) {
    return (
      <VStack gap={3} align="stretch">
        <Header
          lastUpdated={null}
          onRefresh={handleRefresh}
          isLoading={true}
          timeRange={filters.timeRange}
          onTimeRangeChange={handleTimeRangeChange}
        />
        <VStack py={16} gap={4}>
          <Spinner size="xl" color="purple.500" />
          <Text color="gray.500">Loading performance data...</Text>
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
        timeRange={filters.timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

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
                  bg: 'purple.50',
                  color: 'purple.600',
                }}
              >
                <HStack gap={2}>
                  <Icon as={tab.icon} />
                  <Text>{tab.label}</Text>
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Content value="overview" pt={4}>
            <Grid
              templateColumns={{ base: '1fr', xl: '1fr 320px' }}
              gap={6}
            >
              <GridItem>
                <VStack align="stretch" gap={6}>
                  {/* KPI Overview */}
                  <PerformanceOverview
                    metrics={overview}
                    isLoading={isLoading}
                  />

                  {/* Guard Rankings (compact) */}
                  <GuardRankings
                    guards={guards}
                    rankings={rankings}
                    onSelectGuard={setSelectedGuardId}
                    selectedGuardId={selectedGuardId}
                    isLoading={isLoading}
                    compact
                  />
                </VStack>
              </GridItem>

              {/* Alerts Sidebar */}
              <GridItem>
                <PerformanceAlerts
                  alerts={alerts}
                  onDismiss={dismissAlert}
                  onMarkRead={markAlertRead}
                  isLoading={isLoading}
                  compact
                />
              </GridItem>
            </Grid>
          </Tabs.Content>

          {/* Patrols Tab */}
          <Tabs.Content value="patrols" pt={4}>
            <PatrolPerformance
              metrics={patrols}
              isLoading={isLoading}
            />
          </Tabs.Content>

          {/* Attendance Tab */}
          <Tabs.Content value="attendance" pt={4}>
            <AttendancePerformance
              metrics={attendance}
              isLoading={isLoading}
            />
          </Tabs.Content>

          {/* Guard Rankings Tab */}
          <Tabs.Content value="guards" pt={4}>
            <GuardRankings
              guards={guards}
              rankings={rankings}
              onSelectGuard={setSelectedGuardId}
              selectedGuardId={selectedGuardId}
              isLoading={isLoading}
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

export default Performance;