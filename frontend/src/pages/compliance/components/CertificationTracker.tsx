import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  HStack,
  Button,
  Table,
  Badge,
  Text,
  Spinner,
  Alert,
  Flex,
} from '@chakra-ui/react';
import { api } from '../../../utils/api';
import { Certification } from '../../../types/compliance.types';

type FilterType = 'all' | 'valid' | 'expiring-soon' | 'expired';

const CertificationTracker: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        const response = await api.get('/compliance/certifications');
        setCertifications(response.data);
      } catch (err) {
        setError('Failed to load certifications');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void fetchCertifications();
  }, []);

  const filteredCerts = filter === 'all'
    ? certifications
    : certifications.filter(c => c.status === filter);

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { colorPalette: string; label: string }> = {
      'valid': { colorPalette: 'green', label: 'Valid' },
      'expiring-soon': { colorPalette: 'orange', label: 'Expiring Soon' },
      'expired': { colorPalette: 'red', label: 'Expired' },
    };
    return config[status] || config['valid'];
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="gray.500">Loading certifications...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error" borderRadius="md">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{error}</Alert.Title>
        </Alert.Content>
      </Alert.Root>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        mb={5}
        flexWrap="wrap"
        gap={4}
      >
        <Heading as="h2" size="md" color="gray.800">
          Guard Certifications
        </Heading>
        <HStack mb={5} flexWrap="wrap" gap={2}>
          {(['all', 'valid', 'expiring-soon', 'expired'] as FilterType[]).map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              colorPalette={filter === f ? 'blue' : 'gray'}
              variant={filter === f ? 'solid' : 'outline'}
            >
              {f.replace('-', ' ').toUpperCase()}
            </Button>
          ))}
        </HStack>
      </Flex>

      {/* Table */}
      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader fontSize="xs" color="gray.500" textTransform="uppercase">Guard</Table.ColumnHeader>
              <Table.ColumnHeader fontSize="xs" color="gray.500" textTransform="uppercase">Certification Type</Table.ColumnHeader>
              <Table.ColumnHeader fontSize="xs" color="gray.500" textTransform="uppercase">License Number</Table.ColumnHeader>
              <Table.ColumnHeader fontSize="xs" color="gray.500" textTransform="uppercase">Expiry Date</Table.ColumnHeader>
              <Table.ColumnHeader fontSize="xs" color="gray.500" textTransform="uppercase">Status</Table.ColumnHeader>
              <Table.ColumnHeader fontSize="xs" color="gray.500" textTransform="uppercase">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredCerts.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} textAlign="center" py={8} color="gray.400">
                  No certifications found
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredCerts.map((cert) => {
                const badge = getStatusBadge(cert.status);
                const daysLeft = getDaysUntilExpiry(cert.expiryDate);
                return (
                  <Table.Row
                    key={cert._id}
                    bg={cert.status === 'expired' ? 'red.50' : 'transparent'}
                    _hover={{ bg: 'gray.50' }}
                  >
                    <Table.Cell fontWeight="medium">{cert.userId.fullName}</Table.Cell>
                    <Table.Cell>{cert.certType}</Table.Cell>
                    <Table.Cell>{cert.certNumber}</Table.Cell>
                    <Table.Cell>
                      {new Date(cert.expiryDate).toLocaleDateString()}
                      {daysLeft > 0 && daysLeft <= 30 && (
                        <Text as="span" color="orange.500" fontSize="xs" ml={2}>
                          ({daysLeft} days left)
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={badge.colorPalette} borderRadius="full" px={2}>
                        {badge.label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={2}>
                        <Button size="xs" variant="ghost">View</Button>
                        <Button size="xs" colorPalette="blue">Renew</Button>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
};

export default CertificationTracker;