/**
 * AddShiftModal Component
 *
 * Modal form for creating new shifts with tasks.
 * Includes intelligent officer recommendations based on site requirements.
 * Uses Chakra UI v3 Dialog components.
 */

import React, { useState } from 'react';
import {
  Box,
  Dialog,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Select,
  createListCollection,
  Flex,
  Field,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { LuX, LuPlus, LuCalendarPlus, LuTrash2 } from 'react-icons/lu';
import {
  ShiftFormData,
  TaskFormData,
  AvailableOfficer,
  AvailableSite,
  ShiftType,
  TaskFrequency,
  TaskPriority,
} from '../types/scheduling.types';
import RecommendedOfficersPanel from './RecommendedOfficersPanel';

// ============================================
// Props Interface
// ============================================

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftFormData) => Promise<void>;
  availableOfficers: AvailableOfficer[];
  availableSites: AvailableSite[];
  selectedDate?: string;
  isSubmitting?: boolean;
}

// ============================================
// Constants
// ============================================

// Shift type options
const shiftTypeOptions = createListCollection({
  items: [
    { value: 'Morning', label: 'Morning (06:00 - 14:00)' },
    { value: 'Afternoon', label: 'Afternoon (14:00 - 22:00)' },
    { value: 'Night', label: 'Night (22:00 - 06:00)' },
  ],
});

// Task frequency options
const frequencyOptions = createListCollection({
  items: [
    { value: 'once', label: 'One-time' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'periodic', label: 'Periodic' },
  ],
});

// Default times for shift types
const shiftTimes: Record<ShiftType, { start: string; end: string }> = {
  Morning: { start: '06:00', end: '14:00' },
  Afternoon: { start: '14:00', end: '22:00' },
  Night: { start: '22:00', end: '06:00' },
};

// Initial form state
const getInitialFormData = (selectedDate?: string): ShiftFormData => ({
  officerId: '',
  siteId: '',
  date: selectedDate || new Date().toISOString().split('T')[0],
  startTime: '06:00',
  endTime: '14:00',
  shiftType: 'Morning',
  tasks: [],
  notes: '',
});

// ============================================
// Main Component
// ============================================

