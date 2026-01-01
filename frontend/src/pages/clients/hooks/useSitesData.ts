/**
 * useSitesData Hook
 *
 * Centralized data fetching for Sites tab in Clients page.
 * Fetches all sites with client info and shift statistics.
 */

import { useState, useEffect, useCallback } from 'react';
import { MOCK_CONFIG, simulateDelay } from '../../../config/api.config';
import { api } from '../../../utils/api';

// ============================================
// Types
// ============================================

export interface SiteWithDetails {
  _id: string;
  name: string;
  client: {
    _id: string;
    companyName: string;
  };
  address: {
    street: string;
    city: string;
    postCode: string;
    country: string;
  };
  siteType: string;
  status: 'active' | 'inactive';
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  specialInstructions?: string;
  requirements?: {
    contractStart: string;
    contractEnd: string | null;
    isOngoing: boolean;
    shiftsPerDay: Array<{
      shiftType: string;
      guardsRequired: number;
      guardType: string;
    }>;
    daysOfWeek: number[];
  };
  // Computed stats
  totalShiftsThisWeek: number;
  unassignedShifts: number;
  assignedShifts: number;
  hasGeofence: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  clientId?: string;
  sortBy: 'name' | 'clientName' | 'createdAt' | 'unassignedShifts';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseSitesDataReturn {
  sites: SiteWithDetails[];
  selectedSite: SiteWithDetails | null;
  isLoading: boolean;
  isLoadingDetails: boolean;
  error: string | null;
  pagination: Pagination;
  filters: SiteFilters;
  setFilters: (filters: SiteFilters) => void;
  selectSite: (siteId: string | null) => Promise<void>;
  refreshSites: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Configuration
// ============================================

const USE_MOCK_DATA = MOCK_CONFIG.clients ?? true;

const DEFAULT_FILTERS: SiteFilters = {
  search: '',
  status: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  limit: 20,
};

// ============================================
// Mock Data
// ============================================

const mockSites: SiteWithDetails[] = [
  {
    _id: 's1',
    name: 'One Canada Square - Main Lobby',
    client: { _id: '1', companyName: 'Canary Wharf Group' },
    address: {
      street: 'One Canada Square',
      city: 'London',
      postCode: 'E14 5AB',
      country: 'United Kingdom',
    },
    siteType: 'Corporate Office',
    status: 'active',
    contactName: 'Sarah Mitchell',
    contactPhone: '+44 20 7418 2000',
    contactEmail: 'sarah.mitchell@canarywharf.com',
    requirements: {
      contractStart: '2024-01-01',
      contractEnd: null,
      isOngoing: true,
      shiftsPerDay: [
        { shiftType: 'Morning', guardsRequired: 2, guardType: 'Static' },
        { shiftType: 'Afternoon', guardsRequired: 2, guardType: 'Static' },
        { shiftType: 'Night', guardsRequired: 1, guardType: 'Static' },
      ],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    },
    totalShiftsThisWeek: 35,
    unassignedShifts: 5,
    assignedShifts: 30,
    hasGeofence: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2025-01-10T14:20:00Z',
  },
  {
    _id: 's2',
    name: 'Jubilee Place Shopping Centre',
    client: { _id: '1', companyName: 'Canary Wharf Group' },
    address: {
      street: 'Jubilee Place',
      city: 'London',
      postCode: 'E14 5NY',
      country: 'United Kingdom',
    },
    siteType: 'Retail',
    status: 'active',
    requirements: {
      contractStart: '2024-02-01',
      contractEnd: null,
      isOngoing: true,
      shiftsPerDay: [
        { shiftType: 'Morning', guardsRequired: 2, guardType: 'Static' },
        { shiftType: 'Afternoon', guardsRequired: 2, guardType: 'Mobile Patrol' },
      ],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    },
    totalShiftsThisWeek: 28,
    unassignedShifts: 0,
    assignedShifts: 28,
    hasGeofence: true,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2025-01-08T11:45:00Z',
  },
  {
    _id: 's3',
    name: 'British Museum - Main Building',
    client: { _id: '2', companyName: 'British Museum' },
    address: {
      street: 'Great Russell Street',
      city: 'London',
      postCode: 'WC1B 3DG',
      country: 'United Kingdom',
    },
    siteType: 'Government',
    status: 'active',
    contactName: 'James Wright',
    contactPhone: '+44 20 7323 8000',
    specialInstructions: 'High-profile venue. Enhanced screening protocols.',
    requirements: {
      contractStart: '2024-03-20',
      contractEnd: null,
      isOngoing: true,
      shiftsPerDay: [
        { shiftType: 'Morning', guardsRequired: 4, guardType: 'Static' },
        { shiftType: 'Afternoon', guardsRequired: 4, guardType: 'Static' },
        { shiftType: 'Night', guardsRequired: 2, guardType: 'Static' },
      ],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    },
    totalShiftsThisWeek: 70,
    unassignedShifts: 14,
    assignedShifts: 56,
    hasGeofence: true,
    createdAt: '2024-03-20T09:00:00Z',
    updatedAt: '2025-01-09T16:30:00Z',
  },
  {
    _id: 's4',
    name: 'Westfield London Main',
    client: { _id: '3', companyName: 'Westfield London' },
    address: {
      street: 'Ariel Way',
      city: 'London',
      postCode: 'W12 7GF',
      country: 'United Kingdom',
    },
    siteType: 'Retail',
    status: 'active',
    requirements: {
      contractStart: '2024-02-01',
      contractEnd: null,
      isOngoing: true,
      shiftsPerDay: [
        { shiftType: 'Morning', guardsRequired: 6, guardType: 'Static' },
        { shiftType: 'Afternoon', guardsRequired: 8, guardType: 'Static' },
        { shiftType: 'Night', guardsRequired: 4, guardType: 'Mobile Patrol' },
      ],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    },
    totalShiftsThisWeek: 126,
    unassignedShifts: 18,
    assignedShifts: 108,
    hasGeofence: true,
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2025-01-09T16:30:00Z',
  },
  {
    _id: 's5',
    name: 'Tech Hub HQ',
    client: { _id: '4', companyName: 'Tech Hub London' },
    address: {
      street: '100 Liverpool Street',
      city: 'London',
      postCode: 'EC2M 2RH',
      country: 'United Kingdom',
    },
    siteType: 'Corporate Office',
    status: 'active',
    contactName: 'Michael Chen',
    contactPhone: '+44 20 7946 0958',
    specialInstructions: 'Access card system integration required.',
    requirements: {
      contractStart: '2024-06-15',
      contractEnd: null,
      isOngoing: true,
      shiftsPerDay: [
        { shiftType: 'Night', guardsRequired: 1, guardType: 'Static' },
      ],
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    totalShiftsThisWeek: 5,
    unassignedShifts: 0,
    assignedShifts: 5,
    hasGeofence: false,
    createdAt: '2024-06-15T11:00:00Z',
    updatedAt: '2025-01-07T09:15:00Z',
  },
];

// ============================================
// Hook Implementation
// ============================================

export function useSitesData(): UseSitesDataReturn {
  const [sites, setSites] = useState<SiteWithDetails[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SiteFilters>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Fetch sites
  const fetchSites = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('short');

        let filtered = [...mockSites];

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            (site) =>
              site.name.toLowerCase().includes(searchLower) ||
              site.client.companyName.toLowerCase().includes(searchLower) ||
              site.address.city.toLowerCase().includes(searchLower) ||
              site.address.postCode.toLowerCase().includes(searchLower)
          );
        }

        // Status filter
        if (filters.status !== 'all') {
          filtered = filtered.filter((site) => site.status === filters.status);
        }

        // Client filter
        if (filters.clientId) {
          filtered = filtered.filter((site) => site.client._id === filters.clientId);
        }

        // Sort
        filtered.sort((a, b) => {
          let aVal: string | number;
          let bVal: string | number;

          switch (filters.sortBy) {
            case 'clientName':
              aVal = a.client.companyName;
              bVal = b.client.companyName;
              break;
            case 'unassignedShifts':
              aVal = a.unassignedShifts;
              bVal = b.unassignedShifts;
              break;
            case 'createdAt':
              aVal = a.createdAt;
              bVal = b.createdAt;
              break;
            default:
              aVal = a.name;
              bVal = b.name;
          }

          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return filters.sortOrder === 'asc'
              ? aVal.localeCompare(bVal)
              : bVal.localeCompare(aVal);
          }
          return filters.sortOrder === 'asc'
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number);
        });

