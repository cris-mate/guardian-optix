/**
 * AddSiteModal Component
 *
 * Modal form for creating a new site under a client.
 * Includes address, geofence configuration, and site contact details.
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
} from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';
import { LuMapPin, LuX } from 'react-icons/lu';

// ============================================
// Types
// ============================================

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
  'Warehouse',
  'Industrial',
  'Residential',
  'Construction',
  'Event Venue',
  'Hospital',
  'School',
  'Corporate Office',
  'Other',
];

const INITIAL_FORM_DATA: CreateSiteFormData = {
  name: '',
  siteType: 'Office',
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
};

// ============================================
// Component
// ============================================

const AddSiteModal: React.FC<AddSiteModalProps> = ({
                                                     isOpen,
                                                     onClose,
                                                     onSubmit,
                                                     clientName,
                                                     clientId,
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

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Site name is required';
    }
    if (!formData.address.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.address.postCode.trim()) {
      newErrors.postCode = 'Post code is required';
    }

    // Validate geofence coordinates if provided
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleChange = (field: string, value: string) => {
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
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear error on change
    if (errors[field.replace('address.', '').replace('geofence.', '')]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field.replace('address.', '').replace('geofence.', '')];
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="600px" mx={4}>
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
              {/* Site Details */}
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

              {/* Address */}
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
                          onChange={(e) => handleChange('address.postCode', e.target.value.toUpperCase())}
                        />
                        {errors.postCode && <Field.ErrorText>{errors.postCode}</Field.ErrorText>}
                      </Field.Root>
                    </GridItem>
                  </Grid>
                </Fieldset.Content>
              </Fieldset.Root>

              {/* Geofence (Optional) */}
              <Fieldset.Root>
                <Fieldset.Legend fontWeight="semibold" color="gray.700" mb={1}>
                  Geofence Configuration
                </Fieldset.Legend>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  Optional. Used for clock-in/out location verification.
                </Text>
                <Fieldset.Content>
                  <Grid templateColumns="repeat(3, 1fr)" gap={4}>
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
                        <Field.Label>Radius (m)</Field.Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={formData.geofence.radius}
                          onChange={(e) => handleChange('geofence.radius', e.target.value)}
                          min={10}
                          max={1000}
                        />
                      </Field.Root>
                    </GridItem>
                  </Grid>
                </Fieldset.Content>
              </Fieldset.Root>

              {/* Site Contact (Optional) */}
              <Fieldset.Root>
                <Fieldset.Legend fontWeight="semibold" color="gray.700" mb={1}>
                  Site Contact
                </Fieldset.Legend>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  Optional. On-site contact for emergencies.
                </Text>
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

              {/* Special Instructions */}
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