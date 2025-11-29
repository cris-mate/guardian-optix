/**
 * ClientsTable Component
 *
 * Displays clients in a searchable, sortable table.
 */

import React from 'react';
import {
  Table,
  Box,
  Text,
  Badge,
  HStack,
  IconButton,
  Flex,
  Image,
} from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import {
  LuChevronUp,
  LuChevronDown,
  LuEye,
  LuPencil,
  LuMoveHorizontal,
  LuMapPin,
  LuUsers,
} from 'react-icons/lu';
import type { Client, ClientTableProps, ClientFilters } from '../types/client.types';

// ============================================
// Helpers
// ============================================

const getStatusColor = (status: Client['status']): string => {
  switch (status) {
    case 'active': return 'green';
    case 'inactive': return 'gray';
    case 'prospect': return 'blue';
    default: return 'gray';
  }
};

const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'No activity';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

// ============================================
// Company Logo Component
// ============================================

interface CompanyLogoProps {
  logoUrl?: string;
  companyName: string;
  size?: 'sm' | 'md';
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ logoUrl, companyName, size = 'sm' }) => {
  const dimensions = size === 'sm' ? '36px' : '48px';
  const fontSize = size === 'sm' ? 'xs' : 'sm';

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={companyName}
        w={dimensions}
        h={dimensions}
        borderRadius="md"
        objectFit="contain"
        bg="gray.50"
        p={1}
      />
    );
  }

  return (
    <Flex
      w={dimensions}
      h={dimensions}
      borderRadius="md"
      bg="blue.50"
      color="blue.600"
      align="center"
      justify="center"
      fontWeight="bold"
      fontSize={fontSize}
      flexShrink={0}
    >
      {getInitials(companyName)}
    </Flex>
  );
};

// ============================================
// Sort Header Component
// ============================================

interface SortHeaderProps {
  label: string;
  sortKey: ClientFilters['sortBy'];
  currentSort: ClientFilters['sortBy'];
  currentOrder: ClientFilters['sortOrder'];
  onSort: (key: ClientFilters['sortBy']) => void;
}

const SortHeader: React.FC<SortHeaderProps> = ({ label, sortKey, currentSort, currentOrder, onSort }) => {
  const isActive = currentSort === sortKey;
  return (
    <Box
      as="button"
      display="flex"
      alignItems="center"
      gap={1}
      cursor="pointer"
      _hover={{ color: 'blue.600' }}
      onClick={() => onSort(sortKey)}
      fontWeight="semibold"
      color={isActive ? 'blue.600' : 'gray.700'}
    >
      {label}
      {isActive && (currentOrder === 'asc' ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />)}
    </Box>
  );
};

// ============================================
// Main Table Component
// ============================================

