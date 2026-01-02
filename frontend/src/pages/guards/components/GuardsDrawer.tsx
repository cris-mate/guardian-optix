/**
 * GuardsDrawer Component
 *
 * Side panel displaying detailed guard information.
 * Uses Chakra UI v3 Drawer components.
 * * Handles missing fields gracefully for API data.
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
  IconButton, Icon,
} from '@chakra-ui/react';
import {
  LuX,
  LuPhone,
  LuMail,
  LuMapPin,
  LuCalendar,
  LuShield,
  LuTriangleAlert,
  LuPencil,
  LuBadgeCheck,
  LuFileText, LuCircleCheck,
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

// Status display text
const getStatusText = (status?: GuardsStatus): string => {
  if (!status) return 'Unknown';
  return status.replace('-', ' ');
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

  const currentStatus = guard?.status || 'off-duty';

  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="end" size="md">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header borderBottomWidth="1px" borderColor="gray.200">
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold"><Text>{guard?.role === 'Guard' ? 'Guard' : guard?.role || 'Guard'} Details</Text></Text>
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
                <Box
                  bg={`${getStatusColor(currentStatus)}.50`}
                  p={6}
                  borderBottomWidth="2px"
                  borderColor={`${getStatusColor(currentStatus)}.200`}
                >
                  <VStack gap={4}>
                    {/* Guard Name (moved to top) */}
                    <VStack gap={1}>
                      <Text fontSize="xl" fontWeight="semibold">{guard.fullName}</Text>
                      <HStack gap={2} mt={1}>
                        {guard.guardType && (
                          <Badge colorPalette="purple" variant="outline">
                            {guard.guardType}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                    {/* Status Badge */}
                    <Badge
                      colorPalette={getStatusColor(currentStatus)}
                      variant="solid"
                      px={4}
                      py={1}
                      fontSize="sm"
                      textTransform="capitalize"
                    >
                      <Icon as={LuCircleCheck} mr={1} />
                      {getStatusText(currentStatus)}
                    </Badge>
                  </VStack>
                </Box>

                {/* Quick Actions */}
                <Box px={6} py={4} borderBottomWidth="1px" borderColor="gray.200">
                  <HStack gap={3}>
                    <Button
                      flex={1}
                      size="sm"
                      variant="outline"
                      onClick={() => guard.phoneNumber && window.open(`tel:${guard.phoneNumber}`)}
                      disabled={!guard.phoneNumber}
                    >
                      <LuPhone size={14} />
                      Call
                    </Button>
                    <Button
                      flex={1}
                      size="sm"
                      variant="outline"
                      onClick={() => guard.email && window.open(`mailto:${guard.email}`)}
                      disabled={!guard.email}
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
                      value={guard.phoneNumber || '-'}
                    />
                    <InfoRow
                      icon={<LuMapPin size={14} />}
                      label="Postcode"
                      value={guard.postCode || '-'}
                    />
                  </VStack>
                </Box>

                <Separator />

                {/* SIA Licence */}
                {guard.siaLicence ? (
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
                          value={guard.siaLicence.licenceType || '-'}
                        />
                        <InfoRow
                          icon={<LuFileText size={14} />}
                          label="Licence Number"
                          value={
                            <Text fontSize="sm" fontWeight="medium" fontFamily="mono">
                              {guard.siaLicence.licenceNumber || '-'}
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
                ) : (
                  <>
                    <Box px={6} py={4}>
                      <Flex justify="space-between" align="center" mb={3}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                          SIA Licence
                        </Text>
                        <Badge colorPalette="gray" variant="subtle">
                          Not Provided
                        </Badge>
                      </Flex>
                      <Box bg="gray.50" borderRadius="md" p={4} textAlign="center">
                        <Icon as={LuShield} boxSize={6} color="gray.400" mb={2} />
                        <Text fontSize="sm" color="gray.500">
                          No SIA licence information on file
                        </Text>
                      </Box>
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