/**
 * ActivityLog Component
 *
 * Displays system-generated audit trail with filtering capabilities.
 * Shows clock-ins, checkpoint scans, incidents, and other operational events.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Input,
  Button,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import {
  FiLogIn,
  FiLogOut,
  FiCheckSquare,
  FiAlertTriangle,
  FiMapPin,
  FiShield,
  FiFileText,
  FiSettings,
  FiClock,
  FiUser,
  FiSearch,
  FiFilter,
  FiChevronDown,
} from 'react-icons/fi';
import {
  SystemActivity,
  ActivityCategory,
  ActivitySeverity,
  ActivityFilters,
  CATEGORY_CONFIG,
  SEVERITY_CONFIG,
} from '../types/activityHub.types';

// ============================================
// Types
// ============================================

interface ActivityLogProps {
  activities: SystemActivity[];
  filters: ActivityFilters;
  onFiltersChange: (filters: Partial<ActivityFilters>) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// ============================================
// Icon Configuration
// ============================================

const categoryIcons: Record<ActivityCategory, React.ElementType> = {
  authentication: FiLogIn,
  shift: FiClock,
  patrol: FiCheckSquare,
  incident: FiAlertTriangle,
  compliance: FiFileText,
  geofence: FiMapPin,
  task: FiCheckSquare,
  system: FiSettings,
};

// ============================================
// Helper Functions
// ============================================

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getSeverityColor = (severity: ActivitySeverity): string => {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'warning':
      return 'orange';
    default:
      return 'blue';
  }
};

// ============================================
// Activity Item Component
// ============================================

interface ActivityItemProps {
  activity: SystemActivity;
  isLast?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, isLast }) => {
  const config = CATEGORY_CONFIG[activity.category];
  const IconComponent = categoryIcons[activity.category];

  return (
    <HStack
      gap={3}
      align="flex-start"
      py={3}
      borderBottomWidth={isLast ? 0 : 1}
      borderColor="gray.100"
    >
      {/* Timeline indicator */}
      <VStack gap={0} align="center" pt={1}>
        <Box
          p={2}
          borderRadius="full"
          bg={config.bgColor}
        >
          <Icon as={IconComponent} boxSize={4} color={config.color} />
        </Box>
        {!isLast && (
          <Box w="2px" flex={1} bg="gray.100" minH={6} />
        )}
      </VStack>

      {/* Content */}
      <VStack align="flex-start" flex={1} gap={1} pb={2}>
        <HStack gap={2} flexWrap="wrap">
          <Text fontSize="sm" fontWeight="semibold" color="gray.800">
            {activity.action}
          </Text>
          <Badge
            colorPalette={config.color.split('.')[0]}
            size="sm"
            variant="subtle"
          >
            {config.label}
          </Badge>
          {activity.severity !== 'info' && (
            <Badge
              colorPalette={getSeverityColor(activity.severity)}
              size="sm"
              variant="solid"
            >
              {activity.severity.toUpperCase()}
            </Badge>
          )}
        </HStack>

        <Text fontSize="sm" color="gray.600">
          {activity.description}
        </Text>

        <HStack gap={4} flexWrap="wrap">
          {activity.actorName && (
            <HStack gap={1}>
              <Icon as={FiUser} boxSize={3} color="gray.400" />
              <Text fontSize="xs" color="gray.500">
                {activity.actorName}
              </Text>
            </HStack>
          )}
          {activity.location?.siteName && (
            <HStack gap={1}>
              <Icon as={FiMapPin} boxSize={3} color="gray.400" />
              <Text fontSize="xs" color="gray.500">
                {activity.location.siteName}
              </Text>
            </HStack>
          )}
          <HStack gap={1}>
            <Icon as={FiClock} boxSize={3} color="gray.400" />
            <Text fontSize="xs" color="gray.500">
              {formatTimestamp(activity.timestamp)}
            </Text>
          </HStack>
        </HStack>
      </VStack>
    </HStack>
  );
};

// ============================================
// Filter Bar Component
// ============================================

