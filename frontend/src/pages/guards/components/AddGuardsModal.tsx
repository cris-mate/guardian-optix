/**
 * AddGuardsModal Component
 *
 * Modal form for adding new guards.
 * Uses Chakra UI v3 Dialog components.
 */

import React, { useState } from 'react';
import {
  Box,
  Dialog,
  Field,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  createListCollection,
  Flex,
  Select,
} from '@chakra-ui/react';
import { LuX, LuUserPlus } from 'react-icons/lu';
import { GuardsFormData, GuardType, SIALicenceType } from '../../../types/guards.types';

interface AddGuardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GuardsFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const guardTypeOptions = createListCollection({
  items: [
    { value: 'Static', label: 'Static' },
    { value: 'Mobile Patrol', label: 'Mobile Patrol' },
    { value: 'Close Protection', label: 'Close Protection' },
    { value: 'Dog Handler', label: 'Dog Handler' },
  ],
});

const licenceTypeOptions = createListCollection({
  items: [
    { value: 'Security Guard', label: 'Security Guard' },
    { value: 'Door Supervisor', label: 'Door Supervisor' },
    { value: 'Close Protection', label: 'Close Protection' },
    { value: 'CCTV Operator', label: 'CCTV Operator' },
    { value: 'Key Holder', label: 'Key Holder' },
  ],
});

// Initial form state
const initialFormData: GuardsFormData = {
  fullName: '',
  username: '',
  email: '',
  phoneNumber: '',
  postCode: '',
  role: 'Guard',
  guardType: undefined,
  siaLicenceNumber: '',
  siaLicenceType: undefined,
  siaLicenceExpiry: '',
};

