/**
 * SchedulingToolbar Component
 *
 * Navigation and view controls for the scheduling calendar.
 * Includes date navigation, view mode toggle, and filters.
 */

import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Button,
  Text,
  Select,
  createListCollection,
  Input,
  Badge,
} from '@chakra-ui/react';
import {
  LuChevronLeft,
  LuChevronRight,
  LuCalendar,
  LuCalendarDays,
  LuCalendarRange,
  LuFilter,
  LuX,
} from 'react-icons/lu';
import {
  SchedulingFilters,
  SchedulingStats,
  AvailableOfficer,
  AvailableSite,
  ViewMode,
} from '../types/scheduling.types';

interface SchedulingToolbarProps {
  filters: SchedulingFilters;
  stats: SchedulingStats;
  availableOfficers: AvailableOfficer[];
  availableSites: AvailableSite[];
  onFiltersChange: (filters: Partial<SchedulingFilters>) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  onReset: () => void;
}

// Shift type options
const shiftTypeOptions = createListCollection({
  items: [
    { value: 'all', label: 'All Shifts' },
    { value: 'Morning', label: 'Morning' },
    { value: 'Afternoon', label: 'Afternoon' },
    { value: 'Night', label: 'Night' },
  ],
});

// Status options
const statusOptions = createListCollection({
  items: [
    { value: 'all', label: 'All Status' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
});

const SchedulingToolbar: React.FC<SchedulingToolbarProps> = ({
                                                               filters,
                                                               stats,
                                                               availableOfficers,
                                                               availableSites,
                                                               onFiltersChange,
                                                               onNavigate,
                                                               onToday,
                                                               onReset,
                                                             }) => {
  // Format the current date range for display
  const getDateRangeLabel = (): string => {
    const date = new Date(filters.selectedDate);
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

    if (filters.viewMode === 'day') {
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    if (filters.viewMode === 'week') {
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startOfWeek.setDate(startOfWeek.getDate() + diff);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startStr = startOfWeek.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const endStr = endOfWeek.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      return `${startStr} - ${endStr}`;
    }

    return date.toLocaleDateString('en-GB', options);
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.officerId ||
    filters.siteId ||
    (filters.shiftType && filters.shiftType !== 'all') ||
    (filters.status && filters.status !== 'all');

  // Create officer options
  const officerOptions = createListCollection({
    items: [
      { value: 'all', label: 'All Officers' },
      ...availableOfficers.map((o) => ({ value: o._id, label: o.fullName })),
    ],
  });

  // Create site options
  const siteOptions = createListCollection({
    items: [
      { value: 'all', label: 'All Sites' },
      ...availableSites.map((s) => ({ value: s._id, label: s.name })),
    ],
  });

  // Get view mode icon
  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'day':
        return <LuCalendar size={16} />;
      case 'week':
        return <LuCalendarDays size={16} />;
      case 'month':
        return <LuCalendarRange size={16} />;
    }
  };

  return (
    <Box>
      {/* Main Toolbar */}
      <Flex
        justify="space-between"
        align="center"
        p={4}
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
        mb={4}
      >
        {/* Left: Navigation */}
        <HStack gap={3}>
          <Button variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>

          <HStack gap={1}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('prev')}
              aria-label="Previous"
            >
              <LuChevronLeft size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('next')}
              aria-label="Next"
            >
              <LuChevronRight size={18} />
            </Button>
          </HStack>

          <Text fontSize="lg" fontWeight="semibold" color="gray.800" minW="200px">
            {getDateRangeLabel()}
          </Text>
        </HStack>

        {/* Center: Stats */}
        <HStack gap={4} display={{ base: 'none', lg: 'flex' }}>
          <HStack gap={2}>
            <Badge colorPalette="blue" variant="subtle" px={2} py={1}>
              {stats.totalShifts} shifts
            </Badge>
            <Badge colorPalette="green" variant="subtle" px={2} py={1}>
              {stats.totalHoursScheduled}h scheduled
            </Badge>
            {stats.inProgressShifts > 0 && (
              <Badge colorPalette="orange" variant="subtle" px={2} py={1}>
                {stats.inProgressShifts} in progress
              </Badge>
            )}
          </HStack>
        </HStack>

        {/* Right: View Mode */}
        <HStack gap={2}>
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={filters.viewMode === mode ? 'solid' : 'ghost'}
              colorPalette={filters.viewMode === mode ? 'blue' : 'gray'}
              onClick={() => onFiltersChange({ viewMode: mode })}
            >
              {getViewModeIcon(mode)}
              <Text ml={1} textTransform="capitalize">
                {mode}
              </Text>
            </Button>
          ))}
        </HStack>
      </Flex>

      {/* Filter Bar */}
      <Flex
        gap={3}
        p={4}
        bg="gray.50"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
        align="center"
        flexWrap="wrap"
      >
        <HStack gap={1} color="gray.600">
          <LuFilter size={16} />
          <Text fontSize="sm" fontWeight="medium">
            Filters:
          </Text>
        </HStack>

        {/* Date Picker */}
        <Input
          type="date"
          size="sm"
          value={filters.selectedDate}
          onChange={(e) => onFiltersChange({ selectedDate: e.target.value })}
          maxW="160px"
          bg="white"
        />

        {/* Officer Filter */}
        <Select.Root
          collection={officerOptions}
          size="sm"
          value={[filters.officerId || 'all']}
          onValueChange={(e) =>
            onFiltersChange({ officerId: e.value[0] === 'all' ? undefined : e.value[0] })
          }
          w="180px"
        >
          <Select.Trigger bg="white">
            <Select.ValueText placeholder="All Officers" />
          </Select.Trigger>
          <Select.Content bg="white" borderColor="gray.200" boxShadow="lg">
            {officerOptions.items.map((item) => (
              <Select.Item
                key={item.value}
                item={item}
                _hover={{ bg: 'gray.100' }}
                _highlighted={{ bg: 'gray.100' }}
                color="gray.800"
              >
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        {/* Site Filter */}
        <Select.Root
          collection={siteOptions}
          size="sm"
          value={[filters.siteId || 'all']}
          onValueChange={(e) =>
            onFiltersChange({ siteId: e.value[0] === 'all' ? undefined : e.value[0] })
          }
          w="200px"
        >
          <Select.Trigger bg="white">
            <Select.ValueText placeholder="All Sites" />
          </Select.Trigger>
          <Select.Content bg="white" borderColor="gray.200" boxShadow="lg">
            {siteOptions.items.map((item) => (
              <Select.Item
                key={item.value}
                item={item}
                _hover={{ bg: 'gray.100' }}
                _highlighted={{ bg: 'gray.100' }}
                color="gray.800"
              >
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        {/* Shift Type Filter */}
        <Select.Root
          collection={shiftTypeOptions}
          size="sm"
          value={[filters.shiftType || 'all']}
          onValueChange={(e) => onFiltersChange({ shiftType: e.value[0] as any })}
          w="140px"
        >
          <Select.Trigger bg="white">
            <Select.ValueText placeholder="All Shifts" />
          </Select.Trigger>
          <Select.Content bg="white" borderColor="gray.200" boxShadow="lg">
            {shiftTypeOptions.items.map((item) => (
              <Select.Item
                key={item.value}
                item={item}
                _hover={{ bg: 'gray.100' }}
                _highlighted={{ bg: 'gray.100' }}
                color="gray.800"
              >
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        {/* Status Filter */}
        <Select.Root
          collection={statusOptions}
          size="sm"
          value={[filters.status || 'all']}
          onValueChange={(e) => onFiltersChange({ status: e.value[0] as any })}
          w="140px"
        >
          <Select.Trigger bg="white">
            <Select.ValueText placeholder="All Status" />
          </Select.Trigger>
          <Select.Content bg="white" borderColor="gray.200" boxShadow="lg">
            {statusOptions.items.map((item) => (
              <Select.Item
                key={item.value}
                item={item}
                _hover={{ bg: 'gray.100' }}
                _highlighted={{ bg: 'gray.100' }}
                color="gray.800"
              >
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={onReset}
          >
            <LuX size={14} />
            Clear
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default SchedulingToolbar;