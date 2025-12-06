/**
 * ShiftDrawer Component
 *
 * Side panel showing detailed shift information.
 * Includes guard info, site, time, tasks, and notes.
 */

import React from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  Badge,
  Drawer,
  Avatar,
  Separator,
  Spinner,
  Checkbox,
} from '@chakra-ui/react';
import {
  LuX,
  LuClock,
  LuMapPin,
  LuPhone,
  LuClipboardList,
  LuStickyNote,
  LuPencil,
} from 'react-icons/lu';
import { Shift, ShiftDrawerProps } from '../../../types/scheduling.types';

// Status color mapping
const statusColors: Record<string, string> = {
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

// Frequency labels
const frequencyLabels: Record<string, string> = {
  once: 'One-time',
  hourly: 'Hourly',
  periodic: 'Periodic',
};

const ShiftDrawer: React.FC<ShiftDrawerProps> = ({
                                                   shift,
                                                   isOpen,
                                                   onClose,
                                                   onEdit,
                                                   onTaskComplete,
                                                   isLoading = false,
                                                 }) => {
  if (!shift) return null;

  const completedTasks = shift.tasks.filter((t) => t.completed).length;
  const totalTasks = shift.tasks.length;

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="md" placement="end">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          {/* Header */}
          <Drawer.Header borderBottomWidth="1px" borderColor="gray.200" p={4}>
            <Flex justify="space-between" align="flex-start" w="full">
              <VStack align="flex-start" gap={2}>
                <HStack gap={2}>
                  <Badge
                    colorPalette={statusColors[shift.status]}
                    variant="subtle"
                    px={2}
                    py={1}
                  >
                    {shift.status.replace('-', ' ')}
                  </Badge>
                  <Badge
                    colorPalette={shiftTypeColors[shift.shiftType]}
                    variant="subtle"
                    px={2}
                    py={1}
                  >
                    {shift.shiftType} Shift
                  </Badge>
                </HStack>
                <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                  {formatDate(shift.date)}
                </Text>
              </VStack>

              <HStack gap={2}>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(shift)}
                  >
                    <LuPencil size={14} />
                    Edit
                  </Button>
                )}
                <Drawer.CloseTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <LuX size={18} />
                  </Button>
                </Drawer.CloseTrigger>
              </HStack>
            </Flex>
          </Drawer.Header>

          {/* Body */}
          <Drawer.Body p={0}>
            {isLoading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="lg" color="blue.500" />
              </Flex>
            ) : (
              <VStack align="stretch" gap={0}>
                {/* Guard Section */}
                <Box p={4} bg="gray.50">
                  <HStack gap={3}>
                    <Avatar.Root size="lg">
                      <Avatar.Fallback name={shift.guard.fullName} />
                    </Avatar.Root>
                    <Box flex="1">
                      <Text fontSize="md" fontWeight="semibold" color="gray.800">
                        {shift.guard.fullName}
                      </Text>
                      {shift.guard.badgeNumber && (
                        <Text fontSize="sm" color="gray.500">
                          Badge: {shift.guard.badgeNumber}
                        </Text>
                      )}
                    </Box>
                    {shift.guard.phoneNumber && (
                      <Button size="sm" variant="outline" colorPalette="blue">
                        <LuPhone size={14} />
                        Call
                      </Button>
                    )}
                  </HStack>
                </Box>

                <Separator />

                {/* Shift Details */}
                <Box p={4}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                    Shift Details
                  </Text>
                  <VStack align="stretch" gap={3}>
                    {/* Time */}
                    <HStack gap={3}>
                      <Box color="gray.400">
                        <LuClock size={18} />
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Time
                        </Text>
                        <Text fontSize="md" color="gray.800" fontWeight="medium">
                          {shift.startTime} - {shift.endTime}
                        </Text>
                      </Box>
                    </HStack>

                    {/* Site */}
                    <HStack gap={3}>
                      <Box color="gray.400">
                        <LuMapPin size={18} />
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">
                          Site
                        </Text>
                        <Text fontSize="md" color="gray.800" fontWeight="medium">
                          {shift.site.name}
                        </Text>
                        {shift.site.postCode && (
                          <Text fontSize="sm" color="gray.500">
                            {shift.site.postCode}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </VStack>
                </Box>

                <Separator />

                {/* Shift Tasks */}
                <Box p={4}>
                  <Flex justify="space-between" align="center" mb={3}>
                    <HStack gap={2}>
                      <LuClipboardList size={18} color="gray" />
                      <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                        Shift Tasks
                      </Text>
                    </HStack>
                    {totalTasks > 0 && (
                      <Badge
                        colorPalette={completedTasks === totalTasks ? 'green' : 'gray'}
                        variant="subtle"
                      >
                        {completedTasks}/{totalTasks} complete
                      </Badge>
                    )}
                  </Flex>

                  {totalTasks === 0 ? (
                    <Box
                      p={4}
                      bg="gray.50"
                      borderRadius="md"
                      textAlign="center"
                    >
                      <Text fontSize="sm" color="gray.500">
                        No tasks assigned to this shift
                      </Text>
                    </Box>
                  ) : (
                    <VStack align="stretch" gap={2}>
                      {shift.tasks.map((task) => (
                        <Flex
                          key={task._id}
                          p={3}
                          bg={task.completed ? 'green.50' : 'gray.50'}
                          borderRadius="md"
                          align="flex-start"
                          gap={3}
                        >
                          <Checkbox.Root
                            checked={task.completed}
                            onCheckedChange={(e) =>
                              onTaskComplete?.(shift._id, task._id, !!e.checked)
                            }
                            disabled={shift.status === 'completed' || shift.status === 'cancelled'}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Root>
                          <Box flex="1">
                            <Text
                              fontSize="sm"
                              color={task.completed ? 'gray.500' : 'gray.800'}
                              textDecoration={task.completed ? 'line-through' : 'none'}
                            >
                              {task.description}
                            </Text>
                            <Badge
                              colorPalette="gray"
                              variant="outline"
                              size="sm"
                              mt={1}
                            >
                              {frequencyLabels[task.frequency]}
                            </Badge>
                          </Box>
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </Box>

                {/* Shift Notes */}
                {shift.notes && (
                  <>
                    <Separator />
                    <Box p={4}>
                      <HStack gap={2} mb={2}>
                        <LuStickyNote size={18} color="gray" />
                        <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                          Shift Notes
                        </Text>
                      </HStack>
                      <Box
                        p={3}
                        bg="yellow.50"
                        borderRadius="md"
                        borderLeftWidth="3px"
                        borderLeftColor="yellow.400"
                      >
                        <Text fontSize="sm" color="gray.700" fontStyle="italic">
                          "{shift.notes}"
                        </Text>
                      </Box>
                    </Box>
                  </>
                )}
              </VStack>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};

export default ShiftDrawer;