import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  Field,
  Link,
  Flex,
} from '@chakra-ui/react';
import { Header } from '../../layouts/Header';
import { Footer } from '../../layouts/Footer';
import { login } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await login(formData.identifier, formData.password);
      authLogin(response.user);
      setError('');
      setSuccessMessage('Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError('Login failed. Please check your username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex direction="column" minH="100vh" bg="#1b1b60">
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
          maxW={{ base: '100%', md: 'sm' }}
        >
          <VStack gap={6} align="stretch">
            {/* Header */}
            <Heading as="h2" fontSize={{ base: '2xl', md: '3xl' }} color="gray.700" textAlign="center">
              Login
            </Heading>

            {/* Messages */}
            {error && (
              <Box bg="red.50" color="red.600" p={3} borderRadius="md" fontSize="sm">
                {error}
              </Box>
            )}
            {successMessage && (
              <Box bg="green.50" color="green.600" p={3} borderRadius="md" fontSize="sm">
                {successMessage}
              </Box>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <VStack gap={4} align="stretch">
                <Field.Root>
                  <Field.Label fontWeight="semibold" color="gray.700">
                    Username or Email
                  </Field.Label>
                  <Input
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                    size="lg"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label fontWeight="semibold" color="gray.700">
                    Password
                  </Field.Label>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    size="lg"
                  />
                </Field.Root>

                <Button
                  type="submit"
                  bg="#1b1b60"
                  color="gray.300"
                  size="lg"
                  width="full"
                  mt={4}
                  loading={isLoading}
                  _hover={{ bg: '#2d2d80' }}
                >
                  Login
                </Button>
              </VStack>
            </form>

            {/* Footer */}
            <Text textAlign="center" color="gray.600" fontSize="sm">
              Don't have an account?{' '}
              <Link asChild color="#1b1b60" fontSize="md" fontWeight="bold">
                <RouterLink to="/register">Register here</RouterLink>
              </Link>
            </Text>
          </VStack>
        </Box>
      </VStack>

      <Footer />
    </Flex>
  );
};

export default Login;