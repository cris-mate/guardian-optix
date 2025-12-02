/**
 * Reports Page
 *
 * Central hub for analytics reports and data exports.
 * Provides operational reports, performance analytics, and exportable summaries.
 *
 * Features:
 * - Pre-built report templates by category
 * - Report generation with format selection
 * - Report history with download options
 * - Scheduled automated reports
 * - Quick statistics dashboard
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
  Select,
  createListCollection,
} from '@chakra-ui/react';
import {
  LuChartPie,
  LuRefreshCw,
  LuDownload,
  LuCalendarRange,
  LuChartBar,
  LuClock,
  LuTriangleAlert,
  LuBriefcase,
  LuShield,
  LuCircleAlert,
  LuStar,
  LuHistory,
  LuCalendarClock,
} from 'react-icons/lu';
import { usePageTitle } from '../../context/PageContext';

// Components
import ReportQuickStats from './components/ReportQuickStats';
import ReportTemplates from './components/ReportTemplates';
import RecentReports from './components/RecentReports';
import ScheduledReports from './components/ScheduledReports';

// Hooks
import { useReportsData } from './hooks/useReportsData';

// Types
import type { ReportCategory, TimeRange } from './types/reports.types';

// ============================================
// Tab Configuration
// ============================================

type TabValue = 'templates' | 'history' | 'scheduled';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { value: 'templates', label: 'Report Templates', icon: LuChartBar },
  { value: 'history', label: 'Report History', icon: LuHistory },
  { value: 'scheduled', label: 'Scheduled', icon: LuCalendarClock },
];

// Category Filter Options
const categoryCollection = createListCollection({
  items: [
    { value: 'all', label: 'All Categories', icon: LuChartBar },
    { value: 'operational', label: 'Operational', icon: LuChartBar },
    { value: 'attendance', label: 'Attendance', icon: LuClock },
    { value: 'incidents', label: 'Incidents', icon: LuTriangleAlert },
    { value: 'clients', label: 'Clients', icon: LuBriefcase },
    { value: 'compliance', label: 'Compliance', icon: LuShield },
  ],
});

// Time Range Options
const timeRangeCollection = createListCollection({
  items: [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ],
});

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({
                                         lastUpdated,
                                         onRefresh,
                                         isLoading,
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
          <Icon as={LuChartPie} boxSize={6} color="blue.500" />
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            Reports
          </Text>
        </HStack>
        <Text fontSize="sm" color="gray.500">
          Analytics, insights, and exportable data summaries
        </Text>
      </VStack>

      <HStack gap={4} flexWrap="wrap">
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
// Category Filter Component
// ============================================

interface CategoryFilterProps {
  activeCategory: ReportCategory | 'all';
  onCategoryChange: (category: ReportCategory | 'all') => void;
  favoriteCount: number;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
                                                         activeCategory,
                                                         onCategoryChange,
                                                         favoriteCount,
                                                       }) => {
  const categories: { value: ReportCategory | 'all'; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'all', label: 'All', icon: LuChartBar, color: 'gray' },
    { value: 'operational', label: 'Operational', icon: LuChartBar, color: 'blue' },
    { value: 'attendance', label: 'Attendance', icon: LuClock, color: 'green' },
    { value: 'incidents', label: 'Incidents', icon: LuTriangleAlert, color: 'orange' },
    { value: 'clients', label: 'Clients', icon: LuBriefcase, color: 'purple' },
    { value: 'compliance', label: 'Compliance', icon: LuShield, color: 'teal' },
  ];

  return (
    <HStack
      gap={2}
      p={1}
      bg="gray.100"
      borderRadius="lg"
      flexWrap="wrap"
    >
      {categories.map((cat) => (
        <Button
          key={cat.value}
          size="sm"
          variant={activeCategory === cat.value ? 'solid' : 'ghost'}
          colorPalette={activeCategory === cat.value ? cat.color : 'gray'}
          onClick={() => onCategoryChange(cat.value)}
        >
          <Icon as={cat.icon} boxSize={4} mr={1} />
          {cat.label}
        </Button>
      ))}

      {/* Favorites shortcut */}
      {favoriteCount > 0 && (
        <Button
          size="sm"
          variant="ghost"
          colorPalette="yellow"
          ml={2}
        >
          <Icon as={LuStar} boxSize={4} mr={1} fill="currentColor" />
          Favourites ({favoriteCount})
        </Button>
      )}
    </HStack>
  );
};

