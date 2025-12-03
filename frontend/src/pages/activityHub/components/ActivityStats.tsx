/**
 * ActivityStats Component
 *
 * Displays summary statistics for the Activity Hub.
 * Shows today's activity breakdown, critical alerts, and pending acknowledgements.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiFileText,
  FiShield,
} from 'react-icons/fi';
import {
  ActivityStats as ActivityStatsType,
  UpdateStats,
  CATEGORY_CONFIG,
} from '../types/activityHub.types';

// ============================================
// Types
// ============================================

interface ActivityStatsProps {
  activityStats: ActivityStatsType | null;
  updateStats: UpdateStats | null;
  isLoading?: boolean;
}

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  badge?: {
    text: string;
    colorPalette: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({
                                             label,
                                             value,
                                             icon: IconComponent,
                                             color,
                                             trend,
                                             badge,
                                           }) => {
  return (
    <Box
      bg="white"
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
    >
      <HStack justify="space-between" mb={2}>
        <Box
          p={2}
          borderRadius="lg"
          bg={`${color}.50`}
        >
          <Icon as={IconComponent} boxSize={5} color={`${color}.500`} />
        </Box>
        {badge && (
          <Badge colorPalette={badge.colorPalette} variant="subtle" size="sm">
            {badge.text}
          </Badge>
        )}
      </HStack>

      <Text fontSize="2xl" fontWeight="bold" color="gray.800">
        {value}
      </Text>

      <HStack gap={2}>
        <Text fontSize="sm" color="gray.500">
          {label}
        </Text>
        {trend && (
          <HStack gap={1}>
            <Icon
              as={FiTrendingUp}
              color={trend.direction === 'up' ? 'green.500' : trend.direction === 'down' ? 'red.500' : 'gray.400'}
              transform={trend.direction === 'down' ? 'rotate(180deg)' : undefined}
            />
            <Text
              fontSize="xs"
              color={trend.direction === 'up' ? 'green.500' : trend.direction === 'down' ? 'red.500' : 'gray.400'}
            >
              {trend.value}%
            </Text>
          </HStack>
        )}
      </HStack>
    </Box>
  );
};

// ============================================
// Category Breakdown Component
// ============================================

interface CategoryBreakdownProps {
  byCategory: Record<string, number>;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ byCategory }) => {
  const categories = Object.entries(byCategory)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (categories.length === 0) {
    return (
      <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
        No activity today
      </Text>
    );
  }

  const total = categories.reduce((sum, [, count]) => sum + count, 0);

  return (
    <VStack align="stretch" gap={2}>
      {categories.map(([category, count]) => {
        const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
        const percentage = Math.round((count / total) * 100);

        return (
          <HStack key={category} gap={3}>
            <Box
              w={3}
              h={3}
              borderRadius="full"
              bg={config?.color || 'gray.400'}
              flexShrink={0}
            />
            <Text fontSize="sm" color="gray.600" flex={1}>
              {config?.label || category}
            </Text>
            <Text fontSize="sm" fontWeight="medium" color="gray.800">
              {count}
            </Text>
            <Text fontSize="xs" color="gray.400" w={10} textAlign="right">
              {percentage}%
            </Text>
          </HStack>
        );
      })}
    </VStack>
  );
};

// ============================================
// Severity Indicator Component
// ============================================

interface SeverityIndicatorProps {
  bySeverity: Record<string, number>;
}

const SeverityIndicator: React.FC<SeverityIndicatorProps> = ({ bySeverity }) => {
  return (
    <HStack gap={4} justify="center">
      <VStack gap={0}>
        <Text fontSize="lg" fontWeight="bold" color="red.500">
          {bySeverity.critical || 0}
        </Text>
        <Text fontSize="xs" color="gray.500">Critical</Text>
      </VStack>
      <Box h={8} w="1px" bg="gray.200" />
      <VStack gap={0}>
        <Text fontSize="lg" fontWeight="bold" color="orange.500">
          {bySeverity.warning || 0}
        </Text>
        <Text fontSize="xs" color="gray.500">Warning</Text>
      </VStack>
      <Box h={8} w="1px" bg="gray.200" />
      <VStack gap={0}>
        <Text fontSize="lg" fontWeight="bold" color="blue.500">
          {bySeverity.info || 0}
        </Text>
        <Text fontSize="xs" color="gray.500">Info</Text>
      </VStack>
    </HStack>
  );
};

// ============================================
// Main Component
// ============================================

const ActivityStats: React.FC<ActivityStatsProps> = ({
                                                       activityStats,
                                                       updateStats,
                                                       isLoading = false,
                                                     }) => {
  if (isLoading || !activityStats || !updateStats) {
    return (
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        {[1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            bg="white"
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            h={24}
          />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {/* Main Stats Row */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <StatCard
          label="Today's Events"
          value={activityStats.today.total}
          icon={FiActivity}
          color="blue"
          trend={{ value: 12, direction: 'up' }}
        />
        <StatCard
          label="Critical Alerts"
          value={activityStats.recentCritical}
          icon={FiAlertTriangle}
          color="red"
          badge={
            activityStats.recentCritical > 0
              ? { text: 'Needs Attention', colorPalette: 'red' }
              : undefined
          }
        />
        <StatCard
          label="Unread Updates"
          value={updateStats.unread}
          icon={FiFileText}
          color="purple"
        />
        <StatCard
          label="Pending Ack."
          value={updateStats.pendingAcknowledgement}
          icon={FiCheckCircle}
          color="orange"
          badge={
            updateStats.pendingAcknowledgement > 0
              ? { text: 'Action Required', colorPalette: 'orange' }
              : undefined
          }
        />
      </SimpleGrid>

      {/* Detailed Breakdown Row */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {/* Activity by Category */}
        <Box
          bg="white"
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <HStack gap={2} mb={4}>
            <Icon as={FiShield} color="blue.500" />
            <Text fontWeight="semibold" color="gray.800">
              Activity by Category
            </Text>
          </HStack>
          <CategoryBreakdown byCategory={activityStats.today.byCategory} />
        </Box>

        {/* Severity Overview */}
        <Box
          bg="white"
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <HStack gap={2} mb={4}>
            <Icon as={FiAlertTriangle} color="orange.500" />
            <Text fontWeight="semibold" color="gray.800">
              Severity Overview
            </Text>
          </HStack>
          <SeverityIndicator bySeverity={activityStats.today.bySeverity} />

          <Box mt={4} pt={4} borderTopWidth="1px" borderColor="gray.100">
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.500">
                Week Total
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                {activityStats.week.total} events
              </Text>
            </HStack>
          </Box>
        </Box>
      </SimpleGrid>
    </VStack>
  );
};

export default ActivityStats;