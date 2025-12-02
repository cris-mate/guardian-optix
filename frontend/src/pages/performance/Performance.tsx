import React from 'react';
import { Box, Container, Flex, VStack, Text, Badge } from '@chakra-ui/react';
import { LuActivity } from 'react-icons/lu';

const Performance: React.FC = () => {
  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="center" align="center" minH="60vh">
        <VStack gap={6} textAlign="center">
          <Box p={4} borderRadius="full" bg="purple.50" color="purple.500">
            <LuActivity size={48} />
          </Box>
          <VStack gap={2}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Performance Monitoring
            </Text>
            <Badge colorPalette="purple" variant="subtle" px={3} py={1}>
              Coming Soon
            </Badge>
          </VStack>
          <Text color="gray.500" maxW="md">
            Track and evaluate security officer performance.
            Monitor patrol, completion rates, response times, and compliance metrics in real-time.
          </Text>
          <VStack gap={1} color="gray.400" fontSize="sm">
            <Text>• Patrol completion tracking</Text>
            <Text>• Incident response metrics</Text>
            <Text>• Attendance and punctuality scores</Text>
            <Text>• Individual and team KPIs</Text>
          </VStack>
        </VStack>
      </Flex>
    </Container>
  );
};

export default Performance;