// ============================================
// Main Component
// ============================================

const Reports: React.FC = () => {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState<TabValue>('templates');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Set page title
  useEffect(() => {
    setTitle('Reports');
  }, [setTitle]);

  // Fetch data
  const {
    templates,
    allTemplates,
    favoriteTemplates,
    recentReports,
    scheduledReports,
    quickStats,
    isLoading,
    isGenerating,
    error,
    activeCategory,
    setActiveCategory,
    selectedTemplateId,
    setSelectedTemplateId,
    refetch,
    generateReport,
    toggleFavorite,
    deleteScheduledReport,
  } = useReportsData();

  // Update timestamp on data load
  useEffect(() => {
    if (!isLoading && quickStats) {
      setLastUpdated(new Date());
    }
  }, [isLoading, quickStats]);

  const handleRefresh = () => {
    refetch();
  };

  const handleGenerateReport = async (templateId: string) => {
    try {
      await generateReport(templateId, 'pdf');
      // Could show toast notification here
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  const handleDownloadReport = (reportId: string) => {
    // Would trigger actual download
    const report = recentReports.find(r => r.id === reportId);
    if (report?.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    }
  };

  // Loading state
  if (isLoading && !quickStats) {
    return (
      <VStack gap={3} align="stretch">
        <Header
          lastUpdated={null}
          onRefresh={handleRefresh}
          isLoading={true}
        />
        <VStack py={16} gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading reports...</Text>
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

      {/* Quick Stats */}
      <ReportQuickStats
        stats={quickStats}
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
                  {tab.value === 'scheduled' && scheduledReports.length > 0 && (
                    <Badge colorPalette="purple" variant="solid" size="sm">
                      {scheduledReports.filter(r => r.isActive).length}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Templates Tab */}
          <Tabs.Content value="templates" pt={4}>
            <VStack align="stretch" gap={4}>
              {/* Category Filter */}
              <CategoryFilter
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                favoriteCount={favoriteTemplates.length}
              />

              {/* Templates Grid with Sidebar */}
              <Grid
                templateColumns={{ base: '1fr', xl: '1fr 320px' }}
                gap={6}
              >
                <GridItem>
                  <ReportTemplates
                    templates={templates}
                    onSelect={setSelectedTemplateId}
                    onGenerate={handleGenerateReport}
                    onToggleFavorite={toggleFavorite}
                    selectedTemplateId={selectedTemplateId}
                    isLoading={isLoading}
                    isGenerating={isGenerating}
                  />
                </GridItem>

                {/* Sidebar */}
                <GridItem>
                  <VStack align="stretch" gap={4}>
                    <RecentReports
                      reports={recentReports}
                      onDownload={handleDownloadReport}
                      isLoading={isLoading}
                      compact
                    />
                    <ScheduledReports
                      reports={scheduledReports}
                      onDelete={deleteScheduledReport}
                      isLoading={isLoading}
                    />
                  </VStack>
                </GridItem>
              </Grid>
            </VStack>
          </Tabs.Content>

          {/* History Tab */}
          <Tabs.Content value="history" pt={4}>
            <RecentReports
              reports={recentReports}
              onDownload={handleDownloadReport}
              isLoading={isLoading}
            />
          </Tabs.Content>

          {/* Scheduled Tab */}
          <Tabs.Content value="scheduled" pt={4}>
            <Grid
              templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
              gap={6}
            >
              <GridItem>
                <ScheduledReports
                  reports={scheduledReports}
                  onDelete={deleteScheduledReport}
                  isLoading={isLoading}
                />
              </GridItem>
              <GridItem>
                <Box
                  bg="blue.50"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="blue.200"
                  p={6}
                  textAlign="center"
                >
                  <Icon as={LuCalendarClock} boxSize={12} color="blue.400" mb={4} />
                  <Text fontWeight="semibold" color="gray.700" mb={2}>
                    Automate Your Reports
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    Set up automated report delivery to receive reports directly in your inbox
                    on a daily, weekly, or monthly basis.
                  </Text>
                  <Button colorPalette="blue" size="sm">
                    <Icon as={LuCalendarRange} boxSize={4} mr={2} />
                    Create Schedule
                  </Button>
                </Box>
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

export default Reports;