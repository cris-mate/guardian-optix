import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Table,
  Input,
  Avatar,
  Menu,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiMoreVertical,
  FiPhone,
  FiMail,
  FiMapPin,
  FiChevronRight,
  FiUser,
  FiFilter,
} from 'react-icons/fi';
import type { GuardStatusEntry, GuardStatus } from '../types/dashboard.types';

// ============================================
// Types
// ============================================

interface GuardStatusTableProps {
  guards: GuardStatusEntry[];
  onGuardClick?: (guard: GuardStatusEntry) => void;
  showFilters?: boolean;
  maxVisible?: number;
}

// ============================================
// Status Configuration
// ============================================

const statusConfig: Record<GuardStatus, {
  colorScheme: string;
  label: string;
  dotColor: string;
}> = {
  'on-duty': {
    colorScheme: 'green',
    label: 'On Duty',
    dotColor: 'green.400',
  },
  'off-duty': {
    colorScheme: 'gray',
    label: 'Off Duty',
    dotColor: 'gray.400',
  },
  'on-break': {
    colorScheme: 'purple',
    label: 'On Break',
    dotColor: 'purple.400',
  },
  break: {
    colorScheme: 'yellow',
    label: 'On Break',
    dotColor: 'yellow.500'
  },
  scheduled: {
    colorScheme: 'blue',
    label: 'Scheduled',
    dotColor: 'blue.500'
  },
  'late': {
    colorScheme: 'orange',
    label: 'Late',
    dotColor: 'orange.400',
  },
  'absent': {
    colorScheme: 'red',
    label: 'Absent',
    dotColor: 'red.400',
  },
};

// ============================================
// Guard Row Component
// ============================================

interface GuardRowProps {
  guard: GuardStatusEntry;
  onClick?: () => void;
}

