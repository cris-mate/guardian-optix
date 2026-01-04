/**
 * ClockWidget Component
 *
 * Main clock-in/out interface with GPS verification display.
 * Shows current time, clock status, action buttons, and GPS simulation panel.
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
} from '@chakra-ui/react';
import {
  LuLogIn,
  LuLogOut,
  LuCoffee,
  LuPlay,
  LuTriangleAlert,
  LuCircleCheck,
  LuMapPinOff,
  LuRefreshCw,
} from 'react-icons/lu';
import SimulationPanel from './SimulationPanel';
import type {
  ClockStatus,
  ActiveShift,
  GPSLocation,
  GeofenceStatus,
  GeofenceConfig,
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
  onBreakStart: () => void;
  onBreakEnd: () => void;
  onRefreshLocation: () => void;
  // Simulation props
  geofenceConfig: GeofenceConfig | null;
  simulationEnabled: boolean;
  onSimulationEnabledChange: (enabled: boolean) => void;
  selectedScenario: string;
  onScenarioChange: (scenario: string) => void;
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
                                                   // Simulation props
                                                   geofenceConfig,
                                                   simulationEnabled,
                                                   onSimulationEnabledChange,
                                                   selectedScenario,
                                                   onScenarioChange,
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
  const handleStartBreak = () => onBreakStart();

  return (
    <Box>
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
            <Badge colorPalette="blue" variant="subtle" size="sm">
              {activeShift.site?.name || 'No Site'}
            </Badge>
          )}
        </HStack>
      </Box>

      {/* Time Display */}
      <VStack py={6} px={6} gap={1}>
        <Text
          fontSize="4xl"
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

      {/* Location Status */}
      <Box px={6} pb={4}>
        <HStack
          justify="space-between"
          p={3}
          bg="gray.50"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <HStack gap={2}>
            <Box color={geoStyle.color}>
              <GeoIcon size={18} />
            </Box>
            <VStack align="start" gap={0}>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                GPS Location
              </Text>
              <Text fontSize="xs" color="gray.500">
                {currentLocation?.address || geoStyle.label}
              </Text>
            </VStack>
          </HStack>
          <Button
            size="xs"
            variant="ghost"
            onClick={onRefreshLocation}
            disabled={isLocationLoading}
          >
            {isLocationLoading ? (
              <Spinner size="xs" />
            ) : (
              <>
                <LuRefreshCw size={14} />
                <Text ml={1}>Refresh</Text>
              </>
            )}
          </Button>
        </HStack>
      </Box>

      {/* Simulation Panel */}
      <Box px={6} pb={4}>
        <SimulationPanel
          config={geofenceConfig}
          enabled={simulationEnabled}
          onEnabledChange={onSimulationEnabledChange}
          selectedScenario={selectedScenario}
          onScenarioChange={onScenarioChange}
        />
      </Box>

      {/* Action Buttons */}
      <Box px={6} pb={6}>
        {clockStatus === 'clocked-out' && (
          <Button
            colorPalette="green"
            size="lg"
            w="full"
            onClick={() => onClockIn()}
            disabled={isProcessing}
          >
            {isClockingIn ? (
              <Spinner size="sm" mr={2} />
            ) : (
              <LuLogIn size={20} style={{ marginRight: 8 }} />
            )}
            {isClockingIn ? 'Clocking In...' : 'Clock In'}
          </Button>
        )}

        {clockStatus === 'clocked-in' && (
          <VStack gap={3}>
            {/* Break Button */}
            <Button
              colorPalette="orange"
              variant="outline"
              size="md"
              w="full"
              onClick={handleStartBreak}
              disabled={isProcessing}
            >
              {isProcessingBreak ? (
                <Spinner size="sm" mr={2} />
              ) : (
                <LuCoffee size={18} style={{ marginRight: 8 }} />
              )}
              {isProcessingBreak ? 'Starting Break...' : 'Start Break'}
            </Button>

            {/* Clock Out */}
            <Button
              colorPalette="red"
              size="lg"
              w="full"
              onClick={() => onClockOut()}
              disabled={isProcessing}
            >
              {isClockingOut ? (
                <Spinner size="sm" mr={2} />
              ) : (
                <LuLogOut size={20} style={{ marginRight: 8 }} />
              )}
              {isClockingOut ? 'Clocking Out...' : 'Clock Out'}
            </Button>
          </VStack>
        )}

        {clockStatus === 'on-break' && (
          <Button
            colorPalette="blue"
            size="lg"
            w="full"
            onClick={() => onBreakEnd()}
            disabled={isProcessing}
          >
            {isProcessingBreak ? (
              <Spinner size="sm" mr={2} />
            ) : (
              <LuPlay size={20} style={{ marginRight: 8 }} />
            )}
            {isProcessingBreak ? 'Ending Break...' : 'End Break'}
          </Button>
        )}
      </Box>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
};

export default ClockWidget;