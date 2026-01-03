/**
 * AddShiftForSiteModal Component
 *
 * Simplified modal for adding shifts to a specific site.
 * Pre-selects the site and focuses on guard, date, and shift type selection.
 */

import React, { useState, useEffect } from 'react';
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
  Field,
  Badge,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { LuX, LuCalendarPlus, LuMapPin, LuClock, LuUser } from 'react-icons/lu';
import { api } from '../../../utils/api';
import { MOCK_CONFIG, simulateDelay } from '../../../config/api.config';

// ============================================
// Types
// ============================================

interface AvailableGuard {
  _id: string;
  fullName: string;
  siaLicenceNumber?: string;
  availability: boolean;
}

interface ShiftFormData {
  guardId: string;
  date: string;
  shiftType: 'Morning' | 'Afternoon' | 'Night';
  startTime: string;
  endTime: string;
  notes: string;
}

interface AddShiftForSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: {
    _id: string;
    name: string;
    client: { companyName: string };
  };
  onSuccess?: () => void;
}

// ============================================
// Constants
// ============================================

const shiftTypeOptions = createListCollection({
  items: [
    { value: 'Morning', label: 'Morning (06:00 - 14:00)' },
    { value: 'Afternoon', label: 'Afternoon (14:00 - 22:00)' },
    { value: 'Night', label: 'Night (22:00 - 06:00)' },
  ],
});

const shiftTimes: Record<string, { start: string; end: string }> = {
  Morning: { start: '06:00', end: '14:00' },
  Afternoon: { start: '14:00', end: '22:00' },
  Night: { start: '22:00', end: '06:00' },
};

const USE_MOCK_DATA = MOCK_CONFIG.scheduling ?? true;

// Mock guards data
const mockGuards: AvailableGuard[] = [
  { _id: 'g1', fullName: 'James Wilson', siaLicenceNumber: 'G001', availability: true },
  { _id: 'g2', fullName: 'Sarah Connor', siaLicenceNumber: 'G002', availability: true },
  { _id: 'g3', fullName: 'Michael Chen', siaLicenceNumber: 'G003', availability: true },
  { _id: 'g4', fullName: 'Emma Thompson', siaLicenceNumber: 'G004', availability: false },
  { _id: 'g5', fullName: 'Robert Brown', siaLicenceNumber: 'G005', availability: true },
];

// ============================================
// Component
// ============================================

