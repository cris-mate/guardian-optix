/**
 * UpdatesFeed Component
 *
 * Displays human-generated announcements, policy updates, and team communications.
 * Includes read/acknowledgement tracking and pinned updates support.
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  Input,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import {
  FiBell,
  FiFileText,
  FiCalendar,
  FiAlertCircle,
  FiAward,
  FiMessageSquare,
  FiBookmark,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiSearch,
  FiChevronRight,
  FiPlus,
} from 'react-icons/fi';
import {
  Update,
  UpdateType,
  UpdatePriority,
  UpdateFilters,
  UPDATE_TYPE_CONFIG,
  PRIORITY_CONFIG,
} from '../types/activityHub.types';

// ============================================
// Types
// ============================================

interface UpdatesFeedProps {
  updates: Update[];
  filters: UpdateFilters;
  onFiltersChange: (filters: Partial<UpdateFilters>) => void;
  onMarkRead: (updateId: string) => void;
  onAcknowledge: (updateId: string) => void;
  onCreateNew?: () => void;
  isLoading?: boolean;
  canCreate?: boolean;
}

// ============================================
// Icon Configuration
// ============================================

const typeIcons: Record<UpdateType, React.ElementType> = {
  announcement: FiBell,
  policy: FiFileText,
  schedule: FiCalendar,
  alert: FiAlertCircle,
  recognition: FiAward,
  general: FiMessageSquare,
};

// ============================================
// Helper Functions
// ============================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: diffDays > 365 ? 'numeric' : undefined,
  });
};

const truncateContent = (content: string, maxLength: number = 150): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
};

// ============================================
// Update Card Component
// ============================================

interface UpdateCardProps {
  update: Update;
  onMarkRead: (updateId: string) => void;
  onAcknowledge: (updateId: string) => void;
  isRead?: boolean;
  isAcknowledged?: boolean;
}

const UpdateCard: React.FC<UpdateCardProps> = ({
                                                 update,
                                                 onMarkRead,
                                                 onAcknowledge,
                                                 isRead = false,
                                                 isAcknowledged = false,
                                               }) => {
  const [expanded, setExpanded] = useState(false);
  const config = UPDATE_TYPE_CONFIG[update.type];
  const priorityConfig = PRIORITY_CONFIG[update.priority];
  const IconComponent = typeIcons[update.type];

  const handleClick = () => {
    if (!isRead) {
      onMarkRead(update._id);
    }
    setExpanded(!expanded);
  };

  return (
    <Box
      bg={isRead ? 'white' : 'blue.50'}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={update.isPinned ? 'blue.300' : 'gray.200'}
      p={4}
      cursor="pointer"
      onClick={handleClick}
      transition="all 0.2s"
      _hover={{
        borderColor: 'blue.400',
        boxShadow: 'sm',
      }}
      position="relative"
    >
      {/* Pinned Indicator */}
      {update.isPinned && (
        <Box
          position="absolute"
          top={2}
          right={2}
        >
          <Icon as={FiBookmark} color="blue.500" boxSize={4} />
        </Box>
      )}

      {/* Header */}
      <HStack gap={3} align="flex-start" mb={2}>
        <Box
          p={2}
          borderRadius="lg"
          bg={config.bgColor}
          flexShrink={0}
        >
          <Icon as={IconComponent} boxSize={5} color={config.color} />
        </Box>

        <VStack align="flex-start" flex={1} gap={1}>
          <HStack gap={2} flexWrap="wrap">
            <Text fontWeight="semibold" color="gray.800" fontSize="sm">
              {update.title}
            </Text>
            <Badge
              colorPalette={config.color.split('.')[0]}
              size="sm"
              variant="subtle"
            >
              {config.label}
            </Badge>
            {update.priority !== 'low' && (
              <Badge
                colorPalette={priorityConfig.color}
                size="sm"
                variant={update.priority === 'urgent' ? 'solid' : 'outline'}
              >
                {priorityConfig.label}
              </Badge>
            )}
          </HStack>

          {/* Meta info */}
          <HStack gap={3} fontSize="xs" color="gray.500">
            <HStack gap={1}>
              <Icon as={FiUser} boxSize={3} />
              <Text>{update.authorName}</Text>
            </HStack>
            <HStack gap={1}>
              <Icon as={FiClock} boxSize={3} />
              <Text>{formatDate(update.createdAt)}</Text>
            </HStack>
          </HStack>
        </VStack>

        <Icon
          as={FiChevronRight}
          color="gray.400"
          transform={expanded ? 'rotate(90deg)' : 'none'}
          transition="transform 0.2s"
        />
      </HStack>

      {/* Content */}
      <Text
        fontSize="sm"
        color="gray.600"
        ml={12}
        lineHeight="tall"
      >
        {expanded ? update.content : truncateContent(update.content)}
      </Text>

      {/* Actions */}
      {expanded && (
        <HStack mt={4} ml={12} gap={3}>
          {update.requiresAcknowledgement && !isAcknowledged && (
            <Button
              size="sm"
              colorPalette="green"
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(update._id);
              }}
            >
              <Icon as={FiCheck} mr={1} />
              Acknowledge
            </Button>
          )}
          {isAcknowledged && (
            <HStack gap={1} color="green.500">
              <Icon as={FiCheckCircle} />
              <Text fontSize="sm" fontWeight="medium">
                Acknowledged
              </Text>
            </HStack>
          )}
        </HStack>
      )}

      {/* Unread indicator */}
      {!isRead && (
        <Box
          position="absolute"
          left={0}
          top="50%"
          transform="translateY(-50%)"
          w={1}
          h="60%"
          bg="blue.500"
          borderRadius="full"
        />
      )}
    </Box>
  );
};

