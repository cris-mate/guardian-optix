/**
 * SitesOverview Component
 *
 * Displays all sites in a table with drawer for details and shift management.
 * Replaces the simpler inline SitesOverview in Clients.tsx.
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Icon,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { LuSearch, LuMapPin, LuRefreshCw } from 'react-icons/lu';
import { useSitesData, type SiteWithDetails } from '../hooks/useSitesData';
import SitesTable from './SitesTable';
import SiteDetailsDrawer from './SiteDetailsDrawer';
import AddShiftForSiteModal from './AddShiftForSiteModal';
import { toaster } from '../../../components/ui/toaster';

// ============================================
// Pagination Component
// ============================================

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, total, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <Flex justify="space-between" align="center" px={4} py={3} borderTopWidth="1px" borderColor="gray.100">
      <Text fontSize="sm" color="gray.500">
        {total} site{total !== 1 ? 's' : ''} total
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
// Empty State Component
// ============================================

const EmptyState: React.FC<{ hasFilters: boolean }> = ({ hasFilters }) => (
  <Flex justify="center" align="center" py={16}>
    <VStack gap={3}>
      <Icon as={LuMapPin} boxSize={12} color="gray.300" />
      <Text color="gray.500">
        {hasFilters ? 'No sites match your filters' : 'No sites found'}
      </Text>
      {hasFilters && (
        <Text fontSize="sm" color="gray.400">
          Try adjusting your search or filters
        </Text>
      )}
    </VStack>
  </Flex>
);

// ============================================
// Main Component
// ============================================

const SitesOverview: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [selectedSiteForShift, setSelectedSiteForShift] = useState<SiteWithDetails | null>(null);

  const {
    sites,
    selectedSite,
    isLoading,
    isLoadingDetails,
    pagination,
    filters,
    setFilters,
    selectSite,
    refreshSites,
  } = useSitesData();

  // Handlers
  const handleSearch = useCallback(() => {
    setFilters({ ...filters, search: searchInput, page: 1 });
  }, [filters, searchInput, setFilters]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSiteSelect = useCallback((site: SiteWithDetails) => {
    selectSite(site._id);
    setIsDrawerOpen(true);
  }, [selectSite]);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => selectSite(null), 300);
  }, [selectSite]);

  const handlePageChange = useCallback((page: number) => {
    setFilters({ ...filters, page });
  }, [filters, setFilters]);

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setFilters({ ...filters, status, page: 1 });
  };

  const handleAddShift = useCallback((site: SiteWithDetails) => {
    setSelectedSiteForShift(site);
    setIsAddShiftModalOpen(true);
  }, []);

  const handleAddShiftSuccess = useCallback(() => {
    toaster.create({
      title: 'Shift Created',
      description: `Shift added to ${selectedSiteForShift?.name}`,
      type: 'success',
      duration: 4000,
    });
    void refreshSites();
    setIsAddShiftModalOpen(false);
    setSelectedSiteForShift(null);
  }, [selectedSiteForShift, refreshSites]);

  const hasFilters = !!filters.search || filters.status !== 'all';

  // Stats
  const totalSites = pagination.total;
  const activeSites = sites.filter((s) => s.status === 'active').length;
  const totalUnassigned = sites.reduce((sum, s) => sum + s.unassignedShifts, 0);

  return (
    <VStack gap={4} align="stretch">
      {/* Summary Stats */}
      <HStack gap={4} flexWrap="wrap">
        <Box bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200" px={4} py={3}>
          <Text fontSize="xs" color="gray.500">Total Sites</Text>
          <Text fontSize="xl" fontWeight="bold" color="gray.800">{totalSites}</Text>
        </Box>
        <Box bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200" px={4} py={3}>
          <Text fontSize="xs" color="gray.500">Active</Text>
          <Text fontSize="xl" fontWeight="bold" color="green.600">{activeSites}</Text>
        </Box>
        {totalUnassigned > 0 && (
          <Box bg="orange.50" borderRadius="lg" borderWidth="1px" borderColor="orange.200" px={4} py={3}>
            <Text fontSize="xs" color="orange.600">Unassigned Shifts</Text>
            <Text fontSize="xl" fontWeight="bold" color="orange.600">{totalUnassigned}</Text>
          </Box>
        )}
      </HStack>

      {/* Search and Filters */}
      <Box bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200" p={4}>
        <HStack gap={3} flexWrap="wrap">
          {/* Search */}
          <HStack flex={1} minW="250px">
            <Input
              placeholder="Search sites, clients, locations..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              size="sm"
            />
            <Button size="sm" onClick={handleSearch}>
              <Icon as={LuSearch} />
            </Button>
          </HStack>

          {/* Status Filter */}
          <HStack gap={1}>
            <Button
              size="sm"
              variant={filters.status === 'all' ? 'solid' : 'outline'}
              colorPalette={filters.status === 'all' ? 'blue' : 'gray'}
              onClick={() => handleStatusFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filters.status === 'active' ? 'solid' : 'outline'}
              colorPalette={filters.status === 'active' ? 'green' : 'gray'}
              onClick={() => handleStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={filters.status === 'inactive' ? 'solid' : 'outline'}
              colorPalette={filters.status === 'inactive' ? 'gray' : 'gray'}
              onClick={() => handleStatusFilter('inactive')}
            >
              Inactive
            </Button>
          </HStack>

          {/* Refresh */}
          <Button
            size="sm"
            variant="outline"
            onClick={refreshSites}
            disabled={isLoading}
          >
            <Icon as={LuRefreshCw} className={isLoading ? 'spin' : ''} />
          </Button>
        </HStack>
      </Box>

      {/* Sites Table */}
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        {isLoading && sites.length === 0 ? (
          <Flex justify="center" py={12}>
            <Spinner size="lg" color="purple.500" />
          </Flex>
        ) : sites.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <SitesTable
            sites={sites}
            isLoading={isLoading}
            onSiteSelect={handleSiteSelect}
            selectedSiteId={selectedSite?._id}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={handlePageChange}
        />
      </Box>

      {/* Site Details Drawer */}
      <SiteDetailsDrawer
        site={selectedSite}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        isLoading={isLoadingDetails}
        onAddShift={handleAddShift}
        onRefresh={refreshSites}
      />

      {/* Add Shift Modal */}
      {selectedSiteForShift && (
        <AddShiftForSiteModal
          isOpen={isAddShiftModalOpen}
          onClose={() => {
            setIsAddShiftModalOpen(false);
            setSelectedSiteForShift(null);
          }}
          site={selectedSiteForShift}
          onSuccess={handleAddShiftSuccess}
        />
      )}

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

export default SitesOverview;