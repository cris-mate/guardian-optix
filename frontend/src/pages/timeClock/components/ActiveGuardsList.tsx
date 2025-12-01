/**
 * ActiveGuardsList Component
 *
 * Displays list of guards currently on duty with their status.
 * Used by managers to monitor workforce in real-time.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Spinner,
  Flex,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  LuUser,
  LuMapPin,
  LuClock,
  LuCoffee,
  LuCircleCheck,
  LuTriangleAlert,
  LuCircleOff,
} from 'react-icons/lu';
import type { ActiveGuard, ClockStatus, GeofenceStatus } from '../types/timeClock.types';

// ============================================
// Props Interface
// ============================================

interface ActiveGuardsListProps {
  guards: ActiveGuard[];
  isLoading: boolean;
  onGuardClick?: (guard: ActiveGuard) => void;
}

// ============================================
// Status Configuration
// ============================================

const clockStatusConfig: Record<ClockStatus, { color: string; label: string; icon: typeof LuCircleCheck }> = {
  'clocked-in': { color: 'green', label: 'On Duty', icon: LuCircleCheck },
  'on-break': { color: 'orange', label: 'On Break', icon: LuCoffee },
  'clocked-out': { color: 'gray', label: 'Off Duty', icon: LuCircleOff },
};

const geofenceConfig: Record<GeofenceStatus, { color: string; icon: typeof LuCircleCheck }> = {
  inside: { color: 'green.500', icon: LuCircleCheck },
  outside: { color: 'red.500', icon: LuTriangleAlert },
  unknown: { color: 'gray.400', icon: LuMapPin },
};

// ============================================
// Guard Card Component
// ============================================

interface GuardCardProps {
  guard: ActiveGuard;
  onClick?: () => void;
}

const GuardCard: React.FC<GuardCardProps> = ({ guard, onClick }) => {
  const statusConfig = clockStatusConfig[guard.clockStatus];
  const geoConfig = geofenceConfig[guard.geofenceStatus];
  const StatusIcon = statusConfig.icon;
  const GeoIcon = geoConfig.icon;

  // Format hours
  const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Format clocked in time
  const formatClockedIn = (timestamp?: string): string => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={guard.geofenceStatus === 'outside' ? 'red.200' : 'gray.200'}
      p={4}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      _hover={onClick ? { borderColor: 'blue.300', shadow: 'sm' } : undefined}
      transition="all 0.2s"
    >
      <VStack align="stretch" gap={3}>
        {/* Header */}
        <HStack justify="space-between">
          <HStack gap={3}>
            <Avatar.Root size="sm">
              <Avatar.Fallback>
                {guard.fullName.split(' ').map(n => n[0]).join('')}
              </Avatar.Fallback>
              {guard.profileImage && <Avatar.Image src={guard.profileImage} />}
            </Avatar.Root>
            <VStack align="start" gap={0}>
              <Text fontWeight="medium" fontSize="sm" color="gray.800">
                {guard.fullName}
              </Text>
              {guard.badgeNumber && (
                <Text fontSize="xs" color="gray.500">
                  {guard.badgeNumber}
                </Text>
              )}
            </VStack>
          </HStack>
          <Badge colorPalette={statusConfig.color} variant="subtle">
            <HStack gap={1}>
              <StatusIcon size={12} />
              <Text>{statusConfig.label}</Text>
            </HStack>
          </Badge>
        </HStack>

        {/* Details */}
        {guard.clockStatus !== 'clocked-out' && (
          <VStack align="stretch" gap={2}>
            {/* Site */}
            {guard.currentSite && (
              <HStack gap={2}>
                <Box color="gray.400">
                  <LuMapPin size={14} />
                </Box>
                <Text fontSize="sm" color="gray.600">
                  {guard.currentSite}
                </Text>
                <Box color={geoConfig.color} ml="auto">
                  <GeoIcon size={14} />
                </Box>
              </HStack>
            )}

            {/* Time Info */}
            <HStack gap={4}>
              <HStack gap={2}>
                <Box color="gray.400">
                  <LuClock size={14} />
                </Box>
                <Text fontSize="xs" color="gray.500">
                  In: {formatClockedIn(guard.clockedInAt)}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.600" fontWeight="medium">
                {formatHours(guard.hoursToday)} today
              </Text>
            </HStack>

            {/* Geofence Warning */}
            {guard.geofenceStatus === 'outside' && (
              <HStack
                gap={2}
                p={2}
                bg="red.50"
                borderRadius="md"
                borderWidth="1px"
                borderColor="red.200"
              >
                <LuTriangleAlert size={14} color="var(--chakra-colors-red-500)" />
                <Text fontSize="xs" color="red.700">
                  Outside site boundary
                </Text>
              </HStack>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

// ============================================
// Main Component
// ============================================

const ActiveGuardsList: React.FC<ActiveGuardsListProps> = ({
                                                             guards,
                                                             isLoading,
                                                             onGuardClick,
                                                           }) => {
  // Loading state
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  // Filter and sort guards
  const activeGuards = guards.filter(g => g.clockStatus !== 'clocked-out');
  const inactiveGuards = guards.filter(g => g.clockStatus === 'clocked-out');

  // Empty state
  if (guards.length === 0) {
    return (
      <Box
        p={8}
        textAlign="center"
        bg="gray.50"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <VStack gap={3}>
          <Box color="gray.400">
            <LuUser size={32} />
          </Box>
          <Text color="gray.500">No guards data available</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {/* Active Guards */}
      {activeGuards.length > 0 && (
        <Box>
          <HStack mb={3}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              Currently Active
            </Text>
            <Badge colorPalette="green" variant="subtle">
              {activeGuards.length}
            </Badge>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            {activeGuards.map((guard) => (
              <GuardCard
                key={guard._id}
                guard={guard}
                onClick={onGuardClick ? () => onGuardClick(guard) : undefined}
              />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Off-Duty Guards */}
      {inactiveGuards.length > 0 && (
        <Box>
          <HStack mb={3}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.500">
              Off Duty
            </Text>
            <Badge colorPalette="gray" variant="subtle">
              {inactiveGuards.length}
            </Badge>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
            {inactiveGuards.map((guard) => (
              <GuardCard
                key={guard._id}
                guard={guard}
                onClick={onGuardClick ? () => onGuardClick(guard) : undefined}
              />
            ))}
          </SimpleGrid>
        </Box>
      )}
    </VStack>
  );
};

export default ActiveGuardsList;