const AddGuardsModal: React.FC<AddGuardsModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               onSubmit,
                                                               isSubmitting = false,
                                                             }) => {
  const [formData, setFormData] = useState<GuardsFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof GuardsFormData, string>>>({});

  // Reset form when modal closes
  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  // Handle input change
  const handleChange = (field: keyof GuardsFormData, value: string | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GuardsFormData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!formData.postCode.trim()) {
      newErrors.postCode = 'Postcode is required';
    }

    // Guard-specific validation
    if (formData.role === 'Guard') {
      if (!formData.guardType) {
        newErrors.guardType = 'Guard type is required';
      }
      if (!formData.siaLicenceNumber) {
        newErrors.siaLicenceNumber = 'SIA licence number is required';
      } else if (formData.siaLicenceNumber.length !== 16) {
        newErrors.siaLicenceNumber = 'SIA licence must be 16 digits';
      }
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
      console.error('Error submitting form:', err);
    }
  };

  const isGuard = formData.role === 'Guard';

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()} size="lg">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header borderBottomWidth="1px" borderColor="gray.200">
            <Flex justify="space-between" align="center">
              <HStack gap={2}>
                <LuUserPlus size={20} />
                <Text fontSize="lg" fontWeight="semibold">Add Guard</Text>
              </HStack>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm">
                  <LuX size={18} />
                </Button>
              </Dialog.CloseTrigger>
            </Flex>
          </Dialog.Header>

          <Dialog.Body py={6}>
            <VStack gap={6} align="stretch">
              {/* Personal Information */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={4}>
                  Personal Information
                </Text>
                <VStack gap={4}>
                  <Field.Root required invalid={!!errors.fullName}>
                    <Field.Label>Full Name</Field.Label>
                    <Input
                      placeholder="John Smith"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                    />
                    {errors.fullName && <Field.ErrorText>{errors.fullName}</Field.ErrorText>}
                  </Field.Root>

                  <HStack gap={4} width="100%">
                    <Field.Root required invalid={!!errors.email}>
                      <Field.Label>Email</Field.Label>
                      <Input
                        type="email"
                        placeholder="john.smith@guardianoptix.co.uk"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                      />
                      {errors.email && <Field.ErrorText>{errors.email}</Field.ErrorText>}
                    </Field.Root>
                    <Field.Root required invalid={!!errors.phoneNumber}>
                      <Field.Label>Phone Number</Field.Label>
                      <Input
                        type="tel"
                        placeholder="07700 900123"
                        value={formData.phoneNumber}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      />
                      {errors.phoneNumber && <Field.ErrorText>{errors.phoneNumber}</Field.ErrorText>}
                    </Field.Root>
                  </HStack>

                  <HStack gap={4} width="100%">
                    <Field.Root required invalid={!!errors.postCode}>
                      <Field.Label>Postcode</Field.Label>
                      <Input
                        placeholder="SW1A 1AA"
                        value={formData.postCode}
                        onChange={(e) => handleChange('postCode', e.target.value.toUpperCase())}
                        maxLength={8}
                      />
                      {errors.postCode && <Field.ErrorText>{errors.postCode}</Field.ErrorText>}
                    </Field.Root>
                  </HStack>
                </VStack>
              </Box>

              {/* Employment Details */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={4}>
                  Employment Details
                </Text>
                <VStack gap={4}>
                  <HStack gap={4} width="100%">
                    <Field.Root required invalid={!!errors.guardType}>
                      <Field.Label>Guard Type</Field.Label>
                      <Select.Root
                        collection={guardTypeOptions}
                        value={formData.guardType ? [formData.guardType] : []}
                        onValueChange={(e) => handleChange('guardType', e.value[0] as GuardType)}
                      >
                        <Select.Trigger>
                          <Select.ValueText placeholder="Select type" />
                        </Select.Trigger>
                        <Select.Content>
                          {guardTypeOptions.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                      {errors.guardType && <Field.ErrorText>{errors.guardType}</Field.ErrorText>}
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Badge Number</Field.Label>
                      <Input
                        placeholder="GO-2024-001"
                        value={formData.siaLicenceNumber || ''}
                        onChange={(e) => handleChange('siaLicenceNumber', e.target.value)}
                      />
                    </Field.Root>
                  </HStack>
                </VStack>
              </Box>

              {/* SIA Licence (Guards only) */}
              {isGuard && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={4}>
                    SIA Licence
                  </Text>
                  <VStack gap={4}>
                    <HStack gap={4} width="100%">
                      <Field.Root required invalid={!!errors.siaLicenceNumber}>
                        <Field.Label>Licence Number</Field.Label>
                        <Input
                          placeholder="1234567890123456"
                          value={formData.siaLicenceNumber || ''}
                          onChange={(e) => handleChange('siaLicenceNumber', e.target.value.replace(/\D/g, '').slice(0, 16))}
                          maxLength={16}
                          fontFamily="mono"
                        />
                        {errors.siaLicenceNumber && <Field.ErrorText>{errors.siaLicenceNumber}</Field.ErrorText>}
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>Licence Type</Field.Label>
                        <Select.Root
                          collection={licenceTypeOptions}
                          value={formData.siaLicenceType ? [formData.siaLicenceType] : []}
                          onValueChange={(e) => handleChange('siaLicenceType', e.value[0] as SIALicenceType)}
                        >
                          <Select.Trigger>
                            <Select.ValueText placeholder="Select type" />
                          </Select.Trigger>
                          <Select.Content>
                            {licenceTypeOptions.items.map((item) => (
                              <Select.Item key={item.value} item={item}>
                                {item.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      </Field.Root>
                    </HStack>
                    <Field.Root>
                      <Field.Label>Expiry Date</Field.Label>
                      <Input
                        type="date"
                        value={formData.siaLicenceExpiry || ''}
                        onChange={(e) => handleChange('siaLicenceExpiry', e.target.value)}
                      />
                    </Field.Root>
                  </VStack>
                </Box>
              )}
            </VStack>
          </Dialog.Body>

          <Dialog.Footer borderTopWidth="1px" borderColor="gray.200">
            <HStack gap={3}>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                colorPalette="blue"
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Add Guard
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default AddGuardsModal;