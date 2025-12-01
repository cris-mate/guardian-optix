/**
 * GuardsDrawer Component
 *
 * Side panel displaying detailed officer information.
 * Uses Chakra UI v3 Drawer components.
 */

import React from 'react';
import {
  Box,
  Drawer,
  VStack,
  HStack,
  Text,
  Avatar,
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
  LuClock,
  LuUser,
  LuTriangleAlert,
  LuPencil,
  LuBadgeCheck,
  LuFileText,
} from 'react-icons/lu';
import { Guards, LicenceStatus, GuardsStatus } from '../types/guards.types';

interface GuardsDrawerProps {
  officer: Guards | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (officer: Guards) => void;
  isLoading?: boolean;
}

// Status colour mapping
const getStatusColor = (status: GuardsStats): string => {
  const colors: Record<GuardsStatus, string> = {
    active: 'green',
    'on-leave': 'yellow',
    'off-duty': 'gray',
    suspended: 'red',
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
    pending: 'blue',
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
                                                           officer,
                                                           isOpen,
                                                           onClose,
                                                           onEdit,
                                                           isLoading = false,
                                                         }) => {
  const daysUntilExpiry = officer?.siaLicence?.expiryDate
    ? getDaysUntilExpiry(officer.siaLicence.expiryDate)
    : null;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="end" size="md">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header borderBottomWidth="1px" borderColor="gray.200">
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold">Officer Details</Text>
              <HStack gap={2}>
                {onEdit && officer && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Edit"
                    onClick={() => onEdit(officer)}
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
            ) : officer ? (
              <VStack gap={0} align="stretch">
                {/* Profile Header */}
                <Box bg="gray.50" p={6}>
                  <VStack gap={4}>
                    <Avatar.Root size="sm">
                      <Avatar.Image src={officer.profileImage} />
                      <Avatar.Fallback name={officer.fullName} />
                    </Avatar.Root>
                    <VStack gap={1}>
                      <Text fontSize="xl" fontWeight="semibold">{officer.fullName}</Text>
                      {officer.badgeNumber && (
                        <Text fontSize="sm" color="gray.500" fontFamily="mono">
                          {officer.badgeNumber}
                        </Text>
                      )}
                      <HStack gap={2} mt={1}>
                        <Badge colorPalette={getStatusColor(officer.status)} variant="subtle">
                          {officer.status.replace('-', ' ')}
                        </Badge>
                        {officer.availability && officer.status === 'active' && (
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
                      onClick={() => window.open(`tel:${officer.phoneNumber}`)}
                    >
                      <LuPhone size={14} />
                      Call
                    </Button>
                    <Button
                      flex={1}
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`mailto:${officer.email}`)}
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
                      value={officer.email}
                    />
                    <InfoRow
                      icon={<LuPhone size={14} />}
                      label="Phone"
                      value={officer.phoneNumber}
                    />
                    <InfoRow
                      icon={<LuMapPin size={14} />}
                      label="Postcode"
                      value={officer.postCode}
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
                            {officer.role === 'Guard' ? 'Security Officer' : officer.role}
                          </Text>
                          {(officer.guardType || officer.managerType) && (
                            <Text fontSize="xs" color="gray.500">
                              {officer.guardType || officer.managerType}
                            </Text>
                          )}
                        </VStack>
                      }
                    />
                    <InfoRow
                      icon={<LuClock size={14} />}
                      label="Shift"
                      value={officer.shift || 'Not assigned'}
                    />
                    <InfoRow
                      icon={<LuCalendar size={14} />}
                      label="Start Date"
                      value={formatDate(officer.startDate)}
                    />
                    {officer.assignedSite && (
                      <InfoRow
                        icon={<LuMapPin size={14} />}
                        label="Assigned Site"
                        value={officer.assignedSite}
                      />
                    )}
                  </VStack>
                </Box>

                <Separator />

                {/* SIA Licence */}
                {officer.siaLicence && (
                  <>
                    <Box px={6} py={4}>
                      <Flex justify="space-between" align="center" mb={3}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                          SIA Licence
                        </Text>
                        <Badge colorPalette={getLicenceColor(officer.siaLicence.status)} variant="subtle">
                          {officer.siaLicence.status === 'expiring-soon' ? 'Expiring Soon' : officer.siaLicence.status}
                        </Badge>
                      </Flex>

                      {/* Expiry Warning */}
                      {(officer.siaLicence.status === 'expired' || officer.siaLicence.status === 'expiring-soon') && (
                        <Box
                          bg={officer.siaLicence.status === 'expired' ? 'red.50' : 'orange.50'}
                          borderWidth="1px"
                          borderColor={officer.siaLicence.status === 'expired' ? 'red.200' : 'orange.200'}
                          borderRadius="md"
                          p={3}
                          mb={4}
                        >
                          <HStack gap={2}>
                            <Box color={officer.siaLicence.status === 'expired' ? 'red.500' : 'orange.500'}>
                              <LuTriangleAlert size={16} />
                            </Box>
                            <Text fontSize="sm" color={officer.siaLicence.status === 'expired' ? 'red.700' : 'orange.700'}>
                              {officer.siaLicence.status === 'expired'
                                ? 'Licence has expired. Officer cannot work until renewed.'
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
                          value={officer.siaLicence.licenceType}
                        />
                        <InfoRow
                          icon={<LuFileText size={14} />}
                          label="Licence Number"
                          value={
                            <Text fontSize="sm" fontWeight="medium" fontFamily="mono">
                              {officer.siaLicence.licenceNumber}
                            </Text>
                          }
                        />
                        <InfoRow
                          icon={<LuCalendar size={14} />}
                          label="Issue Date"
                          value={formatDate(officer.siaLicence.issueDate)}
                        />
                        <InfoRow
                          icon={<LuCalendar size={14} />}
                          label="Expiry Date"
                          value={
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color={
                                officer.siaLicence.status === 'expired' ? 'red.600' :
                                  officer.siaLicence.status === 'expiring-soon' ? 'orange.600' :
                                    'inherit'
                              }
                            >
                              {formatDate(officer.siaLicence.expiryDate)}
                            </Text>
                          }
                        />
                      </VStack>
                    </Box>
                    <Separator />
                  </>
                )}

                {/* Certifications */}
                {officer.certifications && officer.certifications.length > 0 && (
                  <>
                    <Box px={6} py={4}>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
                        Certifications
                      </Text>
                      <Flex gap={2} flexWrap="wrap">
                        {officer.certifications.map((cert, index) => (
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

                {/* Emergency Contact */}
                {officer.emergencyContact && (
                  <Box px={6} py={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
                      Emergency Contact
                    </Text>
                    <VStack gap={0} align="stretch">
                      <InfoRow
                        icon={<LuUser size={14} />}
                        label="Name"
                        value={officer.emergencyContact.name}
                      />
                      <InfoRow
                        icon={<LuUser size={14} />}
                        label="Relationship"
                        value={officer.emergencyContact.relationship}
                      />
                      <InfoRow
                        icon={<LuPhone size={14} />}
                        label="Phone"
                        value={
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => window.open(`tel:${officer.emergencyContact?.phone}`)}
                          >
                            {officer.emergencyContact.phone}
                          </Button>
                        }
                      />
                    </VStack>
                  </Box>
                )}
              </VStack>
            ) : (
              <Flex justify="center" align="center" py={16}>
                <Text color="gray.500">No officer selected</Text>
              </Flex>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};

export default GuardsDrawer;