const ClientsTable: React.FC<ClientTableProps> = ({
                                                    clients,
                                                    onClientSelect,
                                                    onClientEdit,
                                                    selectedClientId,
                                                    filters,
                                                    onFiltersChange,
                                                  }) => {
  const handleSort = (sortBy: ClientFilters['sortBy']) => {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    onFiltersChange({ ...filters, sortBy, sortOrder: newOrder });
  };

  return (
    <Table.Root size="md" variant="line" interactive>
      <Table.Header>
        <Table.Row bg="gray.50">
          <Table.ColumnHeader width="280px">
            <SortHeader label="Client" sortKey="companyName" currentSort={filters.sortBy} currentOrder={filters.sortOrder} onSort={handleSort} />
          </Table.ColumnHeader>
          <Table.ColumnHeader width="100px">Status</Table.ColumnHeader>
          <Table.ColumnHeader width="150px">Location</Table.ColumnHeader>
          <Table.ColumnHeader width="80px">
            <SortHeader label="Sites" sortKey="totalSites" currentSort={filters.sortBy} currentOrder={filters.sortOrder} onSort={handleSort} />
          </Table.ColumnHeader>
          <Table.ColumnHeader width="100px">Guards</Table.ColumnHeader>
          <Table.ColumnHeader width="130px">
            <SortHeader label="Last Activity" sortKey="lastActivityAt" currentSort={filters.sortBy} currentOrder={filters.sortOrder} onSort={handleSort} />
          </Table.ColumnHeader>
          <Table.ColumnHeader width="160px">Primary Contact</Table.ColumnHeader>
          <Table.ColumnHeader width="80px">Actions</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {clients.map((client) => (
          <Table.Row
            key={client.id}
            cursor="pointer"
            bg={selectedClientId === client.id ? 'blue.50' : 'white'}
            _hover={{ bg: selectedClientId === client.id ? 'blue.100' : 'gray.50' }}
            onClick={() => onClientSelect(client)}
          >
            {/* Client Name with Logo */}
            <Table.Cell>
              <HStack gap={3}>
                <CompanyLogo logoUrl={client.logoUrl} companyName={client.companyName} />
                <Box>
                  <Text fontWeight="medium" color="gray.800" lineClamp={1}>
                    {client.companyName}
                  </Text>
                  {client.tradingName && client.tradingName !== client.companyName && (
                    <Text fontSize="xs" color="gray.500" lineClamp={1}>
                      t/a {client.tradingName}
                    </Text>
                  )}
                  {client.industry && (
                    <Text fontSize="xs" color="gray.400">{client.industry}</Text>
                  )}
                </Box>
              </HStack>
            </Table.Cell>

            {/* Status */}
            <Table.Cell>
              <Badge colorPalette={getStatusColor(client.status)} variant="subtle" size="sm" textTransform="capitalize">
                {client.status}
              </Badge>
            </Table.Cell>

            {/* Location */}
            <Table.Cell>
              <HStack gap={1} color="gray.600">
                <LuMapPin size={14} />
                <Text fontSize="sm" lineClamp={1}>{client.address.postCode}, {client.address.city}</Text>
              </HStack>
            </Table.Cell>

            {/* Sites */}
            <Table.Cell>
              <HStack gap={1}>
                <Text fontWeight="medium">{client.activeSites}</Text>
                <Text color="gray.400" fontSize="sm">/ {client.totalSites}</Text>
              </HStack>
            </Table.Cell>

            {/* Guards */}
            <Table.Cell>
              <HStack gap={1} color="gray.600">
                <LuUsers size={14} />
                <Text>{client.totalGuardsAssigned}</Text>
              </HStack>
            </Table.Cell>

            {/* Last Activity */}
            <Table.Cell>
              <Text fontSize="sm" color="gray.600">{formatTimeAgo(client.lastActivityAt)}</Text>
            </Table.Cell>

            {/* Primary Contact */}
            <Table.Cell>
              {client.primaryContact ? (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" lineClamp={1}>
                    {client.primaryContact.firstName} {client.primaryContact.lastName}
                  </Text>
                  <Text fontSize="xs" color="gray.500" lineClamp={1}>
                    {client.primaryContact.jobTitle || 'Contact'}
                  </Text>
                </Box>
              ) : (
                <Text fontSize="sm" color="gray.400">No contact</Text>
              )}
            </Table.Cell>

            {/* Actions */}
            <Table.Cell onClick={(e) => e.stopPropagation()}>
              <HStack gap={1}>
                <IconButton
                  aria-label="View client"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onClientSelect(client); }}
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
                    <Menu.Item value="view" onClick={() => onClientSelect(client)}>
                      <LuEye size={14} />
                      <Box ml={2}>View Details</Box>
                    </Menu.Item>
                    <Menu.Item value="edit" onClick={() => onClientEdit(client)}>
                      <LuPencil size={14} />
                      <Box ml={2}>Edit Client</Box>
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item value="sites" onClick={() => onClientSelect(client)}>
                      <LuMapPin size={14} />
                      <Box ml={2}>View Sites</Box>
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

export default ClientsTable;