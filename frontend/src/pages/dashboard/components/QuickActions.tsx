import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  HStack,
  Icon,
  Text,
  Wrap,
  WrapItem,
  Spinner,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiMessageSquare,
  FiAlertCircle,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiMapPin,
  FiRefreshCw,
} from 'react-icons/fi';

// ============================================
// Types
// ============================================

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  colorScheme: string;
  variant?: 'solid' | 'outline' | 'ghost';
  action: () => void;
  requiresPermission?: string;
}

interface QuickActionsProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  userPermissions?: string[];
}

// ============================================
// Main Component
// ============================================

const QuickActions: React.FC<QuickActionsProps> = ({
                                                     onRefresh,
                                                     isRefreshing = false,
                                                     userPermissions = [],
                                                   }) => {
  const navigate = useNavigate();

  // Define available quick actions
  const actions: QuickAction[] = [
    {
      id: 'assign-task',
      label: 'Assign Task',
      icon: FiPlus,
      colorScheme: 'blue',
      variant: 'solid',
      action: () => navigate('/tasks/new'),
      requiresPermission: 'tasks:create',
    },
    {
      id: 'broadcast-message',
      label: 'Broadcast',
      icon: FiMessageSquare,
      colorScheme: 'teal',
      variant: 'outline',
      action: () => navigate('/messages/broadcast'),
      requiresPermission: 'messages:broadcast',
    },
    {
      id: 'report-incident',
      label: 'Report Incident',
      icon: FiAlertCircle,
      colorScheme: 'orange',
      variant: 'outline',
      action: () => navigate('/incidents/new'),
    },
    {
      id: 'view-schedule',
      label: 'Schedule',
      icon: FiCalendar,
      colorScheme: 'purple',
      variant: 'ghost',
      action: () => navigate('/schedules'),
    },
    {
      id: 'view-guards',
      label: 'Guards',
      icon: FiUsers,
      colorScheme: 'gray',
      variant: 'ghost',
      action: () => navigate('/guards'),
    },
    {
      id: 'view-reports',
      label: 'Reports',
      icon: FiFileText,
      colorScheme: 'gray',
      variant: 'ghost',
      action: () => navigate('/reports'),
    },
    {
      id: 'view-sites',
      label: 'Sites',
      icon: FiMapPin,
      colorScheme: 'gray',
      variant: 'ghost',
      action: () => navigate('/sites'),
    },
  ];

  // Filter actions based on permissions (if provided)
  const filteredActions = actions.filter(action => {
    if (!action.requiresPermission) return true;
    if (userPermissions.length === 0) return true; // No restrictions if no permissions provided
    return userPermissions.includes(action.requiresPermission);
  });

  return (
    <Box
      bg="white"
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
    >
      <HStack justify="space-between" align="center" mb={3}>
        <Text fontSize="sm" fontWeight="semibold" color="gray.700">
          Quick Actions
        </Text>
        {onRefresh && (
          <Button
            size="xs"
            variant="ghost"
            colorScheme="gray"
            onClick={onRefresh}
            disabled={isRefreshing}
            color="green.600"
            borderColor="green.300"
            _hover={{ bg: 'green.50', borderColor: 'green.400' }}
          >
            {isRefreshing ? (
              <>
                <Spinner size="xs" mr={1} />
                Refreshing
              </>
            ) : (
              <>
                <Icon as={FiRefreshCw} mr={1} />
                Refresh
              </>
            )}
          </Button>
        )}
      </HStack>

      <Wrap gap={2}>
        {filteredActions.map(action => (
          <WrapItem key={action.id}>
            <Button
              size="sm"
              colorScheme={action.colorScheme}
              variant={action.variant || 'outline'}
              onClick={action.action}
              fontWeight="medium"
            >
              <Icon as={action.icon} mr={2} />
              {action.label}
            </Button>
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  );
};

// ============================================
// Compact Version for Mobile
// ============================================

export const QuickActionsCompact: React.FC<QuickActionsProps> = ({
                                                                   onRefresh,
                                                                   isRefreshing = false,
                                                                 }) => {
  const navigate = useNavigate();

  const primaryActions: QuickAction[] = [
    {
      id: 'assign-task',
      label: 'Task',
      icon: FiPlus,
      colorScheme: 'blue',
      variant: 'solid',
      action: () => navigate('/tasks/new'),
    },
    {
      id: 'report-incident',
      label: 'Incident',
      icon: FiAlertCircle,
      colorScheme: 'orange',
      variant: 'outline',
      action: () => navigate('/incidents/new'),
    },
    {
      id: 'broadcast-message',
      label: 'Message',
      icon: FiMessageSquare,
      colorScheme: 'teal',
      variant: 'outline',
      action: () => navigate('/messages/broadcast'),
    },
  ];

  return (
    <HStack gap={2} overflowX="auto" pb={2}>
      {primaryActions.map(action => (
        <Button
          key={action.id}
          size="sm"
          colorScheme={action.colorScheme}
          variant={action.variant || 'outline'}
          onClick={action.action}
          flexShrink={0}
        >
          <Icon as={action.icon} mr={2} />
          {action.label}
        </Button>
      ))}
      {onRefresh && (
        <Button
          size="sm"
          variant="ghost"
          colorScheme="gray"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Spinner size="xs" mr={1} />
              Refreshing
            </>
          ) : (
            <>
              <Icon as={FiRefreshCw} mr={1} />
              Refresh
            </>
          )}
        </Button>
      )}
    </HStack>
  );
};

export default QuickActions;