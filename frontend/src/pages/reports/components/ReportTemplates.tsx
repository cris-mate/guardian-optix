/**
 * ReportTemplates Component
 *
 * Displays available report templates in a grid layout.
 * Allows filtering by category and quick generation.
 */

import React from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  IconButton,
  Flex,
} from '@chakra-ui/react';
import {
  LuFileText,
  LuChartBar,
  LuClock,
  LuTriangleAlert,
  LuBriefcase,
  LuShield,
  LuMapPin,
  LuChartPie,
  LuTable,
  LuStar,
  LuDownload,
  LuCalendar,
} from 'react-icons/lu';
import type { ReportTemplate, ReportCategory } from '../types/reports.types';

// ============================================
// Props Interface
// ============================================

interface ReportTemplatesProps {
  templates: ReportTemplate[];
  onSelect: (templateId: string) => void;
  onGenerate: (templateId: string) => void;
  onToggleFavorite: (templateId: string) => void;
  selectedTemplateId?: string | null;
  isLoading?: boolean;
  isGenerating?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const getIconComponent = (iconName: string): React.ElementType => {
  const icons: Record<string, React.ElementType> = {
    LuChartBar,
    LuClock,
    LuTriangleAlert,
    LuBriefcase,
    LuShield,
    LuMapPin,
    LuChartPie,
    LuFileSpreadsheet: LuTable,
    LuFileText,
  };
  return icons[iconName] || LuFileText;
};

const formatDate = (isoString?: string) => {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const getCategoryColor = (category: ReportCategory): string => {
  const colors: Record<ReportCategory, string> = {
    operational: 'blue',
    attendance: 'green',
    incidents: 'orange',
    clients: 'purple',
    compliance: 'teal',
  };
  return colors[category] || 'gray';
};

// ============================================
// Template Card Component
// ============================================

interface TemplateCardProps {
  template: ReportTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onGenerate: () => void;
  onToggleFavorite: () => void;
  isGenerating: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
                                                     template,
                                                     isSelected,
                                                     onSelect,
                                                     onGenerate,
                                                     onToggleFavorite,
                                                     isGenerating,
                                                   }) => {
  const IconComponent = getIconComponent(template.icon);
  const categoryColor = getCategoryColor(template.category);

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="2px"
      borderColor={isSelected ? `${categoryColor}.400` : 'gray.200'}
      p={5}
      cursor="pointer"
      onClick={onSelect}
      transition="all 0.2s"
      _hover={{
        borderColor: `${categoryColor}.300`,
        shadow: 'md',
      }}
      position="relative"
    >
      {/* Favorite Button */}
      <IconButton
        size="xs"
        variant="ghost"
        position="absolute"
        top={3}
        right={3}
        aria-label={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        color={template.isFavorite ? 'yellow.500' : 'gray.300'}
        _hover={{ color: template.isFavorite ? 'yellow.600' : 'yellow.400' }}
      >
        <Icon as={LuStar} boxSize={4} fill={template.isFavorite ? 'currentColor' : 'none'} />
      </IconButton>

      <VStack align="stretch" gap={4}>
        {/* Header */}
        <HStack gap={3}>
          <Box
            p={3}
            borderRadius="lg"
            bg={`${categoryColor}.50`}
            color={`${categoryColor}.600`}
          >
            <Icon as={IconComponent} boxSize={5} />
          </Box>
          <VStack align="flex-start" gap={0} flex={1}>
            <Text fontWeight="semibold" color="gray.800" fontSize="sm" pr={6}>
              {template.name}
            </Text>
            <Badge
              colorPalette={categoryColor}
              variant="subtle"
              size="sm"
              textTransform="capitalize"
            >
              {template.category}
            </Badge>
          </VStack>
        </HStack>

        {/* Description */}
        <Text fontSize="sm" color="gray.500" lineClamp={2}>
          {template.description}
        </Text>

        {/* Meta Info */}
        <HStack justify="space-between" fontSize="xs" color="gray.400">
          <HStack gap={1}>
            <Icon as={LuCalendar} boxSize={3} />
            <Text>{formatDate(template.lastGenerated)}</Text>
          </HStack>
          <Text>{template.generationCount} generated</Text>
        </HStack>

        {/* Actions */}
        <Button
          size="sm"
          colorPalette={categoryColor}
          onClick={(e) => {
            e.stopPropagation();
            onGenerate();
          }}
          disabled={isGenerating}
          loading={isGenerating}
        >
          <Icon as={LuDownload} boxSize={4} mr={2} />
          Generate Report
        </Button>
      </VStack>
    </Box>
  );
};

// ============================================
// Loading Skeleton
// ============================================

const TemplateCardSkeleton: React.FC = () => (
  <Box
    bg="white"
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
    p={5}
  >
    <VStack align="stretch" gap={4}>
      <HStack gap={3}>
        <Box bg="gray.100" borderRadius="lg" h={11} w={11} />
        <VStack align="flex-start" gap={2} flex={1}>
          <Box bg="gray.100" h={4} w="70%" borderRadius="md" />
          <Box bg="gray.100" h={4} w={16} borderRadius="md" />
        </VStack>
      </HStack>
      <Box bg="gray.100" h={10} borderRadius="md" />
      <HStack justify="space-between">
        <Box bg="gray.100" h={3} w={20} borderRadius="md" />
        <Box bg="gray.100" h={3} w={16} borderRadius="md" />
      </HStack>
      <Box bg="gray.100" h={8} borderRadius="md" />
    </VStack>
  </Box>
);

// ============================================
// Empty State
// ============================================

const EmptyState: React.FC<{ category: string }> = ({ category }) => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    py={12}
    px={4}
    bg="gray.50"
    borderRadius="xl"
    borderWidth="1px"
    borderColor="gray.200"
    borderStyle="dashed"
  >
    <Icon as={LuFileText} boxSize={12} color="gray.300" mb={3} />
    <Text fontWeight="medium" color="gray.600" mb={1}>
      No templates found
    </Text>
    <Text fontSize="sm" color="gray.400" textAlign="center">
      {category === 'all'
        ? 'No report templates available'
        : `No templates in the ${category} category`}
    </Text>
  </Flex>
);

// ============================================
// Main Component
// ============================================

const ReportTemplates: React.FC<ReportTemplatesProps> = ({
                                                           templates,
                                                           onSelect,
                                                           onGenerate,
                                                           onToggleFavorite,
                                                           selectedTemplateId,
                                                           isLoading = false,
                                                           isGenerating = false,
                                                         }) => {
  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {Array.from({ length: 6 }).map((_, i) => (
          <TemplateCardSkeleton key={i} />
        ))}
      </SimpleGrid>
    );
  }

  if (templates.length === 0) {
    return <EmptyState category="all" />;
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={selectedTemplateId === template.id}
          onSelect={() => onSelect(template.id)}
          onGenerate={() => onGenerate(template.id)}
          onToggleFavorite={() => onToggleFavorite(template.id)}
          isGenerating={isGenerating}
        />
      ))}
    </SimpleGrid>
  );
};

export default ReportTemplates;