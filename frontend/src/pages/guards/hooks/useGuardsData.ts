/**
 * useGuardsData Hook
 *
 * Centralised data fetching and state management for Guards page.
 * Toggle USE_MOCK_DATA to switch between mock and API data.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../utils/api';
import {
  Guards,
  GuardsFilters,
  GuardsStats,
  GuardsFormData,
  Pagination,
  DEFAULT_FILTERS,
} from '../types/guards.types';

// Toggle this to switch between mock data and API calls
const USE_MOCK_DATA = true;

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
    badgeNumber: 'GO-2024-001',
    shift: 'Morning',
    availability: true,
    assignedSite: 'Westminster Office Complex',
    profileImage: '',
    startDate: '2023-06-15',
    siaLicence: {
      licenceNumber: '1234567890123456',
      licenceType: 'Security Guard',
      issueDate: '2023-01-15',
      expiryDate: '2026-01-15',
      status: 'valid',
    },
    certifications: ['First Aid', 'Fire Safety'],
    emergencyContact: {
      name: 'Sarah Wilson',
      relationship: 'Spouse',
      phone: '07700 900456',
    },
    createdAt: '2023-06-15T09:00:00Z',
    lastActiveAt: '2024-11-29T08:30:00Z',
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
    badgeNumber: 'GO-2024-002',
    shift: 'Night',
    availability: true,
    assignedSite: 'Canary Wharf Tower',
    startDate: '2022-03-10',
    siaLicence: {
      licenceNumber: '2345678901234567',
      licenceType: 'Close Protection',
      issueDate: '2022-03-01',
      expiryDate: '2025-03-01',
      status: 'expiring-soon',
    },
    certifications: ['First Aid', 'Advanced Driving', 'Conflict Management'],
    emergencyContact: {
      name: 'David Thompson',
      relationship: 'Brother',
      phone: '07700 900567',
    },
    createdAt: '2022-03-10T09:00:00Z',
    lastActiveAt: '2024-11-28T22:15:00Z',
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
    badgeNumber: 'GO-2024-003',
    shift: 'Afternoon',
    availability: false,
    assignedSite: 'Manchester Retail Park',
    startDate: '2023-09-01',
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
    badgeNumber: 'GO-2024-004',
    shift: 'Night',
    availability: false,
    startDate: '2021-11-20',
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
    badgeNumber: 'GO-2024-005',
    shift: 'Morning',
    availability: true,
    assignedSite: 'Leeds Business Centre',
    startDate: '2024-01-08',
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
  },
  {
    _id: '6',
    fullName: 'Charlotte Davies',
    username: 'c.davies',
    email: 'charlotte.davies@guardianoptix.co.uk',
    phoneNumber: '07700 900678',
    postCode: 'CF10 1EP',
    role: 'Manager',
    managerType: 'Operations Manager',
    status: 'on-duty',
    shift: null,
    availability: true,
    startDate: '2020-05-01',
    createdAt: '2020-05-01T09:00:00Z',
    lastActiveAt: '2024-11-29T09:30:00Z',
  },
  {
    _id: '7',
    fullName: 'Daniel Roberts',
    username: 'd.roberts',
    email: 'daniel.roberts@guardianoptix.co.uk',
    phoneNumber: '07700 900789',
    postCode: 'G2 1DY',
    role: 'Guard',
    guardType: 'Static',
    status: 'off-duty',
    badgeNumber: 'GO-2024-007',
    shift: 'Night',
    availability: false,
    startDate: '2023-02-14',
    siaLicence: {
      licenceNumber: '6789012345678901',
      licenceType: 'Security Guard',
      issueDate: '2023-02-01',
      expiryDate: '2026-02-01',
      status: 'valid',
    },
    certifications: ['First Aid', 'CCTV Operations'],
    createdAt: '2023-02-14T09:00:00Z',
    lastActiveAt: '2024-11-28T06:00:00Z',
  },
  {
    _id: '8',
    fullName: 'Amelia Johnson',
    username: 'a.johnson',
    email: 'amelia.johnson@guardianoptix.co.uk',
    phoneNumber: '07700 900890',
    postCode: 'EH1 1RE',
    role: 'Guard',
    guardType: 'Close Protection',
    status: 'on-duty',
    badgeNumber: 'GO-2024-008',
    shift: 'Morning',
    availability: true,
    assignedSite: 'Edinburgh Executive Suites',
    startDate: '2022-08-22',
    siaLicence: {
      licenceNumber: '7890123456789012',
      licenceType: 'Close Protection',
      issueDate: '2022-08-01',
      expiryDate: '2025-08-01',
      status: 'valid',
    },
    certifications: ['First Aid', 'Advanced Driving', 'Firearms Awareness'],
    createdAt: '2022-08-22T09:00:00Z',
    lastActiveAt: '2024-11-29T08:00:00Z',
  },
];

// ============================================
// Hook Implementation
// ============================================

interface UseGuardsDataReturn {
  guards: Guards[];
  selectedOfficer: Guards | null;
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
  selectOfficer: (id: string | null) => void;
  createOfficer: (data: GuardsFormData) => Promise<void>;
  updateOfficer: (id: string, data: Partial<GuardsFormData>) => Promise<void>;
  deleteOfficer: (id: string) => Promise<void>;
  refetch: () => void;
}

export const useGuardsData = (): UseGuardsDataReturn => {
  const [guards, setGuards] = useState<Guards[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<Guards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<GuardsFilters>(DEFAULT_FILTERS);

  // ============================================
  // Computed Statistics
  // ============================================

  const stats = useMemo<GuardsStats>(() => {
    const total = guards.length;
    const onDuty = guards.filter(p => p.status === 'on-duty').length;
    const offDuty = guards.filter(p => p.status === 'off-duty').length;
    const expiringLicences = guards.filter(
      p => p.siaLicence?.status === 'expiring-soon' || p.siaLicence?.status === 'expired'
    ).length;

    return { total, onDuty, offDuty, expiringLicences };
  }, [guards]);

  // ============================================
  // Filtered & Paginated Data
  // ============================================

  const filteredGuards = useMemo(() => {
    let result = [...guards];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p =>
        p.fullName.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower) ||
        p.badgeNumber?.toLowerCase().includes(searchLower) ||
        p.postCode.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(p => p.status === filters.status);
    }

    // Role filter
    if (filters.role !== 'all') {
      result = result.filter(p => p.role === filters.role);
    }

    // Guard type filter
    if (filters.guardType !== 'all') {
      result = result.filter(p => p.guardType === filters.guardType);
    }

    // Shift filter
    if (filters.shift !== 'all') {
      result = result.filter(p => p.shift === filters.shift);
    }

    // Availability filter
    if (filters.availability !== 'all') {
      const isAvailable = filters.availability === 'available';
      result = result.filter(p => p.availability === isAvailable);
    }

    // Licence status filter
    if (filters.licenceStatus !== 'all') {
      result = result.filter(p => p.siaLicence?.status === filters.licenceStatus);
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
          comparison = new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime();
          break;
        case 'licenceExpiry':
          const aExpiry = a.siaLicence?.expiryDate ? new Date(a.siaLicence.expiryDate).getTime() : Infinity;
          const bExpiry = b.siaLicence?.expiryDate ? new Date(b.siaLicence.expiryDate).getTime() : Infinity;
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
        await new Promise(resolve => setTimeout(resolve, 500));
        setGuards(MOCK_GUARDS);
      } else {
        const response = await api.get('/api/guards');
        setGuards(response.data.data || response.data);
      }
    } catch (err) {
      setError('Failed to load guards data');
      console.error('Error fetching guards:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOfficerDetails = useCallback(async (id: string) => {
    setIsLoadingDetails(true);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const officer = MOCK_GUARDS.find(p => p._id === id);
        setSelectedOfficer(officer || null);
      } else {
        const response = await api.get(`/api/guards/${id}`);
        setSelectedOfficer(response.data.data || response.data);
      }
    } catch (err) {
      console.error('Error fetching officer details:', err);
      setSelectedOfficer(null);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // ============================================
  // Actions
  // ============================================

  const setFilters = useCallback((newFilters: Partial<GuardsFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except page itself)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const selectOfficer = useCallback((id: string | null) => {
    if (id) {
      fetchOfficerDetails(id);
    } else {
      setSelectedOfficer(null);
    }
  }, [fetchOfficerDetails]);

  const createOfficer = useCallback(async (data: GuardsFormData) => {
    setIsMutating(true);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        // In mock mode, just refetch
      } else {
        await api.post('/api/guards', data);
      }
      await fetchGuards();
    } catch (err) {
      console.error('Error creating officer:', err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [fetchGuards]);

  const updateOfficer = useCallback(async (id: string, data: Partial<GuardsFormData>) => {
    setIsMutating(true);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        await api.put(`/api/guards/${id}`, data);
      }
      await fetchGuards();
      if (selectedOfficer?._id === id) {
        await fetchOfficerDetails(id);
      }
    } catch (err) {
      console.error('Error updating officer:', err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [fetchGuards, fetchOfficerDetails, selectedOfficer]);

  const deleteOfficer = useCallback(async (id: string) => {
    setIsMutating(true);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        await api.delete(`/api/guards/${id}`);
      }
      await fetchGuards();
      if (selectedOfficer?._id === id) {
        setSelectedOfficer(null);
      }
    } catch (err) {
      console.error('Error deleting officer:', err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [fetchGuards, selectedOfficer]);

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    fetchGuards();
  }, [fetchGuards]);

  return {
    guards: paginatedGuards,
    selectedOfficer,
    isLoading,
    isLoadingDetails,
    isMutating,
    error,
    filters,
    pagination,
    stats,
    setFilters,
    resetFilters,
    selectOfficer,
    createOfficer,
    updateOfficer,
    deleteOfficer,
    refetch: fetchGuards,
  };
};