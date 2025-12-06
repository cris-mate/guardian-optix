import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  Field,
  Link,
  Flex,
  Select,
  createListCollection,
  Icon,
} from '@chakra-ui/react';
import { register } from '../../utils/api';
import axios from 'axios';
import { LuShield, LuUsers, LuCalendar, LuCircleCheck } from 'react-icons/lu';
import { ReactComponent as Logo } from '../../assets/go-logo-transparent.svg';

// Select collections
const roleOptions = createListCollection({
  items: [
    { value: 'Manager', label: 'Manager' },
    { value: 'Guard', label: 'Guard' },
  ],
});

const managerTypeOptions = createListCollection({
  items: [
    { value: 'Operations Manager', label: 'Operations Manager' },
    { value: 'Account Manager', label: 'Account Manager' },
    { value: 'Business Support Manager', label: 'Business Support Manager' },
  ],
});

const guardTypeOptions = createListCollection({
  items: [
    { value: 'Static', label: 'Static' },
    { value: 'Dog Handler', label: 'Dog Handler' },
    { value: 'Close Protection', label: 'Close Protection' },
    { value: 'Mobile Patrol', label: 'Mobile Patrol' },
  ],
});

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    postCode: '',
    password: '',
    role: 'Manager',
    managerType: 'Operations Manager',
    guardType: 'Static',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        postCode: formData.postCode,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'Manager' && { managerType: formData.managerType }),
        ...(formData.role === 'Guard' && { guardType: formData.guardType }),
      };
      await register(payload);

      setError('');
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message);
      } else {
        setError('An unexpected error occurred. Please check the details and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }}>
      {/* Left side - Branding & Welcome */}
      <Flex
        flex="1"
        bg="#1b1b60"
        color="white"
        align="center"
        justify="center"
        p={{ base: 8, md: 12 }}
        display={{ base: 'none', lg: 'flex' }}
      >
        <VStack gap={12} maxW="lg" >
          {/* Logo */}
          <Icon as={Logo} boxSize="160px"/>

          <VStack gap={4} align="flex-start">
            <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="bold">
              Create Your Account
            </Heading>
            <Text fontSize="lg" color="gray.300" lineHeight="1.7">
              Join Guardian Optix and streamline your security operations.
              Manage teams, schedule shifts, and ensure compliance.
            </Text>
          </VStack>

          {/* Feature highlights */}
          <VStack gap={4} align="flex-start" pt={4} w="full">
            <HStack gap={3}>
              <Box p={2} bg="whiteAlpha.200" borderRadius="md">
                <LuShield size={20} />
              </Box>
              <Text fontSize="md" color="gray.200">
                Comprehensive compliance management
              </Text>
            </HStack>
            <HStack gap={3}>
              <Box p={2} bg="whiteAlpha.200" borderRadius="md">
                <LuUsers size={20} />
              </Box>
              <Text fontSize="md" color="gray.200">
                Efficient workforce tracking
              </Text>
            </HStack>
            <HStack gap={3}>
              <Box p={2} bg="whiteAlpha.200" borderRadius="md">
                <LuCalendar size={20} />
              </Box>
              <Text fontSize="md" color="gray.200">
                Smart shift scheduling
              </Text>
            </HStack>
            <HStack gap={3}>
              <Box p={2} bg="whiteAlpha.200" borderRadius="md">
                <LuCircleCheck size={20} />
              </Box>
              <Text fontSize="md" color="gray.200">
                Real-time incident reporting
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </Flex>

      {/* Right side - Registration Form */}
      <Flex
        flex="1"
        bg="white"
        align="center"
        justify="center"
        p={{ base: 6, md: 10 }}
        overflowY="auto"
      >
        <Box w="full" maxW="md">
          {/* Already have account link */}
          <Flex justify="flex-end" mb={6}>
            <Text fontSize="sm" color="gray.600">
              Already have an account?{' '}
              <Link asChild color="#1b1b60" fontSize="md" fontWeight="bold">
                <RouterLink to="/login">Sign in →</RouterLink>
              </Link>
            </Text>
          </Flex>

          {/* Form header */}
          <Heading as="h2" fontSize="xl" color="gray.800" mb={6}>
            Sign up for Guardian Optix
          </Heading>

          {/* Messages */}
          {error && (
            <Box bg="red.50" color="red.600" p={3} borderRadius="md" fontSize="sm" mb={4}>
              {error}
            </Box>
          )}
          {successMessage && (
            <Box bg="green.50" color="green.600" p={3} borderRadius="md" fontSize="sm" mb={4}>
              {successMessage}
            </Box>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">
              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Full Name<Text as="span" color="red.500">*</Text>
                </Field.Label>
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  borderColor="gray.300"
                  _focus={{ borderColor: '#1b1b60', boxShadow: '0 0 0 1px #1b1b60' }}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Username<Text as="span" color="red.500">*</Text>
                </Field.Label>
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  borderColor="gray.300"
                  _focus={{ borderColor: '#1b1b60', boxShadow: '0 0 0 1px #1b1b60' }}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Email<Text as="span" color="red.500">*</Text>
                </Field.Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  borderColor="gray.300"
                  _focus={{ borderColor: '#1b1b60', boxShadow: '0 0 0 1px #1b1b60' }}
                />
              </Field.Root>

              <HStack gap={4}>
                <Field.Root flex="1">
                  <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                    Phone Number<Text as="span" color="red.500">*</Text>
                  </Field.Label>
                  <Input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    borderColor="gray.300"
                    _focus={{ borderColor: '#1b1b60', boxShadow: '0 0 0 1px #1b1b60' }}
                  />
                </Field.Root>

                <Field.Root flex="1">
                  <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                    Post Code<Text as="span" color="red.500">*</Text>
                  </Field.Label>
                  <Input
                    type="text"
                    name="postCode"
                    value={formData.postCode}
                    onChange={handleChange}
                    required
                    borderColor="gray.300"
                    _focus={{ borderColor: '#1b1b60', boxShadow: '0 0 0 1px #1b1b60' }}
                  />
                </Field.Root>
              </HStack>

              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Password<Text as="span" color="red.500">*</Text>
                </Field.Label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  borderColor="gray.300"
                  _focus={{ borderColor: '#1b1b60', boxShadow: '0 0 0 1px #1b1b60' }}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Password should be at least 8 characters
                </Text>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                  Your Role<Text as="span" color="red.500">*</Text>
                </Field.Label>
                <Select.Root
                  collection={roleOptions}
                  value={[formData.role]}
                  onValueChange={(e) => setFormData({ ...formData, role: e.value[0] })}
                >
                  <Select.Trigger borderColor="gray.300">
                    <Select.ValueText placeholder="Select role" />
                  </Select.Trigger>
                  <Select.Content bg="white" borderColor="gray.200" boxShadow="lg">
                    {roleOptions.items.map((item) => (
                      <Select.Item
                        key={item.value}
                        item={item}
                        _hover={{ bg: 'gray.100' }}
                        _highlighted={{ bg: 'gray.100' }}
                        color="gray.800"
                      >
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Field.Root>

              {formData.role === 'Manager' && (
                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                    Manager Type<Text as="span" color="red.500">*</Text>
                  </Field.Label>
                  <Select.Root
                    collection={managerTypeOptions}
                    value={[formData.managerType]}
                    onValueChange={(e) => setFormData({ ...formData, managerType: e.value[0] })}
                  >
                    <Select.Trigger borderColor="gray.300">
                      <Select.ValueText placeholder="Select manager type" />
                    </Select.Trigger>
                    <Select.Content bg="white" borderColor="gray.200" boxShadow="lg">
                      {managerTypeOptions.items.map((item) => (
                        <Select.Item
                          key={item.value}
                          item={item}
                          _hover={{ bg: 'gray.100' }}
                          _highlighted={{ bg: 'gray.100' }}
                          color="gray.800"
                        >
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Field.Root>
              )}

              {formData.role === 'Guard' && (
                <Field.Root>
                  <Field.Label fontSize="sm" fontWeight="medium" color="gray.700">
                    Guard Type<Text as="span" color="red.500">*</Text>
                  </Field.Label>
                  <Select.Root
                    collection={guardTypeOptions}
                    value={[formData.guardType]}
                    onValueChange={(e) => setFormData({ ...formData, guardType: e.value[0] })}
                  >
                    <Select.Trigger borderColor="gray.300">
                      <Select.ValueText placeholder="Select guard type" />
                    </Select.Trigger>
                    <Select.Content bg="white" borderColor="gray.200" boxShadow="lg">
                      {guardTypeOptions.items.map((item) => (
                        <Select.Item
                          key={item.value}
                          item={item}
                          _hover={{ bg: 'gray.100' }}
                          _highlighted={{ bg: 'gray.100' }}
                          color="gray.800"
                        >
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Field.Root>
              )}

              <Button
                type="submit"
                bg="#1b1b60"
                color="white"
                size="lg"
                width="full"
                mt={4}
                loading={isLoading}
                _hover={{ bg: '#2d2d80' }}
              >
                Create account →
              </Button>
            </VStack>
          </form>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Register;