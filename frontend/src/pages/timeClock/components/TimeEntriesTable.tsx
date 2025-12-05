/**
 * TimeEntriesTable Component
 *
 * Displays time entries with location data and status indicators.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Table,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import {
  LuLogIn,
  LuLogOut,
  LuCoffee,
  LuPlay,
  LuMapPin,
  LuCircleCheck,
  LuTriangleAlert,
  LuClock,
} from 'react-icons/lu';
import type { TimeEntry, EntryType, GeofenceStatus } from '../../../types/timeClock.types';

// ============================================
// Props Interface
// ============================================

interface TimeEntriesTableProps {
  entries: TimeEntry[];
  isLoading: boolean;
  showOfficerName?: boolean;
}

// ============================================
// Entry Type Styling
// ============================================

const entryTypeConfig: Record<EntryType, { icon: typeof LuLogIn; color: string; label: string }> = {
  'clock-in': { icon: LuLogIn, color: 'green', label: 'Clock In' },
  'clock-out': { icon: LuLogOut, color: 'red', label: 'Clock Out' },
  'break-start': { icon: LuCoffee, color: 'orange', label: 'Break Start' },
  'break-end': { icon: LuPlay, color: 'blue', label: 'Break End' },
};

const geofenceConfig: Record<GeofenceStatus, { color: string; icon: typeof LuCircleCheck }> = {
  inside: { color: 'green.500', icon: LuCircleCheck },
  outside: { color: 'red.500', icon: LuTriangleAlert },
  unknown: { color: 'gray.400', icon: LuMapPin },
};

// ============================================
// Component
// ============================================

const TimeEntriesTable: React.FC<TimeEntriesTableProps> = ({
                                                             entries,
                                                             isLoading,
                                                             showOfficerName = false,
                                                           }) => {
  // Format time
  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  // Empty state
  if (entries.length === 0) {
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
            <LuClock size={32} />
          </Box>
          <Text color="gray.500">No time entries for today</Text>
          <Text fontSize="sm" color="gray.400">
            Clock in to start tracking your time
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row bg="gray.50">
            <Table.ColumnHeader py={3} px={4}>
              Time
            </Table.ColumnHeader>
            <Table.ColumnHeader py={3} px={4}>
              Type
            </Table.ColumnHeader>
            {showOfficerName && (
              <Table.ColumnHeader py={3} px={4}>
                Officer
              </Table.ColumnHeader>
            )}
            <Table.ColumnHeader py={3} px={4}>
              Location
            </Table.ColumnHeader>
            <Table.ColumnHeader py={3} px={4}>
              Status
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {entries.map((entry) => {
            const typeConfig = entryTypeConfig[entry.type];
            const geoConfig = geofenceConfig[entry.geofenceStatus];
            const TypeIcon = typeConfig.icon;
            const GeoIcon = geoConfig.icon;

            return (
              <Table.Row
                key={entry._id}
                _hover={{ bg: 'gray.50' }}
                transition="background 0.2s"
              >
                <Table.Cell py={3} px={4}>
                  <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
                    {formatTime(entry.timestamp)}
                  </Text>
                </Table.Cell>
                <Table.Cell py={3} px={4}>
                  <HStack gap={2}>
                    <Box color={`${typeConfig.color}.500`}>
                      <TypeIcon size={16} />
                    </Box>
                    <Badge
                      colorPalette={typeConfig.color}
                      variant="subtle"
                      size="sm"
                    >
                      {typeConfig.label}
                    </Badge>
                  </HStack>
                </Table.Cell>
                {showOfficerName && (
                  <Table.Cell py={3} px={4}>
                    <Text fontSize="sm" color="gray.700">
                      {entry.officerName}
                    </Text>
                  </Table.Cell>
                )}
                <Table.Cell py={3} px={4}>
                  {entry.location ? (
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" color="gray.700">
                        {entry.siteName || 'Unknown Site'}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {entry.location.address ||
                          `${entry.location.latitude.toFixed(4)}, ${entry.location.longitude.toFixed(4)}`}
                      </Text>
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="gray.400">
                      No location data
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell py={3} px={4}>
                  <HStack gap={1}>
                    <Box color={geoConfig.color}>
                      <GeoIcon size={14} />
                    </Box>
                    <Text
                      fontSize="xs"
                      color={geoConfig.color}
                      textTransform="capitalize"
                    >
                      {entry.geofenceStatus === 'inside'
                        ? 'Verified'
                        : entry.geofenceStatus === 'outside'
                          ? 'Outside'
                          : 'Unknown'}
                    </Text>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default TimeEntriesTable;