interface FilterBarProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: Partial<ActivityFilters>) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const categoryOptions: ActivityCategory[] = [
    'authentication',
    'shift',
    'patrol',
    'incident',
    'compliance',
    'geofence',
    'task',
    'system',
  ];

  const toggleCategory = (category: ActivityCategory) => {
    const current = filters.categories;
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    onFiltersChange({ categories: updated });
  };

  return (
    <VStack gap={3} align="stretch" mb={4}>
      {/* Search */}
      <HStack gap={3}>
        <Box position="relative" flex={1}>
          <Icon
            as={FiSearch}
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            color="gray.400"
          />
          <Input
            placeholder="Search activity logs..."
            pl={10}
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            size="sm"
          />
        </Box>

        {/* Time Range Buttons */}
        <HStack gap={1}>
          {timeRangeOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={filters.timeRange === option.value ? 'solid' : 'outline'}
              colorPalette={filters.timeRange === option.value ? 'blue' : 'gray'}
              onClick={() =>
                onFiltersChange({
                  timeRange: option.value as ActivityFilters['timeRange'],
                })
              }
            >
              {option.label}
            </Button>
          ))}
        </HStack>
      </HStack>

      {/* Category Filters */}
      <HStack gap={2} flexWrap="wrap">
        <Icon as={FiFilter} color="gray.400" />
        {categoryOptions.map((category) => {
          const config = CATEGORY_CONFIG[category];
          const isActive = filters.categories.includes(category);
          return (
            <Badge
              key={category}
              cursor="pointer"
              variant={isActive ? 'solid' : 'outline'}
              colorPalette={isActive ? config.color.split('.')[0] : 'gray'}
              onClick={() => toggleCategory(category)}
              _hover={{ opacity: 0.8 }}
              px={2}
              py={1}
            >
              {config.label}
            </Badge>
          );
        })}
        {filters.categories.length > 0 && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onFiltersChange({ categories: [] })}
          >
            Clear
          </Button>
        )}
      </HStack>
    </VStack>
  );
};

// ============================================
// Main Component
// ============================================

const ActivityLog: React.FC<ActivityLogProps> = ({
                                                   activities,
                                                   filters,
                                                   onFiltersChange,
                                                   isLoading = false,
                                                   onLoadMore,
                                                   hasMore = false,
                                                 }) => {
  if (isLoading && activities.length === 0) {
    return (
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        p={6}
      >
        <VStack py={8}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.500">Loading activity logs...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
    >
      {/* Header */}
      <HStack justify="space-between" p={4} borderBottomWidth="1px" borderColor="gray.100">
        <HStack gap={2}>
          <Icon as={FiShield} color="blue.500" />
          <Text fontWeight="semibold" color="gray.800">
            Activity Log
          </Text>
          <Badge colorPalette="blue" variant="subtle">
            {activities.length} events
          </Badge>
        </HStack>
        <HStack gap={2}>
          <Box
            w={2}
            h={2}
            borderRadius="full"
            bg="green.400"
            animation="pulse 2s infinite"
          />
          <Text fontSize="xs" color="green.500" fontWeight="medium">
            LIVE
          </Text>
        </HStack>
      </HStack>

      {/* Filters */}
      <Box px={4} pt={4}>
        <FilterBar filters={filters} onFiltersChange={onFiltersChange} />
      </Box>

      {/* Activity List */}
      <Box px={4} pb={4} maxH="500px" overflowY="auto">
        {activities.length === 0 ? (
          <VStack py={8} gap={2}>
            <Icon as={FiShield} boxSize={10} color="gray.300" />
            <Text color="gray.500">No activity found</Text>
            <Text fontSize="sm" color="gray.400">
              Try adjusting your filters
            </Text>
          </VStack>
        ) : (
          <VStack align="stretch" gap={0}>
            {activities.map((activity, index) => (
              <ActivityItem
                key={activity._id}
                activity={activity}
                isLast={index === activities.length - 1}
              />
            ))}
          </VStack>
        )}
      </Box>

      {/* Load More */}
      {hasMore && (
        <Box p={4} borderTopWidth="1px" borderColor="gray.100">
          <Button
            w="full"
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner size="sm" mr={2} />
            ) : (
              <Icon as={FiChevronDown} mr={2} />
            )}
            Load More
          </Button>
        </Box>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
};

export default ActivityLog;