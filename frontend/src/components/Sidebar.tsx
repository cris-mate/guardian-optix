import { Box, Heading, VStack, Link } from '@chakra-ui/react';
import React from 'react';

export const Sidebar = () => {
  return (
    <Box
      as="aside"
      bg="#2D3748" // A slightly lighter dark color
      color="white"
      p={4}
      gridArea="sidebar" // Important for Grid layout
      height="100%"
    >
      <VStack align="stretch" gap={4}>
        <Heading size="md" mb={4}>Navigation</Heading>
        <Link>Dashboard</Link>
        <Link>Scheduling</Link>
        <Link>PersonnelManagement</Link>
        <Link>TaskManager</Link>
        <Link>PerformanceMonitoring</Link>
        <Link>Analytics</Link>
        <Link>Compliance</Link>
      </VStack>
    </Box>
  );
};