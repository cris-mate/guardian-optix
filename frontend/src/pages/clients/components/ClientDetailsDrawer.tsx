/**
 * ClientDetailsDrawer Component
 *
 * Simplified side panel with tabs for:
 * - Overview (company info, primary contact, metrics)
 * - Sites (jobs/locations)
 * - Contacts
 */

import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
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
  Link,
  Image,
} from '@chakra-ui/react';
import { Drawer } from '@chakra-ui/react';
import {
  LuX,
  LuPencil,
  LuBuilding2,
  LuMapPin,
  LuPhone,
  LuMail,
  LuUsers,
  LuClock,
  LuShield,
} from 'react-icons/lu';
import type { ClientDetailsDrawerProps, Client, ClientSite, ClientContact } from '../../../types/client.types';

// ============================================
// Helpers
// ============================================

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStatusColor = (status: Client['status']): string => {
  switch (status) {
    case 'active': return 'green';
    case 'inactive': return 'gray';
    case 'prospect': return 'blue';
    default: return 'gray';
  }
};

const getSiteStatusColor = (status: ClientSite['status']): string => {
  return status === 'active' ? 'green' : 'gray';
};

const getInitials = (name: string): string => {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
};

// ============================================
// Company Logo Component
// ============================================

interface CompanyLogoProps {
  logoUrl?: string;
  companyName: string;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ logoUrl, companyName }) => {
  if (logoUrl) {
    return (
      <Image src={logoUrl} alt={companyName} w="56px" h="56px" borderRadius="lg" objectFit="contain" bg="gray.50" p={2} />
    );
  }
  return (
    <Flex w="56px" h="56px" borderRadius="lg" bg="blue.50" color="blue.600" align="center" justify="center" fontWeight="bold" fontSize="lg">
      {getInitials(companyName)}
    </Flex>
  );
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
      <Text fontSize="xs" color="gray.500" mb={0.5}>{label}</Text>
      <Text fontSize="sm" color="gray.800">{value || '-'}</Text>
    </Box>
  </HStack>
);

// ============================================
// Overview Tab
// ============================================

const OverviewTab: React.FC<{ client: Client }> = ({ client }) => (
  <VStack gap={4} align="stretch">
    {/* Company Info */}
    <Box>
      <Text fontWeight="semibold" color="gray.700" mb={3}>Company Information</Text>
      <Box bg="gray.50" borderRadius="md" p={4}>
        <InfoRow icon={<LuBuilding2 size={16} />} label="Company Name" value={client.companyName} />
        {client.tradingName && (
          <InfoRow icon={<LuBuilding2 size={16} />} label="Trading Name" value={client.tradingName} />
        )}
        {client.industry && (
          <InfoRow icon={<LuShield size={16} />} label="Industry" value={client.industry} />
        )}
      </Box>
    </Box>

    {/* Address */}
    <Box>
      <Text fontWeight="semibold" color="gray.700" mb={3}>Address</Text>
      <Box bg="gray.50" borderRadius="md" p={4}>
        <HStack gap={3} align="flex-start">
          <Box color="gray.400" mt={1}><LuMapPin size={16} /></Box>
          <Box>
            <Text fontSize="sm" color="gray.800">{client.address.street}</Text>
            <Text fontSize="sm" color="gray.800">{client.address.city}</Text>
            <Text fontSize="sm" color="gray.800">{client.address.postCode}</Text>
            <Text fontSize="sm" color="gray.600">{client.address.country}</Text>
          </Box>
        </HStack>
      </Box>
    </Box>

    {/* Primary Contact */}
    {client.primaryContact && (
      <Box>
        <Text fontWeight="semibold" color="gray.700" mb={3}>Primary Contact</Text>
        <Box bg="gray.50" borderRadius="md" p={4}>
          <HStack gap={3} mb={3}>
            <Flex w="40px" h="40px" borderRadius="full" bg="blue.100" color="blue.600" align="center" justify="center" fontWeight="bold" fontSize="sm">
              {client.primaryContact.firstName[0]}{client.primaryContact.lastName[0]}
            </Flex>
            <Box>
              <Text fontWeight="medium" color="gray.800">
                {client.primaryContact.firstName} {client.primaryContact.lastName}
              </Text>
              <Text fontSize="sm" color="gray.500">{client.primaryContact.jobTitle || 'Contact'}</Text>
            </Box>
          </HStack>
          <InfoRow
            icon={<LuMail size={16} />}
            label="Email"
            value={<Link href={`mailto:${client.primaryContact.email}`} color="blue.600">{client.primaryContact.email}</Link>}
          />
          <InfoRow icon={<LuPhone size={16} />} label="Phone" value={client.primaryContact.phone} />
        </Box>
      </Box>
    )}

    {/* Key Metrics */}
    <Box>
      <Text fontWeight="semibold" color="gray.700" mb={3}>Key Metrics</Text>
      <Grid templateColumns="repeat(2, 1fr)" gap={3}>
        <GridItem>
          <Box bg="blue.50" borderRadius="md" p={3} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">{client.totalSites}</Text>
            <Text fontSize="xs" color="gray.600">Total Sites</Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box bg="green.50" borderRadius="md" p={3} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="green.600">{client.totalGuardsAssigned}</Text>
            <Text fontSize="xs" color="gray.600">Guards Assigned</Text>
          </Box>
        </GridItem>
        <GridItem colSpan={2}>
          <Box bg={client.incidentsThisMonth > 5 ? 'red.50' : 'gray.50'} borderRadius="md" p={3} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color={client.incidentsThisMonth > 5 ? 'red.600' : 'gray.600'}>
              {client.incidentsThisMonth}
            </Text>
            <Text fontSize="xs" color="gray.600">Incidents This Month</Text>
          </Box>
        </GridItem>
      </Grid>
    </Box>

    {/* Notes */}
    {client.notes && (
      <Box>
        <Text fontWeight="semibold" color="gray.700" mb={3}>Notes</Text>
        <Box bg="yellow.50" borderRadius="md" p={4}>
          <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{client.notes}</Text>
        </Box>
      </Box>
    )}
  </VStack>
);

