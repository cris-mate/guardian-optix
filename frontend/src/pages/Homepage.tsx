import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, VStack, Heading, Text, Button, HStack, Flex } from '@chakra-ui/react';
import { Header } from '../layouts/Header';
import {Footer} from "../layouts/Footer";

const Homepage: React.FC = () => {
  return (
    <Flex direction="column" minH="100vh" bg="#1b1b60">
      {/* On a public page, the 'user' object is null, so the user-specific
          details will automatically be hidden. */}
      <Header />

      {/* Main content area */}
      <VStack
        flex="4"
        align="center"
        justify="center"
        p={{ base: 4, md: 8 }}
        textAlign="center"
      >
        <Box
          bg="whiteAlpha.900"
          p={{ base: 6, md: 10 }}
          borderRadius="xl"
          boxShadow="lg"
          w="full"
          maxW={{ base: '100%', md: '3xl' }}
        >
          <VStack gap={6}>
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '5xl' }}
              color="gray.700"
              p={6}
            >
              Welcome to Guardian Optix!
            </Heading>

            <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.500">
              A comprehensive solution for security operations management.
            </Text>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.600" lineHeight="1.6">
              Our application is designed to help security companies streamline their operations,
              manage guard patrols, schedule shifts, ensure compliance and much more, all from one
              centralised dashboard.
            </Text>

            <Heading as="h2" size="lg" color="gray.700" pt={4}>
              Get Started
            </Heading>
            <Text fontSize="md" color="gray.500">
              Please login or register to continue.
            </Text>

            {/* Buttons */}
            <HStack gap={4} pt={4}>
              <RouterLink to="login">
                <Button
                  bg="#1b1b60"
                  color="gray.300"
                  rounded="md"
                  size="lg"
                  px={8}
                  variant="surface"
                >
                  Login
                </Button>
              </RouterLink>

              <RouterLink to="register">
                <Button
                  color="#1b1b60"
                  rounded="md"
                  size="lg"
                  px={8}
                  variant="outline"
                  _hover= {{bg: "#6c757d", color: "gray.300"}}
                >
                  Register
                </Button>
              </RouterLink>
            </HStack>
          </VStack>
        </Box>
      </VStack>

      <Footer />
    </Flex>
  );
};

export default Homepage;
