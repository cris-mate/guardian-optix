/**
 * PersonnelFilters Component
 *
 * Filter controls for the personnel list.
 * Uses Chakra UI v3 components.
 */

import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Input,
  Button,
  Text,
  Flex,
  Select,
  createListCollection,
} from '@chakra-ui/react';
import { LuSearch, LuX, LuFilter } from 'react-icons/lu';
import { PersonnelFilters as FiltersType, PersonnelStats } from '../types/personnel.types';

interface PersonnelFiltersProps {
  filters: FiltersType;
  stats: PersonnelStats;
  onFiltersChange: (filters: Partial<FiltersType>) => void;
  onReset: () => void;
}

// Collections for select components
const statusOptions = createListCollection({
  items: [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'on-leave', label: 'On Leave' },
    { value: 'off-duty', label: 'Off Duty' },
    { value: 'suspended', label: 'Suspended' },
  ],
});

const roleOptions = createListCollection({
  items: [
    { value: 'all', label: 'All Roles' },
    { value: 'Guard', label: 'Security Officer' },
    { value: 'Manager', label: 'Manager' },
  ],
});

const guardTypeOptions = createListCollection({
  items: [
    { value: 'all', label: 'All Types' },
    { value: 'Static', label: 'Static' },
    { value: 'Mobile Patrol', label: 'Mobile Patrol' },
    { value: 'Close Protection', label: 'Close Protection' },
    { value: 'Dog Handler', label: 'Dog Handler' },
  ],
});

const shiftOptions = createListCollection({
  items: [
    { value: 'all', label: 'All Shifts' },
    { value: 'Morning', label: 'Morning' },
    { value: 'Afternoon', label: 'Afternoon' },
    { value: 'Night', label: 'Night' },
  ],
});

const availabilityOptions = createListCollection({
  items: [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'unavailable', label: 'Unavailable' },
  ],
});

const licenceStatusOptions = createListCollection({
  items: [
    { value: 'all', label: 'All Licences' },
    { value: 'valid', label: 'Valid' },
    { value: 'expiring-soon', label: 'Expiring Soon' },
    { value: 'expired', label: 'Expired' },
    { value: 'pending', label: 'Pending' },
  ],
});

const PersonnelFilters: React.FC<PersonnelFiltersProps> = ({
                                                             filters,
                                                             stats,
                                                             onFiltersChange,
                                                             onReset,
                                                           }) => {
  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.role !== 'all' ||
    filters.guardType !== 'all' ||
    filters.shift !== 'all' ||
    filters.availability !== 'all' ||
    filters.licenceStatus !== 'all';

  return (
    <Box bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200" p={4}>
      <VStack gap={4} align="stretch">
        {/* Stats Summary */}
        <HStack gap={6} flexWrap="wrap">
          <Flex align="center" gap={2}>
            <Box w={2} h={2} borderRadius="full" bg="green.500" />
            <Text fontSize="sm" color="gray.600">
              Active: <Text as="span" fontWeight="semibold">{stats.active}</Text>
            </Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box w={2} h={2} borderRadius="full" bg="yellow.500" />
            <Text fontSize="sm" color="gray.600">
              On Leave: <Text as="span" fontWeight="semibold">{stats.onLeave}</Text>
            </Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box w={2} h={2} borderRadius="full" bg="gray.400" />
            <Text fontSize="sm" color="gray.600">
              Off Duty: <Text as="span" fontWeight="semibold">{stats.offDuty}</Text>
            </Text>
          </Flex>
          {stats.expiringLicences > 0 && (
            <Flex align="center" gap={2}>
              <Box w={2} h={2} borderRadius="full" bg="red.500" />
              <Text fontSize="sm" color="red.600">
                Licence Alerts: <Text as="span" fontWeight="semibold">{stats.expiringLicences}</Text>
              </Text>
            </Flex>
          )}
        </HStack>

        {/* Search and Filters Row */}
        <Flex gap={3} flexWrap="wrap" align="flex-end">
          {/* Search Input */}
          <Box flex="1" minW="200px">
            <Text fontSize="xs" color="gray.500" mb={1}>Search</Text>
            <Box position="relative">
              <Box
                position="absolute"
                left={3}
                top="50%"
                transform="translateY(-50%)"
                color="gray.400"
                pointerEvents="none"
              >
                <LuSearch size={16} />
              </Box>
              <Input
                placeholder="Name, badge, postcode..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                pl={9}
                size="sm"
              />
            </Box>
          </Box>

          {/* Status Filter */}
          <Box minW="140px">
            <Text fontSize="xs" color="gray.500" mb={1}>Status</Text>
            <Select.Root
              collection={statusOptions}
              value={[filters.status]}
              onValueChange={(e) => onFiltersChange({ status: e.value[0] as FiltersType['status'] })}
              size="sm"
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Status" />
              </Select.Trigger>
              <Select.Content>
                {statusOptions.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Role Filter */}
          <Box minW="140px">
            <Text fontSize="xs" color="gray.500" mb={1}>Role</Text>
            <Select.Root
              collection={roleOptions}
              value={[filters.role]}
              onValueChange={(e) => onFiltersChange({ role: e.value[0] as FiltersType['role'] })}
              size="sm"
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Role" />
              </Select.Trigger>
              <Select.Content>
                {roleOptions.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Guard Type Filter */}
          {(filters.role === 'all' || filters.role === 'Guard') && (
            <Box minW="150px">
              <Text fontSize="xs" color="gray.500" mb={1}>Type</Text>
              <Select.Root
                collection={guardTypeOptions}
                value={[filters.guardType]}
                onValueChange={(e) => onFiltersChange({ guardType: e.value[0] as FiltersType['guardType'] })}
                size="sm"
              >
                <Select.Trigger>
                  <Select.ValueText placeholder="Type" />
                </Select.Trigger>
                <Select.Content>
                  {guardTypeOptions.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          )}

          {/* Shift Filter */}
          <Box minW="120px">
            <Text fontSize="xs" color="gray.500" mb={1}>Shift</Text>
            <Select.Root
              collection={shiftOptions}
              value={[filters.shift || 'all']}
              onValueChange={(e) => onFiltersChange({ shift: e.value[0] === 'all' ? 'all' : e.value[0] as FiltersType['shift'] })}
              size="sm"
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Shift" />
              </Select.Trigger>
              <Select.Content>
                {shiftOptions.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Licence Status Filter */}
          <Box minW="140px">
            <Text fontSize="xs" color="gray.500" mb={1}>Licence</Text>
            <Select.Root
              collection={licenceStatusOptions}
              value={[filters.licenceStatus]}
              onValueChange={(e) => onFiltersChange({ licenceStatus: e.value[0] as FiltersType['licenceStatus'] })}
              size="sm"
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Licence" />
              </Select.Trigger>
              <Select.Content>
                {licenceStatusOptions.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Reset Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              color="gray.600"
            >
              <LuX size={14} />
              Clear
            </Button>
          )}
        </Flex>
      </VStack>
    </Box>
  );
};

export default PersonnelFilters;