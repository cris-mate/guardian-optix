import React from 'react';
import { Box, Container, Flex, VStack, Text, Badge } from '@chakra-ui/react';
import { LuClock } from 'react-icons/lu';

const TimeClock: React.FC = () => {
  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="center" align="center" minH="60vh">
        <VStack gap={6} textAlign="center">
          <Box p={4} borderRadius="full" bg="green.50" color="green.500">
            <LuClock size={48} />
          </Box>
          <VStack gap={2}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Time Clock
            </Text>
            <Badge colorPalette="green" variant="subtle" px={3} py={1}>
              Coming Soon
            </Badge>
          </VStack>
          <Text color="gray.500" maxW="md">
            Digital time tracking for security officers.
            Clock in/out with
            GPS verification, manage breaks, and generate accurate timesheets.
          </Text>
          <VStack gap={1} color="gray.400" fontSize="sm">
            <Text>• GPS-verified clock in/out</Text>
            <Text>• Break management</Text>
            <Text>• Overtime tracking</Text>
            <Text>• Timesheet export for payroll</Text>
          </VStack>
        </VStack>
      </Flex>
    </Container>
  );
};

export default TimeClock;