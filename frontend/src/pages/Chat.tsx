import React from 'react';
import { Box, Container, Flex, VStack, Text, Badge } from '@chakra-ui/react';
import { LuMessageSquare } from 'react-icons/lu';

const Chat: React.FC = () => {
  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="center" align="center" minH="60vh">
        <VStack gap={6} textAlign="center">
          <Box p={4} borderRadius="full" bg="blue.50" color="blue.500">
            <LuMessageSquare size={48} />
          </Box>
          <VStack gap={2}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Team Chat
            </Text>
            <Badge colorPalette="blue" variant="subtle" px={3} py={1}>
              Coming Soon
            </Badge>
          </VStack>
          <Text color="gray.500" maxW="md">
            Real-time messaging for security teams.
            Communicate with officers
            on-site, share updates, and coordinate shift handovers seamlessly.
          </Text>
          <VStack gap={1} color="gray.400" fontSize="sm">
            <Text>• Direct and group messaging</Text>
            <Text>• Shift-based channels</Text>
            <Text>• File and image sharing</Text>
            <Text>• Message read receipts</Text>
          </VStack>
        </VStack>
      </Flex>
    </Container>
  );
};

export default Chat;