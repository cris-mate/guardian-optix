import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  InputGroup,
  Button,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  Link,
  Spinner,
  Alert,
  Flex,
} from '@chakra-ui/react';
import { api } from '../../../utils/api';

interface ComplianceDocument {
  _id: string;
  title: string;
  category: 'policy' | 'procedure' | 'manual' | 'form' | 'certificate';
  description: string;
  fileUrl: string;
  version: string;
  lastUpdated: string;
  requiresAcknowledgment: boolean;
  acknowledgedBy: string[];
  uploadedBy: { fullName: string };
}

type CategoryFilter = 'all' | ComplianceDocument['category'];

const DocumentLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    void fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/compliance/documents');
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (docId: string) => {
    try {
      await api.post(`/compliance/documents/${docId}/acknowledge`);
      await fetchDocuments();
    } catch (err) {
      setError('Failed to acknowledge document');
    }
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      policy: '📜',
      procedure: '📋',
      manual: '📖',
      form: '📄',
      certificate: '🏆',
    };
    return icons[category] || '📁';
  };

  const getCategoryLabel = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesFilter = filter === 'all' || doc.category === filter;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories: CategoryFilter[] = ['all', 'policy', 'procedure', 'manual', 'form', 'certificate'];

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="gray.500">Loading documents...</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={5}>
        <Heading as="h2" size="md" color="gray.800">
          Document Library
        </Heading>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Access policies, procedures, and compliance documentation
        </Text>
      </Box>

      {error && (
        <Alert.Root status="error" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      {/* Search and Filter */}
      <Flex gap={4} mb={6} flexWrap="wrap">
        <InputGroup maxW={{ base: '100%', md: '300px' }}>
          <Input
            placeholder="🔍 Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="white"
          />
        </InputGroup>
        <HStack mb={5} flexWrap="wrap" gap={2}>
          {categories.map((cat) => (
            <Button
              key={cat}
              onClick={() => setFilter(cat)}
              colorPalette={filter === cat ? 'blue' : 'gray'}
              variant={filter === cat ? 'solid' : 'outline'}
            >
              {cat === 'all' ? 'All' : getCategoryLabel(cat)}
            </Button>
          ))}
        </HStack>
      </Flex>

      {/* Documents Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
        {filteredDocuments.length === 0 ? (
          <Box gridColumn="1 / -1" textAlign="center" py={10} color="gray.400">
            No documents found
          </Box>
        ) : (
          filteredDocuments.map((doc) => (
            <Box
              key={doc._id}
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              p={5}
              transition="all 0.2s"
              _hover={{ shadow: 'md' }}
            >
              <VStack align="stretch" gap={3}>
                <Text fontSize="2xl">{getCategoryIcon(doc.category)}</Text>
                <Box>
                  <Heading as="h4" size="sm" mb={1}>
                    {doc.title}
                  </Heading>
                  <Badge
                    fontSize="xs"
                    colorPalette="gray"
                    variant="subtle"
                    borderRadius="sm"
                  >
                    {getCategoryLabel(doc.category)}
                  </Badge>
                </Box>
                <Text fontSize="sm" color="gray.500" lineClamp={2}>
                  {doc.description}
                </Text>
                <HStack fontSize="xs" color="gray.400" gap={3}>
                  <Text>v{doc.version}</Text>
                  <Text>Updated: {new Date(doc.lastUpdated).toLocaleDateString()}</Text>
                </HStack>
                <HStack pt={2} borderTopWidth="1px" borderColor="gray.100" gap={2}>
                  <Link
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="xs" colorPalette="blue">
                      View
                    </Button>
                  </Link>
                  <Button size="xs" variant="outline">
                    Download
                  </Button>
                  {doc.requiresAcknowledgment && (
                    <Button
                      size="xs"
                      colorPalette="green"
                      variant="outline"
                      onClick={() => handleAcknowledge(doc._id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </HStack>
              </VStack>
            </Box>
          ))
        )}
      </SimpleGrid>
    </Box>
  );
};

export default DocumentLibrary;
