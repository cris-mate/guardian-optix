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
} from '@chakra-ui/react';
import { api } from '../../../utils/api';
import { Incident } from '../types/compliance.types';

type FilterStatus = 'all' | 'open' | 'under-review' | 'resolved' | 'closed';

const IncidentReports: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    incidentType: 'security-breach',
    severity: 'medium',
    description: '',
    witnesses: '',
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

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
        witnesses: formData.witnesses.split(',').map((w) => w.trim()).filter(Boolean),
      };
      await api.post('/compliance/incidents', payload);
      setShowForm(false);
      setFormData({
        location: '',
        incidentType: 'security-breach',
        severity: 'medium',
        description: '',
        witnesses: '',
      });
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
  };

  const filteredIncidents = filter === 'all'
    ? incidents
    : incidents.filter((i) => i.status === filter);

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

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="gray.500">Loading incidents...</Text>
      </Box>
    );
  }

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
          <Box bg="gray.50" p={6} borderRadius="lg" mb={6} borderWidth="1px" borderColor="gray.200">
            <Heading as="h3" size="sm" mb={4} color="gray.700">
              New Incident Report
            </Heading>
            <form onSubmit={handleSubmit}>
              <VStack gap={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Field.Root required>
                    <Field.Label fontSize="sm" color="gray.600">Location</Field.Label>
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Main Entrance, Building A"
                      bg="white"
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label fontSize="sm" color="gray.600">Incident Type</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        name="incidentType"
                        value={formData.incidentType}
                        onChange={handleInputChange}
                        bg="white"
                      >
                        <option value="security-breach">Security Breach</option>
                        <option value="injury">Injury</option>
                        <option value="property-damage">Property Damage</option>
                        <option value="unauthorized-access">Unauthorized Access</option>
                        <option value="equipment-failure">Equipment Failure</option>
                        <option value="policy-violation">Policy Violation</option>
                        <option value="other">Other</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Field.Root>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Field.Root required>
                    <Field.Label fontSize="sm" color="gray.600">Severity</Field.Label>
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
                  </Field.Root>
                  <Field.Root>
                    <Field.Label fontSize="sm" color="gray.600">Witnesses (comma-separated)</Field.Label>
                    <Input
                      name="witnesses"
                      value={formData.witnesses}
                      onChange={handleInputChange}
                      placeholder="e.g., John Smith, Jane Doe"
                      bg="white"
                    />
                  </Field.Root>
                </SimpleGrid>

                <Field.Root required>
                  <Field.Label fontSize="sm" color="gray.600">Description</Field.Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Provide detailed description of the incident..."
                    bg="white"
                  />
                </Field.Root>

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
        {(['all', 'open', 'under-review', 'resolved', 'closed'] as FilterStatus[]).map((status) => (
          <Button
            key={status}
            onClick={() => setFilter(status)}
            colorPalette={filter === status ? 'blue' : 'gray'}
            variant={filter === status ? 'solid' : 'outline'}
          >
            {status.replace('-', ' ').toUpperCase()}
          </Button>
        ))}
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