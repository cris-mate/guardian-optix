/**
 * Guards Page
 *
 * Main page for managing security officers and staff.
 * Provides search, filtering, and detailed officer views.
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
} from '@chakra-ui/react';
import { LuUsers, LuUserPlus, LuRefreshCw } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useGuardsData } from './hooks/useGuardsData';
import GuardsFilters from './components/GuardsFilters';
import GuardsTable from './components/GuardsTable';
import GuardsDrawer from './components/GuardsDrawer';
import AddGuardsModal from './components/AddGuardsModal';
import { Guards as GuardsType} from './types/guards.types';

const Guards: React.FC = () => {
  const { user } = useAuth();
  const {
    guards,
    selectedOfficer,
    isLoading,
    isLoadingDetails,
    isMutating,
    error,
    filters,
    pagination,
    stats,
    setFilters,
    resetFilters,
    selectOfficer,
    createOfficer,
    refetch,
  } = useGuardsData();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Check if user has manager/admin permissions
  const isManager = user?.role === 'Admin' || user?.role === 'Manager';

  // Handle officer selection
  const handleOfficerSelect = (id: string) => {
    selectOfficer(id);
    setIsDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    // Delay clearing selection to allow drawer animation
    setTimeout(() => selectOfficer(null), 300);
  };

  // Handle edit (placeholder)
  const handleEdit = (officer: GuardsType) => {
    console.log('Edit officer:', officer._id);
    // TODO: Implement edit modal
  };

  return (
    <Container maxW="container.xl" py={6}>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={3}>
          <Box
            p={2}
            borderRadius="lg"
            bg="blue.50"
            color="blue.600"
          >
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

        <HStack gap={3}>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <LuRefreshCw size={14} />
            Refresh
          </Button>
          {isManager && (
            <Button
              colorPalette="blue"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <LuUserPlus size={14} />
              Add Officer
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Error State */}
      {error && (
        <Box
          bg="red.50"
          borderWidth="1px"
          borderColor="red.200"
          borderRadius="lg"
          p={4}
          mb={6}
        >
          <Text color="red.700">{error}</Text>
        </Box>
      )}

      {/* Filters */}
      <Box mb={6}>
        <GuardsFilters
          filters={filters}
          stats={stats}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />
      </Box>

      {/* Main Content */}
      <Box
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        {/* Results Header */}
        <Flex
          justify="space-between"
          align="center"
          px={6}
          py={3}
          bg="gray.50"
          borderBottomWidth="1px"
          borderColor="gray.200"
        >
          <Text fontSize="sm" color="gray.600">
            Showing {guards.length} of {pagination.total} officers
          </Text>
        </Flex>

        {/* Empty State */}
        {!isLoading && guards.length === 0 ? (
          <Flex justify="center" align="center" py={16}>
            <VStack gap={4}>
              <Box color="gray.400">
                <LuUsers size={48} />
              </Box>
              <Text color="gray.500" fontSize="lg">
                No officers found
              </Text>
              <Text color="gray.400" fontSize="sm">
                {filters.search || filters.status !== 'all' || filters.role !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first security officer to get started'
                }
              </Text>
              {isManager && !filters.search && filters.status === 'all' && (
                <Button
                  colorPalette="blue"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <LuUserPlus size={16} />
                  Add Officer
                </Button>
              )}
            </VStack>
          </Flex>
        ) : (
          <GuardsTable
            guards={guards}
            isLoading={isLoading}
            selectedId={selectedOfficer?._id}
            filters={filters}
            onFiltersChange={setFilters}
            onSelect={handleOfficerSelect}
            onEdit={isManager ? handleEdit : undefined}
          />
        )}

        {/* Pagination */}
        {guards.length > 0 && pagination.totalPages > 1 && (
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
              Page {pagination.page} of {pagination.totalPages}
            </Text>
            <HStack gap={2}>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setFilters({ page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters({ page: pagination.page + 1 })}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        )}
      </Box>

      {/* Officer Details Drawer */}
      <GuardsDrawer
        officer={selectedOfficer}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onEdit={isManager ? handleEdit : undefined}
        isLoading={isLoadingDetails}
      />

      {/* Add Officer Modal */}
      <AddGuardsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={createOfficer}
        isSubmitting={isMutating}
      />
    </Container>
  );
};

export default Guards;