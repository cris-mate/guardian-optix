/**
 * TimesheetSummary Component
 *
 * Displays today's timesheet summary with hours breakdown.
 * Shows total hours, breaks, and overtime calculations.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  Separator,
} from '@chakra-ui/react';
import {
  LuClock,
  LuCoffee,
  LuTrendingUp,
  LuCalendarDays,
  LuFileCheck,
} from 'react-icons/lu';
import type { TodayTimesheet, WeeklySummary, TimesheetStatus } from '../../../types/timeClock.types';

// ============================================
// Props Interface
// ============================================

interface TimesheetSummaryProps {
  todayTimesheet: TodayTimesheet | null;
  weeklySummary: WeeklySummary;
  isLoading: boolean;
}

// ============================================
// Status Configuration
// ============================================

const statusConfig: Record<TimesheetStatus, { color: string; label: string }> = {
  pending: { color: 'yellow', label: 'Pending' },
  submitted: { color: 'blue', label: 'Submitted' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
};

// ============================================
// Helper Functions
// ============================================

const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

// ============================================
// Stat Item Component
// ============================================

interface StatItemProps {
  icon: typeof LuClock;
  label: string;
  value: string;
  subValue?: string;
  colorScheme?: string;
}

const StatItem: React.FC<StatItemProps> = ({
                                             icon: Icon,
                                             label,
                                             value,
                                             subValue,
                                             colorScheme = 'gray',
                                           }) => (
  <HStack gap={3} p={3} bg="gray.50" borderRadius="lg">
    <Box
      p={2}
      borderRadius="md"
      bg={`${colorScheme}.100`}
      color={`${colorScheme}.600`}
    >
      <Icon size={18} />
    </Box>
    <VStack align="start" gap={0} flex={1}>
      <Text fontSize="xs" color="gray.500">
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="bold" color="gray.800">
        {value}
      </Text>
      {subValue && (
        <Text fontSize="xs" color="gray.500">
          {subValue}
        </Text>
      )}
    </VStack>
  </HStack>
);

// ============================================
// Component
// ============================================

const TimesheetSummary: React.FC<TimesheetSummaryProps> = ({
                                                             todayTimesheet,
                                                             weeklySummary,
                                                             isLoading,
                                                           }) => {
  // Calculate weekly progress (assuming 40 hours target)
  const weeklyTarget = 40;
  const weeklyProgress = Math.min((weeklySummary.totalHours / weeklyTarget) * 100, 100);

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      {/* Header */}
      <Box px={5} py={4} borderBottomWidth="1px" borderColor="gray.200">
        <HStack justify="space-between">
          <HStack gap={2}>
            <LuFileCheck size={20} color="var(--chakra-colors-blue-500)" />
            <Text fontWeight="semibold" color="gray.800">
              Timesheet Summary
            </Text>
          </HStack>
          {todayTimesheet && (
            <Badge
              colorPalette={statusConfig[todayTimesheet.status].color}
              variant="subtle"
            >
              {statusConfig[todayTimesheet.status].label}
            </Badge>
          )}
        </HStack>
      </Box>

      {/* Content */}
      <VStack align="stretch" p={5} gap={5}>
        {/* Today's Hours */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
            Today
          </Text>
          <SimpleGrid columns={2} gap={3}>
            <StatItem
              icon={LuClock}
              label="Hours Worked"
              value={todayTimesheet ? formatHours(todayTimesheet.totalHours) : '0h'}
              colorScheme="blue"
            />
            <StatItem
              icon={LuCoffee}
              label="Break Time"
              value={todayTimesheet ? formatMinutes(todayTimesheet.breakMinutes) : '0m'}
              colorScheme="orange"
            />
          </SimpleGrid>
        </Box>

        <Separator />

        {/* Weekly Summary */}
        <Box>
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              This Week
            </Text>
            <Text fontSize="xs" color="gray.500">
              {weeklySummary.daysWorked} days worked
            </Text>
          </HStack>

          {/* Weekly Progress Bar */}
          <Box mb={4}>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.600">
                {formatHours(weeklySummary.totalHours)} of {weeklyTarget}h
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                {weeklyProgress.toFixed(0)}%
              </Text>
            </HStack>
            <Progress.Root value={weeklyProgress} size="sm" colorPalette="blue">
              <Progress.Track borderRadius="full">
                <Progress.Range borderRadius="full" />
              </Progress.Track>
            </Progress.Root>
          </Box>

          <SimpleGrid columns={2} gap={3}>
            <StatItem
              icon={LuCalendarDays}
              label="Regular Hours"
              value={formatHours(weeklySummary.regularHours)}
              colorScheme="green"
            />
            <StatItem
              icon={LuTrendingUp}
              label="Overtime"
              value={formatHours(weeklySummary.overtimeHours)}
              subValue={weeklySummary.overtimeHours > 0 ? 'Above 40h/week' : undefined}
              colorScheme="purple"
            />
          </SimpleGrid>
        </Box>

        {/* Average Info */}
        <Box
          p={3}
          bg="blue.50"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="blue.200"
        >
          <HStack justify="space-between">
            <Text fontSize="sm" color="blue.700">
              Average per day
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="blue.800">
              {formatHours(weeklySummary.averageHoursPerDay)}
            </Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

// ============================================
// SimpleGrid Helper (inline to avoid import issues)
// ============================================

interface SimpleGridProps {
  columns: number;
  gap: number;
  children: React.ReactNode;
}

const SimpleGrid: React.FC<SimpleGridProps> = ({ columns, gap, children }) => (
  <Box
    display="grid"
    gridTemplateColumns={`repeat(${columns}, 1fr)`}
    gap={gap}
  >
    {children}
  </Box>
);

export default TimesheetSummary;