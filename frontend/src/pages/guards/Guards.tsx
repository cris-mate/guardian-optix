/**
 * Guards Page
 *
 * Central hub for security personnel management in Guardian Optix.
 * Provides guard overview, status tracking, and licence management.
 *
 * Features:
 * - Guard portfolio overview with key metrics
 * - Searchable and filterable guard list
 * - Status-based tabs (All, On Duty, Off Duty, Expiring Licences)
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
  LuUserMinus,
  LuSearch,
  LuShieldAlert,
  LuCircleCheck,
  LuCirclePause,
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
import type { Guards as GuardsType } from '../../types/guards.types';

// ============================================
// Tab Configuration
// ============================================

type TabValue = 'all' | 'on-duty' | 'off-duty' | 'expiring';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { value: 'all', label: 'All Guards', icon: LuUsers },
  { value: 'on-duty', label: 'On Duty', icon: LuCircleCheck },
  { value: 'off-duty', label: 'Off Duty', icon: LuCirclePause },
  { value: 'expiring', label: 'Expiring Licences', icon: LuBadgeAlert },
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
        <Button
          colorPalette="blue"
          size="sm"
          onClick={onAddGuard}
        >
          <Icon as={LuUserPlus} boxSize={4} mr={2} />
          Add Guard
        </Button>
      )}
    </HStack>
  </HStack>
);

// ============================================
// Stats Cards Component
// ============================================

interface StatsCardsProps {
  total: number;
  availableToday: number;
  unassignedThisWeek: number;
  complianceAlerts: number;
  isLoading: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({
                                                 total,
                                                 availableToday,
                                                 unassignedThisWeek,
                                                 complianceAlerts,
                                                 isLoading,
                                               }) => {
  const stats = [
    { label: 'Total Guards', value: total, icon: LuUsers, color: 'blue' },
    { label: 'Available Today', value: availableToday, icon: LuCircleCheck, color: 'green' },
    { label: 'Unassigned This Week', value: unassignedThisWeek, icon: LuUserMinus, color: 'orange' },
    { label: 'Compliance Alerts', value: complianceAlerts, icon: LuShieldAlert, color: 'red' },
  ];

  return (
    <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
      {stats.map((stat) => (
        <Box
          key={stat.label}
          bg="white"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          p={4}
        >
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.500">
              {stat.label}
            </Text>
            <Icon as={stat.icon} boxSize={5} color={`${stat.color}.500`} />
          </HStack>
          {isLoading ? (
            <Spinner size="sm" color="gray.400" />
          ) : (
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              {stat.value}
            </Text>
          )}
        </Box>
      ))}
    </Grid>
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
  const emptyMessages: Record<TabValue, { icon: React.ElementType; message: string }> = {
    all: { icon: LuUsers, message: hasFilters ? 'No guards match your filters' : 'No guards found' },
    'on-duty': { icon: LuCircleCheck, message: 'No guards currently on duty' },
    'off-duty': { icon: LuCirclePause, message: 'No guards currently off duty' },
    expiring: { icon: LuBadgeAlert, message: 'No licences expiring soon' },
  };

  const { icon, message } = emptyMessages[tabValue];

  return (
    <Flex justify="center" align="center" py={16}>
      <VStack gap={3}>
        <Icon as={icon} boxSize={12} color="gray.300" />
        <Text color="gray.500">{message}</Text>
        {tabValue === 'all' && !hasFilters && isManager && (
          <Button colorPalette="blue" size="sm" onClick={onAddGuard}>
            <Icon as={LuUserPlus} boxSize={4} mr={2} />
            Add First Guard
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
        Showing {start}-{end} of {total}
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
    setFilters,
    resetFilters,
    selectGuard,
    createGuard,
    refetch,
    error,
  } = useGuardsData();

  // Computed counts for tabs
  const onDutyCount = guards.filter(g => g.status === 'on-duty').length;
  const offDutyCount = guards.filter(g => g.status === 'off-duty').length;
  const expiringCount = guards.filter(g =>
    g.siaLicence?.status === 'expiring-soon'
  ).length;

  // Computed stats for cards
  const availableTodayCount = guards.filter(g =>
    g.availability && g.status !== 'on-duty'
  ).length;
  const unassignedThisWeekCount = guards.filter(g =>
    g.availability && g.status === 'off-duty'
  ).length;
  const complianceAlertsCount = guards.filter(g =>
    g.siaLicence?.status === 'expiring-soon' || g.siaLicence?.status === 'expired'
  ).length;

  // Filtered guards based on tab
  const filteredGuards = React.useMemo(() => {
    switch (activeTab) {
      case 'on-duty':
        return guards.filter(g => g.status === 'on-duty');
      case 'off-duty':
        return guards.filter(g => g.status === 'off-duty');
      case 'expiring':
        return guards.filter(g => g.siaLicence?.status === 'expiring-soon');
      default:
        return guards;
    }
  }, [guards, activeTab]);

  // Handlers
  const handleSearch = useCallback(() => {
    setFilters({ ...filters, search: searchInput, page: 1 });
  }, [filters, searchInput, setFilters]);

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
    setFilters({ ...filters, page });
  }, [filters, setFilters]);

  const handleRefresh = () => {
    refetch();
  };

  const hasFilters = !!filters.search || filters.status !== 'all' ||
    filters.role !== 'all' || filters.guardType !== 'all';

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

      {/* Stats Cards */}
      <StatsCards
        total={pagination.total}
        availableToday={availableTodayCount}
        unassignedThisWeek={unassignedThisWeekCount}
        complianceAlerts={complianceAlertsCount}
        isLoading={isLoading}
      />

      {/* Search Bar */}
      <HStack gap={2}>
        <Box position="relative" flex={1}>
          <Input
            placeholder="Search by name, badge, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            pl={10}
            bg="white"
          />
          <Icon
            as={LuSearch}
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            color="gray.400"
            boxSize={4}
          />
        </Box>
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={resetFilters}>
            Clear
          </Button>
        )}
      </HStack>

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
                _selected={{
                  bg: 'blue.50',
                  color: 'blue.600',
                }}
              >
                <HStack gap={2}>
                  <Icon as={tab.icon} boxSize={4} />
                  <Text>{tab.label}</Text>
                  {tab.value === 'on-duty' && onDutyCount > 0 && (
                    <Badge colorPalette="green" variant="solid" size="sm">
                      {onDutyCount}
                    </Badge>
                  )}
                  {tab.value === 'off-duty' && offDutyCount > 0 && (
                    <Badge colorPalette="gray" variant="solid" size="sm">
                      {offDutyCount}
                    </Badge>
                  )}
                  {tab.value === 'expiring' && expiringCount > 0 && (
                    <Badge colorPalette="orange" variant="solid" size="sm">
                      {expiringCount}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* All Guards Tab */}
          <Tabs.Content value="all" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              {filteredGuards.length === 0 ? (
                <EmptyState
                  tabValue="all"
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

          {/* On Duty Tab */}
          <Tabs.Content value="on-duty" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              {filteredGuards.length === 0 ? (
                <EmptyState
                  tabValue="on-duty"
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
            </Box>
          </Tabs.Content>

          {/* Off Duty Tab */}
          <Tabs.Content value="off-duty" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              {filteredGuards.length === 0 ? (
                <EmptyState
                  tabValue="off-duty"
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
            </Box>
          </Tabs.Content>

          {/* Expiring Licences Tab */}
          <Tabs.Content value="expiring" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              {filteredGuards.length === 0 ? (
                <EmptyState
                  tabValue="expiring"
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
            </Box>
          </Tabs.Content>
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