/**
 * Settings Page
 *
 * Placeholder for system configuration and user preferences.
 * Future implementation will include account settings, notifications,
 * security preferences, and system configuration.
 */

import React from 'react';
import {
  Box,
  Container,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiSettings,
  FiUser,
  FiBell,
  FiShield,
  FiDatabase,
  FiLock,
} from 'react-icons/fi';

interface SettingsCategoryProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const SettingsCategory: React.FC<SettingsCategoryProps> = ({
                                                             icon: Icon,
                                                             title,
                                                             description,
                                                             color,
                                                           }) => (
  <Box
    p={6}
    bg="white"
    borderRadius="lg"
    borderWidth="1px"
    borderColor="gray.200"
    opacity={0.7}
    cursor="not-allowed"
    _hover={{ borderColor: 'gray.300' }}
    transition="all 0.2s"
  >
    <HStack gap={4} align="flex-start">
      <Box p={3} borderRadius="lg" bg={`${color}.50`} color={`${color}.600`}>
        <Icon size={24} />
      </Box>
      <VStack align="flex-start" gap={1}>
        <Text fontWeight="semibold" color="gray.700">
          {title}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {description}
        </Text>
      </VStack>
    </HStack>
  </Box>
);

const Settings: React.FC = () => {
  const settingsCategories: SettingsCategoryProps[] = [
    {
      icon: FiUser,
      title: 'Account Settings',
      description: 'Manage your profile, password, and personal information',
      color: 'blue',
    },
    {
      icon: FiBell,
      title: 'Notifications',
      description: 'Configure alerts, email preferences, and push notifications',
      color: 'orange',
    },
    {
      icon: FiShield,
      title: 'Security',
      description: 'Two-factor authentication, sessions, and login history',
      color: 'green',
    },
    {
      icon: FiLock,
      title: 'Privacy',
      description: 'Data sharing, visibility settings, and consent preferences',
      color: 'purple',
    },
    {
      icon: FiDatabase,
      title: 'Data Management',
      description: 'Export data, backup settings, and storage usage',
      color: 'cyan',
    },
    {
      icon: FiSettings,
      title: 'System Preferences',
      description: 'Application defaults, integrations, and advanced options',
      color: 'gray',
    },
  ];

  return (
    <Container maxW="container.xl" py={6}>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={3}>
          <Box p={2} borderRadius="lg" bg="gray.100" color="gray.600">
            <FiSettings size={24} />
          </Box>
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Settings
            </Text>
            <Text fontSize="sm" color="gray.500">
              Configure your account and system preferences
            </Text>
          </Box>
        </HStack>

        <Button variant="outline" size="sm" disabled>
          Save Changes
        </Button>
      </Flex>

      {/* Coming Soon Banner */}
      <Box
        bg="gray.50"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        p={8}
        mb={8}
        textAlign="center"
      >
        <VStack gap={4}>
          <Box p={4} borderRadius="full" bg="gray.100" color="gray.500">
            <FiSettings size={40} />
          </Box>
          <Text fontSize="xl" fontWeight="semibold" color="gray.700">
            Settings Coming Soon
          </Text>
          <Text color="gray.500" maxW="md">
            We're building a comprehensive settings panel to give you full control
            over your Guardian Optix experience. Check back soon for updates.
          </Text>
        </VStack>
      </Box>

      {/* Settings Categories Preview */}
      <Box mb={6}>
        <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={4}>
          PLANNED FEATURES
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} gap={4}>
          {settingsCategories.map((category) => (
            <SettingsCategory key={category.title} {...category} />
          ))}
        </SimpleGrid>
      </Box>
    </Container>
  );
};

export default Settings;