const AddShiftModal: React.FC<AddShiftModalProps> = ({
                                                       isOpen,
                                                       onClose,
                                                       onSubmit,
                                                       availableOfficers,
                                                       availableSites,
                                                       selectedDate,
                                                       isSubmitting = false,
                                                     }) => {
  const [formData, setFormData] = useState<ShiftFormData>(
    getInitialFormData(selectedDate)
  );
  const [newTask, setNewTask] = useState<TaskFormData>({
    title: '',
    description: '',
    frequency: 'once',
    priority: 'medium',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShiftFormData, string>>>({});

  // Create officer options for dropdown
  const officerOptions = createListCollection({
    items: availableOfficers
      .filter((o) => o.availability)
      .map((o) => ({
        value: o._id,
        label: `${o.fullName}${o.badgeNumber ? ` (${o.badgeNumber})` : ''}`,
      })),
  });

  // Create site options for dropdown
  const siteOptions = createListCollection({
    items: availableSites.map((s) => ({
      value: s._id,
      label: `${s.name}${s.postCode ? ` - ${s.postCode}` : ''}`,
    })),
  });

  // Reset form when modal closes
  const handleClose = () => {
    setFormData(getInitialFormData(selectedDate));
    setNewTask({ title: '', description: '', frequency: 'once', priority: 'medium' });
    setErrors({});
    onClose();
  };

  // Handle shift type change (auto-update times)
  const handleShiftTypeChange = (type: ShiftType) => {
    const times = shiftTimes[type];
    setFormData((prev) => ({
      ...prev,
      shiftType: type,
      startTime: times.start,
      endTime: times.end,
    }));
  };

  // Handle recommended officer selection
  const handleRecommendedOfficerSelect = (officerId: string) => {
    setFormData((prev) => ({ ...prev, officerId }));
    // Clear officer error if it was set
    if (errors.officerId) {
      setErrors((prev) => ({ ...prev, officerId: undefined }));
    }
  };

  // Add task
  const handleAddTask = () => {
    if (!newTask.description.trim()) return;

    setFormData((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          title: newTask.title?.trim() || undefined,
          description: newTask.description.trim(),
          frequency: newTask.frequency,
          priority: newTask.priority,
        },
      ],
    }));

    setNewTask({ title: '', description: '', frequency: 'once', priority: 'medium' });
  };

  const priorityOptions = createListCollection({
    items: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
  });

  // Remove task
  const handleRemoveTask = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShiftFormData, string>> = {};

    if (!formData.officerId) {
      newErrors.officerId = 'Please select an officer';
    }
    if (!formData.siteId) {
      newErrors.siteId = 'Please select a site';
    }
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      console.error('Error creating shift:', err);
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && handleClose()}
      size="lg"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxH="90vh" overflow="auto">
          {/* Header */}
          <Dialog.Header borderBottomWidth="1px" borderColor="gray.200">
            <Flex justify="space-between" align="center">
              <HStack gap={2}>
                <LuCalendarPlus size={20} />
                <Text fontSize="lg" fontWeight="semibold">
                  Create New Shift
                </Text>
              </HStack>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm">
                  <LuX size={18} />
                </Button>
              </Dialog.CloseTrigger>
            </Flex>
          </Dialog.Header>

          {/* Body */}
          <Dialog.Body py={6}>
            <VStack gap={6} align="stretch">
              {/* Shift Details Section */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={4}>
                  Shift Details
                </Text>
                <VStack gap={4}>
                  {/* Site Selection (FIRST - triggers recommendations) */}
                  <Field.Root required invalid={!!errors.siteId}>
                    <Field.Label>Site</Field.Label>
                    <Select.Root
                      collection={siteOptions}
                      value={formData.siteId ? [formData.siteId] : []}
                      onValueChange={(e) =>
                        setFormData((prev) => ({ ...prev, siteId: e.value[0] }))
                      }
                    >
                      <Select.Trigger
                        borderColor={errors.siteId ? 'red.300' : 'gray.300'}
                      >
                        <Select.ValueText placeholder="Select a site" />
                      </Select.Trigger>
                      <Select.Content
                        bg="white"
                        borderColor="gray.200"
                        boxShadow="lg"
                      >
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
                    {errors.siteId && (
                      <Field.ErrorText>{errors.siteId}</Field.ErrorText>
                    )}
                  </Field.Root>

                  {/* Date & Shift Type (needed for recommendations context) */}
                  <HStack gap={4} w="full">
                    <Field.Root required invalid={!!errors.date} flex="1">
                      <Field.Label>Date</Field.Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, date: e.target.value }))
                        }
                        borderColor={errors.date ? 'red.300' : 'gray.300'}
                      />
                      {errors.date && (
                        <Field.ErrorText>{errors.date}</Field.ErrorText>
                      )}
                    </Field.Root>

                    <Field.Root required flex="1">
                      <Field.Label>Shift Type</Field.Label>
                      <Select.Root
                        collection={shiftTypeOptions}
                        value={[formData.shiftType]}
                        onValueChange={(e) =>
                          handleShiftTypeChange(e.value[0] as ShiftType)
                        }
                      >
                        <Select.Trigger>
                          <Select.ValueText placeholder="Select shift type" />
                        </Select.Trigger>
                        <Select.Content
                          bg="white"
                          borderColor="gray.200"
                          boxShadow="lg"
                        >
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
                    </Field.Root>
                  </HStack>

                  {/* ============================================ */}
                  {/* RECOMMENDED OFFICERS PANEL                   */}
                  {/* Appears after site selection                 */}
                  {/* ============================================ */}
                  <RecommendedOfficersPanel
                    siteId={formData.siteId || null}
                    date={formData.date}
                    onSelect={handleRecommendedOfficerSelect}
                    selectedOfficerId={formData.officerId}
                  />

                  {/* Officer Selection */}
                  <Field.Root required invalid={!!errors.officerId}>
                    <Field.Label>Officer</Field.Label>
                    <Select.Root
                      collection={officerOptions}
                      value={formData.officerId ? [formData.officerId] : []}
                      onValueChange={(e) =>
                        setFormData((prev) => ({ ...prev, officerId: e.value[0] }))
                      }
                    >
                      <Select.Trigger
                        borderColor={errors.officerId ? 'red.300' : 'gray.300'}
                      >
                        <Select.ValueText placeholder="Select an officer" />
                      </Select.Trigger>
                      <Select.Content
                        bg="white"
                        borderColor="gray.200"
                        boxShadow="lg"
                      >
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
                    {errors.officerId && (
                      <Field.ErrorText>{errors.officerId}</Field.ErrorText>
                    )}
                  </Field.Root>

                  {/* Custom Times */}
                  <HStack gap={4} w="full">
                    <Field.Root flex="1">
                      <Field.Label>Start Time</Field.Label>
                      <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                      />
                    </Field.Root>

                    <Field.Root flex="1">
                      <Field.Label>End Time</Field.Label>
                      <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                      />
                    </Field.Root>
                  </HStack>
                </VStack>
              </Box>

              {/* Tasks Section */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={4}>
                  Shift Tasks
                </Text>

                {/* Existing Tasks */}
                {formData.tasks.length > 0 && (
                  <VStack gap={2} mb={4} align="stretch">
                    {formData.tasks.map((task, index) => (
                      <HStack
                        key={index}
                        p={3}
                        bg="gray.50"
                        borderRadius="md"
                        justify="space-between"
                      >
                        <VStack align="flex-start" gap={0}>
                          <Text fontSize="sm" color="gray.700">
                            {task.description}
                          </Text>
                          <Badge size="sm" variant="subtle" colorPalette="blue">
                            {task.frequency}
                          </Badge>
                        </VStack>
                        <IconButton
                          aria-label="Remove task"
                          variant="ghost"
                          size="sm"
                          colorPalette="red"
                          onClick={() => handleRemoveTask(index)}
                        >
                          <LuTrash2 size={14} />
                        </IconButton>
                      </HStack>
                    ))}
                  </VStack>
                )}

                {/* Add New Task */}
                <VStack gap={2} align="stretch">
                  <Input
                    placeholder="Task title (optional)"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                  <HStack gap={2}>
                    <Input
                      flex="1"
                      placeholder="Task description"
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                    <Select.Root
                      collection={frequencyOptions}
                      value={[newTask.frequency]}
                      onValueChange={(e) =>
                        setNewTask((prev) => ({ ...prev, frequency: e.value[0] as TaskFrequency }))
                      }
                      width="140px"
                    >
                      {/* ... */}
                    </Select.Root>
                    <Select.Root
                      collection={priorityOptions}
                      value={[newTask.priority]}
                      onValueChange={(e) =>
                        setNewTask((prev) => ({ ...prev, priority: e.value[0] as TaskPriority }))
                      }
                      width="120px"
                    >
                      <Select.Trigger>
                        <Select.ValueText placeholder="Priority" />
                      </Select.Trigger>
                      <Select.Content>
                        {priorityOptions.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    <IconButton onClick={handleAddTask} colorPalette="blue">
                      <LuPlus />
                    </IconButton>
                  </HStack>
                </VStack>
              </Box>

              {/* Notes Section */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={4}>
                  Additional Notes
                </Text>
                <Textarea
                  placeholder="Special instructions, client requests, etc."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </Box>
            </VStack>
          </Dialog.Body>

          {/* Footer */}
          <Dialog.Footer borderTopWidth="1px" borderColor="gray.200">
            <HStack gap={3} justify="flex-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                colorPalette="blue"
                onClick={handleSubmit}
                loading={isSubmitting}
                loadingText="Creating..."
              >
                Create Shift
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default AddShiftModal;