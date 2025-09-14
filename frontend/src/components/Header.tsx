import {Flex, Heading, IconButton, Button, Text, Icon, Separator} from '@chakra-ui/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBell  } from 'react-icons/fi';
import { ReactComponent as Logo } from '../assets/go-logo-transparent.svg';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout(); // clear user state
    navigate('/');
  }

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      p={5}
      bg="#212529"
      color="white"
      boxShadow="md"
      gridArea="header"
    >
      {/* Brand Section */}
      <Flex align="center" gap={4}>
        <Icon as={Logo} boxSize="40px" />

        <Heading size="xl">
        Guardian Optix
        </Heading>
      </Flex>

      {/* Right Side Container */}
      {user && (
        <Flex align="center" gap={6}>

          {/* Notification Section */}
          <IconButton variant="ghost" aria-label="View notifications" rounded="full">
            {<FiBell />}
          </IconButton>

          <Separator variant="solid" orientation="vertical" height="10" borderColor="gray.600" />

          {/* User Info Section */}
          <Flex align="center" gap={4}>
            <Text fontSize="md" color="#ced4da">
              Logged in as, {user.fullName}
            </Text>

            <Separator variant="solid" orientation="vertical" height="10" borderColor="gray.600" />

            <Button
              bg="#495057"
              fontSize="lg"
              fontWeight="medium"
              _hover={{ bg: '#6c757d' }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};
