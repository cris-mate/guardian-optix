/**
 * ScheduledReports Component
 *
 * Displays automated scheduled reports.
 * Shows frequency, next run time, and recipients.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  IconButton,
  Switch,
  Flex,
} from '@chakra-ui/react';
import {
  LuCalendarClock,
  LuMail,
  LuClock,
  LuTrash2,
  LuPencil,
  LuFileText,
  LuTable,
  LuSheet,
  LuPlay,
  LuPause,
} from 'react-icons/lu';
import type { ScheduledReport, ExportFormat } from '../types/reports.types';

// ============================================
// Props Interface
// ============================================

interface ScheduledReportsProps {
  reports: ScheduledReport[];
  onToggleActive?: (scheduleId: string, isActive: boolean) => void;
  onEdit?: (scheduleId: string) => void;
  onDelete?: (scheduleId: string) => void;
  isLoading?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const getFormatIcon = (format: ExportFormat): React.ElementType => {
  const icons: Record<ExportFormat, React.ElementType> = {
    pdf: LuFileText,
    csv: LuTable,
    xlsx: LuSheet,
  };
  return icons[format];
};

const getFrequencyLabel = (frequency: ScheduledReport['frequency']): string => {
  const labels: Record<ScheduledReport['frequency'], string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };
  return labels[frequency];
};

const getFrequencyColor = (frequency: ScheduledReport['frequency']): string => {
  const colors: Record<ScheduledReport['frequency'], string> = {
    daily: 'blue',
    weekly: 'green',
    monthly: 'purple',
  };
  return colors[frequency];
};

const formatNextRun = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 0) return 'Overdue';
  if (diffHours < 1) return 'Less than 1 hour';
  if (diffHours < 24) return `In ${diffHours} hours`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================
// Schedule Card Component
// ============================================

interface ScheduleCardProps {
  schedule: ScheduledReport;
  onToggleActive?: (isActive: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
                                                     schedule,
                                                     onToggleActive,
                                                     onEdit,
                                                     onDelete,
                                                   }) => {
  const FormatIcon = getFormatIcon(schedule.format);

  return (
    <Box
      p={4}
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={schedule.isActive ? 'green.200' : 'gray.200'}
      borderLeftWidth="4px"
      borderLeftColor={schedule.isActive ? 'green.400' : 'gray.300'}
      opacity={schedule.isActive ? 1 : 0.7}
      transition="all 0.2s"
      _hover={{ shadow: 'sm' }}
    >
      <VStack align="stretch" gap={3}>
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="flex-start" gap={0}>
            <Text fontWeight="semibold" color="gray.800" fontSize="sm">
              {schedule.templateName}
            </Text>
            <HStack gap={2}>
              <Badge
                colorPalette={getFrequencyColor(schedule.frequency)}
                variant="subtle"
                size="sm"
              >
                {getFrequencyLabel(schedule.frequency)}
              </Badge>
              <Badge colorPalette="gray" variant="subtle" size="sm">
                <HStack gap={1}>
                  <Icon as={FormatIcon} boxSize={3} />
                  <Text textTransform="uppercase">{schedule.format}</Text>
                </HStack>
              </Badge>
            </HStack>
          </VStack>

          {onToggleActive && (
            <Switch.Root
              checked={schedule.isActive}
              onCheckedChange={(e) => onToggleActive(e.checked)}
              size="sm"
              colorPalette="green"
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          )}
        </HStack>

        {/* Next Run */}
        <HStack gap={2} fontSize="sm" color="gray.500">
          <Icon as={LuClock} boxSize={4} />
          <Text>Next run: <Text as="span" fontWeight="medium" color="gray.700">{formatNextRun(schedule.nextRun)}</Text></Text>
        </HStack>

        {/* Recipients */}
        <HStack gap={2} fontSize="sm" color="gray.500">
          <Icon as={LuMail} boxSize={4} />
          <Text lineClamp={1} flex={1}>
            {schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}
          </Text>
        </HStack>

        {/* Actions */}
        <HStack justify="flex-end" gap={1} pt={1} borderTopWidth="1px" borderColor="gray.100">
          {onEdit && (
            <IconButton
              size="xs"
              variant="ghost"
              colorPalette="gray"
              aria-label="Edit schedule"
              onClick={onEdit}
            >
              <Icon as={LuPencil} boxSize={3} />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="xs"
              variant="ghost"
              colorPalette="red"
              aria-label="Delete schedule"
              onClick={onDelete}
            >
              <Icon as={LuTrash2} boxSize={3} />
            </IconButton>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

// ============================================
// Loading Skeleton
// ============================================

const ScheduleCardSkeleton: React.FC = () => (
  <Box
    p={4}
    bg="white"
    borderRadius="lg"
    borderWidth="1px"
    borderColor="gray.200"
  >
    <VStack align="stretch" gap={3}>
      <HStack justify="space-between">
        <VStack align="flex-start" gap={2}>
          <Box bg="gray.100" h={4} w={32} borderRadius="md" />
          <HStack gap={2}>
            <Box bg="gray.100" h={4} w={16} borderRadius="md" />
            <Box bg="gray.100" h={4} w={12} borderRadius="md" />
          </HStack>
        </VStack>
        <Box bg="gray.100" h={5} w={10} borderRadius="full" />
      </HStack>
      <Box bg="gray.100" h={4} w={40} borderRadius="md" />
      <Box bg="gray.100" h={4} w={28} borderRadius="md" />
    </VStack>
  </Box>
);

// ============================================
// Empty State
// ============================================

const EmptyState: React.FC = () => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    py={8}
    px={4}
    bg="gray.50"
    borderRadius="lg"
    borderWidth="1px"
    borderColor="gray.200"
    borderStyle="dashed"
  >
    <Icon as={LuCalendarClock} boxSize={10} color="gray.300" mb={3} />
    <Text fontWeight="medium" color="gray.600" mb={1}>
      No scheduled reports
    </Text>
    <Text fontSize="sm" color="gray.400" textAlign="center">
      Set up automated report delivery
    </Text>
  </Flex>
);

// ============================================
// Main Component
// ============================================

const ScheduledReports: React.FC<ScheduledReportsProps> = ({
                                                             reports,
                                                             onToggleActive,
                                                             onEdit,
                                                             onDelete,
                                                             isLoading = false,
                                                           }) => {
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
          <Icon as={LuCalendarClock} boxSize={5} color="purple.500" />
          <Text fontWeight="semibold" color="gray.800">
            Scheduled Reports
          </Text>
        </HStack>
        {reports.length > 0 && (
          <Badge colorPalette="purple" variant="subtle">
            {reports.filter(r => r.isActive).length} active
          </Badge>
        )}
      </HStack>

      {isLoading ? (
        <VStack align="stretch" gap={3} p={4}>
          {Array.from({ length: 2 }).map((_, i) => (
            <ScheduleCardSkeleton key={i} />
          ))}
        </VStack>
      ) : reports.length === 0 ? (
        <Box p={4}>
          <EmptyState />
        </Box>
      ) : (
        <VStack align="stretch" gap={3} p={4}>
          {reports.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onToggleActive={onToggleActive ? (active) => onToggleActive(schedule.id, active) : undefined}
              onEdit={onEdit ? () => onEdit(schedule.id) : undefined}
              onDelete={onDelete ? () => onDelete(schedule.id) : undefined}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ScheduledReports;