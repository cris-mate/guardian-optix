import React from 'react';
import { Box, Container, Flex, VStack, Text, Badge } from '@chakra-ui/react';
import { LuChartBar } from 'react-icons/lu';

const Analytics: React.FC = () => {
  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="center" align="center" minH="60vh">
        <VStack gap={6} textAlign="center">
          <Box p={4} borderRadius="full" bg="orange.50" color="orange.500">
            <LuChartBar size={48} />
          </Box>
          <VStack gap={2}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Analytics
            </Text>
            <Badge colorPalette="orange" variant="subtle" px={3} py={1}>
              Coming Soon
            </Badge>
          </VStack>
          <Text color="gray.500" maxW="md">
            Data-driven insights for security operations. Visualise trends,
            identify patterns, and make informed decisions with comprehensive reports.
          </Text>
          <VStack gap={1} color="gray.400" fontSize="sm">
            <Text>• Incident trend analysis</Text>
            <Text>• Workforce utilisation reports</Text>
            <Text>• Client site comparisons</Text>
            <Text>• Exportable PDF and CSV reports</Text>
          </VStack>
        </VStack>
      </Flex>
    </Container>
  );
};

export default Analytics;
