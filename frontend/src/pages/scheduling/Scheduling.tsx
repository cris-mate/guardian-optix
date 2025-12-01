/**
 * Scheduling Page
 *
 * Main page for managing shift schedules and tasks.
 * Provides calendar view, shift creation, and task management.
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
} from '@chakra-ui/react';
import { LuCalendarDays, LuPlus, LuRefreshCw } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useSchedulingData } from './hooks/useSchedulingData';
import SchedulingToolbar from './components/SchedulingToolbar';
import CalendarView from './components/CalendarView';
import ShiftDrawer from './components/ShiftDrawer';
import AddShiftModal from './components/AddShiftModal';
import { Shift } from './types/scheduling.types';

const Scheduling: React.FC = () => {
  const { user } = useAuth();
  const {
    shifts,
    selectedShift,
    availableOfficers,
    availableSites,
    stats,
    isLoading,
    isLoadingDetails,
    isMutating,
    error,
    filters,
    setFilters,
    resetFilters,
    selectShift,
    createShift,
    toggleTaskComplete,
    navigateDate,
    goToToday,
    refetch,
  } = useSchedulingData();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Check if user has manager/admin permissions
  const isManager = user?.role === 'Admin' || user?.role === 'Manager';

  // Handle shift selection
  const handleShiftClick = (shift: Shift) => {
    selectShift(shift._id);
    setIsDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setTimeout(() => selectShift(null), 300);
  };

  // Handle edit (placeholder)
  const handleEdit = (shift: Shift) => {
    console.log('Edit shift:', shift._id);
    // TODO: Implement edit modal
  };

  // Handle task completion
  const handleTaskComplete = (shiftId: string, taskId: string, completed: boolean) => {
    toggleTaskComplete(shiftId, taskId, completed);
  };

  return (
    <Container maxW="container.xl" py={6}>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={3}>
          <Box p={2} borderRadius="lg" bg="blue.50" color="blue.600">
            <LuCalendarDays size={24} />
          </Box>
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Scheduling
            </Text>
            <Text fontSize="sm" color="gray.500">
              Manage shifts and assign tasks
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <LuRefreshCw size={14} />
            Refresh
          </Button>
          {isManager && (
            <Button
              colorPalette="blue"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <LuPlus size={14} />
              New Shift
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Error State */}
      {error && (
        <Box
          bg="red.50"
          borderWidth="1px"
          borderColor="red.200"
          borderRadius="lg"
          p={4}
          mb={6}
        >
          <Text color="red.700">{error}</Text>
        </Box>
      )}

      {/* Toolbar */}
      <Box mb={6}>
        <SchedulingToolbar
          filters={filters}
          stats={stats}
          availableOfficers={availableOfficers}
          availableSites={availableSites}
          onFiltersChange={setFilters}
          onNavigate={navigateDate}
          onToday={goToToday}
          onReset={resetFilters}
        />
      </Box>

      {/* Calendar View */}
      <CalendarView
        shifts={shifts}
        viewMode={filters.viewMode}
        selectedDate={filters.selectedDate}
        onShiftClick={handleShiftClick}
        isLoading={isLoading}
      />

      {/* Shift Details Drawer */}
      <ShiftDrawer
        shift={selectedShift}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onEdit={isManager ? handleEdit : undefined}
        onTaskComplete={handleTaskComplete}
        isLoading={isLoadingDetails}
      />

      {/* Add Shift Modal */}
      <AddShiftModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={createShift}
        availableOfficers={availableOfficers}
        availableSites={availableSites}
        selectedDate={filters.selectedDate}
        isSubmitting={isMutating}
      />
    </Container>
  );
};

export default Scheduling;