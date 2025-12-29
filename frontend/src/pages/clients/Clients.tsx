/**
 * Clients Page
 *
 * Central hub for client portfolio management in Guardian Optix.
 * Provides client overview, site management, and contact information.
 *
 * Features:
 * - Client portfolio overview with key metrics
 * - Searchable and filterable client list
 * - Site and contact management per client
 * - Activity tracking and incident monitoring
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
  LuBuilding2,
  LuRefreshCw,
  LuPlus,
  LuSearch,
  LuUsers,
  LuMapPin,
  LuTriangleAlert,
  LuFilter,
  LuCircleCheck,
  LuCirclePause,
} from 'react-icons/lu';
import { usePageTitle } from '../../context/PageContext';
import { useAuth } from '../../context/AuthContext';

// Components
import ClientsTable from './components/ClientsTable';
import ClientDetailsDrawer from './components/ClientDetailsDrawer';
import AddClientModal from './components/AddClientModal';

// Hooks
import { useClientsData } from './hooks/useClientsData';

// Types
import type { Client } from '../../types/client.types';

// ============================================
// Tab Configuration
// ============================================

type TabValue = 'all' | 'active' | 'inactive' | 'sites';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { value: 'all', label: 'All Clients', icon: LuBuilding2 },
  { value: 'active', label: 'Active', icon: LuCircleCheck },
  { value: 'inactive', label: 'Inactive', icon: LuCirclePause },
  { value: 'sites', label: 'Sites', icon: LuMapPin },
];

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  onRefresh: () => void;
  onAddClient: () => void;
  isLoading: boolean;
  isManager: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, onAddClient, isLoading, isManager }) => (
  <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
    <HStack gap={3}>
      <Box p={2} borderRadius="lg" bg="blue.50" color="blue.600">
        <LuBuilding2 size={24} />
      </Box>
      <Box>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          Clients
        </Text>
        <Text fontSize="sm" color="gray.500">
          Manage your client portfolio and sites
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
        <Button colorPalette="blue" size="sm" onClick={onAddClient}>
          <Icon as={LuPlus} boxSize={4} mr={2} />
          Add Client
        </Button>
      )}
    </HStack>
  </HStack>
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
// Quick Stats Component
// ============================================

interface QuickStatsProps {
  totalClients: number;
  activeClients: number;
  totalSites: number;
  totalIncidents: number;
  isLoading: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({
                                                 totalClients,
                                                 activeClients,
                                                 totalSites,
                                                 totalIncidents,
                                                 isLoading,
                                               }) => {
  const stats = [
    {
      label: 'Total Clients',
      value: totalClients,
      icon: LuBuilding2,
      color: 'blue',
    },
    {
      label: 'Active Clients',
      value: activeClients,
      icon: LuUsers,
      color: 'green',
    },
    {
      label: 'Total Sites',
      value: totalSites,
      icon: LuMapPin,
      color: 'purple',
    },
    {
      label: 'Incidents (Month)',
      value: totalIncidents,
      icon: LuTriangleAlert,
      color: totalIncidents > 10 ? 'red' : 'gray',
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
  onFilterToggle?: () => void;
  showFilterButton?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
                                               value,
                                               onChange,
                                               onSearch,
                                               onFilterToggle,
                                               showFilterButton = true,
                                             }) => {
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
            placeholder="Search by name, location, or contact..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            pl={10}
          />
        </Box>
        <Button type="submit" colorPalette="blue">
          Search
        </Button>
        {showFilterButton && onFilterToggle && (
          <Button variant="outline" onClick={onFilterToggle}>
            <Icon as={LuFilter} boxSize={4} mr={2} />
            Filters
          </Button>
        )}
      </HStack>
    </Box>
  );
};

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  hasFilters: boolean;
  isManager: boolean;
  onAddClient: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasFilters, isManager, onAddClient }) => (
  <Flex justify="center" align="center" py={16}>
    <VStack gap={4}>
      <Box color="gray.400">
        <LuBuilding2 size={48} />
      </Box>
      <Text color="gray.500" fontSize="lg">No clients found</Text>
      <Text color="gray.400" fontSize="sm">
        {hasFilters
          ? 'Try adjusting your filters'
          : 'Add your first client to get started'}
      </Text>
      {isManager && !hasFilters && (
        <Button colorPalette="blue" size="sm" onClick={onAddClient}>
          <Icon as={LuPlus} boxSize={4} mr={2} />
          Add Client
        </Button>
      )}
    </VStack>
  </Flex>
);

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
        Showing {start} to {end} of {total} clients
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
// Sites Overview Component (for Sites tab)
// ============================================

interface SitesOverviewProps {
  clients: Client[];
  isLoading: boolean;
}

const SitesOverview: React.FC<SitesOverviewProps> = ({ clients, isLoading }) => {
  const totalSites = clients.reduce((sum, c) => sum + c.totalSites, 0);
  const activeSites = clients.reduce((sum, c) => sum + c.activeSites, 0);

  if (isLoading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {/* Sites Summary */}
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        p={6}
      >
        <HStack justify="space-between" mb={4}>
          <Text fontWeight="semibold" color="gray.700">Sites Summary</Text>
          <Badge colorPalette="purple" variant="subtle">
            {activeSites} active of {totalSites} total
          </Badge>
        </HStack>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
          {clients
            .filter(c => c.totalSites > 0)
            .sort((a, b) => b.totalSites - a.totalSites)
            .slice(0, 6)
            .map((client) => (
              <Box
                key={client.id}
                p={4}
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.100"
                bg="gray.50"
              >
                <Text fontWeight="medium" color="gray.800" mb={1}>
                  {client.companyName}
                </Text>
                <HStack gap={2}>
                  <Badge colorPalette="green" variant="subtle" size="sm">
                    {client.activeSites} active
                  </Badge>
                  <Text fontSize="sm" color="gray.500">
                    / {client.totalSites} sites
                  </Text>
                </HStack>
              </Box>
            ))}
        </Grid>

        {clients.filter(c => c.totalSites > 0).length > 6 && (
          <Text fontSize="sm" color="gray.500" mt={4} textAlign="center">
            + {clients.filter(c => c.totalSites > 0).length - 6} more clients with sites
          </Text>
        )}
      </Box>

      {/* Info Card */}
      <Box
        bg="purple.50"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="purple.200"
        p={6}
        textAlign="center"
      >
        <Icon as={LuMapPin} boxSize={10} color="purple.400" mb={3} />
        <Text fontWeight="semibold" color="gray.700" mb={2}>
          Site Management
        </Text>
        <Text fontSize="sm" color="gray.500" mb={4}>
          View and manage individual sites by selecting a client from the All Clients tab.
          Each client profile includes detailed site information and assignments.
        </Text>
      </Box>
    </VStack>
  );
};

