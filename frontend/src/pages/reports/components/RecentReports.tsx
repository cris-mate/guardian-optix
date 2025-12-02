/**
 * RecentReports Component
 *
 * Displays recently generated reports with download options.
 * Shows report status, format, and expiration info.
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  IconButton,
  Table,
  Flex,
} from '@chakra-ui/react';
import {
  LuDownload,
  LuFileText,
  LuTable,
  LuSheet,
  LuClock,
  LuCircleCheck,
  LuLoader,
  LuCircleAlert,
  LuCalendar,
  LuTrash2,
  LuExternalLink,
  LuHistory,
} from 'react-icons/lu';
import type { GeneratedReport, ExportFormat, ReportStatus } from '../types/reports.types';

// ============================================
// Props Interface
// ============================================

interface RecentReportsProps {
  reports: GeneratedReport[];
  onDownload: (reportId: string) => void;
  onDelete?: (reportId: string) => void;
  isLoading?: boolean;
  compact?: boolean;
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

const getFormatColor = (format: ExportFormat): string => {
  const colors: Record<ExportFormat, string> = {
    pdf: 'red',
    csv: 'green',
    xlsx: 'blue',
  };
  return colors[format];
};

const getStatusConfig = (status: ReportStatus) => {
  const config: Record<ReportStatus, { icon: React.ElementType; color: string; label: string }> = {
    ready: { icon: LuCircleCheck, color: 'green', label: 'Ready' },
    generating: { icon: LuLoader, color: 'blue', label: 'Generating' },
    scheduled: { icon: LuClock, color: 'purple', label: 'Scheduled' },
    failed: { icon: LuCircleAlert, color: 'red', label: 'Failed' },
  };
  return config[status];
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateRange = (start: Date, end: Date) => {
  const startStr = new Date(start).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
  const endStr = new Date(end).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
  return `${startStr} - ${endStr}`;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    operational: 'blue',
    attendance: 'green',
    incidents: 'orange',
    clients: 'purple',
    compliance: 'teal',
  };
  return colors[category] || 'gray';
};

// ============================================
// Report Row Component
// ============================================

interface ReportRowProps {
  report: GeneratedReport;
  onDownload: () => void;
  onDelete?: () => void;
}

const ReportRow: React.FC<ReportRowProps> = ({ report, onDownload, onDelete }) => {
  const statusConfig = getStatusConfig(report.status);
  const FormatIcon = getFormatIcon(report.format);

  return (
    <Table.Row _hover={{ bg: 'gray.50' }}>
      <Table.Cell>
        <VStack align="flex-start" gap={1}>
          <Text fontWeight="medium" color="gray.800" fontSize="sm">
            {report.templateName}
          </Text>
          <Badge
            colorPalette={getCategoryColor(report.category)}
            variant="subtle"
            size="sm"
            textTransform="capitalize"
          >
            {report.category}
          </Badge>
        </VStack>
      </Table.Cell>

      <Table.Cell>
        <HStack gap={1} color="gray.500" fontSize="sm">
          <Icon as={LuCalendar} boxSize={3} />
          <Text>{formatDateRange(report.dateRange.start, report.dateRange.end)}</Text>
        </HStack>
      </Table.Cell>

      <Table.Cell>
        <VStack align="flex-start" gap={0}>
          <Text fontSize="sm" color="gray.700">
            {formatDate(report.generatedAt)}
          </Text>
          <Text fontSize="xs" color="gray.400">
            by {report.generatedBy}
          </Text>
        </VStack>
      </Table.Cell>

      <Table.Cell>
        <Badge
          colorPalette={getFormatColor(report.format)}
          variant="subtle"
        >
          <HStack gap={1}>
            <Icon as={FormatIcon} boxSize={3} />
            <Text textTransform="uppercase">{report.format}</Text>
          </HStack>
        </Badge>
      </Table.Cell>

      <Table.Cell>
        <Text fontSize="sm" color="gray.600">
          {formatFileSize(report.fileSize)}
        </Text>
      </Table.Cell>

      <Table.Cell>
        <Badge colorPalette={statusConfig.color} variant="subtle">
          <HStack gap={1}>
            <Icon
              as={statusConfig.icon}
              boxSize={3}
              className={report.status === 'generating' ? 'spin' : ''}
            />
            <Text>{statusConfig.label}</Text>
          </HStack>
        </Badge>
      </Table.Cell>

      <Table.Cell>
        <HStack gap={1}>
          {report.status === 'ready' && (
            <Button
              size="xs"
              colorPalette="blue"
              variant="ghost"
              onClick={onDownload}
            >
              <Icon as={LuDownload} boxSize={3} mr={1} />
              Download
            </Button>
          )}
          {onDelete && (
            <IconButton
              size="xs"
              variant="ghost"
              colorPalette="red"
              aria-label="Delete report"
              onClick={onDelete}
            >
              <Icon as={LuTrash2} boxSize={3} />
            </IconButton>
          )}
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
};

// ============================================
// Compact Report Card
// ============================================

interface CompactReportCardProps {
  report: GeneratedReport;
  onDownload: () => void;
}

const CompactReportCard: React.FC<CompactReportCardProps> = ({ report, onDownload }) => {
  const statusConfig = getStatusConfig(report.status);
  const FormatIcon = getFormatIcon(report.format);

  return (
    <HStack
      p={3}
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      justify="space-between"
      _hover={{ borderColor: 'gray.300' }}
      transition="all 0.15s"
    >
      <HStack gap={3} flex={1}>
        <Box
          p={2}
          borderRadius="md"
          bg={`${getFormatColor(report.format)}.50`}
          color={`${getFormatColor(report.format)}.600`}
        >
          <Icon as={FormatIcon} boxSize={4} />
        </Box>
        <VStack align="flex-start" gap={0} flex={1}>
          <Text fontSize="sm" fontWeight="medium" color="gray.800" lineClamp={1}>
            {report.templateName}
          </Text>
          <HStack gap={2} fontSize="xs" color="gray.400">
            <Text>{formatDate(report.generatedAt)}</Text>
            <Text>•</Text>
            <Text>{formatFileSize(report.fileSize)}</Text>
          </HStack>
        </VStack>
      </HStack>

      <HStack gap={2}>
        <Badge colorPalette={statusConfig.color} variant="subtle" size="sm">
          {statusConfig.label}
        </Badge>
        {report.status === 'ready' && (
          <IconButton
            size="xs"
            colorPalette="blue"
            variant="ghost"
            aria-label="Download"
            onClick={onDownload}
          >
            <Icon as={LuDownload} boxSize={4} />
          </IconButton>
        )}
      </HStack>
    </HStack>
  );
};

// ============================================
// Loading Skeleton
// ============================================

const RowSkeleton: React.FC = () => (
  <Table.Row>
    <Table.Cell>
      <VStack align="flex-start" gap={2}>
        <Box bg="gray.100" h={4} w={32} borderRadius="md" />
        <Box bg="gray.100" h={4} w={16} borderRadius="md" />
      </VStack>
    </Table.Cell>
    <Table.Cell><Box bg="gray.100" h={4} w={24} borderRadius="md" /></Table.Cell>
    <Table.Cell><Box bg="gray.100" h={4} w={28} borderRadius="md" /></Table.Cell>
    <Table.Cell><Box bg="gray.100" h={5} w={12} borderRadius="md" /></Table.Cell>
    <Table.Cell><Box bg="gray.100" h={4} w={12} borderRadius="md" /></Table.Cell>
    <Table.Cell><Box bg="gray.100" h={5} w={16} borderRadius="md" /></Table.Cell>
    <Table.Cell><Box bg="gray.100" h={6} w={20} borderRadius="md" /></Table.Cell>
  </Table.Row>
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
  >
    <Icon as={LuHistory} boxSize={10} color="gray.300" mb={3} />
    <Text fontWeight="medium" color="gray.600" mb={1}>
      No reports yet
    </Text>
    <Text fontSize="sm" color="gray.400" textAlign="center">
      Generate a report from the templates above
    </Text>
  </Flex>
);

// ============================================
// Main Component
// ============================================

const RecentReports: React.FC<RecentReportsProps> = ({
                                                       reports,
                                                       onDownload,
                                                       onDelete,
                                                       isLoading = false,
                                                       compact = false,
                                                     }) => {
  if (compact) {
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
            <Icon as={LuHistory} boxSize={5} color="gray.600" />
            <Text fontWeight="semibold" color="gray.800">
              Recent Reports
            </Text>
          </HStack>
          {reports.length > 0 && (
            <Badge colorPalette="gray" variant="subtle">
              {reports.length} reports
            </Badge>
          )}
        </HStack>

        {reports.length === 0 ? (
          <EmptyState />
        ) : (
          <VStack align="stretch" gap={2} p={3}>
            {reports.slice(0, 5).map((report) => (
              <CompactReportCard
                key={report.id}
                report={report}
                onDownload={() => onDownload(report.id)}
              />
            ))}
            {reports.length > 5 && (
              <Button size="sm" variant="ghost" colorPalette="blue">
                View all {reports.length} reports
              </Button>
            )}
          </VStack>
        )}
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
          <Icon as={LuHistory} boxSize={5} color="gray.600" />
          <Text fontWeight="semibold" color="gray.800">
            Report History
          </Text>
        </HStack>
        {reports.length > 0 && (
          <Text fontSize="sm" color="gray.500">
            {reports.length} reports generated
          </Text>
        )}
      </HStack>

      {isLoading ? (
        <Box overflowX="auto">
          <Table.Root variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Report</Table.ColumnHeader>
                <Table.ColumnHeader>Period</Table.ColumnHeader>
                <Table.ColumnHeader>Generated</Table.ColumnHeader>
                <Table.ColumnHeader>Format</Table.ColumnHeader>
                <Table.ColumnHeader>Size</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      ) : reports.length === 0 ? (
        <EmptyState />
      ) : (
        <Box overflowX="auto">
          <Table.Root variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Report</Table.ColumnHeader>
                <Table.ColumnHeader>Period</Table.ColumnHeader>
                <Table.ColumnHeader>Generated</Table.ColumnHeader>
                <Table.ColumnHeader>Format</Table.ColumnHeader>
                <Table.ColumnHeader>Size</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {reports.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  onDownload={() => onDownload(report.id)}
                  onDelete={onDelete ? () => onDelete(report.id) : undefined}
                />
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Spinner animation */}
      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default RecentReports;