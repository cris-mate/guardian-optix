/**
 * Reports Page
 *
 * Placeholder for analytics reports and data exports.
 * Future implementation will include operational reports,
 * performance analytics, and exportable data summaries.
 */

import React from 'react';
import {
  Box,
  Container,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  LuFileText,
  LuChartBar,
  LuChartPie,
  LuTrendingUp,
  LuCalendarRange,
  LuDownload,
  LuUsers,
  LuClock,
  LuShield,
  LuMapPin,
} from 'react-icons/lu';

interface ReportCategoryProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const ReportCategory: React.FC<ReportCategoryProps> = ({
                                                         icon: Icon,
                                                         title,
                                                         description,
                                                         color,
                                                       }) => (
  <Box
    p={6}
    bg="white"
    borderRadius="lg"
    borderWidth="1px"
    borderColor="gray.200"
    opacity={0.7}
    cursor="not-allowed"
    _hover={{ borderColor: 'gray.300' }}
    transition="all 0.2s"
  >
    <HStack gap={4} align="flex-start">
      <Box p={3} borderRadius="lg" bg={`${color}.50`} color={`${color}.600`}>
        <Icon size={24} />
      </Box>
      <VStack align="flex-start" gap={1} flex={1}>
        <Text fontWeight="semibold" color="gray.700">
          {title}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {description}
        </Text>
      </VStack>
    </HStack>
  </Box>
);

const Reports: React.FC = () => {
  const reportCategories: ReportCategoryProps[] = [
    {
      icon: LuChartBar,
      title: 'Shift Reports',
      description: 'Shift coverage, attendance rates, and scheduling efficiency',
      color: 'blue',
    },
    {
      icon: LuMapPin,
      title: 'Site Reports',
      description: 'Site activity, incident logs, and patrol completion rates',
      color: 'teal',
    },
    {
      icon: LuChartPie,
      title: 'Client Reports',
      description: 'Service delivery, contract compliance, and billing summaries',
      color: 'pink',
    },
    {
      icon: LuCalendarRange,
      title: 'Custom Reports',
      description: 'Build custom reports with flexible date ranges and filters',
      color: 'gray',
    },
  ];

  return (
    <Container maxW="container.xl" py={6}>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={3}>
          <Box p={2} borderRadius="lg" bg="blue.50" color="blue.600">
            <LuFileText size={24} />
          </Box>
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Reports
            </Text>
            <Text fontSize="sm" color="gray.500">
              Analytics, insights, and exportable reports
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          <Button variant="outline" size="sm" disabled>
            <LuCalendarRange size={14} />
            Date Range
          </Button>
          <Button colorPalette="blue" size="sm" disabled>
            <LuDownload size={14} />
            Export
          </Button>
        </HStack>
      </Flex>

      {/* Coming Soon Banner */}
      <Box
        bg="blue.50"
        borderWidth="1px"
        borderColor="blue.200"
        borderRadius="lg"
        p={8}
        mb={8}
        textAlign="center"
      >
        <VStack gap={4}>
          <Box p={4} borderRadius="full" bg="blue.100" color="blue.600">
            <LuChartBar size={40} />
          </Box>
          <Text fontSize="xl" fontWeight="semibold" color="gray.700">
            Reports Coming Soon
          </Text>
          <Text color="gray.500" maxW="xl">
            We're building comprehensive reporting tools to help you analyse
            operations, track performance, and generate exportable summaries
            for stakeholders.
          </Text>
        </VStack>
      </Box>

      {/* Report Categories Preview */}
      <Box mb={6}>
        <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={4}>
          PLANNED REPORT TYPES
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {reportCategories.map((category) => (
            <ReportCategory key={category.title} {...category} />
          ))}
        </SimpleGrid>
      </Box>
    </Container>
  );
};

export default Reports;