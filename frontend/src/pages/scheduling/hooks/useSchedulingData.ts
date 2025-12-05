/**
 * useSchedulingData Hook
 *
 * Centralized data fetching and state management for the Scheduling page.
 * Includes mock data for development.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../utils/api';
import { MOCK_CONFIG, simulateDelay } from '../../../config/api.config';
import {
  Shift,
  ShiftFormData,
  SchedulingFilters,
  SchedulingStats,
  AvailableOfficer,
  AvailableSite,
  CalendarDay,
} from '../../../types/scheduling.types';

const USE_MOCK_DATA = MOCK_CONFIG.scheduling;

// ============================================
// Mock Data
// ============================================

const mockOfficers: AvailableOfficer[] = [
  { _id: 'off1', fullName: 'James Wilson', badgeNumber: 'GO-2024-001', guardType: 'Static', availability: true },
  { _id: 'off2', fullName: 'Sarah Mitchell', badgeNumber: 'GO-2024-002', guardType: 'Mobile Patrol', availability: true },
  { _id: 'off3', fullName: 'David Chen', badgeNumber: 'GO-2024-003', guardType: 'Static', availability: true },
  { _id: 'off4', fullName: 'Emma Thompson', badgeNumber: 'GO-2024-004', guardType: 'Close Protection', availability: false },
  { _id: 'off5', fullName: 'Michael Brown', badgeNumber: 'GO-2024-005', guardType: 'Dog Handler', availability: true },
  { _id: 'off6', fullName: 'Lisa Anderson', badgeNumber: 'GO-2024-006', guardType: 'Static', availability: true },
];

const mockSites: AvailableSite[] = [
  { _id: 'site1', name: 'Westminster Office Complex', address: '123 Victoria Street', postCode: 'SW1E 5JL', clientName: 'Barclays' },
  { _id: 'site2', name: 'Canary Wharf Tower', address: '1 Canada Square', postCode: 'E14 5AB', clientName: 'HSBC Holdings' },
  { _id: 'site3', name: 'King\'s Cross Hub', address: '1 Pancras Square', postCode: 'N1C 4AG', clientName: 'Google UK' },
  { _id: 'site4', name: 'SouthBank Centre', address: 'Belvedere Road', postCode: 'SE1 8XX', clientName: 'Arts Council' },
  { _id: 'site5', name: 'Olympic Park', address: 'Queen Elizabeth Olympic Park', postCode: 'E20 2ST', clientName: 'LLDC' },
];

const generateMockShifts = (): Shift[] => {
  const today = new Date();
  const shifts: Shift[] = [];

  // Generate shifts for the current week
  for (let dayOffset = -3; dayOffset <= 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    // Morning shift
    if (dayOffset !== 0 || Math.random() > 0.3) {
      const officer = mockOfficers[Math.floor(Math.random() * mockOfficers.length)];
      const site = mockSites[Math.floor(Math.random() * mockSites.length)];
      shifts.push({
        _id: `shift-${dateStr}-morning`,
        officer: {
          _id: officer._id,
          fullName: officer.fullName,
          badgeNumber: officer.badgeNumber,
        },
        site: {
          _id: site._id,
          name: site.name,
          postCode: site.postCode,
        },
        date: dateStr,
        startTime: '06:00',
        endTime: '14:00',
        shiftType: 'Morning',
        tasks: [
          {
            _id: 't1',
            title: 'Perimeter Check',
            description: 'Patrol perimeter and check all fence lines',
            frequency: 'hourly',
            priority: 'high',
            completed: dayOffset < 0,
          },
          {
            _id: 't2',
            title: 'Access Points',
            description: 'Check all access points are secure',
            frequency: 'once',
            priority: 'high',
            completed: dayOffset < 0,
          },
          {
            _id: 't3',
            title: 'Visitor Log',
            description: 'Log all visitor entries and exits',
            frequency: 'periodic',
            priority: 'medium',
            completed: false,
          },
        ],
        notes: dayOffset === 1 ? 'Client requested extra attention to loading bay area' : undefined,
        status: dayOffset < 0 ? 'completed' : dayOffset === 0 ? 'in-progress' : 'scheduled',
        createdAt: new Date().toISOString(),
      });
    }

    // Afternoon shift
    if (Math.random() > 0.4) {
      const officer = mockOfficers[Math.floor(Math.random() * mockOfficers.length)];
      const site = mockSites[Math.floor(Math.random() * mockSites.length)];
      shifts.push({
        _id: `shift-${dateStr}-afternoon`,
        officer: {
          _id: officer._id,
          fullName: officer.fullName,
          badgeNumber: officer.badgeNumber,
        },
        site: {
          _id: site._id,
          name: site.name,
          postCode: site.postCode,
        },
        date: dateStr,
        startTime: '14:00',
        endTime: '22:00',
        shiftType: 'Afternoon',
        tasks: [
          { _id: 't4', title: 'CCTV Monitoring', description: 'Monitor CCTV feeds', frequency: 'periodic', priority: 'medium', completed: dayOffset < 0 },
          { _id: 't5', title: 'End of Shift', description: 'Secure premises at shift end', frequency: 'once', priority: 'high', completed: dayOffset < 0 },
        ],
        status: dayOffset < 0 ? 'completed' : 'scheduled',
        createdAt: new Date().toISOString(),
      });
    }

    // Night shift
    if (Math.random() > 0.5) {
      const officer = mockOfficers[Math.floor(Math.random() * mockOfficers.length)];
      const site = mockSites[Math.floor(Math.random() * mockSites.length)];
      shifts.push({
        _id: `shift-${dateStr}-night`,
        officer: {
          _id: officer._id,
          fullName: officer.fullName,
          badgeNumber: officer.badgeNumber,
        },
        site: {
          _id: site._id,
          name: site.name,
          postCode: site.postCode,
        },
        date: dateStr,
        startTime: '22:00',
        endTime: '06:00',
        shiftType: 'Night',
        tasks: [
          { _id: 't6', title: 'Patrol Rounds', description: 'Hourly patrol rounds', frequency: 'hourly', priority: 'high', completed: false },
          { _id: 't7', title: 'Fire Exit Check', description: 'Check fire exits', frequency: 'once', priority: 'high', completed: false },
          { _id: 't8', title: 'Incident Log', description: 'Incident reporting', frequency: 'periodic', priority: 'medium', completed: false },
        ],
        status: dayOffset < 0 ? 'completed' : 'scheduled',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return shifts;
};

// ============================================
// Calendar Helpers
// ============================================

const getWeekDates = (date: Date): Date[] => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  start.setDate(diff);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const getMonthDates = (date: Date): CalendarDay[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date().toISOString().split('T')[0];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start from Monday of the week containing the first day
  const startDate = new Date(firstDay);
  const dayOfWeek = startDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + diff);

  const days: CalendarDay[] = [];

  // Generate 6 weeks (42 days) to ensure full calendar grid
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    days.push({
      date: dateStr,
      dayOfMonth: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      isToday: dateStr === today,
      shifts: [],
    });
  }

  return days;
};

// ============================================
// Default Filters
// ============================================

const defaultFilters: SchedulingFilters = {
  viewMode: 'week',
  selectedDate: new Date().toISOString().split('T')[0],
  shiftType: 'all',
  status: 'all',
};

// ============================================
// Hook
// ============================================

export const useSchedulingData = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [availableOfficers, setAvailableOfficers] = useState<AvailableOfficer[]>([]);
  const [availableSites, setAvailableSites] = useState<AvailableSite[]>([]);
  const [filters, setFiltersState] = useState<SchedulingFilters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch shifts
  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('medium');
        setShifts(generateMockShifts());
        setAvailableOfficers(mockOfficers);
        setAvailableSites(mockSites);
      } else {
        // API call would go here
        const response = await fetch('/api/scheduling/shifts');
        const data = await response.json();
        setShifts(data.shifts);
      }
    } catch (err) {
      setError('Failed to load shifts');
      console.error('Error fetching shifts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // Filter shifts based on current filters
  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      // Filter by officer
      if (filters.officerId && shift.officer._id !== filters.officerId) {
        return false;
      }

      // Filter by site
      if (filters.siteId && shift.site._id !== filters.siteId) {
        return false;
      }

      // Filter by shift type
      if (filters.shiftType && filters.shiftType !== 'all' && shift.shiftType !== filters.shiftType) {
        return false;
      }

      // Filter by status
      return !(filters.status && filters.status !== 'all' && shift.status !== filters.status);


    });
  }, [shifts, filters]);

  // Get shifts for calendar view
  const calendarData = useMemo(() => {
    const selectedDate = new Date(filters.selectedDate);

    if (filters.viewMode === 'day') {
      const dateStr = filters.selectedDate;
      return filteredShifts.filter((shift) => shift.date === dateStr);
    }

    if (filters.viewMode === 'week') {
      const weekDates = getWeekDates(selectedDate);
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];

      return filteredShifts.filter((shift) => shift.date >= startDate && shift.date <= endDate);
    }

    if (filters.viewMode === 'month') {
      const monthDays = getMonthDates(selectedDate);
      const startDate = monthDays[0].date;
      const endDate = monthDays[monthDays.length - 1].date;

      return filteredShifts.filter((shift) => shift.date >= startDate && shift.date <= endDate);
    }

    return filteredShifts;
  }, [filteredShifts, filters.viewMode, filters.selectedDate]);

  // Calculate statistics
  const stats: SchedulingStats = useMemo(() => {
    const totalShifts = calendarData.length;
    const scheduledShifts = calendarData.filter((s) => s.status === 'scheduled').length;
    const inProgressShifts = calendarData.filter((s) => s.status === 'in-progress').length;
    const completedShifts = calendarData.filter((s) => s.status === 'completed').length;
    const cancelledShifts = calendarData.filter((s) => s.status === 'cancelled').length;

    // Calculate total hours
    const totalHoursScheduled = calendarData.reduce((acc, shift) => {
      const start = parseInt(shift.startTime.split(':')[0]);
      const end = parseInt(shift.endTime.split(':')[0]);
      const hours = end > start ? end - start : 24 - start + end;
      return acc + hours;
    }, 0);

    // Coverage percentage (simplified)
    const coveragePercentage = totalShifts > 0 ? Math.round(((scheduledShifts + inProgressShifts) / totalShifts) * 100) : 0;

    return {
      totalShifts,
      scheduledShifts,
      inProgressShifts,
      completedShifts,
      cancelledShifts,
      totalHoursScheduled,
      coveragePercentage,
    };
  }, [calendarData]);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<SchedulingFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  // Select shift
  const selectShift = useCallback((shiftId: string | null) => {
    if (!shiftId) {
      setSelectedShift(null);
      return;
    }

    setIsLoadingDetails(true);
    const shift = shifts.find((s) => s._id === shiftId) || null;
    setSelectedShift(shift);
    setIsLoadingDetails(false);
  }, [shifts]);

  // Create shift
  const createShift = useCallback(async (data: ShiftFormData): Promise<void> => {
    setIsMutating(true);
    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('medium');

        const officer = mockOfficers.find((o) => o._id === data.officerId);
        const site = mockSites.find((s) => s._id === data.siteId);

        if (!officer || !site) {
          throw new Error('Invalid officer or site');
        }

        const newShift: Shift = {
          _id: `shift-${Date.now()}`,
          officer: {
            _id: officer._id,
            fullName: officer.fullName,
            badgeNumber: officer.badgeNumber,
          },
          site: {
            _id: site._id,
            name: site.name,
            postCode: site.postCode,
          },
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          shiftType: data.shiftType,
          tasks: data.tasks.map((t, i) => ({
            _id: `task-${Date.now()}-${i}`,
            title: t.title,
            description: t.description,
            frequency: t.frequency,
            priority: t.priority,
            completed: false,
          })),
          notes: data.notes,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
        };

        setShifts((prev) => [...prev, newShift]);
      } else {
        // API call would go here
        await fetch('/api/scheduling/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        await fetchShifts();
      }
    } catch (err) {
      console.error('Error creating shift:', err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [fetchShifts]);

  // Update shift
  const updateShift = useCallback(async (shiftId: string, data: Partial<ShiftFormData>): Promise<void> => {
    setIsMutating(true);
    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('medium');

        setShifts((prev) =>
          prev.map((shift): Shift => {
            if (shift._id !== shiftId) return shift;

            // Handle tasks separately if provided
            const updatedTasks = data.tasks
              ? data.tasks.map((t, i) => ({
                _id: shift.tasks[i]?._id || `task-${Date.now()}-${i}`,
                title: t.title,
                description: t.description,
                frequency: t.frequency,
                priority: t.priority,
                completed: shift.tasks[i]?.completed || false,
                completedAt: shift.tasks[i]?.completedAt,
                completedBy: shift.tasks[i]?.completedBy,
              }))
              : shift.tasks;

            return {
              ...shift,
              ...(data.officerId && { officer: shift.officer }), // Keep existing officer for now
              ...(data.siteId && { site: shift.site }), // Keep existing site for now
              ...(data.date && { date: data.date }),
              ...(data.startTime && { startTime: data.startTime }),
              ...(data.endTime && { endTime: data.endTime }),
              ...(data.shiftType && { shiftType: data.shiftType }),
              ...(data.notes !== undefined && { notes: data.notes }),
              tasks: updatedTasks,
              updatedAt: new Date().toISOString(),
            };
          })
        );
      } else {
        await fetch(`/api/scheduling/shifts/${shiftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        await fetchShifts();
      }
    } catch (err) {
      console.error('Error updating shift:', err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [fetchShifts]);

  // Delete shift
  const deleteShift = useCallback(async (shiftId: string): Promise<void> => {
    setIsMutating(true);
    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('short');
        setShifts((prev) => prev.filter((s) => s._id !== shiftId));
      } else {
        await fetch(`/api/scheduling/shifts/${shiftId}`, { method: 'DELETE' });
        await fetchShifts();
      }
    } catch (err) {
      console.error('Error deleting shift:', err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [fetchShifts]);

  // Toggle task completion
  const toggleTaskComplete = useCallback(async (shiftId: string, taskId: string, completed: boolean): Promise<void> => {
    if (USE_MOCK_DATA) {
      setShifts((prev) =>
        prev.map((shift) => {
          if (shift._id !== shiftId) return shift;

          return {
            ...shift,
            tasks: shift.tasks.map((task) => {
              if (task._id !== taskId) return task;
              return {
                ...task,
                completed,
                completedAt: completed ? new Date().toISOString() : undefined,
              };
            }),
          };
        })
      );

      // Update selected shift if it's the one being modified
      if (selectedShift?._id === shiftId) {
        setSelectedShift((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: prev.tasks.map((task) => {
              if (task._id !== taskId) return task;
              return {
                ...task,
                completed,
                completedAt: completed ? new Date().toISOString() : undefined,
              };
            }),
          };
        });
      }
    } else {
      await fetch(`/api/scheduling/shifts/${shiftId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
    }
  }, [selectedShift]);

  // Navigation helpers
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const currentDate = new Date(filters.selectedDate);

    switch (filters.viewMode) {
      case 'day':
        currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        currentDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    setFilters({ selectedDate: currentDate.toISOString().split('T')[0] });
  }, [filters.selectedDate, filters.viewMode, setFilters]);

  const goToToday = useCallback(() => {
    setFilters({ selectedDate: new Date().toISOString().split('T')[0] });
  }, [setFilters]);

  return {
    // Data
    shifts: calendarData,
    allShifts: shifts,
    selectedShift,
    availableOfficers,
    availableSites,
    stats,

    // State
    isLoading,
    isLoadingDetails,
    isMutating,
    error,

    // Filters
    filters,
    setFilters,
    resetFilters,

    // Actions
    selectShift,
    createShift,
    updateShift,
    deleteShift,
    toggleTaskComplete,
    refetch: fetchShifts,

    // Navigation
    navigateDate,
    goToToday,
  };
};

export default useSchedulingData;