/**
 * AddSiteModal Component
 *
 * Modal form for creating a new site under a client.
 * Includes address, geofence configuration, site contact details,
 * and coverage requirements (contract period, shifts, guard types).
 */

import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Field,
  Input,
  Grid,
  GridItem,
  Fieldset,
  NativeSelect,
  Textarea,
  IconButton,
  Flex,
  Badge,
  Checkbox,
} from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';
import { LuMapPin, LuX, LuPlus, LuTrash2, LuClock, LuUsers } from 'react-icons/lu';

// ============================================
// Types
// ============================================

export interface ShiftRequirement {
  shiftType: 'Morning' | 'Afternoon' | 'Night';
  guardsRequired: number;
  guardType: string;
  requiredCertifications: string[];
}

export interface CreateSiteFormData {
  name: string;
  siteType: string;
  address: {
    street: string;
    city: string;
    postCode: string;
    country: string;
  };
  geofence: {
    latitude: string;
    longitude: string;
    radius: string;
  };
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  specialInstructions: string;
  requirements: {
    contractStart: string;
    contractEnd: string;
    isOngoing: boolean;
    shiftsPerDay: ShiftRequirement[];
    daysOfWeek: number[];
  };
}

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSiteFormData) => Promise<void>;
  clientName: string;
  clientId: string;
  isSubmitting: boolean;
}

// ============================================
// Constants
// ============================================

const SITE_TYPES = [
  'Office',
  'Retail',
  'Industrial',
  'Residential',
  'Event Venue',
  'Construction',
  'Healthcare',
  'Education',
  'Government',
  'Other',
];

const SHIFT_TYPES: Array<{ value: ShiftRequirement['shiftType']; label: string; time: string }> = [
  { value: 'Morning', label: 'Morning', time: '06:00 - 14:00' },
  { value: 'Afternoon', label: 'Afternoon', time: '14:00 - 22:00' },
  { value: 'Night', label: 'Night', time: '22:00 - 06:00' },
];

