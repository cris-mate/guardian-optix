/**
 * ClockWidget Component
 *
 * Main clock-in/out interface with GPS verification display.
 * Shows current time, clock status, and action buttons.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  Menu,
  Portal,
} from '@chakra-ui/react';
import {
  LuClock,
  LuMapPin,
  LuLogIn,
  LuLogOut,
  LuCoffee,
  LuPlay,
  LuTriangleAlert,
  LuCircleCheck,
  LuMapPinOff,
} from 'react-icons/lu';
import type {
  ClockStatus,
  BreakType,
  ActiveShift,
  GPSLocation,
  GeofenceStatus,
} from '../../../types/timeClock.types';

// ============================================
// Props Interface
// ============================================

interface ClockWidgetProps {
  clockStatus: ClockStatus;
  activeShift: ActiveShift | null;
  currentLocation: GPSLocation | null;
  geofenceStatus: GeofenceStatus;
  isClockingIn: boolean;
  isClockingOut: boolean;
  isProcessingBreak: boolean;
  isLocationLoading: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  onBreakStart: (breakType: BreakType) => void;
  onBreakEnd: () => void;
  onRefreshLocation: () => void;
}

// ============================================
// Status Styling
// ============================================

const statusStyles: Record<ClockStatus, { color: string; bg: string; label: string }> = {
  'clocked-out': { color: 'gray.600', bg: 'gray.100', label: 'Clocked Out' },
  'clocked-in': { color: 'green.600', bg: 'green.100', label: 'On Duty' },
  'on-break': { color: 'orange.600', bg: 'orange.100', label: 'On Break' },
};

const geofenceStyles: Record<GeofenceStatus, { color: string; icon: typeof LuCircleCheck; label: string }> = {
  inside: { color: 'green.500', icon: LuCircleCheck, label: 'Within Site Boundary' },
  outside: { color: 'red.500', icon: LuTriangleAlert, label: 'Outside Site Boundary' },
  unknown: { color: 'gray.500', icon: LuMapPinOff, label: 'Location Unknown' },
};

// ============================================
// Component
// ============================================

const ClockWidget: React.FC<ClockWidgetProps> = ({
                                                   clockStatus,
                                                   activeShift,
                                                   currentLocation,
                                                   geofenceStatus,
                                                   isClockingIn,
                                                   isClockingOut,
                                                   isProcessingBreak,
                                                   isLocationLoading,
                                                   onClockIn,
                                                   onClockOut,
                                                   onBreakStart,
                                                   onBreakEnd,
                                                   onRefreshLocation,
                                                 }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const statusStyle = statusStyles[clockStatus];
  const geoStyle = geofenceStyles[geofenceStatus];
  const GeoIcon = geoStyle.icon;

  const isProcessing = isClockingIn || isClockingOut || isProcessingBreak;

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      {/* Header with Status */}
      <Box
        bg={statusStyle.bg}
        px={6}
        py={3}
        borderBottomWidth="1px"
        borderColor="gray.200"
      >
        <HStack justify="space-between">
          <HStack gap={2}>
            <Box
              w={3}
              h={3}
              borderRadius="full"
              bg={statusStyle.color}
              animation={clockStatus === 'clocked-in' ? 'pulse 2s infinite' : undefined}
            />
            <Text fontWeight="semibold" color={statusStyle.color}>
              {statusStyle.label}
            </Text>
          </HStack>
          {activeShift && (
            <Badge colorPalette="blue" variant="subtle">
              {activeShift.site.name}
            </Badge>
          )}
        </HStack>
      </Box>

      {/* Main Content */}
      <VStack gap={6} p={6}>
        {/* Digital Clock */}
        <VStack gap={1}>
          <Text
            fontSize="5xl"
            fontWeight="bold"
            fontFamily="mono"
            color="gray.800"
            letterSpacing="wider"
          >
            {formatTime(currentTime)}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {formatDate(currentTime)}
          </Text>
        </VStack>

        {/* GPS Location Status */}
        <Box
          w="full"
          p={3}
          bg="gray.50"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <HStack justify="space-between">
            <HStack gap={2}>
              {isLocationLoading ? (
                <Spinner size="sm" color="blue.500" />
              ) : (
                <Box color={geoStyle.color}>
                  <GeoIcon size={18} />
                </Box>
              )}
              <VStack align="start" gap={0}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  GPS Location
                </Text>
                <Text fontSize="xs" color={geoStyle.color}>
                  {isLocationLoading ? 'Acquiring location...' : geoStyle.label}
                </Text>
              </VStack>
            </HStack>
            <Button
              size="xs"
              variant="ghost"
              onClick={onRefreshLocation}
              disabled={isLocationLoading}
            >
              <LuMapPin size={14} />
              Refresh
            </Button>
          </HStack>
          {currentLocation && !isLocationLoading && (
            <Text fontSize="xs" color="gray.500" mt={2}>
              {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
              {currentLocation.accuracy && ` (±${currentLocation.accuracy.toFixed(0)}m)`}
            </Text>
          )}
        </Box>

        {/* Action Buttons */}
        <VStack w="full" gap={3}>
          {clockStatus === 'clocked-out' && (
            <Button
              w="full"
              size="lg"
              colorPalette="green"
              onClick={onClockIn}
              disabled={isProcessing || geofenceStatus === 'outside'}
              loading={isClockingIn}
              loadingText="Clocking In..."
            >
              <LuLogIn size={20} />
              Clock In
            </Button>
          )}

          {clockStatus === 'clocked-in' && (
            <>
              <HStack w="full" gap={3}>
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Button
                      flex={1}
                      size="lg"
                      colorPalette="orange"
                      variant="outline"
                      disabled={isProcessing}
                    >
                      <LuCoffee size={18} />
                      Start Break
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.Item
                          value="paid"
                          onClick={() => onBreakStart('paid')}
                          disabled={isProcessingBreak}
                        >
                          Paid Break (15 min)
                        </Menu.Item>
                        <Menu.Item
                          value="unpaid"
                          onClick={() => onBreakStart('unpaid')}
                          disabled={isProcessingBreak}
                        >
                          Unpaid Break (Lunch)
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>

                <Button
                  flex={1}
                  size="lg"
                  colorPalette="red"
                  onClick={onClockOut}
                  disabled={isProcessing}
                  loading={isClockingOut}
                  loadingText="Clocking Out..."
                >
                  <LuLogOut size={18} />
                  Clock Out
                </Button>
              </HStack>
            </>
          )}

          {clockStatus === 'on-break' && (
            <Button
              w="full"
              size="lg"
              colorPalette="green"
              onClick={onBreakEnd}
              disabled={isProcessing}
              loading={isProcessingBreak}
              loadingText="Ending Break..."
            >
              <LuPlay size={20} />
              End Break & Resume
            </Button>
          )}

          {/* Warning for outside geofence */}
          {geofenceStatus === 'outside' && clockStatus === 'clocked-out' && (
            <HStack
              w="full"
              p={3}
              bg="red.50"
              borderRadius="md"
              borderWidth="1px"
              borderColor="red.200"
            >
              <LuTriangleAlert size={18} color="var(--chakra-colors-red-500)" />
              <Text fontSize="sm" color="red.700">
                You must be within the site boundary to clock in.
              </Text>
            </HStack>
          )}
        </VStack>

        {/* Shift Information */}
        {activeShift && (
          <Box
            w="full"
            p={4}
            bg="blue.50"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="blue.200"
          >
            <VStack align="start" gap={2}>
              <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                Today&apos;s Shift
              </Text>
              <HStack gap={4} wrap="wrap">
                <HStack gap={2}>
                  <LuClock size={14} color="var(--chakra-colors-blue-600)" />
                  <Text fontSize="sm" color="blue.800">
                    {new Date(parseInt(activeShift.scheduledStart)).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(parseInt(activeShift.scheduledEnd)).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <LuMapPin size={14} color="var(--chakra-colors-blue-600)" />
                  <Text fontSize="sm" color="blue.800">
                    {activeShift.site.name}
                  </Text>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ClockWidget;