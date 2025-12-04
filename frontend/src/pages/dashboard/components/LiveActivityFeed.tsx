import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
} from '@chakra-ui/react';
import {
  FiLogIn,
  FiLogOut,
  FiCheckSquare,
  FiAlertTriangle,
  FiMapPin,
  FiCoffee,
  FiRefreshCw,
  FiChevronRight,
  FiActivity,
} from 'react-icons/fi';
import type { ActivityEvent, ActivityType } from '../types/dashboard.types';

// ============================================
// Types
// ============================================

interface LiveActivityFeedProps {
  activities: ActivityEvent[];
  maxVisible?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  isLive?: boolean;
}

// ============================================
// ActivityHub Type Configuration
// ============================================

const activityConfig: Record<ActivityType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  'clock-in': {
    icon: FiLogIn,
    color: 'green.500',
    bgColor: 'green.50',
    label: 'Clock In',
  },
  'clock-out': {
    icon: FiLogOut,
    color: 'gray.500',
    bgColor: 'gray.50',
    label: 'Clock Out',
  },
  'checkpoint-scan': {
    icon: FiCheckSquare,
    color: 'blue.500',
    bgColor: 'blue.50',
    label: 'Checkpoint',
  },
  'incident-report': {
    icon: FiAlertTriangle,
    color: 'orange.500',
    bgColor: 'orange.50',
    label: 'Incident',
  },
  'task-completed': {
    icon: FiCheckSquare,
    color: 'teal.500',
    bgColor: 'teal.50',
    label: 'Task Complete',
  },
  'geofence-violation': {
    icon: FiMapPin,
    color: 'red.500',
    bgColor: 'red.50',
    label: 'Geofence Alert',
  },
  'break-start': {
    icon: FiCoffee,
    color: 'purple.500',
    bgColor: 'purple.50',
    label: 'Break Started',
  },
  'break-end': {
    icon: FiCoffee,
    color: 'purple.400',
    bgColor: 'purple.50',
    label: 'Break Ended',
  },
  'shift-swap': {
    icon: FiRefreshCw,
    color: 'cyan.500',
    bgColor: 'cyan.50',
    label: 'Shift Swap',
  },
};

// ============================================
// ActivityHub Item Component
// ============================================

interface ActivityItemProps {
  activity: ActivityEvent;
  isFirst?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, isFirst }) => {
  const config = activityConfig[activity.type] || {
    icon: FiActivity,
    color: 'gray.500',
    bgColor: 'gray.50',
    label: 'ActivityHub',
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCritical = activity.severity === 'critical' || activity.severity === 'warning';

  return (
    <HStack
      gap={3}
      align="flex-start"
      p={3}
      bg={isCritical ? config.bgColor : 'transparent'}
      borderRadius="md"
      transition="background 0.2s"
      _hover={{ bg: config.bgColor }}
    >
      {/* Timeline Indicator */}
      <VStack gap={0} align="center" pt={1}>
        <Box
          w={3}
          h={3}
          borderRadius="full"
          bg={config.color}
          boxShadow={isFirst ? `0 0 0 4px ${config.bgColor}` : 'none'}
        />
        <Box w="2px" flex={1} bg="gray.100" minH={8} />
      </VStack>

      {/* Content */}
      <VStack align="flex-start" flex={1} gap={1} pb={2}>
        <HStack justify="space-between" w="full">
          <HStack gap={2}>
            <Icon as={config.icon} boxSize={4} color={config.color} />
            <Text fontWeight="medium" fontSize="sm" color="gray.800">
              {activity.guardName || 'System'}
            </Text>
            {activity.severity && (
              <Badge
                colorScheme={activity.severity === 'critical' ? 'red' : 'orange'}
                size="sm"
                variant="subtle"
              >
                {activity.severity}
              </Badge>
            )}
          </HStack>
          <Text fontSize="xs" color="gray.400">
            {formatTimestamp(activity.timestamp)}
          </Text>
        </HStack>

        <Text fontSize="sm" color="gray.600">
          {activity.description}
        </Text>

        {activity.siteName && (
          <HStack gap={1}>
            <Icon as={FiMapPin} boxSize={3} color="gray.400" />
            <Text fontSize="xs" color="gray.500">
              {activity.siteName}
            </Text>
          </HStack>
        )}
      </VStack>
    </HStack>
  );
};

// ============================================
// Main Component
// ============================================

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
                                                             activities,
                                                             maxVisible = 10,
                                                             showViewAll = true,
                                                             onViewAll,
                                                             isLive = true,
                                                           }) => {
  const navigate = useNavigate();
  const visibleActivities = activities.slice(0, maxVisible);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/activity');
    }
  };

  return (
    <Box
      bg="white"
      p={5}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
      h="full"
    >
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <HStack gap={2}>
          <Text fontWeight="semibold" color="gray.800">
            Live Activity
          </Text>
          {isLive && (
            <HStack gap={1}>
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
          )}
        </HStack>
        {showViewAll && (
          <Button
            size="xs"
            variant="ghost"
            colorScheme="blue"
            onClick={handleViewAll}
          >
            View All
            <Icon as={FiChevronRight} ml={1} />
          </Button>
        )}
      </HStack>

      {/* ActivityHub List */}
      {activities.length === 0 ? (
        <VStack py={8} gap={2}>
          <Icon as={FiActivity} boxSize={8} color="gray.300" />
          <Text color="gray.500" fontSize="sm">No recent activity</Text>
        </VStack>
      ) : (
        <VStack align="stretch" gap={0} maxH="400px" overflowY="auto">
          {visibleActivities.map((activity, index) => (
            <ActivityItem
              key={activity._id}
              activity={activity}
              isFirst={index === 0}
            />
          ))}
        </VStack>
      )}

      {/* Footer */}
      {activities.length > maxVisible && (
        <Box mt={3} pt={3} borderTopWidth="1px" borderColor="gray.100">
          <Button
            size="sm"
            variant="ghost"
            colorScheme="gray"
            w="full"
            onClick={handleViewAll}
          >
            View {activities.length - maxVisible} more events
          </Button>
        </Box>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
};

export default LiveActivityFeed;