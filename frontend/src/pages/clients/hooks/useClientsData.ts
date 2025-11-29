/**
 * useClientsData Hook
 * Centralized data fetching for Clients page.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';
import type {
  Client,
  ClientListResponse,
  ClientFilters,
  CreateClientPayload,
  UpdateClientPayload,
} from '../types/client.types';

// ============================================
// Configuration
// ============================================

const USE_MOCK_DATA = true; // Set to 'false' to use real API

// ============================================
// Mock Data
// ============================================

const mockClients: Client[] = [
  {
    id: '1',
    companyName: 'Canary Wharf Group',
    tradingName: 'Canary Wharf',
    status: 'active',
    industry: 'Real Estate',
    logoUrl: '',
    address: {
      street: 'One Canada Square',
      city: 'London',
      postCode: 'E14 5AB',
      country: 'United Kingdom',
      coordinates: { lat: 51.5049, lng: -0.0197 },
    },
    contacts: [
      {
        id: 'c1',
        firstName: 'Sarah',
        lastName: 'Mitchell',
        email: 'sarah.mitchell@canarywharf.com',
        phone: '+44 20 7418 2000',
        jobTitle: 'Head of Security',
        isPrimary: true,
      },
    ],
    primaryContact: {
      id: 'c1',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      email: 'sarah.mitchell@canarywharf.com',
      phone: '+44 20 7418 2000',
      jobTitle: 'Head of Security',
      isPrimary: true,
    },
    sites: [
      {
        id: 's1',
        name: 'One Canada Square - Main Lobby',
        address: {
          street: 'One Canada Square',
          city: 'London',
          postCode: 'E14 5AB',
          country: 'United Kingdom',
        },
        siteType: 'Corporate Office',
        status: 'active',
        guardsAssigned: 8,
        shiftsThisWeek: 42,
        hasGeofence: true,
        lastActivityAt: '2025-11-29T08:15:00Z',
      },
      {
        id: 's2',
        name: 'Jubilee Place Shopping Centre',
        address: {
          street: 'Jubilee Place',
          city: 'London',
          postCode: 'E14 5NY',
          country: 'United Kingdom',
        },
        siteType: 'Retail',
        status: 'active',
        guardsAssigned: 4,
        shiftsThisWeek: 28,
        hasGeofence: true,
        lastActivityAt: '2025-11-29T07:45:00Z',
      },
    ],
    totalSites: 2,
    activeSites: 2,
    totalGuardsAssigned: 12,
    incidentsThisMonth: 3,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2025-11-28T16:00:00Z',
    lastActivityAt: '2025-11-29T08:15:00Z',
  },
  {
    id: '2',
    companyName: 'Westfield London',
    status: 'active',
    industry: 'Retail',
    address: {
      street: 'Ariel Way',
      city: 'London',
      postCode: 'W12 7GF',
      country: 'United Kingdom',
    },
    contacts: [
      {
        id: 'c2',
        firstName: 'David',
        lastName: 'Chen',
        email: 'david.chen@westfield.com',
        phone: '+44 20 3371 2300',
        jobTitle: 'Security Director',
        isPrimary: true,
      },
    ],
    primaryContact: {
      id: 'c2',
      firstName: 'David',
      lastName: 'Chen',
      email: 'david.chen@westfield.com',
      phone: '+44 20 3371 2300',
      jobTitle: 'Security Director',
      isPrimary: true,
    },
    sites: [
      {
        id: 's3',
        name: 'Westfield London Main',
        address: {
          street: 'Ariel Way',
          city: 'London',
          postCode: 'W12 7GF',
          country: 'United Kingdom',
        },
        siteType: 'Shopping Centre',
        status: 'active',
        guardsAssigned: 15,
        shiftsThisWeek: 84,
        hasGeofence: true,
        lastActivityAt: '2025-11-29T09:00:00Z',
      },
    ],
    totalSites: 1,
    activeSites: 1,
    totalGuardsAssigned: 15,
    incidentsThisMonth: 7,
    createdAt: '2023-05-20T09:00:00Z',
    updatedAt: '2025-11-27T14:00:00Z',
    lastActivityAt: '2025-11-29T09:00:00Z',
  },
  {
    id: '3',
    companyName: 'British Museum',
    status: 'active',
    industry: 'Cultural Institution',
    address: {
      street: 'Great Russell Street',
      city: 'London',
      postCode: 'WC1B 3DG',
      country: 'United Kingdom',
    },
    contacts: [
      {
        id: 'c3',
        firstName: 'Emma',
        lastName: 'Thompson',
        email: 'emma.thompson@britishmuseum.org',
        phone: '+44 20 7323 8000',
        jobTitle: 'Security Manager',
        isPrimary: true,
      },
    ],
    primaryContact: {
      id: 'c3',
      firstName: 'Emma',
      lastName: 'Thompson',
      email: 'emma.thompson@britishmuseum.org',
      phone: '+44 20 7323 8000',
      jobTitle: 'Security Manager',
      isPrimary: true,
    },
    sites: [
      {
        id: 's4',
        name: 'British Museum Main Building',
        address: {
          street: 'Great Russell Street',
          city: 'London',
          postCode: 'WC1B 3DG',
          country: 'United Kingdom',
        },
        siteType: 'Museum',
        status: 'active',
        guardsAssigned: 20,
        shiftsThisWeek: 112,
        hasGeofence: true,
        lastActivityAt: '2025-11-29T08:30:00Z',
      },
    ],
    totalSites: 1,
    activeSites: 1,
    totalGuardsAssigned: 20,
    incidentsThisMonth: 2,
    createdAt: '2022-08-15T09:00:00Z',
    updatedAt: '2025-11-25T11:00:00Z',
    lastActivityAt: '2025-11-29T08:30:00Z',
  },
  {
    id: '4',
    companyName: 'Heathrow Airport Holdings',
    tradingName: 'Heathrow Airport',
    status: 'active',
    industry: 'Aviation',
    address: {
      street: 'The Compass Centre',
      city: 'Hounslow',
      postCode: 'TW6 2GW',
      country: 'United Kingdom',
    },
    contacts: [
      {
        id: 'c4',
        firstName: 'Michael',
        lastName: 'Roberts',
        email: 'michael.roberts@heathrow.com',
        phone: '+44 844 335 1801',
        jobTitle: 'Chief Security Officer',
        isPrimary: true,
      },
    ],
    primaryContact: {
      id: 'c4',
      firstName: 'Michael',
      lastName: 'Roberts',
      email: 'michael.roberts@heathrow.com',
      phone: '+44 844 335 1801',
      jobTitle: 'Chief Security Officer',
      isPrimary: true,
    },
    sites: [],
    totalSites: 4,
    activeSites: 4,
    totalGuardsAssigned: 50,
    incidentsThisMonth: 12,
    createdAt: '2021-03-01T09:00:00Z',
    updatedAt: '2025-11-28T09:00:00Z',
    lastActivityAt: '2025-11-29T06:00:00Z',
  },
  {
    id: '5',
    companyName: 'Savills Property Management',
    status: 'prospect',
    industry: 'Property Management',
    address: {
      street: '33 Margaret Street',
      city: 'London',
      postCode: 'W1G 0JD',
      country: 'United Kingdom',
    },
    contacts: [
      {
        id: 'c5',
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson@savills.com',
        phone: '+44 20 7499 8644',
        jobTitle: 'Property Manager',
        isPrimary: true,
      },
    ],
    primaryContact: {
      id: 'c5',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@savills.com',
      phone: '+44 20 7499 8644',
      jobTitle: 'Property Manager',
      isPrimary: true,
    },
    sites: [],
    totalSites: 0,
    activeSites: 0,
    totalGuardsAssigned: 0,
    incidentsThisMonth: 0,
    notes: 'Initial meeting scheduled for December 2025.',
    createdAt: '2025-11-20T14:00:00Z',
    updatedAt: '2025-11-20T14:00:00Z',
  },
  {
    id: '6',
    companyName: 'Former Client Ltd',
    status: 'inactive',
    industry: 'Hospitality',
    address: {
      street: '100 Old Street',
      city: 'London',
      postCode: 'EC1V 9BD',
      country: 'United Kingdom',
    },
    contacts: [],
    sites: [],
    totalSites: 0,
    activeSites: 0,
    totalGuardsAssigned: 0,
    incidentsThisMonth: 0,
    notes: 'Contract ended June 2025.',
    createdAt: '2023-01-15T09:00:00Z',
    updatedAt: '2025-06-30T17:00:00Z',
  },
];

// ============================================
// Hook Return Type
// ============================================

interface UseClientsDataReturn {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  isLoadingDetails: boolean;
  isMutating: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ClientFilters;
  setFilters: (filters: ClientFilters) => void;
  selectClient: (clientId: string | null) => void;
  refreshClients: () => Promise<void>;
  createClient: (payload: CreateClientPayload) => Promise<Client>;
  updateClient: (payload: UpdateClientPayload) => Promise<Client>;
  deleteClient: (clientId: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useClientsData(): UseClientsDataReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<ClientFilters>({
    search: '',
    status: 'all',
    sortBy: 'companyName',
    sortOrder: 'asc',
    page: 1,
    limit: 10,
  });

  // Fetch clients
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 400));

        let filtered = [...mockClients];

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(client =>
            client.companyName.toLowerCase().includes(searchLower) ||
            client.tradingName?.toLowerCase().includes(searchLower) ||
            client.address.postCode.toLowerCase().includes(searchLower) ||
            client.primaryContact?.firstName.toLowerCase().includes(searchLower) ||
            client.primaryContact?.lastName.toLowerCase().includes(searchLower)
          );
        }

        // Status filter
        if (filters.status && filters.status !== 'all') {
          filtered = filtered.filter(client => client.status === filters.status);
        }

        // Sorting
        filtered.sort((a, b) => {
          let aVal: string | number = '';
          let bVal: string | number = '';

          switch (filters.sortBy) {
            case 'companyName':
              aVal = a.companyName.toLowerCase();
              bVal = b.companyName.toLowerCase();
              break;
            case 'createdAt':
              aVal = new Date(a.createdAt).getTime();
              bVal = new Date(b.createdAt).getTime();
              break;
            case 'lastActivityAt':
              aVal = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
              bVal = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
              break;
            case 'totalSites':
              aVal = a.totalSites;
              bVal = b.totalSites;
              break;
          }

          return filters.sortOrder === 'desc'
            ? (aVal < bVal ? 1 : -1)
            : (aVal > bVal ? 1 : -1);
        });

        // Pagination
        const total = filtered.length;
        const totalPages = Math.ceil(total / (filters.limit || 10));
        const start = ((filters.page || 1) - 1) * (filters.limit || 10);
        const paginated = filtered.slice(start, start + (filters.limit || 10));

        setClients(paginated);
        setPagination({ page: filters.page || 1, limit: filters.limit || 10, total, totalPages });
      } else {
        const response = await api.get<ClientListResponse>('/clients', { params: filters });
        setClients(response.data.clients);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Select client
  const selectClient = useCallback(async (clientId: string | null) => {
    if (!clientId) {
      setSelectedClient(null);
      return;
    }

    setIsLoadingDetails(true);
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const client = mockClients.find(c => c.id === clientId);
        setSelectedClient(client || null);
      } else {
        const response = await api.get<Client>(`/clients/${clientId}`);
        setSelectedClient(response.data);
      }
    } catch (err) {
      console.error('Error fetching client:', err);
      setError('Failed to load client details.');
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Create client
  const createClient = useCallback(async (payload: CreateClientPayload): Promise<Client> => {
    setIsMutating(true);
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newClient: Client = {
          id: `new-${Date.now()}`,
          ...payload,
          contacts: [{ ...payload.primaryContact, id: `c-${Date.now()}`, isPrimary: true }],
          primaryContact: { ...payload.primaryContact, id: `c-${Date.now()}`, isPrimary: true },
          sites: [],
          totalSites: 0,
          activeSites: 0,
          totalGuardsAssigned: 0,
          incidentsThisMonth: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setClients(prev => [newClient, ...prev]);
        return newClient;
      } else {
        const response = await api.post<Client>('/clients', payload);
        await fetchClients();
        return response.data;
      }
    } finally {
      setIsMutating(false);
    }
  }, [fetchClients]);

  // Update client
  const updateClient = useCallback(async (payload: UpdateClientPayload): Promise<Client> => {
    setIsMutating(true);
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const updated = { ...selectedClient, ...payload, updatedAt: new Date().toISOString() } as Client;
        setClients(prev => prev.map(c => c.id === payload.id ? updated : c));
        setSelectedClient(updated);
        return updated;
      } else {
        const response = await api.put<Client>(`/clients/${payload.id}`, payload);
        await fetchClients();
        return response.data;
      }
    } finally {
      setIsMutating(false);
    }
  }, [fetchClients, selectedClient]);

  // Delete client
  const deleteClient = useCallback(async (clientId: string): Promise<void> => {
    setIsMutating(true);
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setClients(prev => prev.filter(c => c.id !== clientId));
        if (selectedClient?.id === clientId) setSelectedClient(null);
      } else {
        await api.delete(`/clients/${clientId}`);
        await fetchClients();
      }
    } finally {
      setIsMutating(false);
    }
  }, [fetchClients, selectedClient]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    selectedClient,
    isLoading,
    isLoadingDetails,
    isMutating,
    pagination,
    filters,
    setFilters,
    selectClient,
    refreshClients: fetchClients,
    createClient,
    updateClient,
    deleteClient,
    error,
    clearError: () => setError(null),
  };
}

export default useClientsData;