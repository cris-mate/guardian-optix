/**
 * QuickActions Component
 *
 * Quick action buttons for common dashboard operations.
 * Provides shortcuts to key functionality across the app.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  HStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import {
  LuPlus,
  LuMessageSquare,
  LuCircleAlert,
  LuMapPin,
} from 'react-icons/lu';

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
}

interface QuickActionsProps {
  userPermissions?: string[];
}

// ============================================
// Main Component
// ============================================

const QuickActions: React.FC<QuickActionsProps> = ({
                                                     userPermissions = [],
                                                   }) => {
  const navigate = useNavigate();

  // Define available quick actions
  const actions: QuickAction[] = [
    {
      id: 'assign-shift',
      label: 'Assign Shift',
      icon: LuPlus,
      colorScheme: 'blue',
      variant: 'solid',
      action: () => navigate('/scheduling?action=add'),
    },
    {
      id: 'broadcast-message',
      label: 'Broadcast',
      icon: LuMessageSquare,
      colorScheme: 'teal',
      variant: 'outline',
      action: () => navigate('/messages/broadcast'),
    },
    {
      id: 'report-incident',
      label: 'Report Incident',
      icon: LuCircleAlert,
      colorScheme: 'orange',
      variant: 'outline',
      action: () => navigate('/compliance?tab=incidents&action=report'),
    },
    {
      id: 'view-sites',
      label: 'Sites',
      icon: LuMapPin,
      colorScheme: 'purple',
      variant: 'outline',
      action: () => navigate('/clients?tab=sites'),
    },
  ];

  return (
    <Box
      bg="white"
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
    >
      <HStack justify="space-between" align="center">
        <Text fontSize="sm" fontWeight="semibold" color="gray.700">
          Quick Actions
        </Text>
        <HStack gap={2} flexWrap="wrap">
          {actions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              colorPalette={action.colorScheme}
              variant={action.variant || 'outline'}
              onClick={action.action}
              fontWeight="medium"
            >
              <Icon as={action.icon} mr={2} />
              {action.label}
            </Button>
          ))}
        </HStack>
      </HStack>
    </Box>
  );
};

export default QuickActions;