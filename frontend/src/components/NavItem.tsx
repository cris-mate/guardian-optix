import React from 'react';
import {Icon, Box, Text, HStack} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { IconType } from 'react-icons';
import { FiGrid } from 'react-icons/fi';

// Define the props the component will accept
interface NavItemProps {
  icon?: IconType;
  children: React.ReactNode;
  to: string;
}

export const NavItem = ({ icon = FiGrid, to, children }: NavItemProps) => {
  return (
    <RouterLink to={to} style={{ textDecoration: 'none' }}>
      <Box
        _hover={{
          bg: '#4A5568',
        }}
        p={2}
        borderRadius="md"
        color="white"
      >
        <HStack gap={4} align="center">
          <Icon as={icon} boxSize="20px" />
          <Text>{children}</Text>
        </HStack>
      </Box>

    </RouterLink>
  );
};