// ============================================
// Filter Chips Component
// ============================================

interface FilterChipsProps {
  filters: UpdateFilters;
  onFiltersChange: (filters: Partial<UpdateFilters>) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({ filters, onFiltersChange }) => {
  const typeOptions: UpdateType[] = [
    'announcement',
    'alert',
    'policy',
    'schedule',
    'recognition',
    'general',
  ];

  const toggleType = (type: UpdateType) => {
    const current = filters.types;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ types: updated });
  };

  return (
    <HStack gap={2} flexWrap="wrap" mb={4}>
      {typeOptions.map((type) => {
        const config = UPDATE_TYPE_CONFIG[type];
        const isActive = filters.types.includes(type);
        return (
          <Badge
            key={type}
            cursor="pointer"
            variant={isActive ? 'solid' : 'outline'}
            colorPalette={isActive ? config.color.split('.')[0] : 'gray'}
            onClick={() => toggleType(type)}
            _hover={{ opacity: 0.8 }}
            px={2}
            py={1}
          >
            {config.label}
          </Badge>
        );
      })}
      {filters.types.length > 0 && (
        <Button
          size="xs"
          variant="ghost"
          onClick={() => onFiltersChange({ types: [] })}
        >
          Clear
        </Button>
      )}
    </HStack>
  );
};

// ============================================
// Main Component
// ============================================

const UpdatesFeed: React.FC<UpdatesFeedProps> = ({
                                                   updates,
                                                   filters,
                                                   onFiltersChange,
                                                   onMarkRead,
                                                   onAcknowledge,
                                                   onCreateNew,
                                                   isLoading = false,
                                                   canCreate = false,
                                                 }) => {
  // Mock current user ID for read/acknowledged status
  const currentUserId = 'current-user';

  if (isLoading && updates.length === 0) {
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
          <Text color="gray.500">Loading updates...</Text>
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
          <Icon as={FiBell} color="blue.500" />
          <Text fontWeight="semibold" color="gray.800">
            Updates & Announcements
          </Text>
          {updates.filter((u) => !u.readBy?.includes(currentUserId)).length > 0 && (
            <Badge colorPalette="red" variant="solid">
              {updates.filter((u) => !u.readBy?.includes(currentUserId)).length} new
            </Badge>
          )}
        </HStack>
        {canCreate && onCreateNew && (
          <Button size="sm" colorPalette="blue" onClick={onCreateNew}>
            <Icon as={FiPlus} mr={1} />
            New Update
          </Button>
        )}
      </HStack>

      {/* Search & Filters */}
      <Box px={4} pt={4}>
        <Box position="relative" mb={3}>
          <Icon
            as={FiSearch}
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            color="gray.400"
          />
          <Input
            placeholder="Search updates..."
            pl={10}
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            size="sm"
          />
        </Box>
        <FilterChips filters={filters} onFiltersChange={onFiltersChange} />
      </Box>

      {/* Updates List */}
      <Box px={4} pb={4} maxH="600px" overflowY="auto">
        {updates.length === 0 ? (
          <VStack py={8} gap={2}>
            <Icon as={FiBell} boxSize={10} color="gray.300" />
            <Text color="gray.500">No updates found</Text>
            <Text fontSize="sm" color="gray.400">
              Try adjusting your filters
            </Text>
          </VStack>
        ) : (
          <VStack align="stretch" gap={3}>
            {updates.map((update) => (
              <UpdateCard
                key={update._id}
                update={update}
                onMarkRead={onMarkRead}
                onAcknowledge={onAcknowledge}
                isRead={update.readBy?.includes(currentUserId) || false}
                isAcknowledged={update.acknowledgedBy?.includes(currentUserId) || false}
              />
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default UpdatesFeed;