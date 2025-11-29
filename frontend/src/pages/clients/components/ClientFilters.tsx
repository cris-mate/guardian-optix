/**
 * ClientFilters Component
 *
 * Filter controls for the clients list.
 */

import React from 'react';
import { HStack, Button, Box, Text } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import { LuFilter, LuChevronDown, LuArrowUpDown } from 'react-icons/lu';
import type { ClientFilters as ClientFiltersType, ClientStatus } from '../types/client.types';

interface ClientFiltersProps {
  filters: ClientFiltersType;
  onFiltersChange: (filters: ClientFiltersType) => void;
}

const statusOptions: { value: ClientStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'prospect', label: 'Prospect' },
];

const sortOptions: { value: ClientFiltersType['sortBy']; label: string }[] = [
  { value: 'companyName', label: 'Company Name' },
  { value: 'createdAt', label: 'Date Added' },
  { value: 'lastActivityAt', label: 'Last Activity' },
  { value: 'totalSites', label: 'Number of Sites' },
];

const ClientFilters: React.FC<ClientFiltersProps> = ({ filters, onFiltersChange }) => {
  const currentStatusLabel = statusOptions.find(s => s.value === filters.status)?.label || 'All Statuses';
  const currentSortLabel = sortOptions.find(s => s.value === filters.sortBy)?.label || 'Company Name';

  return (
    <HStack gap={2}>
      {/* Status Filter */}
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button variant="outline" size="sm">
            <LuFilter size={14} style={{ marginRight: 6 }} />
            {currentStatusLabel}
            <LuChevronDown size={14} style={{ marginLeft: 6 }} />
          </Button>
        </Menu.Trigger>
        <Menu.Content>
          {statusOptions.map((option) => (
            <Menu.Item
              key={option.value}
              value={option.value}
              onClick={() => onFiltersChange({ ...filters, status: option.value })}
            >
              <Box
                as="span"
                w={2}
                h={2}
                borderRadius="full"
                bg={
                  option.value === 'active' ? 'green.500' :
                    option.value === 'inactive' ? 'gray.500' :
                      option.value === 'prospect' ? 'blue.500' :
                        'transparent'
                }
                mr={2}
              />
              {option.label}
              {filters.status === option.value && <Text ml="auto" color="blue.500">✓</Text>}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Root>

      {/* Sort Filter */}
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button variant="outline" size="sm">
            <LuArrowUpDown size={14} style={{ marginRight: 6 }} />
            {currentSortLabel}
            <LuChevronDown size={14} style={{ marginLeft: 6 }} />
          </Button>
        </Menu.Trigger>
        <Menu.Content>
          {sortOptions.map((option) => (
            <Menu.Item
              key={option.value}
              value={option.value as string}
              onClick={() => {
                if (filters.sortBy === option.value) {
                  onFiltersChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
                } else {
                  onFiltersChange({ ...filters, sortBy: option.value, sortOrder: 'asc' });
                }
              }}
            >
              {option.label}
              {filters.sortBy === option.value && (
                <Text ml="auto" color="blue.500">{filters.sortOrder === 'asc' ? '↑' : '↓'}</Text>
              )}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Root>
    </HStack>
  );
};

export default ClientFilters;