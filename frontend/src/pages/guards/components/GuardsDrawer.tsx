/**
 * GuardsDrawer Component
 *
 * Side panel displaying detailed guard information.
 * Uses Chakra UI v3 Drawer components.
 */

import React from 'react';
import {
  Box,
  Drawer,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  Flex,
  Separator,
  IconButton,
} from '@chakra-ui/react';
import {
  LuX,
  LuPhone,
  LuMail,
  LuMapPin,
  LuCalendar,
  LuShield,
  LuUser,
  LuTriangleAlert,
  LuPencil,
  LuBadgeCheck,
  LuFileText,
} from 'react-icons/lu';
import { Guards, LicenceStatus, GuardsStatus } from '../../../types/guards.types';

interface GuardsDrawerProps {
  guard: Guards | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (guard: Guards) => void;
  isLoading?: boolean;
}

// Status colour mapping
const getStatusColor = (status: GuardsStatus): string => {
  const colors: Record<GuardsStatus, string> = {
    'on-duty': 'green',
    'off-duty': 'gray',
    'on-break': 'yellow',
    'late': 'orange',
    'absent': 'red',
    'scheduled': 'blue',
  };
  return colors[status] || 'gray';
};

// Licence status colour mapping
const getLicenceColor = (status?: LicenceStatus): string => {
  if (!status) return 'gray';
  const colors: Record<LicenceStatus, string> = {
    valid: 'green',
    'expiring-soon': 'orange',
    expired: 'red',
  };
  return colors[status] || 'gray';
};

// Format date for display
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Calculate days until licence expiry
const getDaysUntilExpiry = (expiryDate?: string): number | null => {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Info row component
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <Flex justify="space-between" align="flex-start" py={2}>
    <HStack gap={2} color="gray.500">
      {icon}
      <Text fontSize="sm">{label}</Text>
    </HStack>
    <Box textAlign="right" maxW="60%">
      {typeof value === 'string' ? (
        <Text fontSize="sm" fontWeight="medium">{value}</Text>
      ) : (
        value
      )}
    </Box>
  </Flex>
);

