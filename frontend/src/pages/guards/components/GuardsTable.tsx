/**
 * GuardsTable Component
 *
 * Displays guards in a sortable, interactive table.
 * Uses Chakra UI v3 Table components.
 */

import React from 'react';
import {
  Box,
  Table,
  Badge,
  HStack,
  Text,
  IconButton,
  Flex,
  Menu,
  Spinner,
} from '@chakra-ui/react';
import {
  LuMoveVertical,
  LuEye,
  LuPencil,
  LuPhone,
  LuMail,
  LuChevronUp,
  LuChevronDown,
  LuTriangleAlert,
} from 'react-icons/lu';
import {
  Guards,
  GuardsFilters,
  GuardsStatus,
  LicenceStatus,
} from '../../../types/guards.types';

interface GuardsTableProps {
  guards: Guards[];
  isLoading: boolean;
  selectedId?: string;
  filters: GuardsFilters;
  onFiltersChange: (filters: Partial<GuardsFilters>) => void;
  onSelect: (id: string) => void;
  onEdit?: (guards: Guards) => void;
}

// Status badge colour mapping
const getStatusColor = (status: GuardsStatus): string => {
  const colors: Record<GuardsStatus, string> = {
    'on-duty': 'green',
    'off-duty': 'gray',
    'on-break': 'yellow',
    'late': 'orange',
    'absent': 'red',
    'scheduled': 'blue',
  };
  return colors[status] || 'gray';
};

// Licence status colour mapping
const getLicenceColor = (status?: LicenceStatus): string => {
  if (!status) return 'gray';
  const colors: Record<LicenceStatus, string> = {
    valid: 'green',
    'expiring-soon': 'orange',
    expired: 'red',
  };
  return colors[status] || 'gray';
};

// Format date for display
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Get relative time description
const getRelativeTime = (dateString?: string): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 5) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

// Sortable column header
interface SortHeaderProps {
  label: string;
  sortKey: GuardsFilters['sortBy'];
  currentSort: GuardsFilters['sortBy'];
  currentOrder: GuardsFilters['sortOrder'];
  onSort: (key: GuardsFilters['sortBy']) => void;
}

const SortHeader: React.FC<SortHeaderProps> = ({
                                                 label,
                                                 sortKey,
                                                 currentSort,
                                                 currentOrder,
                                                 onSort,
                                               }) => {
  const isActive = currentSort === sortKey;

  return (
    <Flex
      align="center"
      gap={1}
      cursor="pointer"
      userSelect="none"
      onClick={() => onSort(sortKey)}
      _hover={{ color: 'blue.600' }}
      color={isActive ? 'blue.600' : 'inherit'}
    >
      <Text>{label}</Text>
      {isActive && (
        currentOrder === 'asc' ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />
      )}
    </Flex>
  );
};

const GuardsTable: React.FC<GuardsTableProps> = ({
                                                         guards,
                                                         isLoading,
                                                         selectedId,
                                                         filters,
                                                         onFiltersChange,
                                                         onSelect,
                                                         onEdit,
                                                       }) => {
  const handleSort = (sortBy: GuardsFilters['sortBy']) => {
    if (filters.sortBy === sortBy) {
      // Toggle order if same column
      onFiltersChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      // New column, default to ascending
      onFiltersChange({ sortBy, sortOrder: 'asc' });
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box overflowX="auto">
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row bg="gray.50">
            <Table.ColumnHeader>
              <SortHeader
                label="Guard"
                sortKey="name"
                currentSort={filters.sortBy}
                currentOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <SortHeader
                label="Status"
                sortKey="status"
                currentSort={filters.sortBy}
                currentOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <SortHeader
                label="Role"
                sortKey="role"
                currentSort={filters.sortBy}
                currentOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              Location
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <SortHeader
                label="SIA Licence"
                sortKey="licenceExpiry"
                currentSort={filters.sortBy}
                currentOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              <SortHeader
                label="Last Active Shift"
                sortKey="lastActive"
                currentSort={filters.sortBy}
                currentOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {guards.map((guard) => (
            <Table.Row
              key={guard._id}
              cursor="pointer"
              onClick={() => onSelect(guard._id)}
              bg={selectedId === guard._id ? 'blue.50' : 'white'}
              _hover={{ bg: selectedId === guard._id ? 'blue.50' : 'gray.50' }}
              transition="background 0.15s"
            >
              {/* Guard Info */}
              <Table.Cell>
                <HStack gap={3}>
                  <Box>
                    <Text fontWeight="medium" fontSize="sm">
                      {guard.fullName}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {guard.siaLicenceNumber || guard.email}
                    </Text>
                  </Box>
                </HStack>
              </Table.Cell>

              {/* Status */}
              <Table.Cell>
                <HStack gap={2}>
                  <Badge
                    colorPalette={getStatusColor(guard.status || 'off-duty')}
                    variant="subtle"
                    size="sm"
                  >
                    {(guard.status || 'off-duty').replace('-', ' ')}
                  </Badge>
                  {guard.availability && guard.status === 'on-duty' && (
                    <Box w={2} h={2} borderRadius="full" bg="green.400" title="Available" />
                  )}
                </HStack>
              </Table.Cell>

              {/* Role */}
              <Table.Cell>
                <Box>
                  <Text fontSize="sm">{guard.role === 'Guard' ? 'Security Officer' : guard.role}</Text>
                  {guard.guardType && (
                    <Text fontSize="xs" color="gray.500">{guard.guardType}</Text>
                  )}
                </Box>
              </Table.Cell>

              {/* Location */}
              <Table.Cell>
                <Box>
                  <Text fontSize="sm" fontFamily="mono">
                    {guard.postCode}
                  </Text>
                </Box>
              </Table.Cell>

              {/* SIA Licence */}
              <Table.Cell>
                {guard.siaLicence ? (
                  <HStack gap={2}>
                    <Badge
                      colorPalette={getLicenceColor(guard.siaLicence.status)}
                      variant="subtle"
                      size="sm"
                    >
                      {guard.siaLicence.status === 'expiring-soon' ? 'Expiring' : guard.siaLicence.status}
                    </Badge>
                    {(guard.siaLicence.status === 'expired' || guard.siaLicence.status === 'expiring-soon') && (
                      <Box color={guard.siaLicence.status === 'expired' ? 'red.500' : 'orange.500'}>
                        <LuTriangleAlert size={14} />
                      </Box>
                    )}
                    <Text fontSize="xs" color="gray.500">
                      {formatDate(guard.siaLicence.expiryDate)}
                    </Text>
                  </HStack>
                ) : (
                  <Text fontSize="sm" color="gray.400">N/A</Text>
                )}
              </Table.Cell>

              {/* Last Active Shift*/}
              <Table.Cell>
                {guard.lastShift ? (
                  <Box>
                    <Text fontSize="sm">
                      {new Date(guard.lastShift.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {guard.lastShift.siteName || guard.lastShift.shiftType}
                    </Text>
                  </Box>
                ) : (
                  <Text fontSize="sm" color="gray.400">Never assigned</Text>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default GuardsTable;