const GuardRow: React.FC<GuardRowProps> = ({ guard, onClick }) => {
  const config = statusConfig[guard.status];
  const navigate = useNavigate();

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return 'No recent activity';
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleMenuAction = (value: string) => {
    switch (value) {
      case 'profile':
        navigate(`/guards/${guard._id}`);
        break;
      case 'call':
        if (guard.contactInfo?.phone) {
          window.location.href = `tel:${guard.contactInfo.phone}`;
        }
        break;
      case 'email':
        if (guard.contactInfo?.email) {
          window.location.href = `mailto:${guard.contactInfo.email}`;
        }
        break;
      case 'location':
        navigate(`/tracking/${guard._id}`);
        break;
    }
  };

  return (
    <Table.Row
      _hover={{ bg: 'gray.50' }}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
    >
      {/* Guard Info */}
      <Table.Cell>
        <HStack gap={3}>
          <Avatar.Root size="sm">
            <Avatar.Image src={guard.avatar} alt={guard.name} />
            <Avatar.Fallback bg="blue.500" color="white">
              {getInitials(guard.name)}
            </Avatar.Fallback>
          </Avatar.Root>
          <VStack align="flex-start" gap={0}>
            <Text fontWeight="medium" fontSize="sm">
              {guard.name}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {guard.role}
            </Text>
          </VStack>
        </HStack>
      </Table.Cell>

      {/* Status */}
      <Table.Cell>
        <HStack gap={2}>
          <Box
            w={2}
            h={2}
            borderRadius="full"
            bg={config.dotColor}
            animation={guard.status === 'on-duty' ? 'pulse 2s infinite' : 'none'}
          />
          <Badge
            colorScheme={config.colorScheme}
            variant="subtle"
            size="sm"
          >
            {config.label}
          </Badge>
        </HStack>
      </Table.Cell>

      {/* Current Site */}
      <Table.Cell>
        {guard.currentSite ? (
          <HStack gap={1}>
            <Icon as={FiMapPin} boxSize={3} color="gray.400" />
            <Text fontSize="sm">{guard.currentSite}</Text>
          </HStack>
        ) : (
          <Text fontSize="sm" color="gray.400">—</Text>
        )}
      </Table.Cell>

      {/* Last ActivityHub */}
      <Table.Cell>
        <Text
          fontSize="xs"
          color="gray.600"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {formatLastActivity(guard.lastActivity)}
        </Text>
      </Table.Cell>

      {/* Actions */}
      <Table.Cell>
        <Menu.Root onSelect={(details) => handleMenuAction(details.value)}>
          <Menu.Trigger asChild>
            <Box
              as="button"
              p={2}
              borderRadius="md"
              cursor="pointer"
              _hover={{ bg: 'gray.100' }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              aria-label="More actions"
            >
              <Icon as={FiMoreVertical} boxSize={4} color="gray.500" />
            </Box>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item value="profile">
              <HStack gap={2}>
                <Icon as={FiUser} />
                <Text>View Profile</Text>
              </HStack>
            </Menu.Item>
            {guard.contactInfo?.phone && (
              <Menu.Item value="call">
                <HStack gap={2}>
                  <Icon as={FiPhone} />
                  <Text>Call</Text>
                </HStack>
              </Menu.Item>
            )}
            {guard.contactInfo?.email && (
              <Menu.Item value="email">
                <HStack gap={2}>
                  <Icon as={FiMail} />
                  <Text>Email</Text>
                </HStack>
              </Menu.Item>
            )}
            <Menu.Item value="location">
              <HStack gap={2}>
                <Icon as={FiMapPin} />
                <Text>View Location</Text>
              </HStack>
            </Menu.Item>
          </Menu.Content>
        </Menu.Root>
      </Table.Cell>
    </Table.Row>
  );
};

// ============================================
// Main Component
// ============================================

const GuardStatusTable: React.FC<GuardStatusTableProps> = ({
                                                             guards,
                                                             onGuardClick,
                                                             showFilters = true,
                                                             maxVisible = 10,
                                                           }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GuardStatus | 'all'>('all');

  // Filter guards
  const filteredGuards = useMemo(() => {
    return guards.filter(guard => {
      const matchesSearch = searchQuery === '' ||
        guard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guard.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guard.currentSite?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || guard.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [guards, searchQuery, statusFilter]);

  const visibleGuards = filteredGuards.slice(0, maxVisible);

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    return guards.reduce((acc, guard) => {
      acc[guard.status] = (acc[guard.status] || 0) + 1;
      return acc;
    }, {} as Record<GuardStatus, number>);
  }, [guards]);

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
      overflow="hidden"
    >
      {/* Header */}
      <Box p={5} borderBottomWidth="1px" borderColor="gray.100">
        <HStack justify="space-between" mb={showFilters ? 4 : 0}>
          <HStack gap={2}>
            <Icon as={FiUser} color="blue.500" />
            <Text fontWeight="semibold" color="gray.800">
              Guards Status
            </Text>
            <Badge colorScheme="blue" variant="subtle">
              {guards.filter(g => g.status === 'on-duty').length} active
            </Badge>
          </HStack>
          <Button
            size="xs"
            variant="ghost"
            colorScheme="blue"
            onClick={() => navigate('/guards')}
          >
            <Text>View All</Text>
            <Icon as={FiChevronRight} ml={1} />
          </Button>
        </HStack>

        {showFilters && (
          <VStack align="stretch" gap={3}>
            {/* Search */}
            <Box position="relative">
              <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                <Icon as={FiSearch} color="gray.400" boxSize={4} />
              </Box>
              <Input
                size="sm"
                pl={10}
                placeholder="Search by name, role, or site..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                borderRadius="md"
              />
            </Box>

            {/* Status Filters */}
            <HStack gap={2} flexWrap="wrap">
              <Button
                size="xs"
                variant={statusFilter === 'all' ? 'solid' : 'outline'}
                colorScheme="gray"
                onClick={() => setStatusFilter('all')}
              >
                <Text>All ({guards.length})</Text>
              </Button>
              {(Object.keys(statusConfig) as GuardStatus[]).map(status => (
                <Button
                  key={status}
                  size="xs"
                  variant={statusFilter === status ? 'solid' : 'outline'}
                  colorScheme={statusConfig[status].colorScheme}
                  onClick={() => setStatusFilter(status)}
                >
                  <Box
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={statusConfig[status].dotColor}
                    mr={2}
                  />
                  <Text>{statusConfig[status].label} ({statusCounts[status] || 0})</Text>
                </Button>
              ))}
            </HStack>
          </VStack>
        )}
      </Box>

      {/* Table */}
      {filteredGuards.length === 0 ? (
        <Box p={8} textAlign="center">
          <Icon as={FiFilter} boxSize={8} color="gray.300" mb={2} />
          <Text color="gray.500" fontSize="sm">No guards match your filters</Text>
        </Box>
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader>Guard</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>Current Site</Table.ColumnHeader>
              <Table.ColumnHeader>Last Activity</Table.ColumnHeader>
              <Table.ColumnHeader w={10}></Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {visibleGuards.map(guard => (
              <GuardRow
                key={guard._id}
                guard={guard}
                onClick={onGuardClick ? () => onGuardClick(guard) : undefined}
              />
            ))}
          </Table.Body>
        </Table.Root>
      )}

      {/* Footer - Show more */}
      {filteredGuards.length > maxVisible && (
        <Box p={3} textAlign="center" borderTopWidth="1px" borderColor="gray.100">
          <Button
            size="sm"
            variant="ghost"
            colorScheme="gray"
            onClick={() => navigate('/guards')}
          >
            <Text>View {filteredGuards.length - maxVisible} more guards</Text>
          </Button>
        </Box>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
};

export default GuardStatusTable;