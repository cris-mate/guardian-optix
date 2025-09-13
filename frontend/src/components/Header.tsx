import { Flex, Heading, Image, Button, Text } from '@chakra-ui/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {useAuth} from "../context/AuthContext";

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
        <Image
          src="/assets/guardian-optix-logo-120px.png"
          alt="Logo"
          height="20px" />
        <Heading size="md">Guardian Optix</Heading>
      </Flex>

      {/* User Section */}
      {user && (
        <Flex align="center" gap={4}>
          <Text fontSize="lg"
                color="#ced4da">
            Logged in as, {user.username}
          </Text>
          <Button
            bg="#495057"
            fontWeight="medium"
            _hover={{ bg: '#6c757d' }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Flex>
      )}
    </Flex>
  );
};
