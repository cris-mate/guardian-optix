/**
 * RecommendedGuardsPanel Component
 *
 * Displays top 3 recommended guards for a shift based on:
 * - Distance from site (via postcode)
 * - Guard type match
 * - Licence validity
 * - Availability
 * - Certifications match
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  Icon,
} from '@chakra-ui/react';
import { LuSparkles, LuMapPin, LuShield, LuAward } from 'react-icons/lu';
import { api } from '../../../utils/api';
import { MOCK_CONFIG, simulateDelay } from '../../../config/api.config';

const USE_MOCK_DATA = MOCK_CONFIG.recommendedGuards;

// ============================================
// Types
// ============================================

interface ScoreBreakdown {
  distance: number;
  guardType: number;
  licence: number;
  availability: number;
  certifications: number;
}

interface RecommendedGuard {
  _id: string;
  fullName: string;
  siaLicenceNumber?: string;
  guardType?: string;
  postCode?: string;
  siaLicence?: {
    status: string;
    expiryDate: string;
  };
  certifications?: string[];
}

interface Recommendation {
  guard: RecommendedGuard;
  score: number;
  breakdown: ScoreBreakdown;
  distanceKm?: number;
}

interface RecommendedGuardsPanelProps {
  siteId: string | null;
  date: string;
  onSelect: (guardId: string) => void;
  selectedGuardId?: string;
}

// ============================================
// Helper Functions
// ============================================

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'orange';
};

const getRankBadgeColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'green';
    case 2:
      return 'blue';
    case 3:
      return 'gray';
    default:
      return 'gray';
  }
};

// ============================================
// Mock Data
// ============================================

const generateMockRecommendations = (): Recommendation[] => [
  {
    guard: {
      _id: 'rec-1',
      fullName: 'James Wilson',
      siaLicenceNumber: 'GO-2024-001',
      guardType: 'Static',
      postCode: 'SW1A 1AA',
      siaLicence: { status: 'valid', expiryDate: '2026-05-15' },
      certifications: ['First Aid', 'Fire Safety'],
    },
    score: 92,
    breakdown: {
      distance: 95,
      guardType: 100,
      licence: 100,
      availability: 100,
      certifications: 80,
    },
    distanceKm: 2.3,
  },
  {
    guard: {
      _id: 'rec-2',
      fullName: 'Sarah Thompson',
      siaLicenceNumber: 'GO-2024-002',
      guardType: 'Static',
      postCode: 'EC1A 1BB',
      siaLicence: { status: 'valid', expiryDate: '2025-08-20' },
      certifications: ['First Aid'],
    },
    score: 78,
    breakdown: {
      distance: 70,
      guardType: 100,
      licence: 100,
      availability: 100,
      certifications: 50,
    },
    distanceKm: 5.8,
  },
  {
    guard: {
      _id: 'rec-3',
      fullName: 'Michael Chen',
      siaLicenceNumber: 'GO-2024-003',
      guardType: 'Mobile Patrol',
      postCode: 'N1 9GU',
      siaLicence: { status: 'expiring-soon', expiryDate: '2025-02-10' },
      certifications: ['First Aid', 'CCTV Operations'],
    },
    score: 65,
    breakdown: {
      distance: 60,
      guardType: 30,
      licence: 50,
      availability: 100,
      certifications: 100,
    },
    distanceKm: 8.1,
  },
];

// ============================================
// Recommendation Card Component
// ============================================

interface RecommendationCardProps {
  recommendation: Recommendation;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
                                                                 recommendation,
                                                                 rank,
                                                                 isSelected,
                                                                 onSelect,
                                                               }) => {
  const { guard, score, distanceKm } = recommendation;

  return (
    <Box
      p={3}
      bg={isSelected ? 'blue.50' : 'white'}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={isSelected ? 'blue.300' : 'gray.200'}
      cursor="pointer"
      onClick={onSelect}
      transition="all 0.2s"
      _hover={{
        bg: isSelected ? 'blue.50' : 'gray.50',
        borderColor: isSelected ? 'blue.400' : 'gray.300',
        transform: 'translateY(-1px)',
        boxShadow: 'sm',
      }}
    >
      <HStack justify="space-between" align="flex-start">
        {/* Left: Rank and Guard Info */}
        <HStack gap={3} align="flex-start">
          <Badge
            colorPalette={getRankBadgeColor(rank)}
            variant="solid"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
          >
            #{rank}
          </Badge>

          <VStack align="flex-start" gap={0.5}>
            <Text fontWeight="semibold" fontSize="sm" color="gray.800">
              {guard.fullName}
            </Text>
            <HStack gap={2} flexWrap="wrap">
              {guard.siaLicenceNumber && (
                <Text fontSize="xs" color="gray.500">
                  {guard.siaLicenceNumber}
                </Text>
              )}
              {guard.guardType && (
                <Badge size="sm" variant="outline" colorPalette="purple">
                  {guard.guardType}
                </Badge>
              )}
            </HStack>

            {/* Quick Stats */}
            <HStack gap={3} mt={1}>
              {distanceKm !== undefined && (
                <HStack gap={1}>
                  <Icon as={LuMapPin} boxSize={3} color="gray.400" />
                  <Text fontSize="xs" color="gray.500">
                    {distanceKm.toFixed(1)} km
                  </Text>
                </HStack>
              )}
              {guard.siaLicence && (
                <HStack gap={1}>
                  <Icon as={LuShield} boxSize={3} color="gray.400" />
                  <Text
                    fontSize="xs"
                    color={
                      guard.siaLicence.status === 'valid'
                        ? 'green.600'
                        : 'orange.500'
                    }
                  >
                    {guard.siaLicence.status === 'valid' ? 'Valid' : 'Expiring'}
                  </Text>
                </HStack>
              )}
              {guard.certifications && guard.certifications.length > 0 && (
                <HStack gap={1}>
                  <Icon as={LuAward} boxSize={3} color="gray.400" />
                  <Text fontSize="xs" color="gray.500">
                    {guard.certifications.length} certs
                  </Text>
                </HStack>
              )}
            </HStack>
          </VStack>
        </HStack>

        {/* Right: Score */}
        <VStack gap={0} align="flex-end">
          <Text
            fontSize="lg"
            fontWeight="bold"
            color={`${getScoreColor(score)}.600`}
          >
            {score}%
          </Text>
          <Text fontSize="xs" color="gray.400">
            match
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
};

