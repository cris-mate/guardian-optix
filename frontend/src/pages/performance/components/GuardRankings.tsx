/**
 * GuardRankings Component
 *
 * Displays a leaderboard of security guards ranked by performance.
 * Shows rank changes, scores, and top metrics.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Icon,
  Table,
  Progress,
} from '@chakra-ui/react';
import {
  LuTrophy,
  LuMedal,
  LuAward,
  LuTrendingUp,
  LuTrendingDown,
  LuMinus,
  LuChevronRight,
} from 'react-icons/lu';
import type {
  GuardPerformance,
  GuardRanking,
} from '../../../types/performance.types';

// ============================================
// Props Interface
// ============================================

interface GuardRankingsProps {
  guards: GuardPerformance[];
  rankings: GuardRanking[];
  onSelectGuard?: (guardId: string) => void;
  selectedGuardId?: string | null;
  isLoading?: boolean;
  compact?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return { icon: LuTrophy, color: 'yellow.500', bg: 'yellow.50' };
    case 2: return { icon: LuMedal, color: 'gray.400', bg: 'gray.50' };
    case 3: return { icon: LuAward, color: 'orange.400', bg: 'orange.50' };
    default: return null;
  }
};

const getRankChange = (current: number, previous?: number) => {
  if (!previous || current === previous) return { direction: 'stable', value: 0 };
  const change = previous - current;
  return {
    direction: change > 0 ? 'up' : 'down',
    value: Math.abs(change),
  };
};

const getRatingConfig = (rating: string) => {
  const config: Record<string, { label: string; color: string }> = {
    excellent: { label: 'Excellent', color: 'green' },
    good: { label: 'Good', color: 'blue' },
    average: { label: 'Average', color: 'yellow' },
    'needs-improvement': { label: 'Needs Improvement', color: 'orange' },
    poor: { label: 'Poor', color: 'red' },
  };
  return config[rating] || { label: rating, color: 'gray' };
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'green';
  if (score >= 75) return 'blue';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
};

// ============================================
// Rank Badge Component
// ============================================

interface RankBadgeProps {
  rank: number;
  previousRank?: number;
}

const RankBadge: React.FC<RankBadgeProps> = ({ rank, previousRank }) => {
  const rankConfig = getRankIcon(rank);
  const change = getRankChange(rank, previousRank);

  return (
    <HStack gap={2}>
      {rankConfig ? (
        <Box p={2} bg={rankConfig.bg} borderRadius="lg">
          <Icon as={rankConfig.icon} boxSize={5} color={rankConfig.color} />
        </Box>
      ) : (
        <Box
          w={9}
          h={9}
          bg="gray.100"
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontWeight="bold" color="gray.600">
            {rank}
          </Text>
        </Box>
      )}

      {change.direction !== 'stable' && (
        <VStack gap={0} align="center">
          <Icon
            as={change.direction === 'up' ? LuTrendingUp : LuTrendingDown}
            boxSize={3}
            color={change.direction === 'up' ? 'green.500' : 'red.500'}
          />
          <Text
            fontSize="xs"
            color={change.direction === 'up' ? 'green.500' : 'red.500'}
          >
            {change.value}
          </Text>
        </VStack>
      )}
    </HStack>
  );
};

// ============================================
// Guard Row Component
// ============================================

interface GuardRowProps {
  guard: GuardPerformance;
  rank: number;
  previousRank?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const GuardRow: React.FC<GuardRowProps> = ({
                                                 guard,
                                                 rank,
                                                 previousRank,
                                                 isSelected,
                                                 onClick,
                                               }) => {
  const ratingConfig = getRatingConfig(guard.rating);

  return (
    <Table.Row
      onClick={onClick}
      cursor={onClick ? 'pointer' : 'default'}
      bg={isSelected ? 'blue.50' : undefined}
      _hover={{ bg: isSelected ? 'blue.50' : 'gray.50' }}
      transition="background 0.15s"
    >
      <Table.Cell>
        <RankBadge rank={rank} previousRank={previousRank} />
      </Table.Cell>

      <Table.Cell>
        <HStack gap={3}>
          <Avatar.Root size="sm">
            <Avatar.Fallback>
              {guard.guardName.split(' ').map(n => n[0]).join('')}
            </Avatar.Fallback>
            {guard.profileImage && <Avatar.Image src={guard.profileImage} />}
          </Avatar.Root>
          <VStack align="flex-start" gap={0}>
            <Text fontWeight="medium" color="gray.800">
              {guard.guardName}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {guard.badgeNumber} • {guard.guardType}
            </Text>
          </VStack>
        </HStack>
      </Table.Cell>

      <Table.Cell>
        <Text fontSize="sm" color="gray.600">
          {guard.site}
        </Text>
      </Table.Cell>

      <Table.Cell>
        <VStack align="flex-start" gap={1}>
          <HStack gap={2}>
            <Text fontWeight="bold" color={`${getScoreColor(guard.overallScore)}.600`}>
              {guard.overallScore}
            </Text>
            <Text fontSize="xs" color="gray.400">/100</Text>
          </HStack>
          <Progress.Root
            value={guard.overallScore}
            size="xs"
            colorPalette={getScoreColor(guard.overallScore)}
            w={20}
          >
            <Progress.Track bg="gray.100">
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </VStack>
      </Table.Cell>

      <Table.Cell>
        <Badge colorPalette={ratingConfig.color} variant="subtle">
          {ratingConfig.label}
        </Badge>
      </Table.Cell>

      <Table.Cell>
        <HStack gap={1}>
          <Icon
            as={
              guard.trends.overall === 'up'
                ? LuTrendingUp
                : guard.trends.overall === 'down'
                  ? LuTrendingDown
                  : LuMinus
            }
            boxSize={4}
            color={
              guard.trends.overall === 'up'
                ? 'green.500'
                : guard.trends.overall === 'down'
                  ? 'red.500'
                  : 'gray.400'
            }
          />
          <Text
            fontSize="sm"
            color={
              guard.trends.overall === 'up'
                ? 'green.500'
                : guard.trends.overall === 'down'
                  ? 'red.500'
                  : 'gray.400'
            }
          >
            {guard.trends.value}%
          </Text>
        </HStack>
      </Table.Cell>

      {onClick && (
        <Table.Cell>
          <Icon as={LuChevronRight} boxSize={5} color="gray.400" />
        </Table.Cell>
      )}
    </Table.Row>
  );
};

// ============================================
// Loading Skeleton
// ============================================

const RowSkeleton: React.FC = () => (
  <Table.Row>
    <Table.Cell><Box bg="gray.100" h={9} w={9} borderRadius="lg" /></Table.Cell>
    <Table.Cell>
      <HStack gap={3}>
        <Box bg="gray.100" h={8} w={8} borderRadius="full" />
        <VStack align="flex-start" gap={1}>
          <Box bg="gray.100" h={4} w={28} borderRadius="md" />
          <Box bg="gray.100" h={3} w={20} borderRadius="md" />
        </VStack>
      </HStack>
    </Table.Cell>
    <Table.Cell><Box bg="gray.100" h={4} w={24} borderRadius="md" /></Table.Cell>
    <Table.Cell><Box bg="gray.100" h={4} w={12} borderRadius="md" /></Table.Cell>
    <Table.Cell><Box bg="gray.100" h={5} w={16} borderRadius="md" /></Table.Cell>
    <Table.Cell><Box bg="gray.100" h={4} w={10} borderRadius="md" /></Table.Cell>
  </Table.Row>
);

// ============================================
// Main Component
// ============================================

const GuardRankings: React.FC<GuardRankingsProps> = ({
                                                       guards,
                                                           rankings,
                                                           onSelectGuard,
                                                           selectedGuardId,
                                                           isLoading = false,
                                                           compact = false,
                                                         }) => {
  // Create a map for quick lookup of rankings
  const rankingMap = new Map(rankings.map(r => [r.guardId, r]));

  // Sort guards by score
  const sortedGuards = [...guards].sort((a, b) => b.overallScore - a.overallScore);
  const displayedGuards = compact ? sortedGuards.slice(0, 5) : sortedGuards;

  if (isLoading) {
    return (
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        <Box p={4} borderBottomWidth="1px" borderColor="gray.100">
          <Text fontWeight="semibold" color="gray.800">
            Guard Rankings
          </Text>
        </Box>
        <Table.Root variant="line">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w={20}>Rank</Table.ColumnHeader>
              <Table.ColumnHeader>Guard</Table.ColumnHeader>
              <Table.ColumnHeader>Site</Table.ColumnHeader>
              <Table.ColumnHeader w={24}>Score</Table.ColumnHeader>
              <Table.ColumnHeader w={32}>Rating</Table.ColumnHeader>
              <Table.ColumnHeader w={20}>Trend</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Array.from({ length: 5 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    );
  }

  if (guards.length === 0) {
    return (
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        p={8}
        textAlign="center"
      >
        <Icon as={LuTrophy} boxSize={12} color="gray.300" mb={3} />
        <Text color="gray.500">No performance data available</Text>
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      <HStack p={4} borderBottomWidth="1px" borderColor="gray.100" justify="space-between">
        <HStack gap={2}>
          <Icon as={LuTrophy} boxSize={5} color="yellow.500" />
          <Text fontWeight="semibold" color="gray.800">
            Guard Rankings
          </Text>
        </HStack>
        {compact && guards.length > 5 && (
          <Badge colorPalette="gray" variant="subtle">
            Top 5 of {guards.length}
          </Badge>
        )}
      </HStack>

      <Box overflowX="auto">
        <Table.Root variant="line">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w={20}>Rank</Table.ColumnHeader>
              <Table.ColumnHeader>Guard</Table.ColumnHeader>
              <Table.ColumnHeader>Site</Table.ColumnHeader>
              <Table.ColumnHeader w={24}>Score</Table.ColumnHeader>
              <Table.ColumnHeader w={32}>Rating</Table.ColumnHeader>
              <Table.ColumnHeader w={20}>Trend</Table.ColumnHeader>
              {onSelectGuard && <Table.ColumnHeader w={10} />}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {displayedGuards.map((guard, index) => {
              const ranking = rankingMap.get(guard.guardId);
              return (
                <GuardRow
                  key={guard.guardId}
                  guard={guard}
                  rank={index + 1}
                  previousRank={ranking?.previousRank}
                  isSelected={selectedGuardId === guard.guardId}
                  onClick={onSelectGuard ? () => onSelectGuard(guard.guardId) : undefined}
                />
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
};

export default GuardRankings;