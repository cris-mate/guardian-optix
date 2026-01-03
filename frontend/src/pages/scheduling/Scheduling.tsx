/**
 * Scheduling Page
 *
 * Central hub for shift management in Guardian Optix.
 * Provides calendar views, shift creation, and task management.
 *
 * Features:
 * - Quick stats overview (4 KPIs)
 * - Calendar view (day/week/month)
 * - Shift filtering and search
 * - Task management per shift
 * - Team availability overview
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Grid,
  GridItem,
  Tabs,
  Badge,
} from '@chakra-ui/react';
import {
  LuCalendarDays,
  LuRefreshCw,
  LuPlus,
  LuClock,
  LuUsers,
  LuCircleCheck,
  LuTriangleAlert,
  LuCalendarClock,
  LuClipboardList,
} from 'react-icons/lu';
import { usePageTitle } from '../../context/PageContext';
import { useAuth } from '../../context/AuthContext';

// Components
import SchedulingToolbar from './components/SchedulingToolbar';
import CalendarView from './components/CalendarView';
import ShiftDrawer from './components/ShiftDrawer';
import AddShiftModal from './components/AddShiftModal';

// Hooks
import { useSchedulingData } from './hooks/useSchedulingData';

// Types
import type { Shift, SchedulingStats } from '../../types/scheduling.types';

// ============================================
// Tab Configuration
// ============================================

type TabValue = 'calendar' | 'shifts' | 'tasks';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { value: 'calendar', label: 'Calendar', icon: LuCalendarDays },
  { value: 'shifts', label: 'Shifts', icon: LuClock },
  { value: 'tasks', label: 'Tasks', icon: LuClipboardList },
];

// ============================================
// Header Component
// ============================================

interface HeaderProps {
  onRefresh: () => void;
  onAddShift: () => void;
  isLoading: boolean;
  isManager: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, onAddShift, isLoading, isManager }) => (
  <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
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

    <HStack gap={2}>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        color="green.600"
        borderColor="green.300"
        _hover={{ bg: 'green.50', borderColor: 'green.400' }}
      >
        <Icon
          as={LuRefreshCw}
          boxSize={4}
          mr={2}
          className={isLoading ? 'spin' : ''}
        />
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
      {isManager && (
        <Button
          colorPalette="blue"
          size="sm"
          onClick={onAddShift}
        >
          <Icon as={LuPlus} boxSize={4} mr={2} />
          Add Shift
        </Button>
      )}
    </HStack>
  </HStack>
);

// ============================================
// Stats Card Component
// ============================================

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, color }) => (
  <Box
    bg="white"
    borderRadius="xl"
    p={5}
    borderWidth="1px"
    borderColor="gray.200"
    shadow="sm"
    _hover={{ shadow: 'md' }}
    transition="shadow 0.2s"
  >
    <HStack justify="space-between" align="flex-start">
      <VStack align="flex-start" gap={1}>
        <Text fontSize="sm" color="gray.500" fontWeight="medium">
          {title}
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          {value}
        </Text>
        {subtitle && (
          <Text fontSize="xs" color="gray.400">
            {subtitle}
          </Text>
        )}
      </VStack>
      <Box p={2} borderRadius="lg" bg={`${color}.50`} color={`${color}.500`}>
        <Icon as={icon} boxSize={5} />
      </Box>
    </HStack>
  </Box>
);


// ============================================
// Quick Stats Component
// ============================================

interface QuickStatsProps {
  stats: SchedulingStats;
}

const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => (
  <Grid templateColumns={{ base: '1fr 1fr', lg: 'repeat(4, 1fr)' }} gap={4}>
    <GridItem>
      <StatsCard
        title="Total Shifts"
        value={stats.totalShifts}
        subtitle={`${stats.scheduledShifts} scheduled`}
        icon={LuCalendarClock}
        color="blue"
      />
    </GridItem>
    <GridItem>
      <StatsCard
        title="In Progress"
        value={stats.inProgressShifts}
        subtitle={`${stats.completedShifts} completed`}
        icon={LuUsers}
        color="green"
      />
    </GridItem>
    <GridItem>
      <StatsCard
        title="Hours Scheduled"
        value={`${stats.totalHoursScheduled}h`}
        subtitle="this period"
        icon={LuClock}
        color="purple"
      />
    </GridItem>
    <GridItem>
      <StatsCard
        title="Coverage"
        value={`${stats.coveragePercentage}%`}
        subtitle={stats.coveragePercentage >= 80 ? 'on track' : 'needs attention'}
        icon={stats.coveragePercentage >= 80 ? LuCircleCheck : LuTriangleAlert}
        color={stats.coveragePercentage >= 80 ? 'green' : 'orange'}
      />
    </GridItem>
  </Grid>
);

// ============================================
// Main Component
// ============================================

const Scheduling: React.FC = () => {
  const { setTitle } = usePageTitle();
  const { user } = useAuth();
  const isManager = user?.role === 'Admin' || user?.role === 'Manager';

  // Set page title
  useEffect(() => {
    setTitle('Scheduling');
  }, [setTitle]);

  // State
  const [activeTab, setActiveTab] = useState<TabValue>('calendar');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Data hook
  const {
    shifts:
    allShifts,
    selectedShift,
    availableGuards,
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
    deleteShift,
    toggleTaskComplete,
    refetch,
    navigateDate,
    goToToday,
    fetchAvailableGuards,
  } = useSchedulingData();

  // Handlers
  const handleShiftClick = (shift: Shift) => {
    setSelectedShiftId(shift._id);
    selectShift(shift._id);
  };

  const handleCloseDrawer = () => {
    setSelectedShiftId(null);
    selectShift(null);
  };

  const handleEdit = isManager
    ? (shift: Shift) => {
      console.log('Edit shift:', shift._id);
    }
    : undefined;

  const handleDelete = isManager
    ? async () => {
      if (selectedShiftId) {
        await deleteShift(selectedShiftId);
        handleCloseDrawer();
      }
    }
    : undefined;

  const handleTaskComplete = (shiftId: string, taskId: string, completed: boolean) => {
    toggleTaskComplete(shiftId, taskId, completed);
  };

  return (
    <VStack gap={6} align="stretch" p={6}>
      {/* Header with Refresh and Add Shift buttons */}
      <Header
        onRefresh={refetch}
        onAddShift={() => setIsAddModalOpen(true)}
        isLoading={isLoading}
        isManager={isManager}
      />

      {/* Error Display */}
      {error && (
        <Box bg="red.50" borderRadius="lg" p={4} borderWidth="1px" borderColor="red.200">
          <HStack gap={2}>
            <Icon as={LuTriangleAlert} color="red.500" />
            <Text color="red.700" fontSize="sm">{error}</Text>
            <Button size="xs" variant="outline" colorPalette="red" onClick={refetch}>
              Retry
            </Button>
          </HStack>
        </Box>
      )}

      {/* Quick Stats */}
      <QuickStats stats={stats} />

      {/* Tabs */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value as TabValue)}
      >
        <Tabs.List
          bg="white"
          borderRadius="lg"
          p={1}
          borderWidth="1px"
          borderColor="gray.200"
          shadow="sm"
        >
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              px={4}
              py={2}
              borderRadius="md"
              fontWeight="medium"
              fontSize="sm"
              _selected={{
                bg: 'blue.50',
                color: 'blue.600',
              }}
            >
              <HStack gap={2}>
                <Icon as={tab.icon} boxSize={4} />
                <Text>{tab.label}</Text>
              </HStack>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Calendar Tab */}
        <Tabs.Content value="calendar" pt={4}>
          <VStack gap={4} align="stretch">
            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="sm"
              overflow="hidden"
            >
              <SchedulingToolbar
                filters={filters}
                stats={stats}
                availableGuards={availableGuards}
                availableSites={availableSites}
                onFiltersChange={setFilters}
                onNavigate={navigateDate}
                onToday={goToToday}
                onReset={resetFilters}
              />
            </Box>

            <Box
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="sm"
              overflow="hidden"
            >
              <CalendarView
                shifts={allShifts}
                viewMode={filters.viewMode}
                selectedDate={filters.selectedDate}
                onShiftClick={handleShiftClick}
                isLoading={isLoading}
              />
            </Box>
          </VStack>
        </Tabs.Content>

        {/* Shifts Tab */}
        <Tabs.Content value="shifts" pt={4}>
          <Box
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            shadow="sm"
            p={6}
          >
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="semibold" color="gray.700">All Shifts</Text>
              <Badge colorPalette="blue">{allShifts.length} total</Badge>
            </HStack>
            <Text color="gray.500" fontSize="sm">
              Detailed shifts list view coming soon...
            </Text>
          </Box>
        </Tabs.Content>

        {/* Tasks Tab */}
        <Tabs.Content value="tasks" pt={4}>
          <Box
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            shadow="sm"
            p={6}
          >
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="semibold" color="gray.700">Task Overview</Text>
              <Badge colorPalette="purple">
                {allShifts.reduce((acc, s) => acc + s.tasks.length, 0)} tasks
              </Badge>
            </HStack>
            <Text color="gray.500" fontSize="sm">
              Task management view coming soon...
            </Text>
          </Box>
        </Tabs.Content>
      </Tabs.Root>

      {/* Shift Detail Drawer */}
      <ShiftDrawer
        shift={selectedShift}
        isOpen={!!selectedShiftId}
        onClose={handleCloseDrawer}
        onEdit={handleEdit}
        onTaskComplete={handleTaskComplete}
        isLoading={isLoadingDetails}
      />

      {/* Add Shift Modal */}
      <AddShiftModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={createShift}
        availableGuards={availableGuards}
        availableSites={availableSites}
        selectedDate={filters.selectedDate}
        isSubmitting={isMutating}
        onRefreshGuards={fetchAvailableGuards}
      />

      {/* CSS for spinner animation */}
      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </VStack>
  );
};

