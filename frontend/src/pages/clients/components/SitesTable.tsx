/**
 * SitesTable Component
 *
 * Displays sites in a table format with sorting and actions.
 * Mirrors ClientsTable pattern for consistency.
 */

import React from 'react';
import {
  Box,
  Table,
  Text,
  HStack,
  Badge,
  IconButton,
  Menu,
  Icon,
} from '@chakra-ui/react';
import {
  LuEye,
  LuMoveHorizontal,
  LuPencil,
  LuMapPin,
  LuCalendarClock,
  LuBuilding2,
  LuUserX,
} from 'react-icons/lu';
import type { SiteWithDetails, SiteFilters } from '../hooks/useSitesData';

// ============================================
// Types
// ============================================

interface SitesTableProps {
  sites: SiteWithDetails[];
  isLoading: boolean;
  onSiteSelect: (site: SiteWithDetails) => void;
  onSiteEdit?: (site: SiteWithDetails) => void;
  selectedSiteId?: string;
  filters: SiteFilters;
  onFiltersChange: (filters: SiteFilters) => void;
}

// ============================================
// Helpers
// ============================================

const getStatusColor = (status: SiteWithDetails['status']): string => {
  return status === 'active' ? 'green' : 'gray';
};

const getSiteTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'Corporate Office': 'blue',
    'Retail': 'purple',
    'Industrial': 'orange',
    'Government': 'red',
    'Healthcare': 'teal',
    'Education': 'cyan',
  };
  return colors[type] || 'gray';
};

// ============================================
// Component
// ============================================

const SitesTable: React.FC<SitesTableProps> = ({
                                                 sites,
                                                 isLoading,
                                                 onSiteSelect,
                                                 onSiteEdit,
                                                 selectedSiteId,
                                                 filters,
                                                 onFiltersChange,
                                               }) => {
  const handleSort = (column: SiteFilters['sortBy']) => {
    if (filters.sortBy === column) {
      onFiltersChange({
        ...filters,
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onFiltersChange({ ...filters, sortBy: column, sortOrder: 'asc' });
    }
  };

  const SortIndicator = ({ column }: { column: SiteFilters['sortBy'] }) => {
    if (filters.sortBy !== column) return null;
    return <Text as="span" ml={1}>{filters.sortOrder === 'asc' ? '↑' : '↓'}</Text>;
  };

  return (
    <Table.Root size="sm" variant="line">
      <Table.Header>
        <Table.Row bg="gray.50">
          <Table.ColumnHeader
            cursor="pointer"
            onClick={() => handleSort('name')}
            _hover={{ bg: 'gray.100' }}
          >
            <HStack gap={1}>
              <Icon as={LuMapPin} boxSize={4} color="gray.500" />
              <Text>Site Name</Text>
              <SortIndicator column="name" />
            </HStack>
          </Table.ColumnHeader>
          <Table.ColumnHeader
            cursor="pointer"
            onClick={() => handleSort('clientName')}
            _hover={{ bg: 'gray.100' }}
          >
            <HStack gap={1}>
              <Icon as={LuBuilding2} boxSize={4} color="gray.500" />
              <Text>Client</Text>
              <SortIndicator column="clientName" />
            </HStack>
          </Table.ColumnHeader>
          <Table.ColumnHeader>Location</Table.ColumnHeader>
          <Table.ColumnHeader>Type</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader
            cursor="pointer"
            onClick={() => handleSort('unassignedShifts')}
            _hover={{ bg: 'gray.100' }}
          >
            <HStack gap={1}>
              <Icon as={LuCalendarClock} boxSize={4} color="gray.500" />
              <Text>Shifts</Text>
              <SortIndicator column="unassignedShifts" />
            </HStack>
          </Table.ColumnHeader>
          <Table.ColumnHeader width="80px">Actions</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {sites.map((site) => (
          <Table.Row
            key={site._id}
            cursor="pointer"
            onClick={() => onSiteSelect(site)}
            bg={selectedSiteId === site._id ? 'blue.50' : 'white'}
            _hover={{ bg: selectedSiteId === site._id ? 'blue.50' : 'gray.50' }}
            transition="background 0.15s"
          >
            {/* Site Name */}
            <Table.Cell>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.800" lineClamp={1}>
                  {site.name}
                </Text>
                {site.hasGeofence && (
                  <Badge colorPalette="blue" variant="subtle" size="sm" mt={1}>
                    Geofenced
                  </Badge>
                )}
              </Box>
            </Table.Cell>

            {/* Client */}
            <Table.Cell>
              <Text fontSize="sm" color="gray.700" lineClamp={1}>
                {site.client.companyName}
              </Text>
            </Table.Cell>

            {/* Location */}
            <Table.Cell>
              <Box>
                <Text fontSize="sm" color="gray.700" lineClamp={1}>
                  {site.address.city}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {site.address.postCode}
                </Text>
              </Box>
            </Table.Cell>

            {/* Type */}
            <Table.Cell>
              <Badge colorPalette={getSiteTypeColor(site.siteType)} variant="subtle" size="sm">
                {site.siteType}
              </Badge>
            </Table.Cell>

            {/* Status */}
            <Table.Cell>
              <Badge
                colorPalette={getStatusColor(site.status)}
                variant="solid"
                size="sm"
                textTransform="capitalize"
              >
                {site.status}
              </Badge>
            </Table.Cell>

            {/* Shifts */}
            <Table.Cell>
              <HStack gap={2}>
                <Box textAlign="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.800">
                    {site.totalShiftsThisWeek}
                  </Text>
                  <Text fontSize="xs" color="gray.500">this week</Text>
                </Box>
                {site.unassignedShifts > 0 && (
                  <Badge colorPalette="orange" variant="subtle" size="sm">
                    <Icon as={LuUserX} boxSize={3} mr={1} />
                    {site.unassignedShifts}
                  </Badge>
                )}
              </HStack>
            </Table.Cell>

            {/* Actions */}
            <Table.Cell onClick={(e) => e.stopPropagation()}>
              <HStack gap={1}>
                <IconButton
                  aria-label="View site"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSiteSelect(site);
                  }}
                >
                  <LuEye size={16} />
                </IconButton>
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <IconButton aria-label="More actions" variant="ghost" size="sm">
                      <LuMoveHorizontal size={16} />
                    </IconButton>
                  </Menu.Trigger>
                  <Menu.Content>
                    <Menu.Item value="view" onClick={() => onSiteSelect(site)}>
                      <LuEye size={14} />
                      <Box ml={2}>View Details</Box>
                    </Menu.Item>
                    {onSiteEdit && (
                      <Menu.Item value="edit" onClick={() => onSiteEdit(site)}>
                        <LuPencil size={14} />
                        <Box ml={2}>Edit Site</Box>
                      </Menu.Item>
                    )}
                    <Menu.Separator />
                    <Menu.Item value="shifts" onClick={() => onSiteSelect(site)}>
                      <LuCalendarClock size={14} />
                      <Box ml={2}>Manage Shifts</Box>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Root>
              </HStack>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default SitesTable;