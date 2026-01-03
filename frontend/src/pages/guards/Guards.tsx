/**
 * Guards Page
 *
 * Central hub for security personnel management in Guardian Optix.
 * Provides guard overview, status tracking, and licence management.
 *
 * Features:
 * - Guard portfolio overview with key metrics
 * - Searchable and filterable guard list
 * - Status-based tabs (All + each status)
 * - Guard details drawer with full profile
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
  LuUsers,
  LuRefreshCw,
  LuUserPlus,
  LuSearch,
  LuShieldAlert,
  LuCircleCheck,
  LuCirclePause,
  LuCoffee,
  LuClock,
  LuUserX,
  LuCalendarClock,
  LuBadgeAlert,
} from 'react-icons/lu';
import { usePageTitle } from '../../context/PageContext';
import { useAuth } from '../../context/AuthContext';

// Components
import GuardsTable from './components/GuardsTable';
import GuardsDrawer from './components/GuardsDrawer';
import AddGuardsModal from './components/AddGuardsModal';

// Hooks
import { useGuardsData } from './hooks/useGuardsData';

// Types
import type { Guards as GuardsType, GuardsStatus } from '../../types/guards.types';

// ============================================
// Tab Configuration
// ============================================

type TabValue = 'all' | GuardsStatus | 'expiring';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
  color: string;
}

const tabs: TabConfig[] = [
  { value: 'all', label: 'All Guards', icon: LuUsers, color: 'blue' },
  { value: 'on-duty', label: 'On Duty', icon: LuCircleCheck, color: 'green' },
  { value: 'off-duty', label: 'Off Duty', icon: LuCirclePause, color: 'gray' },
  { value: 'on-break', label: 'On Break', icon: LuCoffee, color: 'yellow' },
  { value: 'scheduled', label: 'Scheduled', icon: LuCalendarClock, color: 'blue' },
  { value: 'late', label: 'Late', icon: LuClock, color: 'orange' },
  { value: 'absent', label: 'Absent', icon: LuUserX, color: 'red' },
  { value: 'expiring', label: 'Expiring Licences', icon: LuBadgeAlert, color: 'orange' },
];

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  onRefresh: () => void;
  onAddGuard: () => void;
  isLoading: boolean;
  isManager: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, onAddGuard, isLoading, isManager }) => (
  <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
    <HStack gap={3}>
      <Box p={2} borderRadius="lg" bg="blue.50" color="blue.600">
        <LuUsers size={24} />
      </Box>
      <Box>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          Guards
        </Text>
        <Text fontSize="sm" color="gray.500">
          Manage security officers and staff
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
      {isManager && (
        <Button colorPalette="blue" size="sm" onClick={onAddGuard}>
          <Icon as={LuUserPlus} boxSize={4} mr={2} />
          Add Guard
        </Button>
      )}
    </HStack>
  </HStack>
);

// ============================================
// Quick Stats Component
// ============================================

interface QuickStatsProps {
  stats: {
    total: number;
    onDuty: number;
    offDuty: number;
    onBreak: number;
    late: number;
    absent: number;
    scheduled: number;
    availableToday: number;
    unassignedThisWeek: number;
    expiringLicences: number;
  };
  isLoading: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({ stats, isLoading }) => {
  const statCards = [
    { label: 'Total Guards', value: stats.total, icon: LuUsers, color: 'blue' },
    { label: 'Available Today', value: stats.availableToday, icon: LuCircleCheck, color: 'green' },
    { label: 'Unassigned This Week', value: stats.unassignedThisWeek, icon: LuCalendarClock, color: 'orange' },
    { label: 'Compliance Alert', value: stats.expiringLicences, icon: LuShieldAlert, color: stats.expiringLicences > 0 ? 'red' : 'gray' },
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
            placeholder="Search by name, email, SIA badge, or postcode..."
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
  hasFilters: boolean;
  isManager: boolean;
  onAddGuard: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ tabValue, hasFilters, isManager, onAddGuard }) => {
  const getEmptyMessage = () => {
    if (hasFilters) return 'No guards match your search criteria';
    switch (tabValue) {
      case 'on-duty': return 'No guards currently on duty';
      case 'off-duty': return 'No guards currently off duty';
      case 'on-break': return 'No guards currently on break';
      case 'scheduled': return 'No guards scheduled';
      case 'late': return 'No late guards - great!';
      case 'absent': return 'No absent guards - excellent!';
      case 'expiring': return 'No expiring licences - all compliant!';
      default: return 'No guards found';
    }
  };

  const showPositive = tabValue === 'late' || tabValue === 'absent' || tabValue === 'expiring';

  return (
    <Flex justify="center" align="center" py={16}>
      <VStack gap={4}>
        <Box color={showPositive ? 'green.400' : 'gray.400'}>
          {showPositive ? <LuCircleCheck size={48} /> : <LuUsers size={48} />}
        </Box>
        <Text color={showPositive ? 'green.600' : 'gray.500'} fontSize="lg">
          {getEmptyMessage()}
        </Text>
        {!hasFilters && tabValue === 'all' && isManager && (
          <Button colorPalette="blue" size="sm" onClick={onAddGuard}>
            <Icon as={LuUserPlus} boxSize={4} mr={2} />
            Add Guard
          </Button>
        )}
      </VStack>
    </Flex>
  );
};

// ============================================
// Pagination Component
// ============================================

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
                                                 page,
                                                 totalPages,
                                                 total,
                                                 limit,
                                                 onPageChange,
                                               }) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <Flex
      justify="space-between"
      align="center"
      px={6}
      py={4}
      borderTopWidth="1px"
      borderColor="gray.200"
      bg="gray.50"
    >
      <Text fontSize="sm" color="gray.600">
        Showing {start} to {end} of {total} guards
      </Text>
      <HStack gap={2}>
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Text fontSize="sm" color="gray.600">
          Page {page} of {totalPages}
        </Text>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </HStack>
    </Flex>
  );
};

// ============================================
// Main Component
// ============================================

const Guards: React.FC = () => {
  const { setTitle } = usePageTitle();
  const { user } = useAuth();
  const isManager = user?.role === 'Manager' || user?.role === 'Admin';

  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Set page title
  useEffect(() => {
    setTitle('Guards');
  }, [setTitle]);

  // Data hook
  const {
    guards,
    selectedGuard,
    isLoading,
    isLoadingDetails,
    isMutating,
    pagination,
    filters,
    stats,
    setFilters,
    selectGuard,
    createGuard,
    refetch,
  } = useGuardsData();

  // Get counts per status for badges
  const statusCounts = React.useMemo(() => ({
    'on-duty': stats.onDuty,
    'off-duty': stats.offDuty,
    'on-break': stats.onBreak,
    'late': stats.late,
    'absent': stats.absent,
    'scheduled': stats.scheduled,
    'expiring': stats.expiringLicences,
  }), [stats.onDuty, stats.offDuty, stats.onBreak, stats.late, stats.absent, stats.scheduled, stats.expiringLicences]);

  // Filtered guards based on tab
  const filteredGuards = React.useMemo(() => {
    if (activeTab === 'all') return guards;
    if (activeTab === 'expiring') {
      return guards.filter(g =>
        g.siaLicence?.status === 'expiring-soon' || g.siaLicence?.status === 'expired'
      );
    }
    return guards.filter(g => g.status === activeTab);
  }, [guards, activeTab]);

  // Handlers
  const handleSearch = useCallback(() => {
    setFilters({ search: searchInput, page: 1 });
  }, [searchInput, setFilters]);

  const handleGuardSelect = useCallback((id: string) => {
    selectGuard(id);
    setIsDrawerOpen(true);
  }, [selectGuard]);

  const handleGuardEdit = useCallback((guard: GuardsType) => {
    selectGuard(guard._id);
    setIsDrawerOpen(true);
  }, [selectGuard]);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => selectGuard(null), 300);
  }, [selectGuard]);

  const handlePageChange = useCallback((page: number) => {
    setFilters({ page });
  }, [setFilters]);

  const handleRefresh = () => {
    refetch();
  };

  const hasFilters = !!filters.search;

  // Loading state
  if (isLoading && guards.length === 0) {
    return (
      <VStack gap={4} align="stretch">
        <Header
          onRefresh={handleRefresh}
          onAddGuard={() => setIsAddModalOpen(true)}
          isLoading={true}
          isManager={isManager}
        />
        <VStack py={16} gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading guards...</Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Header */}
      <Header
        onRefresh={handleRefresh}
        onAddGuard={() => setIsAddModalOpen(true)}
        isLoading={isLoading}
        isManager={isManager}
      />

      {/* Quick Stats */}
      <QuickStats stats={stats} isLoading={isLoading && guards.length === 0} />

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
          <Box overflowX="auto" pb={2}>
            <Tabs.List
              bg="white"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
              p={1}
              minW="fit-content"
            >
              {tabs.map((tab) => {
                const count = tab.value === 'all' ? stats.total : statusCounts[tab.value as keyof typeof statusCounts];
                return (
                  <Tabs.Trigger
                    key={tab.value}
                    value={tab.value}
                    px={3}
                    py={2}
                    borderRadius="md"
                    fontWeight="medium"
                    fontSize="sm"
                    color="gray.600"
                    whiteSpace="nowrap"
                    _selected={{
                      bg: `${tab.color}.50`,
                      color: `${tab.color}.600`,
                    }}
                  >
                    <HStack gap={2}>
                      <Icon as={tab.icon} boxSize={4} />
                      <Text>{tab.label}</Text>
                      {count !== undefined && count > 0 && (
                        <Badge
                          colorPalette={tab.color}
                          variant="solid"
                          size="sm"
                        >
                          {count}
                        </Badge>
                      )}
                    </HStack>
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>
          </Box>

          {/* Tab Content */}
          {tabs.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value} pt={4}>
              <Box
                bg="white"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="gray.200"
                overflow="hidden"
              >
                {filteredGuards.length === 0 ? (
                  <EmptyState
                    tabValue={tab.value}
                    hasFilters={hasFilters}
                    isManager={isManager}
                    onAddGuard={() => setIsAddModalOpen(true)}
                  />
                ) : (
                  <GuardsTable
                    guards={filteredGuards}
                    isLoading={isLoading}
                    onSelect={handleGuardSelect}
                    onEdit={isManager ? handleGuardEdit : undefined}
                    selectedId={selectedGuard?._id}
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                )}
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={pagination.limit}
                  onPageChange={handlePageChange}
                />
              </Box>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </Box>

      {/* Guard Details Drawer */}
      <GuardsDrawer
        guard={selectedGuard}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onEdit={isManager ? handleGuardEdit : undefined}
        isLoading={isLoadingDetails}
      />

      {/* Add Guard Modal */}
      <AddGuardsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={createGuard}
        isSubmitting={isMutating}
      />

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

export default Guards;