/**
 * BroadcastModal Component
 *
 * Placeholder for sending broadcast messages to guards.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Textarea,
  Icon,
  Badge,
  Dialog,
} from '@chakra-ui/react';
import { LuMessageSquare, LuUsers, LuSend, LuInfo } from 'react-icons/lu';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    console.log('Broadcasting:', message);
    onClose();
    setMessage('');
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(details) => !details.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="lg">
          <Dialog.Header>
            <Dialog.Title>
              <HStack gap={2}>
                <Icon as={LuMessageSquare} color="teal.500" />
                <Text>Broadcast Message</Text>
              </HStack>
            </Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} align="stretch">
              <Box bg="teal.50" borderRadius="md" p={4} borderLeftWidth="4px" borderColor="teal.400">
                <HStack gap={2}>
                  <Icon as={LuInfo} color="teal.600" />
                  <Text fontSize="sm" color="teal.700">
                    Messages will be sent to all on-duty guards via push notification.
                  </Text>
                </HStack>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>Recipients</Text>
                <HStack>
                  <Icon as={LuUsers} color="gray.400" />
                  <Text fontSize="sm" color="gray.500">All Active Guards</Text>
                  <Badge colorPalette="blue" variant="subtle">Coming Soon</Badge>
                </HStack>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>Message</Text>
                <Textarea
                  placeholder="Type your broadcast message..."
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                  rows={4}
                />
                <Text fontSize="xs" color="gray.400" mt={1} textAlign="right">
                  {message.length}/500 characters
                </Text>
              </Box>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <HStack gap={3}>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button colorPalette="teal" disabled={!message.trim()} onClick={handleSend}>
                <Icon as={LuSend} mr={2} />
                Send Broadcast
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default BroadcastModal;