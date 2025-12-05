/**
 * useClientsData Hook
 * Centralized data fetching for Clients page.
 * Includes site creation functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import { MOCK_CONFIG, simulateDelay } from '../../../config/api.config';
import { api } from '../../../utils/api';
import type {
  Client,
  ClientListResponse,
  ClientFilters,
  CreateClientPayload,
  UpdateClientPayload,
  ClientSite,
} from '../../../types/client.types';
import type { CreateSiteFormData } from '../components/AddSiteModal';

// ============================================
// Configuration
// ============================================

const USE_MOCK_DATA = MOCK_CONFIG.clients ?? true;

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
        guardsAssigned: 6,
        shiftsThisWeek: 28,
        hasGeofence: true,
      },
    ],
    totalSites: 2,
    activeSites: 2,
    totalGuardsAssigned: 14,
    incidentsThisMonth: 3,
    notes: 'Premium client. Requires senior officers only.',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2025-11-28T14:30:00Z',
    lastActivityAt: '2025-11-28T14:30:00Z',
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
        firstName: 'James',
        lastName: 'Chen',
        email: 'j.chen@westfield.com',
        phone: '+44 20 8743 8000',
        jobTitle: 'Security Manager',
        isPrimary: true,
      },
    ],
    primaryContact: {
      id: 'c2',
      firstName: 'James',
      lastName: 'Chen',
      email: 'j.chen@westfield.com',
      phone: '+44 20 8743 8000',
      jobTitle: 'Security Manager',
      isPrimary: true,
    },
    sites: [
      {
        id: 's3',
        name: 'Main Entrance - Ground Floor',
        address: {
          street: 'Ariel Way',
          city: 'London',
          postCode: 'W12 7GF',
          country: 'United Kingdom',
        },
        siteType: 'Retail',
        status: 'active',
        guardsAssigned: 12,
        shiftsThisWeek: 56,
        hasGeofence: true,
      },
    ],
    totalSites: 1,
    activeSites: 1,
    totalGuardsAssigned: 12,
    incidentsThisMonth: 7,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2025-11-27T16:00:00Z',
  },
  {
    id: '3',
    companyName: 'TechHub Kings Cross',
    status: 'active',
    industry: 'Technology',
    address: {
      street: '20 Ropemaker Street',
      city: 'London',
      postCode: 'N1C 4AG',
      country: 'United Kingdom',
    },
    contacts: [
      {
        id: 'c3',
        firstName: 'Emily',
        lastName: 'Watson',
        email: 'emily@techhub.com',
        phone: '+44 20 3137 7500',
        jobTitle: 'Operations Director',
        isPrimary: true,
      },
    ],
    primaryContact: {
      id: 'c3',
      firstName: 'Emily',
      lastName: 'Watson',
      email: 'emily@techhub.com',
      phone: '+44 20 3137 7500',
      jobTitle: 'Operations Director',
      isPrimary: true,
    },
    sites: [],
    totalSites: 0,
    activeSites: 0,
    totalGuardsAssigned: 0,
    incidentsThisMonth: 0,
    notes: 'New client, awaiting site setup.',
    createdAt: '2025-11-01T09:00:00Z',
    updatedAt: '2025-11-01T09:00:00Z',
  },
  {
    id: '4',
    companyName: 'Hilton Hotel Park Lane',
    status: 'active',
    industry: 'Hospitality',
    address: {
      street: '22 Park Lane',
      city: 'London',
      postCode: 'W1K 1BE',
      country: 'United Kingdom',
    },
    contacts: [
      {
        id: 'c4',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'm.brown@hilton.com',
        phone: '+44 20 7493 8000',
        jobTitle: 'General Manager',
        isPrimary: true,
      },
    ],
    primaryContact: {
      id: 'c4',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'm.brown@hilton.com',
      phone: '+44 20 7493 8000',
      jobTitle: 'General Manager',
      isPrimary: true,
    },
    sites: [
      {
        id: 's4',
        name: 'Main Lobby & Reception',
        address: {
          street: '22 Park Lane',
          city: 'London',
          postCode: 'W1K 1BE',
          country: 'United Kingdom',
        },
        siteType: 'Hotel',
        status: 'active',
        guardsAssigned: 4,
        shiftsThisWeek: 21,
        hasGeofence: false,
      },
    ],
    totalSites: 1,
    activeSites: 1,
    totalGuardsAssigned: 4,
    incidentsThisMonth: 1,
    createdAt: '2024-06-15T11:00:00Z',
    updatedAt: '2025-11-20T09:00:00Z',
  },
  {
    id: '5',
    companyName: 'Prospect Construction Ltd',
    status: 'prospect',
    industry: 'Construction',
    address: {
      street: '45 Builder Street',
      city: 'London',
      postCode: 'SE1 9RT',
      country: 'United Kingdom',
    },
    contacts: [
      {
        id: 'c5',
        firstName: 'David',
        lastName: 'Thompson',
        email: 'd.thompson@prospectconstruction.co.uk',
        phone: '+44 20 7123 4567',
        jobTitle: 'Project Manager',
        isPrimary: true,
      },
    ],
    primaryContact: {
      id: 'c5',
      firstName: 'David',
      lastName: 'Thompson',
      email: 'd.thompson@prospectconstruction.co.uk',
      phone: '+44 20 7123 4567',
      jobTitle: 'Project Manager',
      isPrimary: true,
    },
    sites: [],
    totalSites: 0,
    activeSites: 0,
    totalGuardsAssigned: 0,
    incidentsThisMonth: 0,
    notes: 'Meeting scheduled for December.',
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
  createSite: (clientId: string, siteData: CreateSiteFormData) => Promise<void>;
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
        await simulateDelay('short');

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
        await simulateDelay('short');
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
        await simulateDelay('short');
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
        mockClients.unshift(newClient);
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
        await simulateDelay('short');
        const updated = { ...selectedClient, ...payload, updatedAt: new Date().toISOString() } as Client;
        const index = mockClients.findIndex(c => c.id === payload.id);
        if (index !== -1) mockClients[index] = updated;
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
        await simulateDelay('short');
        const index = mockClients.findIndex(c => c.id === clientId);
        if (index !== -1) mockClients.splice(index, 1);
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

  // Create site for a client
  const createSite = useCallback(async (clientId: string, siteData: CreateSiteFormData): Promise<void> => {
    setIsMutating(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('medium');

        // Create new site object
        const site: ClientSite = {
          id: `site-${Date.now()}`,
          name: siteData.name,
          address: siteData.address,
          siteType: siteData.siteType,
          status: 'active',
          guardsAssigned: 0,
          shiftsThisWeek: 0,
          hasGeofence: !!(siteData.geofence.latitude && siteData.geofence.longitude),
        };

        // Update mock data
        const clientIndex = mockClients.findIndex(c => c.id === clientId);
        if (clientIndex !== -1) {
          mockClients[clientIndex].sites.push(site);
          mockClients[clientIndex].totalSites += 1;
          mockClients[clientIndex].activeSites += 1;
          mockClients[clientIndex].updatedAt = new Date().toISOString();

          // Update selected client if it's the same
          if (selectedClient?.id === clientId) {
            const updatedClient = { ...mockClients[clientIndex] };
            setSelectedClient(updatedClient);
          }

          // Update clients list
          setClients(prev => prev.map(c =>
            c.id === clientId ? mockClients[clientIndex] : c
          ));
        }
      } else {
        // Build API payload
        const payload = {
          name: siteData.name,
          client: clientId,
          address: siteData.address,
          contactName: siteData.contactName || undefined,
          contactPhone: siteData.contactPhone || undefined,
          contactEmail: siteData.contactEmail || undefined,
          specialInstructions: siteData.specialInstructions || undefined,
          geofence: (siteData.geofence.latitude && siteData.geofence.longitude) ? {
            center: {
              latitude: parseFloat(siteData.geofence.latitude),
              longitude: parseFloat(siteData.geofence.longitude),
            },
            radius: parseInt(siteData.geofence.radius) || 100,
          } : undefined,
        };

        await api.post('/sites', payload);

        // Refresh client details to get updated site list
        await selectClient(clientId);
        await fetchClients();
      }
    } catch (err) {
      console.error('Error creating site:', err);
      setError('Failed to create site.');
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [fetchClients, selectClient, selectedClient]);

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
    createSite,
    error,
    clearError: () => setError(null),
  };
}

export default useClientsData;