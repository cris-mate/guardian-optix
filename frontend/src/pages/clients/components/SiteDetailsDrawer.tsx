/**
 * SiteDetailsDrawer Component
 *
 * Side panel for viewing site details and managing shifts.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Button,
  Badge,
  Spinner,
  Tabs,
  Grid,
  GridItem,
  Flex,
  IconButton,
  Icon,
  Table,
} from '@chakra-ui/react';
import { Drawer } from '@chakra-ui/react';
import {
  LuX,
  LuMapPin,
  LuPhone,
  LuMail,
  LuBuilding2,
  LuCalendarClock,
  LuCalendarPlus,
  LuUserX,
  LuCircleCheck,
  LuClock,
  LuInfo,
  LuUsers,
  LuUser,
  LuRefreshCw,
} from 'react-icons/lu';
import { useAuth } from '../../../context/AuthContext';
import { toaster } from '../../../components/ui/toaster';
import { useGenerateShifts } from '../../scheduling';
import { api } from '../../../utils/api';
import { MOCK_CONFIG, simulateDelay } from '../../../config/api.config';
import type { SiteWithDetails } from '../hooks/useSitesData';

// ============================================
// Types
// ============================================

interface SiteDetailsDrawerProps {
  site: SiteWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  onAddShift: (site: SiteWithDetails) => void;
  onRefresh?: () => void;
}

// ============================================
// Shift Types for Display
// ============================================

interface SiteShift {
  _id: string;
  date: string;
  shiftType: 'Morning' | 'Afternoon' | 'Night';
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  guard: {
    _id: string;
    fullName: string;
    badgeNumber?: string;
  } | null;
}

// Mock shifts data
const mockShifts: SiteShift[] = [
  {
    _id: 'sh1',
    date: '2025-01-02',
    shiftType: 'Morning',
    startTime: '06:00',
    endTime: '14:00',
    status: 'scheduled',
    guard: { _id: 'g1', fullName: 'James Wilson', badgeNumber: 'G001' },
  },
  {
    _id: 'sh2',
    date: '2025-01-02',
    shiftType: 'Afternoon',
    startTime: '14:00',
    endTime: '22:00',
    status: 'scheduled',
    guard: null,
  },
  {
    _id: 'sh3',
    date: '2025-01-02',
    shiftType: 'Night',
    startTime: '22:00',
    endTime: '06:00',
    status: 'scheduled',
    guard: { _id: 'g2', fullName: 'Sarah Connor', badgeNumber: 'G002' },
  },
  {
    _id: 'sh4',
    date: '2025-01-03',
    shiftType: 'Morning',
    startTime: '06:00',
    endTime: '14:00',
    status: 'scheduled',
    guard: null,
  },
  {
    _id: 'sh5',
    date: '2025-01-03',
    shiftType: 'Night',
    startTime: '22:00',
    endTime: '06:00',
    status: 'scheduled',
    guard: { _id: 'g3', fullName: 'Michael Chen', badgeNumber: 'G003' },
  },
];

const USE_MOCK_DATA = MOCK_CONFIG.clients ?? true;

// ============================================
// Helpers
// ============================================

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusColor = (status: SiteWithDetails['status']): string => {
  return status === 'active' ? 'green' : 'gray';
};

const getDayName = (dayNum: number): string => {
  const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[dayNum] || '';
};

// ============================================
// Info Row Component
// ============================================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <HStack gap={3} py={2}>
    <Box color="gray.400">{icon}</Box>
    <Box flex={1}>
      <Text fontSize="xs" color="gray.500">{label}</Text>
      <Text fontSize="sm" color="gray.800">{value || '-'}</Text>
    </Box>
  </HStack>
);

// ============================================
// Overview Tab
// ============================================

interface OverviewTabProps {
  site: SiteWithDetails;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ site }) => (
  <VStack gap={5} align="stretch">
    {/* Address */}
    <Box>
      <Text fontWeight="semibold" color="gray.700" mb={3}>Location</Text>
      <Box bg="gray.50" borderRadius="md" p={4}>
        <HStack gap={3} align="flex-start">
          <Box color="gray.400" mt={1}><LuMapPin size={16} /></Box>
          <Box>
            <Text fontSize="sm" color="gray.800">{site.address.street}</Text>
            <Text fontSize="sm" color="gray.800">{site.address.city}</Text>
            <Text fontSize="sm" color="gray.800">{site.address.postCode}</Text>
            <Text fontSize="sm" color="gray.600">{site.address.country}</Text>
          </Box>
        </HStack>
        {site.hasGeofence && (
          <Badge colorPalette="blue" variant="subtle" size="sm" mt={3}>
            Geofence Enabled
          </Badge>
        )}
      </Box>
    </Box>

    {/* Site Contact */}
    {(site.contactName || site.contactPhone || site.contactEmail) && (
      <Box>
        <Text fontWeight="semibold" color="gray.700" mb={3}>Site Contact</Text>
        <Box bg="gray.50" borderRadius="md" p={4}>
          {site.contactName && (
            <InfoRow icon={<LuUsers size={16} />} label="Name" value={site.contactName} />
          )}
          {site.contactPhone && (
            <InfoRow icon={<LuPhone size={16} />} label="Phone" value={site.contactPhone} />
          )}
          {site.contactEmail && (
            <InfoRow icon={<LuMail size={16} />} label="Email" value={site.contactEmail} />
          )}
        </Box>
      </Box>
    )}

    {/* Special Instructions */}
    {site.specialInstructions && (
      <Box>
        <Text fontWeight="semibold" color="gray.700" mb={3}>Special Instructions</Text>
        <Box bg="yellow.50" borderRadius="md" p={4}>
          <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
            {site.specialInstructions}
          </Text>
        </Box>
      </Box>
    )}

    {/* Key Metrics */}
    <Box>
      <Text fontWeight="semibold" color="gray.700" mb={3}>This Week</Text>
      <Grid templateColumns="repeat(3, 1fr)" gap={3}>
        <GridItem>
          <Box bg="blue.50" borderRadius="md" p={3} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {site.totalShiftsThisWeek}
            </Text>
            <Text fontSize="xs" color="gray.600">Total Shifts</Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box bg="green.50" borderRadius="md" p={3} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {site.assignedShifts}
            </Text>
            <Text fontSize="xs" color="gray.600">Assigned</Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box
            bg={site.unassignedShifts > 0 ? 'orange.50' : 'gray.50'}
            borderRadius="md"
            p={3}
            textAlign="center"
          >
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color={site.unassignedShifts > 0 ? 'orange.600' : 'gray.600'}
            >
              {site.unassignedShifts}
            </Text>
            <Text fontSize="xs" color="gray.600">Unassigned</Text>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  </VStack>
);

