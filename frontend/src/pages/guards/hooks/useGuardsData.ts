/**
 * useGuardsData Hook
 *
 * Centralised data fetching and state management for Guards page.
 * Toggle USE_MOCK_DATA to switch between mock and API data.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../utils/api';
import { MOCK_CONFIG, simulateDelay } from '../../../config/api.config';
import {
  Guards,
  GuardsFilters,
  GuardsStats,
  GuardsFormData,
  Pagination,
  DEFAULT_FILTERS,
  DEFAULT_STATS,
} from '../../../types/guards.types';

const USE_MOCK_DATA = MOCK_CONFIG.guards;

// ============================================
// Mock Data
// ============================================

const MOCK_GUARDS: Guards[] = [
  {
    _id: '1',
    fullName: 'James Wilson',
    username: 'j.wilson',
    email: 'james.wilson@guardianoptix.co.uk',
    phoneNumber: '07700 900123',
    postCode: 'SW1A 1AA',
    role: 'Guard',
    guardType: 'Static',
    status: 'on-duty',
    siaLicenceNumber: 'GO-2024-001',
    availability: true,
    assignedSite: 'Westminster Office Complex',
    siaLicence: {
      licenceNumber: '1234567890123456',
      licenceType: 'Security Guard',
      issueDate: '2023-01-15',
      expiryDate: '2026-01-15',
      status: 'valid',
    },
    certifications: ['First Aid', 'Fire Safety'],
    createdAt: '2023-06-15T09:00:00Z',
    lastActiveAt: '2024-11-29T08:30:00Z',
    lastShift: {
      date: '2024-11-29',
      siteName: 'Westminster Office Complex',
      shiftType: 'Morning',
    },
  },
  {
    _id: '2',
    fullName: 'Emma Thompson',
    username: 'e.thompson',
    email: 'emma.thompson@guardianoptix.co.uk',
    phoneNumber: '07700 900234',
    postCode: 'E14 5AB',
    role: 'Guard',
    guardType: 'Close Protection',
    status: 'on-duty',
    siaLicenceNumber: 'GO-2024-002',
    availability: true,
    assignedSite: 'Canary Wharf Tower',
    siaLicence: {
      licenceNumber: '2345678901234567',
      licenceType: 'Close Protection',
      issueDate: '2022-03-01',
      expiryDate: '2025-03-01',
      status: 'expiring-soon',
    },
    certifications: ['First Aid', 'Advanced Driving', 'Conflict Management'],
    createdAt: '2022-03-10T09:00:00Z',
    lastActiveAt: '2024-11-28T22:15:00Z',
    lastShift: {
      date: '2024-11-28',
      siteName: 'Canary Wharf Tower',
      shiftType: 'Night',
    },
  },
  {
    _id: '3',
    fullName: 'Michael Chen',
    username: 'm.chen',
    email: 'michael.chen@guardianoptix.co.uk',
    phoneNumber: '07700 900345',
    postCode: 'M1 2WD',
    role: 'Guard',
    guardType: 'Mobile Patrol',
    status: 'on-duty',
    siaLicenceNumber: 'GO-2024-003',
    availability: false,
    assignedSite: 'Manchester Retail Park',
    siaLicence: {
      licenceNumber: '3456789012345678',
      licenceType: 'Security Guard',
      issueDate: '2023-08-15',
      expiryDate: '2026-08-15',
      status: 'valid',
    },
    certifications: ['First Aid', 'Vehicle Operations'],
    createdAt: '2023-09-01T09:00:00Z',
    lastActiveAt: '2024-11-29T14:45:00Z',
    lastShift: {
      date: '2024-11-29',
      siteName: 'Manchester Retail Park',
      shiftType: 'Afternoon',
    },
  },
  {
    _id: '4',
    fullName: 'Sophie Adams',
    username: 's.adams',
    email: 'sophie.adams@guardianoptix.co.uk',
    phoneNumber: '07700 900456',
    postCode: 'B2 4QA',
    role: 'Guard',
    guardType: 'Dog Handler',
    status: 'off-duty',
    siaLicenceNumber: 'GO-2024-004',
    availability: false,
    siaLicence: {
      licenceNumber: '4567890123456789',
      licenceType: 'Security Guard',
      issueDate: '2021-11-01',
      expiryDate: '2024-11-01',
      status: 'expired',
    },
    certifications: ['First Aid', 'K9 Handler Certification'],
    createdAt: '2021-11-20T09:00:00Z',
    lastActiveAt: '2024-11-15T18:00:00Z',
    lastShift: null,
  },
  {
    _id: '5',
    fullName: 'Oliver Brown',
    username: 'o.brown',
    email: 'oliver.brown@guardianoptix.co.uk',
    phoneNumber: '07700 900567',
    postCode: 'LS1 4DY',
    role: 'Guard',
    guardType: 'Static',
    status: 'on-duty',
    siaLicenceNumber: 'GO-2024-005',
    availability: true,
    assignedSite: 'Leeds Business Centre',
    siaLicence: {
      licenceNumber: '5678901234567890',
      licenceType: 'Door Supervisor',
      issueDate: '2024-01-01',
      expiryDate: '2027-01-01',
      status: 'valid',
    },
    certifications: ['First Aid'],
    createdAt: '2024-01-08T09:00:00Z',
    lastActiveAt: '2024-11-29T07:00:00Z',
    lastShift: {
      date: '2024-11-29',
      siteName: 'Leeds Business Centre',
      shiftType: 'Morning',
    },
  },
];

const MOCK_STATS: GuardsStats = {
  total: 5,
  onDuty: 3,
  offDuty: 2,
  onBreak: 0,
  late: 0,
  absent: 0,
  scheduled: 0,
  availableToday: 3,
  unassignedThisWeek: 1,
  expiringLicences: 2,
};

// ============================================
// Hook Interface
// ============================================

interface UseGuardsDataReturn {
  guards: Guards[];
  selectedGuard: Guards | null;
  isLoading: boolean;
  isLoadingDetails: boolean;
  isMutating: boolean;
  error: string | null;
  filters: GuardsFilters;
  pagination: Pagination;
  stats: GuardsStats;

  // Actions
  setFilters: (filters: Partial<GuardsFilters>) => void;
  resetFilters: () => void;
  selectGuard: (id: string | null) => void;
  createGuard: (data: GuardsFormData) => Promise<void>;
  updateGuard: (id: string, data: Partial<GuardsFormData>) => Promise<void>;
  deleteGuard: (id: string) => Promise<void>;
  refetch: () => void;
}

// ============================================
// Main Hook
// ============================================

export const useGuardsData = (): UseGuardsDataReturn => {
  const [guards, setGuards] = useState<Guards[]>([]);
  const [stats, setStats] = useState<GuardsStats>(DEFAULT_STATS);
  const [selectedGuard, setSelectedGuard] = useState<Guards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<GuardsFilters>(DEFAULT_FILTERS);

  // ============================================
  // Filtered & Paginated Data
  // ============================================

  const filteredGuards = useMemo(() => {
    let result = [...guards];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(searchLower) ||
          p.email.toLowerCase().includes(searchLower) ||
          p.siaLicenceNumber?.toLowerCase().includes(searchLower) ||
          p.postCode.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status);
    }

    // Role filter
    if (filters.role !== 'all') {
      result = result.filter((p) => p.role === filters.role);
    }

    // Guard type filter
    if (filters.guardType !== 'all') {
      result = result.filter((p) => p.guardType === filters.guardType);
    }

    // Availability filter
    if (filters.availability !== 'all') {
      const isAvailable = filters.availability === 'available';
      result = result.filter((p) => p.availability === isAvailable);
    }

    // Licence status filter
    if (filters.licenceStatus !== 'all') {
      result = result.filter((p) => p.siaLicence?.status === filters.licenceStatus);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'lastActive':
          comparison =
            new Date(b.lastActiveAt || 0).getTime() -
            new Date(a.lastActiveAt || 0).getTime();
          break;
        case 'licenceExpiry':
          const aExpiry = a.siaLicence?.expiryDate
            ? new Date(a.siaLicence.expiryDate).getTime()
            : Infinity;
          const bExpiry = b.siaLicence?.expiryDate
            ? new Date(b.siaLicence.expiryDate).getTime()
            : Infinity;
          comparison = aExpiry - bExpiry;
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [guards, filters]);

  // Pagination
  const pagination = useMemo<Pagination>(() => {
    const total = filteredGuards.length;
    const totalPages = Math.ceil(total / filters.limit);
    return {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages,
    };
  }, [filteredGuards.length, filters.page, filters.limit]);

  const paginatedGuards = useMemo(() => {
    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    return filteredGuards.slice(start, end);
  }, [filteredGuards, filters.page, filters.limit]);

  // ============================================
  // Data Fetching
  // ============================================

  const fetchGuards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await simulateDelay('medium');
        setGuards(MOCK_GUARDS);
        setStats(MOCK_STATS);
      } else {
        // Fetch guards and stats in parallel
        const [guardsRes, statsRes] = await Promise.all([
          api.get('/guards'),
          api.get('/guards/stats'),
        ]);

        setGuards(guardsRes.data.data || guardsRes.data);
        setStats(statsRes.data.data || statsRes.data);
      }
    } catch (err) {
      setError('Failed to load guards data');
      console.error('Error fetching guards:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGuardDetails = useCallback(async (id: string) => {
    setIsLoadingDetails(true);

    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('short');
        const guard = MOCK_GUARDS.find((p) => p._id === id);
        setSelectedGuard(guard || null);
      } else {
        const response = await api.get(`/guards/${id}`);
        setSelectedGuard(response.data.data || response.data);
      }
    } catch (err) {
      console.error('Error fetching guard details:', err);
      setSelectedGuard(null);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // ============================================
  // Actions
  // ============================================

  const setFilters = useCallback((newFilters: Partial<GuardsFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except page itself)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const selectGuard = useCallback(
    (id: string | null) => {
      if (id) {
        fetchGuardDetails(id);
      } else {
        setSelectedGuard(null);
      }
    },
    [fetchGuardDetails]
  );

  const createGuard = useCallback(
    async (data: GuardsFormData) => {
      setIsMutating(true);

      try {
        if (USE_MOCK_DATA) {
          await simulateDelay('medium');
          // In mock mode, just refetch
        } else {
          await api.post('/guards', data);
        }
        await fetchGuards();
      } catch (err) {
        console.error('Error creating guard:', err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchGuards]
  );

  const updateGuard = useCallback(
    async (id: string, data: Partial<GuardsFormData>) => {
      setIsMutating(true);

      try {
        if (USE_MOCK_DATA) {
          await simulateDelay('medium');
        } else {
          await api.put(`/guards/${id}`, data);
        }
        await fetchGuards();
        if (selectedGuard?._id === id) {
          await fetchGuardDetails(id);
        }
      } catch (err) {
        console.error('Error updating guard:', err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchGuards, fetchGuardDetails, selectedGuard]
  );

  const deleteGuard = useCallback(
    async (id: string) => {
      setIsMutating(true);

      try {
        if (USE_MOCK_DATA) {
          await simulateDelay('medium');
        } else {
          await api.delete(`/guards/${id}`);
        }
        await fetchGuards();
        if (selectedGuard?._id === id) {
          setSelectedGuard(null);
        }
      } catch (err) {
        console.error('Error deleting guard:', err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchGuards, selectedGuard]
  );

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    fetchGuards();
  }, [fetchGuards]);

  return {
    guards: paginatedGuards,
    selectedGuard,
    isLoading,
    isLoadingDetails,
    isMutating,
    error,
    filters,
    pagination,
    stats,
    setFilters,
    resetFilters,
    selectGuard,
    createGuard,
    updateGuard,
    deleteGuard,
    refetch: fetchGuards,
  };
};