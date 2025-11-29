/**
 * Clients Page
 *
 * Main client management page for Guardian Optix.
 * Simplified version focusing on client list, sites, and contacts.
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  VStack,
  Button,
  Input,
  Spinner,
  Badge,
  Grid,
  GridItem,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import {
  LuPlus,
  LuSearch,
  LuRefreshCw,
  LuBuilding2,
  LuUsers,
  LuMapPin,
  LuTriangle,
} from 'react-icons/lu';

import { useAuth } from '../../context/AuthContext';
import { useClientsData } from './hooks/useClientsData';
import ClientsTable from './components/ClientsTable';
import ClientDetailsDrawer from './components/ClientDetailsDrawer';
import AddClientModal from './components/AddClientModal';
import ClientFilters from './components/ClientFilters';
import type { Client, ClientFilters as ClientFiltersType } from './types/client.types';

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorScheme?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorScheme = 'blue' }) => (
  <Box
    bg="white"
    borderRadius="lg"
    p={4}
    borderWidth="1px"
    borderColor="gray.200"
    shadow="sm"
  >
    <HStack gap={3}>
      <Box p={2} borderRadius="md" bg={`${colorScheme}.50`} color={`${colorScheme}.600`}>
        {icon}
      </Box>
      <Box>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">{value}</Text>
        <Text fontSize="sm" color="gray.500">{label}</Text>
      </Box>
    </HStack>
  </Box>
);

// ============================================
// Main Component
// ============================================

const Clients: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager' || user?.role === 'Admin';

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
    error,
    clearError,
  } = useClientsData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
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

  const handleFiltersChange = useCallback((newFilters: ClientFiltersType) => {
    setFilters({ ...newFilters, page: 1 });
  }, [setFilters]);

  // Computed stats
  const totalClients = pagination.total;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalSites = clients.reduce((sum, c) => sum + c.totalSites, 0);
  const totalIncidents = clients.reduce((sum, c) => sum + c.incidentsThisMonth, 0);

  return (
    <Container maxW="1600px" py={6}>
      {/* Header */}
      <Flex mb={6} align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading as="h1" size="lg" color="gray.800" mb={1}>Clients</Heading>
          <Text color="gray.600">Manage your client portfolio and sites</Text>
        </Box>
        <Spacer />
        <HStack gap={2}>
          <Button variant="outline" size="sm" onClick={refreshClients} disabled={isLoading}>
            <LuRefreshCw size={16} style={{ marginRight: 8 }} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          {isManager && (
            <Button colorPalette="blue" size="sm" onClick={() => setIsAddModalOpen(true)}>
              <LuPlus size={16} style={{ marginRight: 8 }} />
              Add Client
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Stats */}
      <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4} mb={6}>
        <GridItem>
          <StatCard label="Total Clients" value={totalClients} icon={<LuBuilding2 size={20} />} colorScheme="blue" />
        </GridItem>
        <GridItem>
          <StatCard label="Active Clients" value={activeClients} icon={<LuUsers size={20} />} colorScheme="green" />
        </GridItem>
        <GridItem>
          <StatCard label="Total Sites" value={totalSites} icon={<LuMapPin size={20} />} colorScheme="purple" />
        </GridItem>
        <GridItem>
          <StatCard label="Incidents (Month)" value={totalIncidents} icon={<LuTriangle size={20} />} colorScheme={totalIncidents > 10 ? 'red' : 'gray'} />
        </GridItem>
      </Grid>

      {/* Search & Filters */}
      <Box bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200" p={4} mb={6}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'stretch', md: 'center' }}>
          <Box as="form" onSubmit={handleSearch} flex={1} maxW={{ md: '400px' }}>
            <HStack>
              <Box position="relative" flex={1}>
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" zIndex={1}>
                  <LuSearch size={18} />
                </Box>
                <Input
                  placeholder="Search by name, location, or contact..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  pl={10}
                />
              </Box>
              <Button type="submit" colorPalette="blue">Search</Button>
            </HStack>
          </Box>
          <Spacer display={{ base: 'none', md: 'block' }} />
          <ClientFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </Flex>

        {/* Active Filters */}
        {(filters.search || (filters.status && filters.status !== 'all')) && (
          <HStack mt={3} gap={2} flexWrap="wrap">
            <Text fontSize="sm" color="gray.500">Active filters:</Text>
            {filters.search && (
              <Badge
                colorPalette="blue"
                variant="subtle"
                cursor="pointer"
                onClick={() => { setSearchInput(''); setFilters({ ...filters, search: '' }); }}
              >
                Search: "{filters.search}" ×
              </Badge>
            )}
            {filters.status && filters.status !== 'all' && (
              <Badge
                colorPalette="green"
                variant="subtle"
                cursor="pointer"
                onClick={() => setFilters({ ...filters, status: 'all' })}
              >
                Status: {filters.status} ×
              </Badge>
            )}
            <Button
              variant="ghost"
              size="xs"
              color="gray.500"
              onClick={() => {
                setSearchInput('');
                setFilters({ search: '', status: 'all', sortBy: 'companyName', sortOrder: 'asc', page: 1, limit: 10 });
              }}
            >
              Clear all
            </Button>
          </HStack>
        )}
      </Box>

      {/* Error */}
      {error && (
        <Box bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="md" p={4} mb={6}>
          <HStack justify="space-between">
            <Text color="red.700">{error}</Text>
            <Button size="sm" variant="ghost" onClick={clearError}>Dismiss</Button>
          </HStack>
        </Box>
      )}

      {/* Table */}
      <Box bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200" overflow="hidden">
        {isLoading && clients.length === 0 ? (
          <Flex justify="center" align="center" py={16}>
            <VStack gap={4}>
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.500">Loading clients...</Text>
            </VStack>
          </Flex>
        ) : clients.length === 0 ? (
          <Flex justify="center" align="center" py={16}>
            <VStack gap={4}>
              <Box color="gray.400"><LuBuilding2 size={48} /></Box>
              <Text color="gray.500" fontSize="lg">No clients found</Text>
              <Text color="gray.400" fontSize="sm">
                {filters.search || filters.status !== 'all' ? 'Try adjusting your filters' : 'Add your first client to get started'}
              </Text>
              {isManager && !filters.search && filters.status === 'all' && (
                <Button colorPalette="blue" size="sm" onClick={() => setIsAddModalOpen(true)}>
                  <LuPlus size={16} style={{ marginRight: 8 }} />
                  Add Client
                </Button>
              )}
            </VStack>
          </Flex>
        ) : (
          <ClientsTable
            clients={clients}
            isLoading={isLoading}
            onClientSelect={handleClientSelect}
            onClientEdit={handleClientEdit}
            selectedClientId={selectedClient?.id}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {/* Pagination */}
        {clients.length > 0 && pagination.totalPages > 1 && (
          <Flex justify="space-between" align="center" px={6} py={4} borderTopWidth="1px" borderColor="gray.200" bg="gray.50">
            <Text fontSize="sm" color="gray.600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
            </Text>
            <HStack gap={2}>
              <Button size="sm" variant="outline" disabled={pagination.page <= 1} onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}>
                Previous
              </Button>
              <Text fontSize="sm" color="gray.600">Page {pagination.page} of {pagination.totalPages}</Text>
              <Button size="sm" variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}>
                Next
              </Button>
            </HStack>
          </Flex>
        )}
      </Box>

      {/* Drawer */}
      <ClientDetailsDrawer
        client={selectedClient}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onEdit={handleClientEdit}
        isLoading={isLoadingDetails}
      />

      {/* Add Modal */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={createClient}
        isSubmitting={isMutating}
      />
    </Container>
  );
};

export default Clients;