/**
 * PageHeader Component
 *
 * Reusable page header with title, description, and action buttons.
 */

import React from 'react';
import {
  HStack,
  Box,
  Text,
  Button,
  Icon,
} from '@chakra-ui/react';
import { LuRefreshCw } from 'react-icons/lu';

// ============================================
// Types
// ============================================

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Icon component to display */
  icon: React.ElementType;
  /** Icon background color (e.g., 'blue', 'green') */
  iconColor?: string;
  /** Show refresh button */
  showRefresh?: boolean;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Loading state for refresh */
  isLoading?: boolean;
  /** Additional action buttons */
  actions?: React.ReactNode;
}

// ============================================
// Main Component
// ============================================

const PageHeader: React.FC<PageHeaderProps> = ({
                                                 title,
                                                 description,
                                                 icon: IconComponent,
                                                 iconColor = 'blue',
                                                 showRefresh = true,
                                                 onRefresh,
                                                 isLoading = false,
                                                 actions,
                                               }) => {
  return (
    <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
      {/* Left side - Icon and Title */}
      <HStack gap={3}>
        <Box p={2} borderRadius="lg" bg={`${iconColor}.50`} color={`${iconColor}.600`}>
          <IconComponent size={24} />
        </Box>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            {title}
          </Text>
          {description && (
            <Text fontSize="sm" color="gray.500">
              {description}
            </Text>
          )}
        </Box>
      </HStack>

      {/* Right side - Actions */}
      <HStack gap={2}>
        {showRefresh && onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            color="green.600"
            borderColor="green.300"
            _hover={{ bg: 'green.50', borderColor: 'green.400' }}
          >
            <Icon
              as={LuRefreshCw}
              boxSize={4}
              mr={2}
              animation={isLoading ? 'spin 1s linear infinite' : undefined}
            />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
        {actions}
      </HStack>
    </HStack>
  );
};

export default PageHeader;