/**
 * OfficerRankings Component
 *
 * Displays a leaderboard of security officers ranked by performance.
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
  OfficerPerformance,
  OfficerRanking,
} from '../types/performance.types';

// ============================================
// Props Interface
// ============================================

interface OfficerRankingsProps {
  officers: OfficerPerformance[];
  rankings: OfficerRanking[];
  onSelectOfficer?: (officerId: string) => void;
  selectedOfficerId?: string | null;
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
// Officer Row Component
// ============================================

interface OfficerRowProps {
  officer: OfficerPerformance;
  rank: number;
  previousRank?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const OfficerRow: React.FC<OfficerRowProps> = ({
                                                 officer,
                                                 rank,
                                                 previousRank,
                                                 isSelected,
                                                 onClick,
                                               }) => {
  const ratingConfig = getRatingConfig(officer.rating);

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
              {officer.officerName.split(' ').map(n => n[0]).join('')}
            </Avatar.Fallback>
            {officer.profileImage && <Avatar.Image src={officer.profileImage} />}
          </Avatar.Root>
          <VStack align="flex-start" gap={0}>
            <Text fontWeight="medium" color="gray.800">
              {officer.officerName}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {officer.badgeNumber} • {officer.guardType}
            </Text>
          </VStack>
        </HStack>
      </Table.Cell>

      <Table.Cell>
        <Text fontSize="sm" color="gray.600">
          {officer.site}
        </Text>
      </Table.Cell>

      <Table.Cell>
        <VStack align="flex-start" gap={1}>
          <HStack gap={2}>
            <Text fontWeight="bold" color={`${getScoreColor(officer.overallScore)}.600`}>
              {officer.overallScore}
            </Text>
            <Text fontSize="xs" color="gray.400">/100</Text>
          </HStack>
          <Progress.Root
            value={officer.overallScore}
            size="xs"
            colorPalette={getScoreColor(officer.overallScore)}
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
              officer.trends.overall === 'up'
                ? LuTrendingUp
                : officer.trends.overall === 'down'
                  ? LuTrendingDown
                  : LuMinus
            }
            boxSize={4}
            color={
              officer.trends.overall === 'up'
                ? 'green.500'
                : officer.trends.overall === 'down'
                  ? 'red.500'
                  : 'gray.400'
            }
          />
          <Text
            fontSize="sm"
            color={
              officer.trends.overall === 'up'
                ? 'green.500'
                : officer.trends.overall === 'down'
                  ? 'red.500'
                  : 'gray.400'
            }
          >
            {officer.trends.value}%
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

const OfficerRankings: React.FC<OfficerRankingsProps> = ({
                                                           officers,
                                                           rankings,
                                                           onSelectOfficer,
                                                           selectedOfficerId,
                                                           isLoading = false,
                                                           compact = false,
                                                         }) => {
  // Create a map for quick lookup of rankings
  const rankingMap = new Map(rankings.map(r => [r.officerId, r]));

  // Sort officers by score
  const sortedOfficers = [...officers].sort((a, b) => b.overallScore - a.overallScore);
  const displayedOfficers = compact ? sortedOfficers.slice(0, 5) : sortedOfficers;

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
            Officer Rankings
          </Text>
        </Box>
        <Table.Root variant="line">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w={20}>Rank</Table.ColumnHeader>
              <Table.ColumnHeader>Officer</Table.ColumnHeader>
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

  if (officers.length === 0) {
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
            Officer Rankings
          </Text>
        </HStack>
        {compact && officers.length > 5 && (
          <Badge colorPalette="gray" variant="subtle">
            Top 5 of {officers.length}
          </Badge>
        )}
      </HStack>

      <Box overflowX="auto">
        <Table.Root variant="line">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w={20}>Rank</Table.ColumnHeader>
              <Table.ColumnHeader>Officer</Table.ColumnHeader>
              <Table.ColumnHeader>Site</Table.ColumnHeader>
              <Table.ColumnHeader w={24}>Score</Table.ColumnHeader>
              <Table.ColumnHeader w={32}>Rating</Table.ColumnHeader>
              <Table.ColumnHeader w={20}>Trend</Table.ColumnHeader>
              {onSelectOfficer && <Table.ColumnHeader w={10} />}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {displayedOfficers.map((officer, index) => {
              const ranking = rankingMap.get(officer.officerId);
              return (
                <OfficerRow
                  key={officer.officerId}
                  officer={officer}
                  rank={index + 1}
                  previousRank={ranking?.previousRank}
                  isSelected={selectedOfficerId === officer.officerId}
                  onClick={onSelectOfficer ? () => onSelectOfficer(officer.officerId) : undefined}
                />
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
};

export default OfficerRankings;