// ============================================
// Requirements Tab
// ============================================

interface RequirementsTabProps {
  site: SiteWithDetails;
}

const RequirementsTab: React.FC<RequirementsTabProps> = ({ site }) => {
  const { requirements } = site;

  if (!requirements) {
    return (
      <Box bg="gray.50" borderRadius="md" p={6} textAlign="center">
        <Icon as={LuInfo} boxSize={8} color="gray.400" mb={3} />
        <Text color="gray.500">No coverage requirements configured.</Text>
        <Text fontSize="sm" color="gray.400" mt={1}>
          Default Night shift (22:00-06:00) will be used.
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap={5} align="stretch">
      {/* Contract Period */}
      <Box>
        <Text fontWeight="semibold" color="gray.700" mb={3}>Contract Period</Text>
        <Box bg="gray.50" borderRadius="md" p={4}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.600">Start Date</Text>
            <Text fontSize="sm" fontWeight="medium">{formatDate(requirements.contractStart)}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">End Date</Text>
            <Text fontSize="sm" fontWeight="medium">
              {requirements.isOngoing ? (
                <Badge colorPalette="green" variant="subtle">Ongoing</Badge>
              ) : (
                formatDate(requirements.contractEnd || undefined)
              )}
            </Text>
          </HStack>
        </Box>
      </Box>

      {/* Operating Days */}
      <Box>
        <Text fontWeight="semibold" color="gray.700" mb={3}>Operating Days</Text>
        <HStack gap={2} flexWrap="wrap">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <Badge
              key={day}
              colorPalette={requirements.daysOfWeek.includes(day) ? 'blue' : 'gray'}
              variant={requirements.daysOfWeek.includes(day) ? 'solid' : 'outline'}
              px={3}
              py={1}
            >
              {getDayName(day)}
            </Badge>
          ))}
        </HStack>
      </Box>

      {/* Shifts Per Day */}
      <Box>
        <Text fontWeight="semibold" color="gray.700" mb={3}>Daily Shift Requirements</Text>
        <VStack gap={2} align="stretch">
          {requirements.shiftsPerDay.map((shift, index) => (
            <Box key={index} bg="gray.50" borderRadius="md" p={3}>
              <HStack justify="space-between">
                <HStack gap={2}>
                  <Icon as={LuClock} color="gray.500" />
                  <Text fontSize="sm" fontWeight="medium">{shift.shiftType}</Text>
                </HStack>
                <HStack gap={2}>
                  <Badge colorPalette="blue" variant="subtle">
                    {shift.guardsRequired} guard{shift.guardsRequired !== 1 ? 's' : ''}
                  </Badge>
                  <Badge colorPalette="purple" variant="outline">
                    {shift.guardType}
                  </Badge>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
};

// ============================================
// Shifts Tab
// ============================================

interface ShiftsTabProps {
  site: SiteWithDetails;
  onAddShift: () => void;
  onGenerateShifts: () => void;
  isGenerating: boolean;
  isManager: boolean;
}

const ShiftsTab: React.FC<ShiftsTabProps> = ({
                                               site,
                                               onAddShift,
                                               onGenerateShifts,
                                               isGenerating,
                                               isManager,
                                             }) => {
  const [shifts, setShifts] = useState<SiteShift[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  // Fetch shifts for site
  const fetchShifts = useCallback(async () => {
    setIsLoadingShifts(true);
    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('short');
        setShifts(mockShifts);
      } else {
        const response = await api.get('/scheduling/shifts', {
          params: {
            siteId: site._id,
            startDate: new Date().toISOString().split('T')[0],
            limit: 20,
          },
        });
        setShifts(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching shifts:', err);
    } finally {
      setIsLoadingShifts(false);
    }
  }, [site._id]);

  useEffect(() => {
    void fetchShifts();
  }, [fetchShifts]);

  const coveragePercent = site.totalShiftsThisWeek > 0
    ? Math.round((site.assignedShifts / site.totalShiftsThisWeek) * 100)
    : 100;

  const formatShiftDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {weekday: 'short', day: '2-digit', month: 'short'});
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'Morning':
        return 'yellow';
      case 'Afternoon':
        return 'blue';
      case 'Night':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <VStack gap={5} align="stretch">
      {/* Actions */}
      {isManager && (
        <HStack gap={2}>
          <Button
            colorPalette="blue"
            size="sm"
            onClick={onAddShift}
            flex={1}
          >
            <Icon as={LuCalendarPlus} mr={2} />
            Add Shift
          </Button>
          <Button
            variant="outline"
            colorPalette="blue"
            size="sm"
            onClick={onGenerateShifts}
            disabled={isGenerating}
            flex={1}
          >
            <Icon as={LuCalendarClock} mr={2} />
            {isGenerating ? 'Generating...' : 'Generate 2wk'}
          </Button>
        </HStack>
      )}

      {/* Coverage Summary */}
      <Box bg="gray.50" borderRadius="lg" p={4}>
        <HStack justify="space-between" mb={3}>
          <Text fontWeight="semibold" color="gray.700">This Week's Coverage</Text>
          <Badge
            colorPalette={coveragePercent >= 90 ? 'green' : coveragePercent >= 70 ? 'yellow' : 'red'}
            variant="solid"
          >
            {coveragePercent}%
          </Badge>
        </HStack>

        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
          <Box bg="white" borderRadius="md" p={3} textAlign="center">
            <Icon as={LuCircleCheck} boxSize={5} color="green.500" mb={1} />
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {site.assignedShifts}
            </Text>
            <Text fontSize="xs" color="gray.500">Assigned</Text>
          </Box>
          <Box bg="white" borderRadius="md" p={3} textAlign="center">
            <Icon as={LuUserX} boxSize={5} color="orange.500" mb={1} />
            <Text fontSize="lg" fontWeight="bold" color="orange.600">
              {site.unassignedShifts}
            </Text>
            <Text fontSize="xs" color="gray.500">Unassigned</Text>
          </Box>
        </Grid>
      </Box>

      {/* Shifts List */}
      <Box>
        <HStack justify="space-between" mb={3}>
          <Text fontWeight="semibold" color="gray.700">Upcoming Shifts</Text>
          <IconButton
            aria-label="Refresh shifts"
            variant="ghost"
            size="xs"
            onClick={fetchShifts}
            disabled={isLoadingShifts}
          >
            <LuRefreshCw size={14} className={isLoadingShifts ? 'spin' : ''} />
          </IconButton>
        </HStack>

        {isLoadingShifts ? (
          <Flex justify="center" py={6}>
            <Spinner size="md" color="purple.500" />
          </Flex>
        ) : shifts.length === 0 ? (
          <Box bg="gray.50" borderRadius="lg" p={6} textAlign="center">
            <Icon as={LuCalendarClock} boxSize={8} color="gray.400" mb={3} />
            <Text color="gray.500">No shifts scheduled.</Text>
            {isManager && (
              <Text fontSize="sm" color="gray.400" mt={1}>
                Use "Generate 2wk" to auto-create shifts from requirements.
              </Text>
            )}
          </Box>
        ) : (
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            overflow="hidden"
          >
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row bg="gray.50">
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader>Type</Table.ColumnHeader>
                  <Table.ColumnHeader>Time</Table.ColumnHeader>
                  <Table.ColumnHeader>Guard</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {shifts.map((shift) => (
                  <Table.Row key={shift._id}>
                    <Table.Cell>
                      <Text fontSize="sm" fontWeight="medium">
                        {formatShiftDate(shift.date)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={getShiftTypeColor(shift.shiftType)}
                        variant="subtle"
                        size="sm"
                      >
                        {shift.shiftType}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm" color="gray.600">
                        {shift.startTime} - {shift.endTime}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      {shift.guard ? (
                        <HStack gap={1}>
                          <Icon as={LuUser} boxSize={3} color="gray.400" />
                          <Text fontSize="sm">{shift.guard.fullName}</Text>
                        </HStack>
                      ) : (
                        <Badge colorPalette="orange" variant="outline" size="sm">
                          <Icon as={LuUserX} boxSize={3} mr={1} />
                          Unassigned
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={getShiftStatusColor(shift.status)}
                        variant="subtle"
                        size="sm"
                        textTransform="capitalize"
                      >
                        {shift.status}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>

      {/* Unassigned Alert */}
      {site.unassignedShifts > 0 && (
        <Box
          bg="orange.50"
          borderRadius="lg"
          p={4}
          borderWidth="1px"
          borderColor="orange.200"
        >
          <HStack gap={2} mb={2}>
            <Icon as={LuUserX} color="orange.500" />
            <Text fontWeight="medium" color="orange.700" fontSize="sm">
              {site.unassignedShifts} shift{site.unassignedShifts !== 1 ? 's' : ''} need assignment
            </Text>
          </HStack>
          <Text fontSize="xs" color="orange.600">
            Use the Scheduling page to assign guards to these shifts.
          </Text>
        </Box>
      )}

      {/* All Assigned */}
      {site.unassignedShifts === 0 && site.totalShiftsThisWeek > 0 && (
        <Box
          bg="green.50"
          borderRadius="lg"
          p={4}
          borderWidth="1px"
          borderColor="green.200"
        >
          <HStack gap={2}>
            <Icon as={LuCircleCheck} color="green.500" />
            <Text fontWeight="medium" color="green.700" fontSize="sm">
              All shifts are assigned for this week
            </Text>
          </HStack>
        </Box>
      )}
    </VStack>
  );
};

// ============================================
// Main Component
// ============================================

const SiteDetailsDrawer: React.FC<SiteDetailsDrawerProps> = ({
                                                               site,
                                                               isOpen,
                                                               onClose,
                                                               isLoading = false,
                                                               onAddShift,
                                                               onRefresh,
                                                             }) => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager' || user?.role === 'Admin';
  const [activeTab, setActiveTab] = useState('overview');

  const { generate, isGenerating } = useGenerateShifts();

  const handleGenerateShifts = async () => {
    if (!site) return;

    try {
      const result = await generate(site._id, 2);
      toaster.create({
        title: 'Shifts Generated',
        description: `Created ${result.created} shifts for ${site.name}`,
        type: 'success',
        duration: 4000,
      });
      onRefresh?.();
    } catch (err: any) {
      toaster.create({
        title: 'Generation Failed',
        description: err.message,
        type: 'error',
        duration: 4000,
      });
    }
  };

  if (!site) return null;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="md">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          {/* Header */}
          <Drawer.Header borderBottomWidth="1px" borderColor="gray.200" px={6} py={4}>
            <HStack justify="space-between" align="flex-start" width="100%">
              <Box flex={1} pr={4}>
                <HStack gap={2} mb={1}>
                  <Icon as={LuMapPin} color="purple.500" />
                  <Badge
                    colorPalette={getStatusColor(site.status)}
                    variant="solid"
                    size="sm"
                    textTransform="capitalize"
                  >
                    {site.status}
                  </Badge>
                </HStack>
                <Text fontSize="lg" fontWeight="bold" color="gray.800" lineClamp={2}>
                  {site.name}
                </Text>
                <HStack gap={2} mt={1}>
                  <Icon as={LuBuilding2} boxSize={3} color="gray.400" />
                  <Text fontSize="sm" color="gray.500">
                    {site.client.companyName}
                  </Text>
                </HStack>
              </Box>
              <IconButton
                aria-label="Close drawer"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <LuX size={20} />
              </IconButton>
            </HStack>
          </Drawer.Header>

          {/* Body */}
          <Drawer.Body p={0}>
            {isLoading ? (
              <Flex justify="center" align="center" flex={1} py={16}>
                <VStack gap={4}>
                  <Spinner size="xl" color="purple.500" />
                  <Text color="gray.500">Loading...</Text>
                </VStack>
              </Flex>
            ) : (
              <Tabs.Root
                value={activeTab}
                onValueChange={(e) => setActiveTab(e.value)}
                variant="line"
              >
                <Tabs.List px={6} borderBottomWidth="1px" borderColor="gray.200">
                  <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
                  <Tabs.Trigger value="requirements">Requirements</Tabs.Trigger>
                  <Tabs.Trigger value="shifts">
                    Shifts
                    {site.unassignedShifts > 0 && (
                      <Badge colorPalette="orange" variant="solid" size="sm" ml={2}>
                        {site.unassignedShifts}
                      </Badge>
                    )}
                  </Tabs.Trigger>
                </Tabs.List>

                <Box flex={1} overflowY="auto" px={6} py={4}>
                  <Tabs.Content value="overview">
                    <OverviewTab site={site} />
                  </Tabs.Content>
                  <Tabs.Content value="requirements">
                    <RequirementsTab site={site} />
                  </Tabs.Content>
                  <Tabs.Content value="shifts">
                    <ShiftsTab
                      site={site}
                      onAddShift={() => onAddShift(site)}
                      onGenerateShifts={handleGenerateShifts}
                      isGenerating={isGenerating}
                      isManager={isManager}
                    />
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
            )}
          </Drawer.Body>

          {/* Footer */}
          <Drawer.Footer borderTopWidth="1px" borderColor="gray.200" px={6} py={3}>
            <HStack justify="space-between" fontSize="xs" color="gray.500" width="100%">
              <Text>Created: {formatDate(site.createdAt)}</Text>
              <Text>Updated: {formatDate(site.updatedAt)}</Text>
            </HStack>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};

export default SiteDetailsDrawer;