        // Pagination
        const total = filtered.length;
        const totalPages = Math.ceil(total / filters.limit);
        const start = (filters.page - 1) * filters.limit;
        const paginated = filtered.slice(start, start + filters.limit);

        setSites(paginated);
        setPagination({ page: filters.page, limit: filters.limit, total, totalPages });
      } else {
        const response = await api.get('/sites', {
          params: {
            search: filters.search || undefined,
            status: filters.status !== 'all' ? filters.status : undefined,
            clientId: filters.clientId || undefined,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            page: filters.page,
            limit: filters.limit,
          },
        });

        setSites(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
      setError('Failed to load sites.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Select site (load details)
  const selectSite = useCallback(async (siteId: string | null) => {
    if (!siteId) {
      setSelectedSite(null);
      return;
    }

    setIsLoadingDetails(true);

    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('short');
        const site = mockSites.find((s) => s._id === siteId);
        setSelectedSite(site || null);
      } else {
        const response = await api.get(`/sites/${siteId}`);
        setSelectedSite(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching site details:', err);
      setError('Failed to load site details.');
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return {
    sites,
    selectedSite,
    isLoading,
    isLoadingDetails,
    error,
    pagination,
    filters,
    setFilters,
    selectSite,
    refreshSites: fetchSites,
    clearError: () => setError(null),
  };
}

export default useSitesData;