// ============================================
// Main Component
// ============================================

const Clients: React.FC = () => {
  const { setTitle } = usePageTitle();
  const { user } = useAuth();
  const isManager = user?.role === 'Manager' || user?.role === 'Admin';

  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Set page title
  useEffect(() => {
    setTitle('Clients');
  }, [setTitle]);

  // Data hook
  const {
    clients,
    selectedClient,
    isLoading,
    isLoadingDetails,
    isMutating,
    pagination,
    filters,
    setFilters,
    selectClient,
    refreshClients,
    createClient,
    createSite,
    error,
  } = useClientsData();

  // Computed stats
  const totalClients = pagination.total;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const inactiveClients = clients.filter(c => c.status !== 'active').length;
  const totalSites = clients.reduce((sum, c) => sum + c.totalSites, 0);
  const totalIncidents = clients.reduce((sum, c) => sum + c.incidentsThisMonth, 0);

  // Filtered clients based on tab
  const filteredClients = React.useMemo(() => {
    switch (activeTab) {
      case 'active':
        return clients.filter(c => c.status === 'active');
      case 'inactive':
        return clients.filter(c => c.status !== 'active');
      default:
        return clients;
    }
  }, [clients, activeTab]);

  // Handlers
  const handleSearch = useCallback(() => {
    setFilters({ ...filters, search: searchInput, page: 1 });
  }, [filters, searchInput, setFilters]);

  const handleClientSelect = useCallback((client: Client) => {
    selectClient(client.id);
    setIsDrawerOpen(true);
  }, [selectClient]);

  const handleClientEdit = useCallback((client: Client) => {
    selectClient(client.id);
    setIsDrawerOpen(true);
  }, [selectClient]);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => selectClient(null), 300);
  }, [selectClient]);

  const handlePageChange = useCallback((page: number) => {
    setFilters({ ...filters, page });
  }, [filters, setFilters]);

  const handleRefresh = () => {
    refreshClients();
  };

  // Site creation handler
  const handleSiteCreated = useCallback(async (clientId: string, siteData: any) => {
    await createSite(clientId, siteData);
  }, [createSite]);

  const hasFilters = !!(filters.search || filters.status !== 'all');

  // Loading state
  if (isLoading && clients.length === 0) {
    return (
      <VStack gap={4} align="stretch">
        <Header
          onRefresh={handleRefresh}
          onAddClient={() => setIsAddModalOpen(true)}
          isLoading={true}
          isManager={isManager}
        />
        <VStack py={16} gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading clients...</Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Header */}
      <Header
        onRefresh={handleRefresh}
        onAddClient={() => setIsAddModalOpen(true)}
        isLoading={isLoading}
        isManager={isManager}
      />

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      {/* Quick Stats */}
      <QuickStats
        totalClients={totalClients}
        activeClients={activeClients}
        totalSites={totalSites}
        totalIncidents={totalIncidents}
        isLoading={isLoading && clients.length === 0}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSearch={handleSearch}
        showFilterButton={false}
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
                  {tab.value === 'active' && activeClients > 0 && (
                    <Badge colorPalette="green" variant="solid" size="sm">
                      {activeClients}
                    </Badge>
                  )}
                  {tab.value === 'inactive' && inactiveClients > 0 && (
                    <Badge colorPalette="gray" variant="solid" size="sm">
                      {inactiveClients}
                    </Badge>
                  )}
                </HStack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* All Clients Tab */}
          <Tabs.Content value="all" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              {filteredClients.length === 0 ? (
                <EmptyState
                  hasFilters={hasFilters}
                  isManager={isManager}
                  onAddClient={() => setIsAddModalOpen(true)}
                />
              ) : (
                <ClientsTable
                  clients={filteredClients}
                  isLoading={isLoading}
                  onClientSelect={handleClientSelect}
                  onClientEdit={handleClientEdit}
                  selectedClientId={selectedClient?.id}
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

          {/* Active Clients Tab */}
          <Tabs.Content value="active" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              {filteredClients.length === 0 ? (
                <Flex justify="center" align="center" py={16}>
                  <VStack gap={3}>
                    <Icon as={LuCircleCheck} boxSize={12} color="gray.300" />
                    <Text color="gray.500">No active clients</Text>
                  </VStack>
                </Flex>
              ) : (
                <ClientsTable
                  clients={filteredClients}
                  isLoading={isLoading}
                  onClientSelect={handleClientSelect}
                  onClientEdit={handleClientEdit}
                  selectedClientId={selectedClient?.id}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              )}
            </Box>
          </Tabs.Content>

          {/* Inactive Clients Tab */}
          <Tabs.Content value="inactive" pt={4}>
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              {filteredClients.length === 0 ? (
                <Flex justify="center" align="center" py={16}>
                  <VStack gap={3}>
                    <Icon as={LuCirclePause} boxSize={12} color="gray.300" />
                    <Text color="gray.500">No inactive clients</Text>
                  </VStack>
                </Flex>
              ) : (
                <ClientsTable
                  clients={filteredClients}
                  isLoading={isLoading}
                  onClientSelect={handleClientSelect}
                  onClientEdit={handleClientEdit}
                  selectedClientId={selectedClient?.id}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              )}
            </Box>
          </Tabs.Content>

          {/* Sites Tab */}
          <Tabs.Content value="sites" pt={4}>
            <SitesOverview clients={clients} isLoading={isLoading} />
          </Tabs.Content>
        </Tabs.Root>
      </Box>

      {/* Drawer - Updated with onSiteCreated */}
      <ClientDetailsDrawer
        client={selectedClient}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onEdit={handleClientEdit}
        isLoading={isLoadingDetails}
        onSiteCreated={handleSiteCreated}
        isMutating={isMutating}
      />

      {/* Add Modal */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={createClient}
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

export default Clients;