export default Scheduling;


//   return (
//     <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
//       {statItems.map((stat) => (
//         <Box
//           key={stat.label}
//           bg="white"
//           borderRadius="xl"
//           borderWidth="1px"
//           borderColor="gray.200"
//           shadow="sm"
//           p={5}
//           transition="all 0.2s"
//           _hover={{ borderColor: `${stat.color}.300`, shadow: 'md' }}
//         >
//           {isLoading ? (
//             <VStack align="flex-start" gap={2}>
//               <Box bg="gray.100" h={4} w={24} borderRadius="md" />
//               <Box bg="gray.100" h={8} w={16} borderRadius="md" />
//               <Box bg="gray.100" h={3} w={20} borderRadius="md" />
//             </VStack>
//           ) : (
//             <HStack justify="space-between" align="start">
//               <VStack align="start" gap={1}>
//                 <Text fontSize="sm" color="gray.500">
//                   {stat.label}
//                 </Text>
//                 <Text fontSize="2xl" fontWeight="bold" color="gray.800">
//                   {stat.value}
//                 </Text>
//                 <Text fontSize="xs" color="gray.400">
//                   {stat.subtext}
//                 </Text>
//               </VStack>
//               <Box
//                 p={2}
//                 borderRadius="lg"
//                 bg={`${stat.color}.50`}
//                 color={`${stat.color}.500`}
//               >
//                 <Icon as={stat.icon} boxSize={5} />
//               </Box>
//             </HStack>
//           )}
//         </Box>
//       ))}
//     </Grid>
//   );
// };
//
// // ============================================
// // Shifts List Component (for Shifts tab)
// // ============================================
//
// interface ShiftsListProps {
//   shifts: Shift[];
//   onShiftClick: (shift: Shift) => void;
//   isLoading: boolean;
// }
//
// const ShiftsList: React.FC<ShiftsListProps> = ({ shifts, onShiftClick, isLoading }) => {
//   if (isLoading) {
//     return (
//       <VStack py={12}>
//         <Spinner size="lg" color="blue.500" />
//         <Text color="gray.500">Loading shifts...</Text>
//       </VStack>
//     );
//   }
//
//   if (shifts.length === 0) {
//     return (
//       <VStack py={12} gap={3}>
//         <Icon as={LuCalendarDays} boxSize={12} color="gray.300" />
//         <Text color="gray.500" fontWeight="medium">No shifts found</Text>
//         <Text color="gray.400" fontSize="sm">Adjust your filters or create a new shift</Text>
//       </VStack>
//     );
//   }
//
//   return (
//     <VStack align="stretch" gap={3}>
//       {shifts.slice(0, 10).map((shift) => (
//         <Box
//           key={shift._id}
//           p={4}
//           bg="white"
//           borderRadius="lg"
//           borderWidth="1px"
//           borderColor="gray.200"
//           shadow="sm"
//           cursor="pointer"
//           transition="all 0.2s"
//           _hover={{ borderColor: 'blue.300', shadow: 'md' }}
//           onClick={() => onShiftClick(shift)}
//         >
//           <HStack justify="space-between">
//             <VStack align="start" gap={1}>
//               <HStack gap={2}>
//                 <Text fontWeight="medium" color="gray.800">
//                   {shift.guard.fullName}
//                 </Text>
//                 <Badge
//                   colorPalette={
//                     shift.status === 'completed' ? 'green' :
//                       shift.status === 'in-progress' ? 'orange' :
//                         shift.status === 'cancelled' ? 'red' : 'blue'
//                   }
//                   variant="subtle"
//                   size="sm"
//                 >
//                   {shift.status}
//                 </Badge>
//               </HStack>
//               <Text fontSize="sm" color="gray.500">
//                 {shift.site.name}
//               </Text>
//             </VStack>
//             <VStack align="end" gap={1}>
//               <Text fontSize="sm" fontWeight="medium" color="gray.700">
//                 {shift.startTime} - {shift.endTime}
//               </Text>
//               <Text fontSize="xs" color="gray.400">
//                 {new Date(shift.date).toLocaleDateString('en-GB', {
//                   weekday: 'short',
//                   day: 'numeric',
//                   month: 'short',
//                 })}
//               </Text>
//             </VStack>
//           </HStack>
//         </Box>
//       ))}
//       {shifts.length > 10 && (
//         <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
//           Showing 10 of {shifts.length} shifts
//         </Text>
//       )}
//     </VStack>
//   );
// };
//
// // ============================================
// // Tasks Overview Component (for Tasks tab)
// // ============================================
//
// interface TasksOverviewProps {
//   shifts: Shift[];
//   onShiftClick: (shift: Shift) => void;
//   isLoading: boolean;
// }
//
// const TasksOverview: React.FC<TasksOverviewProps> = ({ shifts, onShiftClick, isLoading }) => {
//   // Extract all tasks from shifts
//   const allTasks = shifts.flatMap((shift) =>
//     shift.tasks.map((task) => ({
//       ...task,
//       shift,
//     }))
//   );
//
//   const pendingTasks = allTasks.filter((t) => !t.completed);
//   const completedTasks = allTasks.filter((t) => t.completed);
//
//   if (isLoading) {
//     return (
//       <VStack py={12}>
//         <Spinner size="lg" color="blue.500" />
//         <Text color="gray.500">Loading tasks...</Text>
//       </VStack>
//     );
//   }
//
//   return (
//     <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
//       {/* Pending Tasks */}
//       <GridItem>
//         <Box
//           bg="white"
//           borderRadius="xl"
//           borderWidth="1px"
//           borderColor="gray.200"
//           shadow="sm"
//           overflow="hidden"
//         >
//           <HStack p={4} borderBottomWidth="1px" borderColor="gray.100">
//             <Icon as={LuClock} boxSize={5} color="orange.500" />
//             <Text fontWeight="semibold" color="gray.700">Pending Tasks</Text>
//             <Badge colorPalette="orange" variant="solid" size="sm">
//               {pendingTasks.length}
//             </Badge>
//           </HStack>
//           <Box p={4} maxH="400px" overflowY="auto">
//             {pendingTasks.length === 0 ? (
//               <Text color="gray.400" fontSize="sm" textAlign="center" py={4}>
//                 No pending tasks
//               </Text>
//             ) : (
//               <VStack align="stretch" gap={2}>
//                 {pendingTasks.slice(0, 8).map((task) => (
//                   <Box
//                     key={task._id}
//                     p={3}
//                     bg="gray.50"
//                     borderRadius="md"
//                     cursor="pointer"
//                     _hover={{ bg: 'gray.100' }}
//                     onClick={() => onShiftClick(task.shift)}
//                   >
//                     <Text fontSize="sm" fontWeight="medium" color="gray.800">
//                       {task.description}
//                     </Text>
//                     <HStack gap={2} mt={1}>
//                       <Text fontSize="xs" color="gray.500">
//                         {task.shift.guard.fullName}
//                       </Text>
//                       <Text fontSize="xs" color="gray.400">•</Text>
//                       <Text fontSize="xs" color="gray.500">
//                         {task.shift.site.name}
//                       </Text>
//                     </HStack>
//                   </Box>
//                 ))}
//               </VStack>
//             )}
//           </Box>
//         </Box>
//       </GridItem>
//
//       {/* Completed Tasks */}
//       <GridItem>
//         <Box
//           bg="white"
//           borderRadius="xl"
//           borderWidth="1px"
//           borderColor="gray.200"
//           shadow="sm"
//           overflow="hidden"
//         >
//           <HStack p={4} borderBottomWidth="1px" borderColor="gray.100">
//             <Icon as={LuCircleCheck} boxSize={5} color="green.500" />
//             <Text fontWeight="semibold" color="gray.700">Completed Tasks</Text>
//             <Badge colorPalette="green" variant="solid" size="sm">
//               {completedTasks.length}
//             </Badge>
//           </HStack>
//           <Box p={4} maxH="400px" overflowY="auto">
//             {completedTasks.length === 0 ? (
//               <Text color="gray.400" fontSize="sm" textAlign="center" py={4}>
//                 No completed tasks yet
//               </Text>
//             ) : (
//               <VStack align="stretch" gap={2}>
//                 {completedTasks.slice(0, 8).map((task) => (
//                   <Box
//                     key={task._id}
//                     p={3}
//                     bg="green.50"
//                     borderRadius="md"
//                     cursor="pointer"
//                     _hover={{ bg: 'green.100' }}
//                     onClick={() => onShiftClick(task.shift)}
//                   >
//                     <HStack>
//                       <Icon as={LuCircleCheck} boxSize={4} color="green.500" />
//                       <Text fontSize="sm" color="gray.700" textDecoration="line-through">
//                         {task.description}
//                       </Text>
//                     </HStack>
//                     <Text fontSize="xs" color="gray.500" mt={1}>
//                       {task.shift.guard.fullName}
//                     </Text>
//                   </Box>
//                 ))}
//               </VStack>
//             )}
//           </Box>
//         </Box>
//       </GridItem>
//     </Grid>
//   );
// };
//
// // ============================================
// // Main Component
// // ============================================
//
// const Scheduling: React.FC = () => {
//   const { setTitle } = usePageTitle();
//   const { user } = useAuth();
//   const isManager = user?.role === 'Admin' || user?.role === 'Manager';
//
//   const [activeTab, setActiveTab] = useState<TabValue>('calendar');
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//
//   // Set page title
//   useEffect(() => {
//     setTitle('Scheduling');
//   }, [setTitle]);
//
//   // Data hook
//   const {
//     shifts,
//     allShifts,
//     selectedShift,
//     availableGuards,
//     availableSites,
//     stats,
//     isLoading,
//     isLoadingDetails,
//     isMutating,
//     error,
//     filters,
//     setFilters,
//     resetFilters,
//     selectShift,
//     createShift,
//     toggleTaskComplete,
//     navigateDate,
//     goToToday,
//     refetch,
//   } = useSchedulingData();
//
//   // Counts for badges
//   const inProgressCount = stats.inProgressShifts;
//   const pendingTasksCount = allShifts?.reduce(
//     (acc, shift) => acc + shift.tasks.filter((t) => !t.completed).length,
//     0
//   ) || 0;
//
//   // Handlers
//   const handleShiftClick = (shift: Shift) => {
//     selectShift(shift._id);
//     setIsDrawerOpen(true);
//   };
//
//   const handleDrawerClose = () => {
//     setIsDrawerOpen(false);
//     setTimeout(() => selectShift(null), 300);
//   };
//
//   const handleEdit = (shift: Shift) => {
//     console.log('Edit shift:', shift._id);
//   };
//
//   const handleTaskComplete = (shiftId: string, taskId: string, completed: boolean) => {
//     toggleTaskComplete(shiftId, taskId, completed);
//   };
//
//   const handleRefresh = () => {
//     refetch();
//   };
//
//   // Loading state
//   if (isLoading && !stats) {
//     return (
//       <VStack gap={4} align="stretch">
//         <Header
//           onRefresh={handleRefresh}
//           onAddShift={() => setIsAddModalOpen(true)}
//           isLoading={true}
//           isManager={isManager}
//         />
//         <VStack py={16} gap={4}>
//           <Spinner size="xl" color="blue.500" />
//           <Text color="gray.500">Loading schedule...</Text>
//         </VStack>
//       </VStack>
//     );
//   }
//
//   return (
//     <VStack gap={4} align="stretch">
//       {/* Header */}
//       <Header
//         onRefresh={handleRefresh}
//         onAddShift={() => setIsAddModalOpen(true)}
//         isLoading={isLoading}
//         isManager={isManager}
//       />
//
//       {/* Error Banner */}
//       {error && <ErrorBanner message={error} onRetry={handleRefresh} />}
//
//       {/* Quick Stats */}
//       <QuickStats stats={stats} isLoading={isLoading && !stats} />
//
//       {/* Tabs */}
//       <Box>
//         <Tabs.Root
//           value={activeTab}
//           onValueChange={(e) => setActiveTab(e.value as TabValue)}
//         >
//           <Tabs.List
//             bg="white"
//             borderRadius="lg"
//             borderWidth="1px"
//             borderColor="gray.200"
//             shadow="sm"
//             p={1}
//           >
//             {tabs.map((tab) => (
//               <Tabs.Trigger
//                 key={tab.value}
//                 value={tab.value}
//                 px={4}
//                 py={2}
//                 borderRadius="md"
//                 fontWeight="medium"
//                 color="gray.600"
//                 _selected={{
//                   bg: 'blue.50',
//                   color: 'blue.600',
//                 }}
//               >
//                 <HStack gap={2}>
//                   <Icon as={tab.icon} boxSize={4} />
//                   <Text>{tab.label}</Text>
//                   {tab.value === 'shifts' && inProgressCount > 0 && (
//                     <Badge colorPalette="green" variant="solid" size="sm">
//                       {inProgressCount}
//                     </Badge>
//                   )}
//                   {tab.value === 'tasks' && pendingTasksCount > 0 && (
//                     <Badge colorPalette="orange" variant="solid" size="sm">
//                       {pendingTasksCount}
//                     </Badge>
//                   )}
//                 </HStack>
//               </Tabs.Trigger>
//             ))}
//           </Tabs.List>
//
//           {/* Calendar Tab */}
//           <Tabs.Content value="calendar" pt={4}>
//             <VStack align="stretch" gap={4}>
//               {/* Toolbar */}
//               <Box
//                 bg="white"
//                 borderRadius="xl"
//                 borderWidth="1px"
//                 borderColor="gray.200"
//                 shadow="sm"
//                 overflow="hidden"
//               >
//                 <SchedulingToolbar
//                   filters={filters}
//                   stats={stats}
//                   availableGuards={availableGuards}
//                   availableSites={availableSites}
//                   onFiltersChange={setFilters}
//                   onNavigate={navigateDate}
//                   onToday={goToToday}
//                   onReset={resetFilters}
//                 />
//               </Box>
//
//               {/* Calendar */}
//               <Box
//                 bg="white"
//                 borderRadius="xl"
//                 borderWidth="1px"
//                 borderColor="gray.200"
//                 shadow="sm"
//                 overflow="hidden"
//               >
//                 <CalendarView
//                   shifts={shifts}
//                   viewMode={filters.viewMode}
//                   selectedDate={filters.selectedDate}
//                   onShiftClick={handleShiftClick}
//                   isLoading={isLoading}
//                 />
//               </Box>
//             </VStack>
//           </Tabs.Content>
//
//           {/* Shifts Tab */}
//           <Tabs.Content value="shifts" pt={4}>
//             <Grid templateColumns={{ base: '1fr', xl: '1fr 320px' }} gap={6}>
//               <GridItem>
//                 <Box
//                   bg="white"
//                   borderRadius="xl"
//                   borderWidth="1px"
//                   borderColor="gray.200"
//                   shadow="sm"
//                   p={4}
//                 >
//                   <HStack justify="space-between" mb={4}>
//                     <Text fontWeight="semibold" color="gray.700">All Shifts</Text>
//                     <Badge colorPalette="blue" variant="subtle">
//                       {allShifts?.length || 0} total
//                     </Badge>
//                   </HStack>
//                   <ShiftsList
//                     shifts={allShifts || []}
//                     onShiftClick={handleShiftClick}
//                     isLoading={isLoading}
//                   />
//                 </Box>
//               </GridItem>
//
//               {/* Sidebar */}
//               <GridItem>
//                 <VStack align="stretch" gap={4}>
//                   {/* Quick Stats Summary */}
//                   <Box
//                     bg="white"
//                     borderRadius="xl"
//                     borderWidth="1px"
//                     borderColor="gray.200"
//                     shadow="sm"
//                     p={5}
//                   >
//                     <Text fontWeight="semibold" color="gray.700" mb={4}>
//                       Status Breakdown
//                     </Text>
//                     <VStack align="stretch" gap={3}>
//                       <HStack justify="space-between">
//                         <HStack gap={2}>
//                           <Box w={2} h={2} borderRadius="full" bg="blue.500" />
//                           <Text fontSize="sm" color="gray.600">Scheduled</Text>
//                         </HStack>
//                         <Text fontWeight="medium">{stats.scheduledShifts}</Text>
//                       </HStack>
//                       <HStack justify="space-between">
//                         <HStack gap={2}>
//                           <Box w={2} h={2} borderRadius="full" bg="orange.500" />
//                           <Text fontSize="sm" color="gray.600">In Progress</Text>
//                         </HStack>
//                         <Text fontWeight="medium">{stats.inProgressShifts}</Text>
//                       </HStack>
//                       <HStack justify="space-between">
//                         <HStack gap={2}>
//                           <Box w={2} h={2} borderRadius="full" bg="green.500" />
//                           <Text fontSize="sm" color="gray.600">Completed</Text>
//                         </HStack>
//                         <Text fontWeight="medium">{stats.completedShifts}</Text>
//                       </HStack>
//                       <HStack justify="space-between">
//                         <HStack gap={2}>
//                           <Box w={2} h={2} borderRadius="full" bg="red.500" />
//                           <Text fontSize="sm" color="gray.600">Cancelled</Text>
//                         </HStack>
//                         <Text fontWeight="medium">{stats.cancelledShifts}</Text>
//                       </HStack>
//                     </VStack>
//                   </Box>
//
//                   {/* Info Card */}
//                   <Box
//                     bg="blue.50"
//                     borderRadius="xl"
//                     borderWidth="1px"
//                     borderColor="blue.200"
//                     p={6}
//                     textAlign="center"
//                   >
//                     <Icon as={LuUsers} boxSize={10} color="blue.400" mb={3} />
//                     <Text fontWeight="semibold" color="gray.700" mb={2}>
//                       Team Availability
//                     </Text>
//                     <Text fontSize="sm" color="gray.500">
//                       {availableGuards.filter((o) => o.availability).length} of{' '}
//                       {availableGuards.length} guards available for scheduling.
//                     </Text>
//                   </Box>
//                 </VStack>
//               </GridItem>
//             </Grid>
//           </Tabs.Content>
//
//           {/* Tasks Tab */}
//           <Tabs.Content value="tasks" pt={4}>
//             <TasksOverview
//               shifts={allShifts || []}
//               onShiftClick={handleShiftClick}
//               isLoading={isLoading}
//             />
//           </Tabs.Content>
//         </Tabs.Root>
//       </Box>
//
//       {/* Shift Details Drawer */}
//       <ShiftDrawer
//         shift={selectedShift}
//         isOpen={isDrawerOpen}
//         onClose={handleDrawerClose}
//         onEdit={isManager ? handleEdit : undefined}
//         onTaskComplete={handleTaskComplete}
//         isLoading={isLoadingDetails}
//       />
//
//       {/* Add Shift Modal */}
//       <AddShiftModal
//         isOpen={isAddModalOpen}
//         onClose={() => setIsAddModalOpen(false)}
//         onSubmit={createShift}
//         availableGuards={availableGuards}
//         availableSites={availableSites}
//         selectedDate={filters.selectedDate}
//         isSubmitting={isMutating}
//       />
//
//       {/* CSS for spinner animation */}
//       <style>{`
//         .spin {
//           animation: spin 1s linear infinite;
//         }
//         @keyframes spin {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }
//       `}</style>
//     </VStack>
//   );
// };
//
// export default Scheduling;