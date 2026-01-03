/**
 * CalendarView Component
 *
 * Displays shifts in day, week, or month view.
 * Supports click to view shift details.
 */

import React, {useMemo} from 'react';
import {Box, Flex, Grid, GridItem, Spinner, Text, VStack,} from '@chakra-ui/react';
import {Shift, ViewMode} from '../../../types/scheduling.types';
import ShiftCard from './ShiftCard';

interface CalendarViewProps {
  shifts: Shift[];
  viewMode: ViewMode;
  selectedDate: string;
  onShiftClick: (shift: Shift) => void;
  isLoading?: boolean;
}

// Day names for header
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Shift order for sorting
const SHIFT_ORDER: Record<string, number> = {
  Morning: 1,
  Afternoon: 2,
  Night: 3,
};

const CalendarView: React.FC<CalendarViewProps> = ({
                                                     shifts,
                                                     viewMode,
                                                     selectedDate,
                                                     onShiftClick,
                                                     isLoading = false,
                                                   }) => {
  // Get week dates
  const weekDates = useMemo(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(date);
    start.setDate(date.getDate() + diff);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [selectedDate]);

  // Get month dates (6 weeks grid)
  const monthDates = useMemo(() => {
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() + diff);

    const dates: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [selectedDate]);

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    shifts.forEach((shift) => {
      if (!map[shift.date]) {
        map[shift.date] = [];
      }
      map[shift.date].push(shift);
    });
    return map;
  }, [shifts]);

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  // Day View
  if (viewMode === 'day') {
    const dayShifts = shiftsByDate[selectedDate] || [];
    const date = new Date(selectedDate);
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;

    return (
      <Box
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        {/* Header */}
        <Box
          p={4}
          bg="gray.50"
          borderBottomWidth="1px"
          borderColor="gray.200"
        >
          <Text fontSize="lg" fontWeight="semibold" color="gray.800">
            {fullDayNames[dayIndex]}, {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''} scheduled
          </Text>
        </Box>

        {/* Shifts */}
        <Box p={4}>
          {dayShifts.length === 0 ? (
            <Flex justify="center" align="center" py={12}>
              <Text color="gray.500">No shifts scheduled for this day</Text>
            </Flex>
          ) : (
            <VStack align="stretch" gap={3}>
              {dayShifts
                .sort((a, b) => (SHIFT_ORDER[a.shiftType] || 0) - (SHIFT_ORDER[b.shiftType] || 0))

                .map((shift) => (
                  <ShiftCard
                    key={shift._id}
                    shift={shift}
                    onClick={onShiftClick}
                  />
                ))}
            </VStack>
          )}
        </Box>
      </Box>
    );
  }

  // Week View
  if (viewMode === 'week') {
    return (
      <Box
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        {/* Header */}
        <Grid templateColumns="repeat(7, 1fr)" borderBottomWidth="1px" borderColor="gray.200">
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayShifts = shiftsByDate[dateStr] || [];

            return (
              <GridItem
                key={dateStr}
                p={3}
                bg={isToday(date) ? 'blue.50' : 'gray.50'}
                borderRightWidth={index < 6 ? '1px' : '0'}
                borderColor="gray.200"
                textAlign="center"
              >
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  {dayNames[index]}
                </Text>
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color={isToday(date) ? 'blue.600' : 'gray.800'}
                >
                  {date.getDate()}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                </Text>
              </GridItem>
            );
          })}
        </Grid>

        {/* Body */}
        <Grid templateColumns="repeat(7, 1fr)" minH="500px">
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayShifts = shiftsByDate[dateStr] || [];

            return (
              <GridItem
                key={dateStr}
                p={2}
                borderRightWidth={index < 6 ? '1px' : '0'}
                borderColor="gray.200"
                bg={isToday(date) ? 'blue.50' : 'white'}
              >
                <VStack align="stretch" gap={2}>
                  {dayShifts
                    .sort((a, b) => (SHIFT_ORDER[a.shiftType] || 0) - (SHIFT_ORDER[b.shiftType] || 0))

                    .map((shift) => (
                      <ShiftCard
                        key={shift._id}
                        shift={shift}
                        onClick={onShiftClick}
                      />
                    ))}
                </VStack>
              </GridItem>
            );
          })}
        </Grid>
      </Box>
    );
  }

  // Month View
  if (viewMode === 'month') {
    const currentMonth = new Date(selectedDate).getMonth();

    return (
      <Box
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        {/* Header */}
        <Grid templateColumns="repeat(7, 1fr)" borderBottomWidth="1px" borderColor="gray.200">
          {dayNames.map((day) => (
            <GridItem
              key={day}
              p={3}
              bg="gray.50"
              textAlign="center"
            >
              <Text fontSize="sm" color="gray.600" fontWeight="medium">
                {day}
              </Text>
            </GridItem>
          ))}
        </Grid>

        {/* Calendar Grid */}
        <Grid templateColumns="repeat(7, 1fr)">
          {monthDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayShifts = shiftsByDate[dateStr] || [];
            const isCurrentMonthDay = date.getMonth() === currentMonth;
            const isTodayDate = isToday(date);

            return (
              <GridItem
                key={dateStr}
                p={2}
                minH="100px"
                borderBottomWidth={index < 35 ? '1px' : '0'}
                borderRightWidth={(index + 1) % 7 !== 0 ? '1px' : '0'}
                borderColor="gray.200"
                bg={isTodayDate ? 'blue.50' : isCurrentMonthDay ? 'white' : 'gray.50'}
                opacity={isCurrentMonthDay ? 1 : 0.6}
              >
                {/* Date number */}
                <Text
                  fontSize="sm"
                  fontWeight={isTodayDate ? 'bold' : 'medium'}
                  color={isTodayDate ? 'blue.600' : isCurrentMonthDay ? 'gray.800' : 'gray.400'}
                  mb={1}
                >
                  {date.getDate()}
                </Text>

                {/* Shifts (compact) */}
                <VStack align="stretch" gap={1}>
                  {dayShifts.slice(0, 3).map((shift) => (
                    <ShiftCard
                      key={shift._id}
                      shift={shift}
                      isCompact
                      onClick={onShiftClick}
                    />
                  ))}
                  {dayShifts.length > 3 && (
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      +{dayShifts.length - 3} more
                    </Text>
                  )}
                </VStack>
              </GridItem>
            );
          })}
        </Grid>
      </Box>
    );
  }

  return null;
};

export default CalendarView;