const AddShiftForSiteModal: React.FC<AddShiftForSiteModalProps> = ({
                                                                     isOpen,
                                                                     onClose,
                                                                     site,
                                                                     onSuccess,
                                                                   }) => {
  const [formData, setFormData] = useState<ShiftFormData>({
    guardId: '',
    date: new Date().toISOString().split('T')[0],
    shiftType: 'Morning',
    startTime: '06:00',
    endTime: '14:00',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShiftFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGuards, setIsLoadingGuards] = useState(false);
  const [availableGuards, setAvailableGuards] = useState<AvailableGuard[]>([]);

  // Fetch available guards
  useEffect(() => {
    if (!isOpen) return;

    const fetchGuards = async () => {
      setIsLoadingGuards(true);
      try {
        if (USE_MOCK_DATA) {
          await simulateDelay('short');
          setAvailableGuards(mockGuards);
        } else {
          const response = await api.get('/scheduling/available-guards');
          setAvailableGuards(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching guards:', err);
      } finally {
        setIsLoadingGuards(false);
      }
    };

    fetchGuards();
  }, [isOpen]);

  // Create guard options for dropdown
  const guardOptions = createListCollection({
    items: [
      { value: '', label: 'Leave Unassigned' },
      ...availableGuards
        .filter((g) => g.availability)
        .map((g) => ({
          value: g._id,
          label: `${g.fullName}${g.siaLicenceNumber ? ` (${g.siaLicenceNumber})` : ''}`,
        })),
    ],
  });

  // Handle shift type change (auto-update times)
  const handleShiftTypeChange = (type: string) => {
    const times = shiftTimes[type];
    setFormData((prev) => ({
      ...prev,
      shiftType: type as ShiftFormData['shiftType'],
      startTime: times.start,
      endTime: times.end,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      guardId: '',
      date: new Date().toISOString().split('T')[0],
      shiftType: 'Morning',
      startTime: '06:00',
      endTime: '14:00',
      notes: '',
    });
    setErrors({});
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShiftFormData, string>> = {};

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    // Date should not be in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      newErrors.date = 'Date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        siteId: site._id,
        guardId: formData.guardId || null,
        date: formData.date,
        shiftType: formData.shiftType,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes || undefined,
        status: 'scheduled',
      };

      if (USE_MOCK_DATA) {
        await simulateDelay('medium');
        console.log('Mock shift created:', payload);
      } else {
        await api.post('/scheduling/shifts', payload);
      }

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      console.error('Error creating shift:', err);
      setErrors({ date: err.response?.data?.message || 'Failed to create shift' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="500px">
          {/* Header */}
          <Dialog.Header borderBottomWidth="1px" borderColor="gray.200">
            <HStack justify="space-between" width="100%">
              <HStack gap={2}>
                <Icon as={LuCalendarPlus} color="blue.500" />
                <Dialog.Title>Add Shift</Dialog.Title>
              </HStack>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm">
                  <LuX size={18} />
                </Button>
              </Dialog.CloseTrigger>
            </HStack>
          </Dialog.Header>

          {/* Body */}
          <Dialog.Body py={5}>
            <VStack gap={4} align="stretch">
              {/* Site Info (Read-only) */}
              <Box bg="purple.50" borderRadius="md" p={4}>
                <HStack gap={2} mb={1}>
                  <Icon as={LuMapPin} color="purple.500" boxSize={4} />
                  <Text fontSize="xs" color="purple.600" fontWeight="medium">
                    SITE
                  </Text>
                </HStack>
                <Text fontWeight="semibold" color="gray.800">
                  {site.name}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {site.client.companyName}
                </Text>
              </Box>

              {/* Date */}
              <Field.Root invalid={!!errors.date}>
                <Field.Label>
                  <HStack gap={1}>
                    <Icon as={LuClock} boxSize={4} color="gray.500" />
                    <Text>Date</Text>
                  </HStack>
                </Field.Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.date && <Field.ErrorText>{errors.date}</Field.ErrorText>}
              </Field.Root>

              {/* Shift Type */}
              <Field.Root>
                <Field.Label>Shift Type</Field.Label>
                <Select.Root
                  collection={shiftTypeOptions}
                  value={[formData.shiftType]}
                  onValueChange={(e) => handleShiftTypeChange(e.value[0])}
                >
                  <Select.Trigger>
                    <Select.ValueText />
                  </Select.Trigger>
                  <Select.Content>
                    {shiftTypeOptions.items.map((option) => (
                      <Select.Item key={option.value} item={option}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                <HStack gap={2} mt={2}>
                  <Badge colorPalette="gray" variant="outline">
                    {formData.startTime} - {formData.endTime}
                  </Badge>
                </HStack>
              </Field.Root>

              {/* Guard (Optional) */}
              <Field.Root>
                <Field.Label>
                  <HStack gap={1}>
                    <Icon as={LuUser} boxSize={4} color="gray.500" />
                    <Text>Assign Guard</Text>
                    <Badge colorPalette="gray" variant="subtle" size="sm">Optional</Badge>
                  </HStack>
                </Field.Label>
                {isLoadingGuards ? (
                  <HStack gap={2} py={2}>
                    <Spinner size="sm" />
                    <Text fontSize="sm" color="gray.500">Loading guards...</Text>
                  </HStack>
                ) : (
                  <Select.Root
                    collection={guardOptions}
                    value={formData.guardId ? [formData.guardId] : ['']}
                    onValueChange={(e) =>
                      setFormData((prev) => ({ ...prev, guardId: e.value[0] || '' }))
                    }
                  >
                    <Select.Trigger>
                      <Select.ValueText placeholder="Leave Unassigned" />
                    </Select.Trigger>
                    <Select.Content>
                      {guardOptions.items.map((option) => (
                        <Select.Item key={option.value} item={option}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
                <Text fontSize="xs" color="gray.500" mt={1}>
                  You can assign a guard later from the Scheduling page.
                </Text>
              </Field.Root>

              {/* Notes */}
              <Field.Root>
                <Field.Label>Notes (Optional)</Field.Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special instructions for this shift..."
                  rows={3}
                />
              </Field.Root>
            </VStack>
          </Dialog.Body>

          {/* Footer */}
          <Dialog.Footer borderTopWidth="1px" borderColor="gray.200">
            <HStack gap={2} justify="flex-end">
              <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                colorPalette="blue"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" mr={2} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon as={LuCalendarPlus} mr={2} />
                    Create Shift
                  </>
                )}
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default AddShiftForSiteModal;