// ============================================
// Sites Tab
// ============================================

const SitesTab: React.FC<{ sites: ClientSite[] }> = ({ sites }) => (
  <VStack gap={4} align="stretch">
    <Text fontWeight="semibold" color="gray.700">Sites / Jobs ({sites.length})</Text>

    {sites.length === 0 ? (
      <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
        <LuMapPin size={32} style={{ margin: '0 auto', color: '#A0AEC0' }} />
        <Text color="gray.500" mt={2}>No sites configured</Text>
      </Box>
    ) : (
      <VStack gap={3} align="stretch">
        {sites.map((site) => (
          <Box key={site.id} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4}>
            <Flex justify="space-between" align="flex-start" mb={2}>
              <Box>
                <Text fontWeight="medium" color="gray.800">{site.name}</Text>
                <Text fontSize="sm" color="gray.500">{site.siteType}</Text>
              </Box>
              <Badge colorPalette={getSiteStatusColor(site.status)} variant="subtle">{site.status}</Badge>
            </Flex>

            <HStack gap={4} color="gray.600" fontSize="sm" mb={2}>
              <HStack gap={1}>
                <LuMapPin size={14} />
                <Text>{site.address.postCode}</Text>
              </HStack>
              <HStack gap={1}>
                <LuUsers size={14} />
                <Text>{site.guardsAssigned} guards</Text>
              </HStack>
              <HStack gap={1}>
                <LuClock size={14} />
                <Text>{site.shiftsThisWeek} shifts/week</Text>
              </HStack>
            </HStack>

            {site.hasGeofence && (
              <HStack gap={1} color="green.600" fontSize="xs">
                <LuShield size={12} />
                <Text>Geofence active</Text>
              </HStack>
            )}
          </Box>
        ))}
      </VStack>
    )}
  </VStack>
);

// ============================================
// Contacts Tab
// ============================================

