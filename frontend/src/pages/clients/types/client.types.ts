/**
 * Client Types for Guardian Optix
 *
 * TypeScript interfaces for client management.
 */

// ============================================
// Core Types
// ============================================

export type ClientStatus = 'active' | 'inactive' | 'prospect';

export interface Address {
  street: string;
  city: string;
  postCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ClientContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle?: string;
  isPrimary: boolean;
}

export interface ClientSite {
  id: string;
  name: string;         // Job name
  address: Address;
  siteType: string;
  status: 'active' | 'inactive';
  guardsAssigned: number;
  shiftsThisWeek: number;
  hasGeofence: boolean;
  lastActivityAt?: string;
}

export interface Client {
  id: string;
  companyName: string;
  tradingName?: string;
  status: ClientStatus;
  industry?: string;
  logoUrl?: string;

  // Location
  address: Address;

  // Contacts
  contacts: ClientContact[];
  primaryContact?: ClientContact;

  // Sites (Jobs)
  sites: ClientSite[];
  totalSites: number;
  activeSites: number;

  // Metrics
  totalGuardsAssigned: number;
  incidentsThisMonth: number;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

// ============================================
// API Types
// ============================================

export interface ClientListResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientFilters {
  search?: string;
  status?: ClientStatus | 'all';
  sortBy?: 'companyName' | 'createdAt' | 'lastActivityAt' | 'totalSites';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================
// Form Types
// ============================================

export interface CreateClientPayload {
  companyName: string;
  tradingName?: string;
  status: ClientStatus;
  industry?: string;
  address: Omit<Address, 'coordinates'>;
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle?: string;
  };
  notes?: string;
}

export interface UpdateClientPayload extends Partial<CreateClientPayload> {
  id: string;
}

// ============================================
// Component Props Types
// ============================================

export interface ClientTableProps {
  clients: Client[];
  isLoading: boolean;
  onClientSelect: (client: Client) => void;
  onClientEdit: (client: Client) => void;
  selectedClientId?: string;
  filters: ClientFilters;
  onFiltersChange: (filters: ClientFilters) => void;
}

export interface ClientDetailsDrawerProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  isLoading?: boolean;
}