// ============================================
// Main Component
// ============================================

const RecommendedGuardsPanel: React.FC<RecommendedGuardsPanelProps> = ({
                                                                             siteId,
                                                                             date,
                                                                             onSelect,
                                                                             selectedGuardId,
                                                                           }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recommendations when site changes
  useEffect(() => {
    if (!siteId) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (USE_MOCK_DATA) {
          // Simulate API delay
          await simulateDelay('medium');
          setRecommendations(generateMockRecommendations());
        } else {
          const response = await api.get(
            `/scheduling/recommended-guards/${siteId}`,
            { params: { date } }
          );
          setRecommendations(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Unable to load recommendations');
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [siteId, date]);

  // Don't render if no site selected
  if (!siteId) {
    return null;
  }

  return (
    <Box
      bg="blue.50"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="blue.200"
      p={4}
      mb={4}
    >
      {/* Header */}
      <HStack gap={2} mb={3}>
        <Icon as={LuSparkles} color="blue.500" boxSize={4} />
        <Text fontSize="sm" fontWeight="semibold" color="blue.700">
          Recommended Guards
        </Text>
        {isLoading && <Spinner size="xs" color="blue.500" />}
      </HStack>

      {/* Content */}
      {error ? (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      ) : isLoading ? (
        <VStack py={4}>
          <Spinner size="sm" color="blue.500" />
          <Text fontSize="xs" color="gray.500">
            Analysing best matches...
          </Text>
        </VStack>
      ) : recommendations.length === 0 ? (
        <Text fontSize="sm" color="gray.500">
          No recommendations available for this site.
        </Text>
      ) : (
        <VStack gap={2} align="stretch">
          {recommendations.map((rec, index) => (
            <RecommendationCard
              key={rec.guard._id}
              recommendation={rec}
              rank={index + 1}
              isSelected={selectedGuardId === rec.guard._id}
              onSelect={() => onSelect(rec.guard._id)}
            />
          ))}
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
            Click to select • You can still choose manually below
          </Text>
        </VStack>
      )}
    </Box>
  );
};

export default RecommendedGuardsPanel;