const ContactsTab: React.FC<{ contacts: ClientContact[] }> = ({ contacts }) => (
  <VStack gap={4} align="stretch">
    <Text fontWeight="semibold" color="gray.700">Contacts ({contacts.length})</Text>

    {contacts.length === 0 ? (
      <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
        <LuUsers size={32} style={{ margin: '0 auto', color: '#A0AEC0' }} />
        <Text color="gray.500" mt={2}>No contacts added</Text>
      </Box>
    ) : (
      <VStack gap={3} align="stretch">
        {contacts.map((contact) => (
          <Box key={contact.id} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4}>
            <HStack gap={3} mb={3}>
              <Flex w="40px" h="40px" borderRadius="full" bg="blue.100" color="blue.600" align="center" justify="center" fontWeight="bold" fontSize="sm">
                {contact.firstName[0]}{contact.lastName[0]}
              </Flex>
              <Box flex={1}>
                <HStack gap={2}>
                  <Text fontWeight="medium" color="gray.800">
                    {contact.firstName} {contact.lastName}
                  </Text>
                  {contact.isPrimary && <Badge colorPalette="blue" size="sm">Primary</Badge>}
                </HStack>
                <Text fontSize="sm" color="gray.500">{contact.jobTitle || 'Contact'}</Text>
              </Box>
            </HStack>

            <Grid templateColumns="repeat(2, 1fr)" gap={2} fontSize="sm">
              <GridItem>
                <HStack gap={2} color="gray.600">
                  <LuMail size={14} />
                  <Link href={`mailto:${contact.email}`} color="blue.600">{contact.email}</Link>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack gap={2} color="gray.600">
                  <LuPhone size={14} />
                  <Text>{contact.phone}</Text>
                </HStack>
              </GridItem>
            </Grid>
          </Box>
        ))}
      </VStack>
    )}
  </VStack>
);

// ============================================
// Main Drawer Component
// ============================================

const ClientDetailsDrawer: React.FC<ClientDetailsDrawerProps> = ({
                                                                   client,
                                                                   isOpen,
                                                                   onClose,
                                                                   onEdit,
                                                                   isLoading = false,
                                                                 }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  if (!client) return null;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="lg" placement="end">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          {/* Header */}
          <Box borderBottomWidth="1px" borderColor="gray.200" px={6} py={4}>
            <Flex justify="space-between" align="flex-start">
              <HStack gap={3}>
                <CompanyLogo logoUrl={client.logoUrl} companyName={client.companyName} />
                <Box>
                  <Heading size="md" color="gray.800">{client.companyName}</Heading>
                  <HStack gap={2} mt={1}>
                    <Badge colorPalette={getStatusColor(client.status)} variant="subtle">{client.status}</Badge>
                    {client.industry && <Text fontSize="sm" color="gray.500">{client.industry}</Text>}
                  </HStack>
                </Box>
              </HStack>
              <HStack gap={2}>
                <Button size="sm" variant="outline" onClick={() => onEdit(client)}>
                  <LuPencil size={14} style={{ marginRight: 4 }} />
                  Edit
                </Button>
                <IconButton aria-label="Close" variant="ghost" size="sm" onClick={onClose}>
                  <LuX size={18} />
                </IconButton>
              </HStack>
            </Flex>
          </Box>

          {/* Content */}
          {isLoading ? (
            <Flex justify="center" align="center" flex={1} py={16}>
              <VStack gap={4}>
                <Spinner size="xl" color="blue.500" />
                <Text color="gray.500">Loading...</Text>
              </VStack>
            </Flex>
          ) : (
            <>
              <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)} variant="line">
                <Tabs.List px={6} borderBottomWidth="1px" borderColor="gray.200">
                  <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
                  <Tabs.Trigger value="sites">Sites ({client.sites?.length || 0})</Tabs.Trigger>
                  <Tabs.Trigger value="contacts">Contacts ({client.contacts?.length || 0})</Tabs.Trigger>
                </Tabs.List>

                <Box flex={1} overflowY="auto" px={6} py={4}>
                  <Tabs.Content value="overview">
                    <OverviewTab client={client} />
                  </Tabs.Content>
                  <Tabs.Content value="sites">
                    <SitesTab sites={client.sites || []} />
                  </Tabs.Content>
                  <Tabs.Content value="contacts">
                    <ContactsTab contacts={client.contacts || []} />
                  </Tabs.Content>
                </Box>
              </Tabs.Root>

              {/* Footer */}
              <Box borderTopWidth="1px" borderColor="gray.200" px={6} py={3}>
                <HStack justify="space-between" fontSize="xs" color="gray.500">
                  <Text>Created: {formatDate(client.createdAt)}</Text>
                  <Text>Updated: {formatDate(client.updatedAt)}</Text>
                </HStack>
              </Box>
            </>
          )}
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};

export default ClientDetailsDrawer;