import React from 'react';
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {usePageTitle} from "../context/PageContext";
import { Box, Heading, Text, VStack } from '@chakra-ui/react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { setTitle } = usePageTitle();

  // Set the title for this page when the component loads
  useEffect(() => {
    setTitle('Dashboard');
  }, [setTitle]);

  return (
    <VStack gap={3} align="stretch">
      <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
        <Heading as="h1" size="xl">Welcome to your Dashboard, {user?.username || 'User'}!</Heading>
        <Text mt={2} color="gray.600">Here is a summary of your operations.</Text>
      </Box>

      {/* Add other dashboard widgets and content here */}
      <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
        <Text>Another dashboard section...</Text>
      </Box>
    </VStack>
  );
};

export default Dashboard;
