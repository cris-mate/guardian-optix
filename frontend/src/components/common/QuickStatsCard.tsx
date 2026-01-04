/**
 * QuickStatsCard Component
 *
 * Reusable stat card component for consistent display across pages
 *  following the same design pattern.
 */

import React from 'react';
import { Box, HStack, VStack, Text, Icon } from '@chakra-ui/react';

// ============================================
// Types
// ============================================

export interface QuickStatsCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow' | 'gray' | 'teal';
  subtext?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

// ============================================
// Loading Skeleton
// ============================================

const CardSkeleton: React.FC = () => (
  <Box
    bg="white"
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
    p={5}
  >
    <HStack gap={3}>
      <Box bg="gray.100" p={2} borderRadius="md" h={9} w={9} />
      <VStack align="flex-start" gap={1}>
        <Box bg="gray.100" h={8} w={16} borderRadius="md" />
        <Box bg="gray.100" h={4} w={24} borderRadius="md" />
      </VStack>
    </HStack>
  </Box>
);

// ============================================
// Main Component
// ============================================

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
                                                         label,
                                                         value,
                                                         icon,
                                                         color,
                                                         subtext,
                                                         isLoading = false,
                                                         onClick,
                                                       }) => {
  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      p={5}
      transition="all 0.2s"
      cursor={onClick ? 'pointer' : 'default'}
      _hover={{
        borderColor: `${color}.300`,
        shadow: 'sm',
      }}
      onClick={onClick}
    >
      <HStack gap={3}>
        <Box
          p={2}
          borderRadius="md"
          bg={`${color}.50`}
          color={`${color}.600`}
        >
          <Icon as={icon} boxSize={5} />
        </Box>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            {value}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {label}
          </Text>
          {subtext && (
            <Text fontSize="xs" color="gray.400">
              {subtext}
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  );
};

export default QuickStatsCard;