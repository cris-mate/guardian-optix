/**
 * SimulationPanel Component
 *
 * Admin-only panel for testing geofence scenarios without physical GPS.
 * Only visible when simulation is enabled in config.
 */

import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  NativeSelect, Switch,
} from '@chakra-ui/react';
import { LuFlaskConical, LuTriangleAlert } from 'react-icons/lu';
import type { GeofenceConfig } from '../../../types/timeClock.types';

interface SimulationPanelProps {
  config: GeofenceConfig | null;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  selectedScenario: string;
  onScenarioChange: (scenario: string) => void;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({
                                                           config,
                                                           enabled,
                                                           onEnabledChange,
                                                           selectedScenario,
                                                           onScenarioChange,
                                                         }) => {
  // Don't render if simulation not available
  if (!config?.simulationEnabled) {
    return null;
  }

  return (
    <Box
      bg={enabled ? 'orange.50' : 'gray.50'}
      borderWidth="1px"
      borderColor={enabled ? 'orange.200' : 'gray.200'}
      borderRadius="lg"
      p={4}
    >
      <VStack align="stretch" gap={3}>
        {/* Header */}
        <HStack justify="space-between">
          <HStack gap={2}>
            <Box color={enabled ? 'orange.500' : 'gray.500'}>
              <LuFlaskConical size={18} />
            </Box>
            <Text fontWeight="medium" fontSize="sm">
              GPS Simulation Mode
            </Text>
            <Badge
              colorPalette={enabled ? 'orange' : 'gray'}
              variant="subtle"
              size="sm"
            >
              {config.enforcement === 'strict' ? 'Production' : 'Dev'}
            </Badge>
          </HStack>

          <Switch.Root
            checked={enabled}
            onCheckedChange={(e) => onEnabledChange(e.checked)}
            colorPalette="orange"
            size="sm"
          />
        </HStack>

        {/* Scenario Selector */}
        {enabled && (
          <>
            <NativeSelect.Root size="sm">
              <NativeSelect.Field
                value={selectedScenario}
                onChange={(e) => onScenarioChange(e.target.value)}
                bg="white"
              >
                {config.testScenarios.map((scenario) => (
                  <option key={scenario.value} value={scenario.value}>
                    {scenario.label}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>

            {/* Warning */}
            <HStack
              gap={2}
              p={2}
              bg="orange.100"
              borderRadius="md"
              fontSize="xs"
              color="orange.700"
            >
              <LuTriangleAlert size={14} />
              <Text>
                Entries will be flagged as simulated in audit logs
              </Text>
            </HStack>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default SimulationPanel;