const GUARD_TYPES = [
  'Static',
  'Mobile Patrol',
  'CCTV Operator',
  'Door Supervisor',
  'Close Protection',
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

const DEFAULT_SHIFT: ShiftRequirement = {
  shiftType: 'Morning',
  guardsRequired: 1,
  guardType: 'Static',
  requiredCertifications: [],
};

const INITIAL_FORM_DATA: CreateSiteFormData = {
  name: '',
  siteType: 'Other',
  address: {
    street: '',
    city: '',
    postCode: '',
    country: 'United Kingdom',
  },
  geofence: {
    latitude: '',
    longitude: '',
    radius: '100',
  },
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  specialInstructions: '',
  requirements: {
    contractStart: '',
    contractEnd: '',
    isOngoing: false,
    shiftsPerDay: [],
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri default
  },
};

// ============================================
// Sub-components
// ============================================

interface DaysOfWeekSelectorProps {
  selected: number[];
  onChange: (days: number[]) => void;
}

const DaysOfWeekSelector: React.FC<DaysOfWeekSelectorProps> = ({ selected, onChange }) => {
  const toggleDay = (day: number) => {
    if (selected.includes(day)) {
      onChange(selected.filter(d => d !== day));
    } else {
      onChange([...selected, day].sort((a, b) => a - b));
    }
  };

  return (
    <HStack gap={1} flexWrap="wrap">
      {DAYS_OF_WEEK.map(day => (
        <Button
          key={day.value}
          size="sm"
          variant={selected.includes(day.value) ? 'solid' : 'outline'}
          colorPalette={selected.includes(day.value) ? 'purple' : 'gray'}
          onClick={() => toggleDay(day.value)}
          minW="44px"
        >
          {day.label}
        </Button>
      ))}
    </HStack>
  );
};

interface ShiftRequirementRowProps {
  shift: ShiftRequirement;
  index: number;
  onChange: (index: number, field: keyof ShiftRequirement, value: unknown) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const ShiftRequirementRow: React.FC<ShiftRequirementRowProps> = ({
                                                                   shift,
                                                                   index,
                                                                   onChange,
                                                                   onRemove,
                                                                   canRemove,
                                                                 }) => {
  const shiftInfo = SHIFT_TYPES.find(s => s.value === shift.shiftType);

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      bg="gray.50"
    >
      <Flex justify="space-between" align="flex-start" mb={3}>
        <HStack gap={2}>
          <Badge colorPalette="purple" variant="subtle">
            <LuClock size={12} style={{ marginRight: 4 }} />
            {shiftInfo?.time}
          </Badge>
        </HStack>
        {canRemove && (
          <IconButton
            aria-label="Remove shift"
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={() => onRemove(index)}
          >
            <LuTrash2 size={14} />
          </IconButton>
        )}
      </Flex>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm">Shift Type</Field.Label>
            <NativeSelect.Root size="sm">
              <NativeSelect.Field
                value={shift.shiftType}
                onChange={(e) => onChange(index, 'shiftType', e.target.value)}
              >
                {SHIFT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.time})
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Field.Root>
        </GridItem>

        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm">Guards Required</Field.Label>
            <Input
              size="sm"
              type="number"
              min={1}
              max={50}
              value={shift.guardsRequired}
              onChange={(e) => onChange(index, 'guardsRequired', parseInt(e.target.value) || 1)}
            />
          </Field.Root>
        </GridItem>

        <GridItem>
          <Field.Root>
            <Field.Label fontSize="sm">Guard Type</Field.Label>
            <NativeSelect.Root size="sm">
              <NativeSelect.Field
                value={shift.guardType}
                onChange={(e) => onChange(index, 'guardType', e.target.value)}
              >
                {GUARD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Field.Root>
        </GridItem>
      </Grid>
    </Box>
  );
};

// ============================================
// Main Component
// ============================================

const AddSiteModal: React.FC<AddSiteModalProps> = ({
                                                     isOpen,
                                                     onClose,
                                                     onSubmit,
                                                     clientName,
                                                     isSubmitting,
                                                   }) => {
  const [formData, setFormData] = useState<CreateSiteFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    }
  }, [isOpen]);

  // ============================================
  // Validation
  // ============================================

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Site details
    if (!formData.name.trim()) {
      newErrors.name = 'Site name is required';
    }

    // Address
    if (!formData.address.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.address.postCode.trim()) {
      newErrors.postCode = 'Post code is required';
    }

    // Geofence coordinates (if provided)
    if (formData.geofence.latitude || formData.geofence.longitude) {
      const lat = parseFloat(formData.geofence.latitude);
      const lng = parseFloat(formData.geofence.longitude);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Invalid latitude (-90 to 90)';
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Invalid longitude (-180 to 180)';
      }
    }

    // Requirements validation
    if (!formData.requirements.contractStart) {
      newErrors.contractStart = 'Contract start date is required';
    }

    if (!formData.requirements.isOngoing && !formData.requirements.contractEnd) {
      newErrors.contractEnd = 'Contract end date is required (or mark as ongoing)';
    }

    if (formData.requirements.contractStart && formData.requirements.contractEnd) {
      const start = new Date(formData.requirements.contractStart);
      const end = new Date(formData.requirements.contractEnd);
      if (end < start) {
        newErrors.contractEnd = 'End date must be after start date';
      }
    }

    if (formData.requirements.shiftsPerDay.length === 0) {
      newErrors.shiftsPerDay = 'At least one shift is required';
    }

    if (formData.requirements.daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'At least one operating day is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // Handlers
  // ============================================

  const handleChange = (field: string, value: unknown) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else if (field.startsWith('geofence.')) {
      const geoField = field.replace('geofence.', '');
      setFormData(prev => ({
        ...prev,
        geofence: { ...prev.geofence, [geoField]: value },
      }));
    } else if (field.startsWith('requirements.')) {
      const reqField = field.replace('requirements.', '');
      setFormData(prev => ({
        ...prev,
        requirements: { ...prev.requirements, [reqField]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear related error
    const errorKey = field.split('.').pop() || field;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleShiftChange = (index: number, field: keyof ShiftRequirement, value: unknown) => {
    const updatedShifts = [...formData.requirements.shiftsPerDay];
    updatedShifts[index] = { ...updatedShifts[index], [field]: value };
    handleChange('requirements.shiftsPerDay', updatedShifts);
  };

  const handleAddShift = () => {
    // Determine next available shift type
    const usedTypes = formData.requirements.shiftsPerDay.map(s => s.shiftType);
    const availableType = SHIFT_TYPES.find(t => !usedTypes.includes(t.value));

    const newShift: ShiftRequirement = {
      ...DEFAULT_SHIFT,
      shiftType: availableType?.value || 'Morning',
    };

    handleChange('requirements.shiftsPerDay', [...formData.requirements.shiftsPerDay, newShift]);
  };

  const handleRemoveShift = (index: number) => {
    const updatedShifts = formData.requirements.shiftsPerDay.filter((_, i) => i !== index);
    handleChange('requirements.shiftsPerDay', updatedShifts);
  };

  const handleOngoingChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        isOngoing: checked,
        contractEnd: checked ? '' : prev.requirements.contractEnd,
      },
    }));

    if (checked && errors.contractEnd) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.contractEnd;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error('Failed to create site:', err);
    }
  };

  // Calculate total guards
  const totalGuards = formData.requirements.shiftsPerDay.reduce(
    (sum, shift) => sum + shift.guardsRequired,
    0
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="700px" mx={4}>
          {/* Header */}
          <Box px={6} py={4} borderBottomWidth="1px" borderColor="gray.200">
            <HStack justify="space-between" align="center">
              <HStack gap={3}>
                <Box p={2} borderRadius="md" bg="purple.50" color="purple.600">
                  <LuMapPin size={20} />
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="gray.800">Add New Site</Text>
                  <Text fontSize="sm" color="gray.500">for {clientName}</Text>
                </Box>
              </HStack>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <LuX size={18} />
              </Button>
            </HStack>
          </Box>

          {/* Form */}
          <Box as="form" onSubmit={handleSubmit} px={6} py={4} maxH="70vh" overflowY="auto">
            <VStack gap={5} align="stretch">

              {/* ============================================ */}
              {/* Site Details */}
              {/* ============================================ */}
              <Fieldset.Root>
                <Fieldset.Legend fontWeight="semibold" color="gray.700" mb={3}>
                  Site Details
                </Fieldset.Legend>
                <Fieldset.Content>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <Field.Root invalid={!!errors.name}>
                        <Field.Label>
                          Site Name <Text as="span" color="red.500">*</Text>
                        </Field.Label>
                        <Input
                          placeholder="e.g., Main Reception, Warehouse A"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                        />
                        {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
                      </Field.Root>
                    </GridItem>
                    <GridItem>
                      <Field.Root>
                        <Field.Label>Site Type</Field.Label>
                        <NativeSelect.Root>
                          <NativeSelect.Field
                            value={formData.siteType}
                            onChange={(e) => handleChange('siteType', e.target.value)}
                          >
                            {SITE_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </NativeSelect.Field>
                        </NativeSelect.Root>
                      </Field.Root>
                    </GridItem>
                  </Grid>
                </Fieldset.Content>
              </Fieldset.Root>

              {/* ============================================ */}
              {/* Address */}
              {/* ============================================ */}
              <Fieldset.Root>
                <Fieldset.Legend fontWeight="semibold" color="gray.700" mb={3}>
                  Address
                </Fieldset.Legend>
                <Fieldset.Content>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <Field.Root invalid={!!errors.street}>
                        <Field.Label>
                          Street Address <Text as="span" color="red.500">*</Text>
                        </Field.Label>
                        <Input
                          placeholder="123 Security Street"
                          value={formData.address.street}
                          onChange={(e) => handleChange('address.street', e.target.value)}
                        />
                        {errors.street && <Field.ErrorText>{errors.street}</Field.ErrorText>}
                      </Field.Root>
                    </GridItem>
                    <GridItem>
                      <Field.Root invalid={!!errors.city}>
                        <Field.Label>
                          City <Text as="span" color="red.500">*</Text>
                        </Field.Label>
                        <Input
                          placeholder="London"
                          value={formData.address.city}
                          onChange={(e) => handleChange('address.city', e.target.value)}
                        />
                        {errors.city && <Field.ErrorText>{errors.city}</Field.ErrorText>}
                      </Field.Root>
                    </GridItem>
                    <GridItem>
                      <Field.Root invalid={!!errors.postCode}>
                        <Field.Label>
                          Post Code <Text as="span" color="red.500">*</Text>
                        </Field.Label>
                        <Input
                          placeholder="SW1A 1AA"
                          value={formData.address.postCode}
                          onChange={(e) => handleChange('address.postCode', e.target.value)}
                        />
                        {errors.postCode && <Field.ErrorText>{errors.postCode}</Field.ErrorText>}
                      </Field.Root>
                    </GridItem>
                  </Grid>
                </Fieldset.Content>
              </Fieldset.Root>

              {/* ============================================ */}
              {/* Coverage Requirements */}
              {/* ============================================ */}
              <Fieldset.Root>
                <Fieldset.Legend fontWeight="semibold" color="gray.700" mb={1}>
                  Coverage Requirements
                </Fieldset.Legend>
                <Text fontSize="sm" color="gray.500" mb={3}>
                  Define when and how many guards are needed at this site.
                </Text>
                <Fieldset.Content>
                  <VStack gap={4} align="stretch">

                    {/* Contract Period */}
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                      <GridItem>
                        <Field.Root invalid={!!errors.contractStart}>
                          <Field.Label>
                            Contract Start <Text as="span" color="red.500">*</Text>
                          </Field.Label>
                          <Input
                            type="date"
                            value={formData.requirements.contractStart}
                            onChange={(e) => handleChange('requirements.contractStart', e.target.value)}
                          />
                          {errors.contractStart && <Field.ErrorText>{errors.contractStart}</Field.ErrorText>}
                        </Field.Root>
                      </GridItem>
                      <GridItem>
                        <Field.Root invalid={!!errors.contractEnd}>
                          <Field.Label>Contract End</Field.Label>
                          <Input
                            type="date"
                            value={formData.requirements.contractEnd}
                            onChange={(e) => handleChange('requirements.contractEnd', e.target.value)}
                            disabled={formData.requirements.isOngoing}
                          />
                          {errors.contractEnd && <Field.ErrorText>{errors.contractEnd}</Field.ErrorText>}
                        </Field.Root>
                      </GridItem>
                      <GridItem colSpan={{ base: 1, md: 2 }}>
                        <Checkbox.Root
                          checked={formData.requirements.isOngoing}
                          onCheckedChange={(e) => handleOngoingChange(!!e.checked)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>Ongoing contract (no end date)</Checkbox.Label>
                        </Checkbox.Root>
                      </GridItem>
                    </Grid>

                    {/* Operating Days */}
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" mb={2}>
                        Operating Days <Text as="span" color="red.500">*</Text>
                      </Text>
                      <DaysOfWeekSelector
                        selected={formData.requirements.daysOfWeek}
                        onChange={(days) => handleChange('requirements.daysOfWeek', days)}
                      />
                      {errors.daysOfWeek && (
                        <Text fontSize="sm" color="red.500" mt={1}>{errors.daysOfWeek}</Text>
                      )}
                    </Box>

                    {/* Shifts Per Day */}
                    <Box>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontWeight="medium" fontSize="sm">
                          Shifts Per Day <Text as="span" color="red.500">*</Text>
                        </Text>
                        {totalGuards > 0 && (
                          <Badge colorPalette="green" variant="subtle">
                            <LuUsers size={12} style={{ marginRight: 4 }} />
                            {totalGuards} guard{totalGuards !== 1 ? 's' : ''} / day
                          </Badge>
                        )}
                      </Flex>

                      {errors.shiftsPerDay && (
                        <Text fontSize="sm" color="red.500" mb={2}>{errors.shiftsPerDay}</Text>
                      )}

                      <VStack gap={2} align="stretch">
                        {formData.requirements.shiftsPerDay.map((shift, index) => (
                          <ShiftRequirementRow
                            key={index}
                            shift={shift}
                            index={index}
                            onChange={handleShiftChange}
                            onRemove={handleRemoveShift}
                            canRemove={formData.requirements.shiftsPerDay.length > 1}
                          />
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddShift}
                          disabled={formData.requirements.shiftsPerDay.length >= 3}
                        >
                          <LuPlus size={16} style={{ marginRight: 4 }} />
                          Add Shift
                        </Button>
                      </VStack>
                    </Box>
                  </VStack>
                </Fieldset.Content>
              </Fieldset.Root>

              {/* ============================================ */}
              {/* Geofence (Optional) */}
              {/* ============================================ */}
              <Fieldset.Root>
                <Fieldset.Legend fontWeight="semibold" color="gray.700" mb={1}>
                  Geofence (Optional)
                </Fieldset.Legend>
                <Text fontSize="sm" color="gray.500" mb={3}>
                  GPS boundary for clock-in verification.
                </Text>
                <Fieldset.Content>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                    <GridItem>
                      <Field.Root invalid={!!errors.latitude}>
                        <Field.Label>Latitude</Field.Label>
                        <Input
                          placeholder="51.5074"
                          value={formData.geofence.latitude}
                          onChange={(e) => handleChange('geofence.latitude', e.target.value)}
                        />
                        {errors.latitude && <Field.ErrorText>{errors.latitude}</Field.ErrorText>}
                      </Field.Root>
                    </GridItem>
                    <GridItem>
                      <Field.Root invalid={!!errors.longitude}>
                        <Field.Label>Longitude</Field.Label>
                        <Input
                          placeholder="-0.1278"
                          value={formData.geofence.longitude}
                          onChange={(e) => handleChange('geofence.longitude', e.target.value)}
                        />
                        {errors.longitude && <Field.ErrorText>{errors.longitude}</Field.ErrorText>}
                      </Field.Root>
                    </GridItem>
                    <GridItem>
                      <Field.Root>
                        <Field.Label>Radius (metres)</Field.Label>
                        <Input
                          type="number"
                          min={50}
                          max={1000}
                          value={formData.geofence.radius}
                          onChange={(e) => handleChange('geofence.radius', e.target.value)}
                        />
                      </Field.Root>
                    </GridItem>
                  </Grid>
                </Fieldset.Content>
              </Fieldset.Root>

              {/* ============================================ */}
              {/* Site Contact */}
              {/* ============================================ */}
              <Fieldset.Root>
                <Fieldset.Legend fontWeight="semibold" color="gray.700" mb={1}>
                  Site Contact
                </Fieldset.Legend>
                <Fieldset.Content>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <GridItem>
                      <Field.Root>
                        <Field.Label>Contact Name</Field.Label>
                        <Input
                          placeholder="John Smith"
                          value={formData.contactName}
                          onChange={(e) => handleChange('contactName', e.target.value)}
                        />
                      </Field.Root>
                    </GridItem>
                    <GridItem>
                      <Field.Root>
                        <Field.Label>Contact Phone</Field.Label>
                        <Input
                          placeholder="020 1234 5678"
                          value={formData.contactPhone}
                          onChange={(e) => handleChange('contactPhone', e.target.value)}
                        />
                      </Field.Root>
                    </GridItem>
                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <Field.Root>
                        <Field.Label>Contact Email</Field.Label>
                        <Input
                          type="email"
                          placeholder="site.contact@example.com"
                          value={formData.contactEmail}
                          onChange={(e) => handleChange('contactEmail', e.target.value)}
                        />
                      </Field.Root>
                    </GridItem>
                  </Grid>
                </Fieldset.Content>
              </Fieldset.Root>

              {/* ============================================ */}
              {/* Special Instructions */}
              {/* ============================================ */}
              <Field.Root>
                <Field.Label>Special Instructions</Field.Label>
                <Textarea
                  placeholder="Access codes, parking info, emergency procedures..."
                  value={formData.specialInstructions}
                  onChange={(e) => handleChange('specialInstructions', e.target.value)}
                  rows={3}
                />
              </Field.Root>

            </VStack>
          </Box>

          {/* Footer */}
          <Box px={6} py={4} borderTopWidth="1px" borderColor="gray.200">
            <HStack justify="flex-end" gap={3}>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorPalette="purple"
                onClick={handleSubmit}
                loading={isSubmitting}
                loadingText="Creating..."
              >
                Create Site
              </Button>
            </HStack>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default AddSiteModal;