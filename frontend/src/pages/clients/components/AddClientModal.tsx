/**
 * AddClientModal Component
 *
 * Simplified 2-step form for adding a new client:
 * 1. Company Info + Address
 * 2. Primary Contact
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Heading,
  Spinner,
} from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { LuX, LuBuilding2, LuUser } from 'react-icons/lu';
import type { CreateClientPayload, ClientStatus } from '../types/client.types';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateClientPayload) => Promise<any>;
  isSubmitting: boolean;
}

const initialFormState: CreateClientPayload = {
  companyName: '',
  tradingName: '',
  status: 'prospect',
  industry: '',
  address: { street: '', city: '', postCode: '', country: 'United Kingdom' },
  primaryContact: { firstName: '', lastName: '', email: '', phone: '', jobTitle: '' },
  notes: '',
};

const industryOptions = [
  'Real Estate', 'Retail', 'Hospitality', 'Healthcare', 'Education',
  'Financial Services', 'Manufacturing', 'Technology', 'Entertainment',
  'Government', 'Cultural Institution', 'Aviation', 'Property Management', 'Other',
];

const statusOptions: { value: ClientStatus; label: string }[] = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState<CreateClientPayload>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const handleChange = (section: 'root' | 'address' | 'primaryContact', field: string, value: string) => {
    if (section === 'root') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (section === 'address') {
      setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, primaryContact: { ...prev.primaryContact, [field]: value } }));
    }
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!formData.companyName.trim()) errs.companyName = 'Required';
      if (!formData.address.street.trim()) errs.street = 'Required';
      if (!formData.address.city.trim()) errs.city = 'Required';
      if (!formData.address.postCode.trim()) errs.postCode = 'Required';
    }
    if (s === 2) {
      if (!formData.primaryContact.firstName.trim()) errs.firstName = 'Required';
      if (!formData.primaryContact.lastName.trim()) errs.lastName = 'Required';
      if (!formData.primaryContact.email.trim()) errs.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryContact.email)) errs.email = 'Invalid email';
      if (!formData.primaryContact.phone.trim()) errs.phone = 'Required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validate(1)) setStep(2); };
  const handleBack = () => setStep(1);

  const handleSubmit = async () => {
    if (!validate(2)) return;
    try {
      await onSubmit(formData);
      setFormData(initialFormState);
      setStep(1);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setErrors({});
    setStep(1);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="550px">
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" p={6} borderBottomWidth="1px" borderColor="gray.200">
            <Box>
              <Heading size="md">Add New Client</Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>Step {step} of 2</Text>
            </Box>
            <Button variant="ghost" size="sm" onClick={handleClose}><LuX size={18} /></Button>
          </Box>

          {/* Step Indicator */}
          <Box px={6} py={3} bg="gray.50">
            <HStack gap={0}>
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <Box w={8} h={8} borderRadius="full" bg={step >= s ? 'blue.500' : 'gray.300'} color="white" display="flex" alignItems="center" justifyContent="center" fontSize="sm" fontWeight="bold">
                    {s}
                  </Box>
                  {s < 2 && <Box flex={1} h="2px" bg={step > s ? 'blue.500' : 'gray.300'} />}
                </React.Fragment>
              ))}
            </HStack>
            <HStack justify="space-between" mt={2}>
              <Text fontSize="xs" color={step >= 1 ? 'blue.600' : 'gray.500'}>Company & Address</Text>
              <Text fontSize="xs" color={step >= 2 ? 'blue.600' : 'gray.500'}>Primary Contact</Text>
            </HStack>
          </Box>

          {/* Form */}
          <Box p={6} maxH="380px" overflowY="auto">
            {step === 1 && (
              <VStack gap={4} align="stretch">
                <HStack gap={2} color="blue.600" mb={2}>
                  <LuBuilding2 size={20} />
                  <Text fontWeight="semibold">Company Information</Text>
                </HStack>

                <Field.Root invalid={!!errors.companyName}>
                  <Field.Label>Company Name *</Field.Label>
                  <Input placeholder="e.g., Acme Security Ltd" value={formData.companyName} onChange={(e) => handleChange('root', 'companyName', e.target.value)} />
                  {errors.companyName && <Field.ErrorText>{errors.companyName}</Field.ErrorText>}
                </Field.Root>

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Field.Root>
                      <Field.Label>Trading Name</Field.Label>
                      <Input placeholder="If different" value={formData.tradingName} onChange={(e) => handleChange('root', 'tradingName', e.target.value)} />
                    </Field.Root>
                  </GridItem>
                  <GridItem>
                    <Field.Root>
                      <Field.Label>Status</Field.Label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleChange('root', 'status', e.target.value)}
                        style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}
                      >
                        {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </Field.Root>
                  </GridItem>
                </Grid>

                <Field.Root>
                  <Field.Label>Industry</Field.Label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleChange('root', 'industry', e.target.value)}
                    style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: 'white' }}
                  >
                    <option value="">Select industry...</option>
                    {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field.Root>

                <Field.Root invalid={!!errors.street}>
                  <Field.Label>Street Address *</Field.Label>
                  <Input placeholder="e.g., 123 Main Street" value={formData.address.street} onChange={(e) => handleChange('address', 'street', e.target.value)} />
                  {errors.street && <Field.ErrorText>{errors.street}</Field.ErrorText>}
                </Field.Root>

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Field.Root invalid={!!errors.city}>
                      <Field.Label>City *</Field.Label>
                      <Input placeholder="e.g., London" value={formData.address.city} onChange={(e) => handleChange('address', 'city', e.target.value)} />
                      {errors.city && <Field.ErrorText>{errors.city}</Field.ErrorText>}
                    </Field.Root>
                  </GridItem>
                  <GridItem>
                    <Field.Root invalid={!!errors.postCode}>
                      <Field.Label>Post Code *</Field.Label>
                      <Input placeholder="e.g., EC1A 1BB" value={formData.address.postCode} onChange={(e) => handleChange('address', 'postCode', e.target.value)} />
                      {errors.postCode && <Field.ErrorText>{errors.postCode}</Field.ErrorText>}
                    </Field.Root>
                  </GridItem>
                </Grid>
              </VStack>
            )}

            {step === 2 && (
              <VStack gap={4} align="stretch">
                <HStack gap={2} color="blue.600" mb={2}>
                  <LuUser size={20} />
                  <Text fontWeight="semibold">Primary Contact</Text>
                </HStack>

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Field.Root invalid={!!errors.firstName}>
                      <Field.Label>First Name *</Field.Label>
                      <Input placeholder="John" value={formData.primaryContact.firstName} onChange={(e) => handleChange('primaryContact', 'firstName', e.target.value)} />
                      {errors.firstName && <Field.ErrorText>{errors.firstName}</Field.ErrorText>}
                    </Field.Root>
                  </GridItem>
                  <GridItem>
                    <Field.Root invalid={!!errors.lastName}>
                      <Field.Label>Last Name *</Field.Label>
                      <Input placeholder="Smith" value={formData.primaryContact.lastName} onChange={(e) => handleChange('primaryContact', 'lastName', e.target.value)} />
                      {errors.lastName && <Field.ErrorText>{errors.lastName}</Field.ErrorText>}
                    </Field.Root>
                  </GridItem>
                </Grid>

                <Field.Root>
                  <Field.Label>Job Title</Field.Label>
                  <Input placeholder="e.g., Security Manager" value={formData.primaryContact.jobTitle} onChange={(e) => handleChange('primaryContact', 'jobTitle', e.target.value)} />
                </Field.Root>

                <Field.Root invalid={!!errors.email}>
                  <Field.Label>Email *</Field.Label>
                  <Input type="email" placeholder="john.smith@company.com" value={formData.primaryContact.email} onChange={(e) => handleChange('primaryContact', 'email', e.target.value)} />
                  {errors.email && <Field.ErrorText>{errors.email}</Field.ErrorText>}
                </Field.Root>

                <Field.Root invalid={!!errors.phone}>
                  <Field.Label>Phone *</Field.Label>
                  <Input placeholder="+44 20 1234 5678" value={formData.primaryContact.phone} onChange={(e) => handleChange('primaryContact', 'phone', e.target.value)} />
                  {errors.phone && <Field.ErrorText>{errors.phone}</Field.ErrorText>}
                </Field.Root>

                <Field.Root>
                  <Field.Label>Notes</Field.Label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('root', 'notes', e.target.value)}
                    placeholder="Any notes about this client..."
                    style={{ width: '100%', minHeight: '60px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', resize: 'vertical' }}
                  />
                </Field.Root>
              </VStack>
            )}
          </Box>

          {/* Footer */}
          <Box display="flex" justifyContent="space-between" p={6} borderTopWidth="1px" borderColor="gray.200" bg="gray.50">
            <Button variant="outline" onClick={step === 1 ? handleClose : handleBack}>
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            {step < 2 ? (
              <Button colorPalette="blue" onClick={handleNext}>Next</Button>
            ) : (
              <Button colorPalette="blue" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <><Spinner size="sm" mr={2} />Creating...</> : 'Create Client'}
              </Button>
            )}
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default AddClientModal;