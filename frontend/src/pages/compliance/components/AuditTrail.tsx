import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Circle,
  Button,
  Spinner,
  Alert,
  Badge,
  Separator,
} from '@chakra-ui/react';
import { api } from '../../../utils/api';

interface AuditEntry {
  _id: string;
  action: string;
  performedBy: { _id: string; fullName: string };
  targetType: string;
  details: string;
  timestamp: string;
}

const AuditTrail: React.FC = () => {
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    fetchAuditTrail();
  }, [page]);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/compliance/audit?page=${page}&limit=${limit}`);

      if (page === 1) {
        setAudits(response.data);
      } else {
        setAudits((prev) => [...prev, ...response.data]);
      }

      setHasMore(response.data.length === limit);
    } catch (err) {
      setError('Failed to load audit trail');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string): string => {
    const icons: Record<string, string> = {
      'document-viewed': '👁️',
      'document-signed': '✍️',
      'cert-uploaded': '📤',
      'cert-verified': '✅',
      'incident-reported': '🚨',
      'checklist-completed': '☑️',
      'policy-acknowledged': '📋',
    };
    return icons[action] || '📝';
  };

  const getActionLabel = (action: string): string => {
    return action
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && page === 1) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="gray.500">Loading audit trail...</Text>
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
      <Box mb={5}>
        <Heading as="h2" size="md" color="gray.800">
          Compliance Audit Trail
        </Heading>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Complete log of all compliance-related activities
        </Text>
      </Box>

      {/* Audit List */}
      <VStack gap={0} align="stretch" separator={<Separator />}>
        {audits.length === 0 ? (
          <Box textAlign="center" py={10} color="gray.400">
            No audit entries found
          </Box>
        ) : (
          audits.map((entry) => (
            <HStack key={entry._id} py={4} gap={4} align="flex-start">
              <Circle size="40px" bg="gray.100" fontSize="lg">
                {getActionIcon(entry.action)}
              </Circle>
              <Box flex={1}>
                <HStack gap={2} mb={1}>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                    {getActionLabel(entry.action)}
                  </Text>
                  <Badge
                    fontSize="xs"
                    colorPalette="gray"
                    variant="subtle"
                    borderRadius="sm"
                  >
                    {entry.targetType}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  {entry.details}
                </Text>
                <HStack gap={4} fontSize="xs" color="gray.400">
                  <Text>By: {entry.performedBy?.fullName || 'System'}</Text>
                  <Text>{formatTimestamp(entry.timestamp)}</Text>
                </HStack>
              </Box>
            </HStack>
          ))
        )}
      </VStack>

      {/* Load More */}
      {hasMore && audits.length > 0 && (
        <Button
          variant="ghost"
          width="100%"
          mt={4}
          onClick={() => setPage((prev) => prev + 1)}
          loading={loading}
          loadingText="Loading..."
          borderStyle="dashed"
          borderWidth="1px"
          borderColor="gray.200"
        >
          Load More
        </Button>
      )}
    </Box>
  );
};

export default AuditTrail;