const GuardsDrawer: React.FC<GuardsDrawerProps> = ({
                                                           guard,
                                                           isOpen,
                                                           onClose,
                                                           onEdit,
                                                           isLoading = false,
                                                         }) => {
  const daysUntilExpiry = guard?.siaLicence?.expiryDate
    ? getDaysUntilExpiry(guard.siaLicence.expiryDate)
    : null;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="end" size="md">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header borderBottomWidth="1px" borderColor="gray.200">
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold">Guard Details</Text>
              <HStack gap={2}>
                {onEdit && guard && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Edit"
                    onClick={() => onEdit(guard)}
                  >
                    <LuPencil size={16} />
                  </IconButton>
                )}
                <Drawer.CloseTrigger asChild>
                  <IconButton variant="ghost" size="sm" aria-label="Close">
                    <LuX size={18} />
                  </IconButton>
                </Drawer.CloseTrigger>
              </HStack>
            </Flex>
          </Drawer.Header>

          <Drawer.Body p={0}>
            {isLoading ? (
              <Flex justify="center" align="center" py={16}>
                <Spinner size="lg" color="blue.500" />
              </Flex>
            ) : guard ? (
              <VStack gap={0} align="stretch">
                {/* Profile Header */}
                <Box bg="gray.50" p={6}>
                  <VStack gap={4}>
                    <VStack gap={1}>
                      <Text fontSize="xl" fontWeight="semibold">{guard.fullName}</Text>
                      {guard.badgeNumber && (
                        <Text fontSize="sm" color="gray.500" fontFamily="mono">
                          {guard.badgeNumber}
                        </Text>
                      )}
                      <HStack gap={2} mt={1}>
                        <Badge colorPalette={getStatusColor(guard.status)} variant="subtle">
                          {guard.status.replace('-', ' ')}
                        </Badge>
                        {guard.availability && guard.status === 'on-duty' && (
                          <Badge colorPalette="green" variant="outline">
                            Available
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </VStack>
                </Box>

                {/* Quick Actions */}
                <Box px={6} py={4} borderBottomWidth="1px" borderColor="gray.200">
                  <HStack gap={3}>
                    <Button
                      flex={1}
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`tel:${guard.phoneNumber}`)}
                    >
                      <LuPhone size={14} />
                      Call
                    </Button>
                    <Button
                      flex={1}
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`mailto:${guard.email}`)}
                    >
                      <LuMail size={14} />
                      Email
                    </Button>
                  </HStack>
                </Box>

                {/* Contact Information */}
                <Box px={6} py={4}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
                    Contact Information
                  </Text>
                  <VStack gap={0} align="stretch">
                    <InfoRow
                      icon={<LuMail size={14} />}
                      label="Email"
                      value={guard.email}
                    />
                    <InfoRow
                      icon={<LuPhone size={14} />}
                      label="Phone"
                      value={guard.phoneNumber}
                    />
                    <InfoRow
                      icon={<LuMapPin size={14} />}
                      label="Postcode"
                      value={guard.postCode}
                    />
                  </VStack>
                </Box>

                <Separator />

                {/* Employment Details */}
                <Box px={6} py={4}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
                    Employment Details
                  </Text>
                  <VStack gap={0} align="stretch">
                    <InfoRow
                      icon={<LuUser size={14} />}
                      label="Role"
                      value={
                        <VStack gap={0} align="flex-end">
                          <Text fontSize="sm" fontWeight="medium">
                            {guard.role === 'Guard' ? 'Security Officer' : guard.role}
                          </Text>
                          {(guard.guardType || guard.managerType) && (
                            <Text fontSize="xs" color="gray.500">
                              {guard.guardType || guard.managerType}
                            </Text>
                          )}
                        </VStack>
                      }
                    />
                    {guard.assignedSite && (
                      <InfoRow
                        icon={<LuMapPin size={14} />}
                        label="Assigned Site"
                        value={guard.assignedSite}
                      />
                    )}
                  </VStack>
                </Box>

                <Separator />

                {/* SIA Licence */}
                {guard.siaLicence && (
                  <>
                    <Box px={6} py={4}>
                      <Flex justify="space-between" align="center" mb={3}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                          SIA Licence
                        </Text>
                        <Badge colorPalette={getLicenceColor(guard.siaLicence.status)} variant="subtle">
                          {guard.siaLicence.status === 'expiring-soon' ? 'Expiring Soon' : guard.siaLicence.status}
                        </Badge>
                      </Flex>

                      {/* Expiry Warning */}
                      {(guard.siaLicence.status === 'expired' || guard.siaLicence.status === 'expiring-soon') && (
                        <Box
                          bg={guard.siaLicence.status === 'expired' ? 'red.50' : 'orange.50'}
                          borderWidth="1px"
                          borderColor={guard.siaLicence.status === 'expired' ? 'red.200' : 'orange.200'}
                          borderRadius="md"
                          p={3}
                          mb={4}
                        >
                          <HStack gap={2}>
                            <Box color={guard.siaLicence.status === 'expired' ? 'red.500' : 'orange.500'}>
                              <LuTriangleAlert size={16} />
                            </Box>
                            <Text fontSize="sm" color={guard.siaLicence.status === 'expired' ? 'red.700' : 'orange.700'}>
                              {guard.siaLicence.status === 'expired'
                                ? 'Licence has expired. Guard cannot work until renewed.'
                                : `Licence expires in ${daysUntilExpiry} days. Renewal required.`
                              }
                            </Text>
                          </HStack>
                        </Box>
                      )}

                      <VStack gap={0} align="stretch">
                        <InfoRow
                          icon={<LuShield size={14} />}
                          label="Licence Type"
                          value={guard.siaLicence.licenceType}
                        />
                        <InfoRow
                          icon={<LuFileText size={14} />}
                          label="Licence Number"
                          value={
                            <Text fontSize="sm" fontWeight="medium" fontFamily="mono">
                              {guard.siaLicence.licenceNumber}
                            </Text>
                          }
                        />
                        <InfoRow
                          icon={<LuCalendar size={14} />}
                          label="Issue Date"
                          value={formatDate(guard.siaLicence.issueDate)}
                        />
                        <InfoRow
                          icon={<LuCalendar size={14} />}
                          label="Expiry Date"
                          value={
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color={
                                guard.siaLicence.status === 'expired' ? 'red.600' :
                                  guard.siaLicence.status === 'expiring-soon' ? 'orange.600' :
                                    'inherit'
                              }
                            >
                              {formatDate(guard.siaLicence.expiryDate)}
                            </Text>
                          }
                        />
                      </VStack>
                    </Box>
                    <Separator />
                  </>
                )}

                {/* Certifications */}
                {guard.certifications && guard.certifications.length > 0 && (
                  <>
                    <Box px={6} py={4}>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
                        Certifications
                      </Text>
                      <Flex gap={2} flexWrap="wrap">
                        {guard.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline" colorPalette="blue">
                            <LuBadgeCheck size={12} />
                            {cert}
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                    <Separator />
                  </>
                )}
              </VStack>
            ) : (
              <Flex justify="center" align="center" py={16}>
                <Text color="gray.500">No guard selected</Text>
              </Flex>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};

export default GuardsDrawer;