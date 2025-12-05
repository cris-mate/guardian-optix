/**
 * ReportQuickStats Component
 *
 * Displays quick statistics about reports.
 * Shows total generated, scheduled, and favorites.
 */

import React from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Icon,
} from '@chakra-ui/react';
import {
  LuFileText,
  LuCalendarClock,
  LuStar,
  LuTrendingUp,
} from 'react-icons/lu';
import type { ReportQuickStats as QuickStatsType } from '../../../types/reports.types';

// ============================================
// Props Interface
// ============================================

interface ReportQuickStatsProps {
  stats: QuickStatsType | null;
  isLoading?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const formatTimeAgo = (isoString?: string) => {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
                                             title,
                                             value,
                                             subtitle,
                                             icon,
                                             color,
                                           }) => (
  <Box
    bg="white"
    p={4}
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
    transition="all 0.2s"
    _hover={{ shadow: 'sm', borderColor: `${color}.200` }}
  >
    <HStack justify="space-between" align="flex-start">
      <VStack align="flex-start" gap={1}>
        <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase">
          {title}
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          {value}
        </Text>
        {subtitle && (
          <Text fontSize="xs" color="gray.400">
            {subtitle}
          </Text>
        )}
      </VStack>
      <Box
        p={2}
        borderRadius="lg"
        bg={`${color}.50`}
        color={`${color}.500`}
      >
        <Icon as={icon} boxSize={5} />
      </Box>
    </HStack>
  </Box>
);

// ============================================
// Loading Skeleton
// ============================================

const StatCardSkeleton: React.FC = () => (
  <Box
    bg="white"
    p={4}
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
  >
    <HStack justify="space-between" align="flex-start">
      <VStack align="flex-start" gap={2}>
        <Box bg="gray.100" h={3} w={16} borderRadius="md" />
        <Box bg="gray.100" h={8} w={12} borderRadius="md" />
        <Box bg="gray.100" h={3} w={20} borderRadius="md" />
      </VStack>
      <Box bg="gray.100" p={2} borderRadius="lg" h={9} w={9} />
    </HStack>
  </Box>
);

// ============================================
// Main Component
// ============================================

const ReportQuickStats: React.FC<ReportQuickStatsProps> = ({
                                                             stats,
                                                             isLoading = false,
                                                           }) => {
  if (isLoading || !stats) {
    return (
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
      <StatCard
        title="Total Reports"
        value={stats.reportsGenerated}
        subtitle="All time"
        icon={LuFileText}
        color="blue"
      />
      <StatCard
        title="This Month"
        value={stats.reportsThisMonth}
        subtitle={`Last: ${formatTimeAgo(stats.lastReportGenerated)}`}
        icon={LuTrendingUp}
        color="green"
      />
      <StatCard
        title="Scheduled"
        value={stats.scheduledReports}
        subtitle="Auto-generated"
        icon={LuCalendarClock}
        color="purple"
      />
      <StatCard
        title="Favourites"
        value={stats.favoriteReports}
        subtitle="Quick access"
        icon={LuStar}
        color="yellow"
      />
    </SimpleGrid>
  );
};

export default ReportQuickStats;