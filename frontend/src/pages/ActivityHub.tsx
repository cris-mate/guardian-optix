import React, {useEffect} from 'react';
import {usePageTitle} from "../context/PageContext";
import {Box, Heading, Text, VStack} from "@chakra-ui/react";

export const ActivityHub: React.FC = () => {
  const { setTitle } = usePageTitle();

  // Set the title for this page when the component loads
  useEffect(() => {
    setTitle('Dashboard');
  }, [setTitle]);

  return (
    <VStack gap={3} align="stretch">
      <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
        <Heading as="h1" size="xl">Activity Logs</Heading>
        <Text mt={2} color="gray.600">Here are your most recent activities.</Text>
      </Box>

      {/* Add other dashboard widgets and content here */}
      <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
        <Text>Another section...</Text>
      </Box>
    </VStack>
  );
};

export default ActivityHub;