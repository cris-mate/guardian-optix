/**
 * Incident Reports Component
 *
 * Displays incident list with filtering and allows reporting new incidents.
 * Integrates ML-based severity prediction for intelligent form assistance.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Field,
  Input,
  NativeSelect,
  Textarea,
  SimpleGrid,
  Spinner,
  Alert,
  Flex,
  Collapsible,
  Separator,
  Icon,
} from '@chakra-ui/react';
import { LuBrain, LuSparkles } from 'react-icons/lu';
import { api } from '../../../utils/api';
import { useSeverityPrediction } from '../../../hooks/useSeverityPrediction';
import { Incident } from '../../../types/compliance.types';

// ============================================
// Types
// ============================================

type FilterStatus = 'all' | 'open' | 'under-review' | 'resolved' | 'closed';

type IncidentTypeValue =
  | 'security-breach'
  | 'theft'
  | 'vandalism'
  | 'trespassing'
  | 'suspicious-activity'
  | 'medical-emergency'
  | 'fire-alarm'
  | 'equipment-failure'
  | 'unauthorized-access'
  | 'property-damage'
  | 'assault'
  | 'other';

interface FormData {
  location: string;
  incidentType: IncidentTypeValue;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  witnesses: string;
}

// ============================================
// Constants
// ============================================

const INCIDENT_TYPES: { value: IncidentTypeValue; label: string }[] = [
  { value: 'security-breach', label: 'Security Breach' },
  { value: 'theft', label: 'Theft' },
  { value: 'vandalism', label: 'Vandalism' },
  { value: 'trespassing', label: 'Trespassing' },
  { value: 'suspicious-activity', label: 'Suspicious Activity' },
  { value: 'medical-emergency', label: 'Medical Emergency' },
  { value: 'fire-alarm', label: 'Fire Alarm' },
  { value: 'equipment-failure', label: 'Equipment Failure' },
  { value: 'unauthorized-access', label: 'Unauthorized Access' },
  { value: 'property-damage', label: 'Property Damage' },
  { value: 'assault', label: 'Assault' },
  { value: 'other', label: 'Other' },
];

const INITIAL_FORM_DATA: FormData = {
  location: '',
  incidentType: 'security-breach',
  severity: 'medium',
  description: '',
  witnesses: '',
};

// ============================================
// Component
// ============================================

const IncidentReports: React.FC = () => {
  // State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  // Severity prediction hook
  const {
    prediction,
    isLoading: isPredicting,
    fetchPrediction,
    clearPrediction,
  } = useSeverityPrediction();

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Auto-apply predicted severity when prediction changes
  useEffect(() => {
    if (prediction?.predictedSeverity) {
      setFormData((prev) => ({
        ...prev,
        severity: prediction.predictedSeverity,
      }));
    }
  }, [prediction]);

  // Clear prediction when form closes
  useEffect(() => {
    if (!showForm) {
      clearPrediction();
    }
  }, [showForm, clearPrediction]);

  // ============================================
  // Handlers
  // ============================================

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/compliance/incidents');
      setIncidents(response.data);
    } catch (err) {
      setError('Failed to load incidents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        witnesses: formData.witnesses
          .split(',')
          .map((w) => w.trim())
          .filter(Boolean),
      };
      await api.post('/compliance/incidents', payload);
      setShowForm(false);
      setFormData(INITIAL_FORM_DATA);
      clearPrediction();
      await fetchIncidents();
    } catch (err) {
      setError('Failed to submit incident report');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Trigger severity prediction when incident type changes
    if (name === 'incidentType' && value) {
      fetchPrediction(value as IncidentTypeValue);
    }
  };

  const handleApplyPrediction = () => {
    if (prediction?.predictedSeverity) {
      setFormData((prev) => ({
        ...prev,
        severity: prediction.predictedSeverity,
      }));
    }
  };

  // ============================================
  // Computed Values
  // ============================================

  const filteredIncidents =
    filter === 'all' ? incidents : incidents.filter((i) => i.status === filter);

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'blue',
      medium: 'orange',
      high: 'red',
      critical: 'red',
    };
    return colors[severity] || 'gray';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'blue',
      'under-review': 'orange',
      resolved: 'green',
      closed: 'gray',
    };
    return colors[status] || 'gray';
  };

  // ============================================
  // Render: Loading State
  // ============================================

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="gray.500">
          Loading incidents...
        </Text>
      </Box>
    );
  }

  // ============================================
  // Render: Main Component
  // ============================================

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={5}>
        <Heading as="h2" size="md" color="gray.800">
          Incident Reports
        </Heading>
        <Button
          colorPalette={showForm ? 'gray' : 'blue'}
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Report Incident'}
        </Button>
      </Flex>

      {/* Error Alert */}
      {error && (
        <Alert.Root status="error" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      {/* Incident Form */}
      <Collapsible.Root open={showForm}>
        <Collapsible.Content>
          <Box
            bg="gray.50"
            p={6}
            borderRadius="lg"
            mb={6}
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Heading as="h3" size="sm" mb={4} color="gray.700">
              New Incident Report
            </Heading>
            <form onSubmit={handleSubmit}>
              <VStack gap={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {/* Location Field */}
                  <Field.Root required>
                    <Field.Label fontSize="sm" color="gray.600">
                      Location
                    </Field.Label>
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Main Entrance, Building A"
                      bg="white"
                    />
                  </Field.Root>

                  {/* Incident Type Field */}
                  <Field.Root required>
                    <Field.Label fontSize="sm" color="gray.600">
                      Incident Type
                    </Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        name="incidentType"
                        value={formData.incidentType}
                        onChange={handleInputChange}
                        bg="white"
                      >
                        {INCIDENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Field.Root>

                  {/* Severity Field with AI Prediction */}
                  <Field.Root required>
                    <Field.Label fontSize="sm" color="gray.600">
                      <HStack gap={2}>
                        <Text>Severity</Text>
                        {isPredicting && <Spinner size="xs" color="blue.500" />}
                      </HStack>
                    </Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        name="severity"
                        value={formData.severity}
                        onChange={handleInputChange}
                        bg="white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>

                    {/* AI Prediction Suggestion */}
                    {prediction && !isPredicting && (
                      <Box
                        mt={2}
                        p={3}
                        bg="blue.50"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="blue.200"
                      >
                        <HStack justify="space-between" mb={1}>
                          <HStack gap={2}>
                            <Icon as={LuBrain} color="blue.600" />
                            <Text fontSize="sm" fontWeight="medium" color="blue.700">
                              AI Suggestion
                            </Text>
                          </HStack>
                          <Badge colorPalette="blue" size="sm">
                            {prediction.confidence}% confidence
                          </Badge>
                        </HStack>
                        <HStack justify="space-between" align="center">
                          <Text fontSize="sm" color="blue.800">
                            Recommended:{' '}
                            <Text as="span" fontWeight="bold" textTransform="uppercase">
                              {prediction.predictedSeverity}
                            </Text>
                          </Text>
                          {formData.severity !== prediction.predictedSeverity && (
                            <Button
                              size="xs"
                              colorPalette="blue"
                              variant="subtle"
                              onClick={handleApplyPrediction}
                            >
                              <Icon as={LuSparkles} mr={1} />
                              Apply
                            </Button>
                          )}
                        </HStack>
                        {prediction.basedOnCount > 0 && (
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Based on {prediction.basedOnCount} historical incidents
                          </Text>
                        )}
                      </Box>
                    )}
                  </Field.Root>

                  {/* Witnesses Field */}
                  <Field.Root>
                    <Field.Label fontSize="sm" color="gray.600">
                      Witnesses (comma-separated)
                    </Field.Label>
                    <Input
                      name="witnesses"
                      value={formData.witnesses}
                      onChange={handleInputChange}
                      placeholder="e.g., John Smith, Jane Doe"
                      bg="white"
                    />
                  </Field.Root>
                </SimpleGrid>

                {/* Description Field */}
                <Field.Root required>
                  <Field.Label fontSize="sm" color="gray.600">
                    Description
                  </Field.Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Provide detailed description of the incident..."
                    bg="white"
                  />
                </Field.Root>

                {/* Form Actions */}
                <HStack justify="flex-end" gap={3} pt={2}>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" colorPalette="blue">
                    Submit Report
                  </Button>
                </HStack>
              </VStack>
            </form>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>

      {/* Filter Controls */}
      <HStack mb={5} flexWrap="wrap" gap={2}>
        {(['all', 'open', 'under-review', 'resolved', 'closed'] as FilterStatus[]).map(
          (status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              colorPalette={filter === status ? 'blue' : 'gray'}
              variant={filter === status ? 'solid' : 'outline'}
            >
              {status.replace('-', ' ').toUpperCase()}
            </Button>
          )
        )}
      </HStack>

      {/* Incidents List */}
      <VStack gap={4} align="stretch">
        {filteredIncidents.length === 0 ? (
          <Box textAlign="center" py={10} color="gray.400">
            No incidents found
          </Box>
        ) : (
          filteredIncidents.map((incident) => (
            <Box
              key={incident._id}
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              p={5}
              transition="all 0.2s"
              _hover={{ shadow: 'md' }}
            >
              <HStack gap={3} mb={3} flexWrap="wrap">
                <Badge
                  colorPalette={getSeverityColor(incident.severity)}
                  variant="solid"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="sm"
                >
                  {incident.severity.toUpperCase()}
                </Badge>
                <Badge
                  colorPalette={getStatusColor(incident.status)}
                  variant="subtle"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="sm"
                  textTransform="capitalize"
                >
                  {incident.status.replace('-', ' ')}
                </Badge>
                <Text fontSize="xs" color="gray.500" ml="auto">
                  {new Date(incident.createdAt).toLocaleDateString()}
                </Text>
              </HStack>

              <Heading as="h4" size="sm" mb={2} textTransform="capitalize">
                {incident.incidentType.replace('-', ' ')}
              </Heading>
              <Text fontSize="sm" color="gray.500" mb={2}>
                📍 {incident.location}
              </Text>
              <Text fontSize="sm" color="gray.600" lineClamp={3}>
                {incident.description}
              </Text>

              <Separator my={4} />

              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="gray.500">
                  Reported by: {incident.reportedBy.fullName}
                </Text>
                <Button size="xs" variant="outline">
                  View Details
                </Button>
              </Flex>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
};

export default IncidentReports;