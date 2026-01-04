/**
 * ShiftCard Component
 *
 * Displays a single shift in the calendar view.
 * Shows guard, time, site, and task count.
 */

import React from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Avatar,
} from '@chakra-ui/react';
import { LuClock, LuMapPin, LuClipboardList } from 'react-icons/lu';
import { ShiftCardProps } from '../../../types/scheduling.types';

// Status color mapping
const statusColors: Record<string, string> = {
  unassigned: 'gray',
  scheduled: 'blue',
  'in-progress': 'orange',
  completed: 'green',
  cancelled: 'red',
};

// Shift type color mapping
const shiftTypeColors: Record<string, string> = {
  Morning: 'yellow',
  Afternoon: 'orange',
  Night: 'purple',
};

const ShiftCard: React.FC<ShiftCardProps> = ({
                                               shift,
                                               isCompact = false,
                                               onClick,
                                             }) => {
  const guardName = shift.guard?.fullName || 'Unassigned';
  const completedTasks = shift.tasks.filter((t) => t.completed).length;
  const totalTasks = shift.tasks.length;

  if (isCompact) {
    // Compact version for month view
    return (
      <Box
        p={1.5}
        bg={shift.guard ? `${shiftTypeColors[shift.shiftType]}.50` : 'gray.100'}
        borderRadius="md"
        borderLeftWidth="3px"
        borderLeftColor={shift.guard ? `${shiftTypeColors[shift.shiftType]}.400` : 'gray.400'}
        cursor="pointer"
        _hover={{ bg: shift.guard ? `${shiftTypeColors[shift.shiftType]}.100` : 'gray.200' }}
        onClick={() => onClick?.(shift)}
        overflow="hidden"
      >
        <Text fontSize="xs" fontWeight="medium" color={shift.guard ? 'gray.700' : 'gray.500'} lineClamp={1}>
          {guardName}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {shift.shiftType}
        </Text>
      </Box>
    );
  }

  // Full version for day/week view
  return (
    <Box
      p={3}
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      borderLeftWidth="4px"
      borderLeftColor={`${shiftTypeColors[shift.shiftType]}.400`}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        boxShadow: 'md',
        borderColor: 'gray.300',
      }}
      onClick={() => onClick?.(shift)}
    >
      <VStack align="stretch" gap={2}>
        {/* Header: Guard & Status */}
        <Flex justify="space-between" align="flex-start">
          <HStack gap={2}>
            <Avatar.Root size="sm">
              <Avatar.Fallback name={guardName} />
            </Avatar.Root>
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                {guardName}
              </Text>
              {shift.guard?.siaLicenceNumber && (
                <Text fontSize="xs" color="gray.500">
                  {shift.guard.siaLicenceNumber}
                </Text>
              )}
            </Box>
          </HStack>
          <Badge
            colorPalette={statusColors[shift.status]}
            variant="subtle"
            size="sm"
          >
            {shift.status.replace('-', ' ')}
          </Badge>
        </Flex>

        {/* Shift Type */}
        <HStack gap={1} color="gray.600">
          <LuClock size={14} />
          <Badge
            colorPalette={shiftTypeColors[shift.shiftType]}
            variant="subtle"
            size="sm"
          >
            {shift.shiftType}
          </Badge>
        </HStack>

        {/* Site */}
        <HStack gap={1} color="gray.600">
          <LuMapPin size={14} />
          <Text fontSize="sm" lineClamp={1}>
            {shift.site.name}
          </Text>
        </HStack>

        {/* Tasks */}
        {totalTasks > 0 && (
          <HStack gap={1} color="gray.600">
            <LuClipboardList size={14} />
            <Text fontSize="sm">
              {completedTasks}/{totalTasks} tasks
            </Text>
            {completedTasks === totalTasks && totalTasks > 0 && (
              <Badge colorPalette="green" variant="subtle" size="sm">
                Complete
              </Badge>
            )}
          </HStack>
        )}

        {/* Notes indicator */}
        {shift.notes && (
          <Text fontSize="xs" color="gray.500" fontStyle="italic" lineClamp={1}>
            "{shift.notes}"
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default ShiftCard;