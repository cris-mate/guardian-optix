/**
 * useTimeClockData Hook
 *
 * Centralised data fetching and state management for TimeClock page.
 * Toggle USE_MOCK_DATA to switch between mock and API data.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../utils/api';
import {
  ClockStatus,
  BreakType,
  TimeEntry,
  ActiveShift,
  TodayTimesheet,
  WeeklySummary,
  TimeClockStats,
  ActiveGuard,
  ClockActionPayload,
  GPSLocation,
  GeofenceStatus,
} from '../types/timeClock.types';

// Toggle this to switch between mock data and API calls
const USE_MOCK_DATA = true;

// ============================================
// Mock Data
// ============================================

const generateMockLocation = (isInside: boolean = true): GPSLocation => ({
  latitude: 51.5074 + (Math.random() - 0.5) * 0.01,
  longitude: -0.1278 + (Math.random() - 0.5) * 0.01,
  accuracy: Math.floor(Math.random() * 20) + 5,
  timestamp: new Date().toISOString(),
  address: isInside ? '1 Canada Square, London E14 5AB' : 'Remote Location',
});

const MOCK_ACTIVE_SHIFT: ActiveShift = {
  _id: 'as-001',
  shiftId: 'shift-001',
  officerId: 'off-001',
  officerName: 'Current User',
  badgeNumber: 'GO-2024-001',
  site: {
    _id: 'site-001',
    name: 'Canary Wharf Tower',
    address: '1 Canada Square',
    postCode: 'E14 5AB',
  },
  scheduledStart: new Date().setHours(8, 0, 0, 0).toString(),
  scheduledEnd: new Date().setHours(18, 0, 0, 0).toString(),
  clockStatus: 'clocked-out',
  geofenceStatus: 'inside',
  breaks: [],
  totalBreakMinutes: 0,
  totalWorkedMinutes: 0,
};

const generateMockTimeEntries = (): TimeEntry[] => {
  const today = new Date();
  const entries: TimeEntry[] = [];

  // Morning clock-in
  const clockInTime = new Date(today);
  clockInTime.setHours(7, 58, 32, 0);
  entries.push({
    _id: 'te-001',
    officerId: 'off-001',
    officerName: 'James Wilson',
    type: 'clock-in',
    timestamp: clockInTime.toISOString(),
    location: generateMockLocation(true),
    geofenceStatus: 'inside',
    siteId: 'site-001',
    siteName: 'Canary Wharf Tower',
  });

  // Morning break start
  const breakStartTime = new Date(today);
  breakStartTime.setHours(10, 30, 15, 0);
  entries.push({
    _id: 'te-002',
    officerId: 'off-001',
    officerName: 'James Wilson',
    type: 'break-start',
    timestamp: breakStartTime.toISOString(),
    location: generateMockLocation(true),
    geofenceStatus: 'inside',
    siteId: 'site-001',
    siteName: 'Canary Wharf Tower',
  });

  // Morning break end
  const breakEndTime = new Date(today);
  breakEndTime.setHours(10, 45, 22, 0);
  entries.push({
    _id: 'te-003',
    officerId: 'off-001',
    officerName: 'James Wilson',
    type: 'break-end',
    timestamp: breakEndTime.toISOString(),
    location: generateMockLocation(true),
    geofenceStatus: 'inside',
    siteId: 'site-001',
    siteName: 'Canary Wharf Tower',
  });

  // Lunch break start
  const lunchStartTime = new Date(today);
  lunchStartTime.setHours(12, 30, 0, 0);
  entries.push({
    _id: 'te-004',
    officerId: 'off-001',
    officerName: 'James Wilson',
    type: 'break-start',
    timestamp: lunchStartTime.toISOString(),
    location: generateMockLocation(true),
    geofenceStatus: 'inside',
    siteId: 'site-001',
    siteName: 'Canary Wharf Tower',
  });

  // Lunch break end
  const lunchEndTime = new Date(today);
  lunchEndTime.setHours(13, 0, 45, 0);
  entries.push({
    _id: 'te-005',
    officerId: 'off-001',
    officerName: 'James Wilson',
    type: 'break-end',
    timestamp: lunchEndTime.toISOString(),
    location: generateMockLocation(true),
    geofenceStatus: 'inside',
    siteId: 'site-001',
    siteName: 'Canary Wharf Tower',
  });

  return entries.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

const MOCK_ACTIVE_GUARDS: ActiveGuard[] = [
  {
    _id: 'ag-001',
    officerId: 'off-001',
    fullName: 'James Wilson',
    badgeNumber: 'GO-2024-001',
    clockStatus: 'clocked-in',
    clockedInAt: new Date(new Date().setHours(7, 58, 0, 0)).toISOString(),
    currentSite: 'Canary Wharf Tower',
    geofenceStatus: 'inside',
    hoursToday: 6.5,
  },
  {
    _id: 'ag-002',
    officerId: 'off-002',
    fullName: 'Sarah Mitchell',
    badgeNumber: 'GO-2024-002',
    clockStatus: 'on-break',
    clockedInAt: new Date(new Date().setHours(6, 0, 0, 0)).toISOString(),
    currentSite: 'Westminster Office Complex',
    geofenceStatus: 'inside',
    hoursToday: 8.2,
  },
  {
    _id: 'ag-003',
    officerId: 'off-003',
    fullName: 'David Chen',
    badgeNumber: 'GO-2024-003',
    clockStatus: 'clocked-in',
    clockedInAt: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    currentSite: "King's Cross Hub",
    geofenceStatus: 'inside',
    hoursToday: 2.3,
  },
  {
    _id: 'ag-004',
    officerId: 'off-004',
    fullName: 'Emma Thompson',
    badgeNumber: 'GO-2024-004',
    clockStatus: 'clocked-in',
    clockedInAt: new Date(new Date().setHours(8, 15, 0, 0)).toISOString(),
    currentSite: 'SouthBank Centre',
    geofenceStatus: 'outside',
    hoursToday: 5.8,
  },
  {
    _id: 'ag-005',
    officerId: 'off-005',
    fullName: 'Michael Brown',
    badgeNumber: 'GO-2024-005',
    clockStatus: 'clocked-out',
    currentSite: undefined,
    geofenceStatus: 'unknown',
    hoursToday: 0,
  },
];

const MOCK_STATS: TimeClockStats = {
  todayHours: 6.5,
  weekHours: 32.5,
  monthHours: 142.75,
  overtimeThisWeek: 2.5,
  breaksTaken: 3,
  onTimeClockIns: 18,
  lateClockIns: 2,
  activeGuardsCount: 4,
  guardsOnBreak: 1,
  pendingApprovals: 3,
};

const MOCK_WEEKLY_SUMMARY: WeeklySummary = {
  weekStart: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)).toISOString(),
  weekEnd: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 7)).toISOString(),
  totalHours: 32.5,
  regularHours: 30,
  overtimeHours: 2.5,
  daysWorked: 4,
  averageHoursPerDay: 8.125,
};

// ============================================
// Hook Return Type
// ============================================

interface UseTimeClockDataReturn {
  // Current state
  clockStatus: ClockStatus;
  activeShift: ActiveShift | null;
  currentLocation: GPSLocation | null;
  geofenceStatus: GeofenceStatus;

  // Data
  timeEntries: TimeEntry[];
  todayTimesheet: TodayTimesheet | null;
  weeklySummary: WeeklySummary;
  stats: TimeClockStats;
  activeGuards: ActiveGuard[];

  // Loading states
  isLoading: boolean;
  isClockingIn: boolean;
  isClockingOut: boolean;
  isProcessingBreak: boolean;
  isLocationLoading: boolean;

  // Actions
  clockIn: (notes?: string) => Promise<void>;
  clockOut: (notes?: string) => Promise<void>;
  startBreak: (breakType: BreakType) => Promise<void>;
  endBreak: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  refetch: () => Promise<void>;

  // Error handling
  error: string | null;
  locationError: string | null;
  clearError: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export const useTimeClockData = (): UseTimeClockDataReturn => {
  // State
  const [clockStatus, setClockStatus] = useState<ClockStatus>('clocked-out');
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [geofenceStatus, setGeofenceStatus] = useState<GeofenceStatus>('unknown');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [todayTimesheet, setTodayTimesheet] = useState<TodayTimesheet | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>(MOCK_WEEKLY_SUMMARY);
  const [stats, setStats] = useState<TimeClockStats>(MOCK_STATS);
  const [activeGuards, setActiveGuards] = useState<ActiveGuard[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [isProcessingBreak, setIsProcessingBreak] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ============================================
  // Location Handling
  // ============================================

  const refreshLocation = useCallback(async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockLoc = generateMockLocation(true);
        setCurrentLocation(mockLoc);
        setGeofenceStatus('inside');
      } else {
        // Real GPS implementation would use navigator.geolocation
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        });

        const location: GPSLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        setCurrentLocation(location);
        // API call to verify geofence
        const response = await api.post('/api/timeClock/verify-location', { location });
        setGeofenceStatus(response.data.geofenceStatus);
      }
    } catch (err) {
      setLocationError('Unable to get current location. Please enable GPS.');
      console.error('Location error:', err);
    } finally {
      setIsLocationLoading(false);
    }
  }, []);

  // ============================================
  // Data Fetching
  // ============================================

  const fetchTimeClockData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 600));

        setActiveShift(MOCK_ACTIVE_SHIFT);
        setTimeEntries(generateMockTimeEntries());
        setActiveGuards(MOCK_ACTIVE_GUARDS);
        setStats(MOCK_STATS);
        setWeeklySummary(MOCK_WEEKLY_SUMMARY);

        // Set mock timesheet
        const mockTimesheet: TodayTimesheet = {
          date: new Date().toISOString().split('T')[0],
          officerId: 'off-001',
          officerName: 'James Wilson',
          entries: generateMockTimeEntries(),
          totalHours: 6.5,
          regularHours: 6.5,
          overtimeHours: 0,
          breakMinutes: 45,
          status: 'pending',
        };
        setTodayTimesheet(mockTimesheet);

        // Refresh location
        await refreshLocation();
      } else {
        const [shiftRes, entriesRes, guardsRes, statsRes] = await Promise.all([
          api.get('/api/timeClock/active-shift'),
          api.get('/api/timeClock/entries/today'),
          api.get('/api/timeClock/active-guards'),
          api.get('/api/timeClock/stats'),
        ]);

        setActiveShift(shiftRes.data);
        setTimeEntries(entriesRes.data);
        setActiveGuards(guardsRes.data);
        setStats(statsRes.data);

        if (shiftRes.data) {
          setClockStatus(shiftRes.data.clockStatus);
        }
      }
    } catch (err) {
      setError('Failed to load time clock data');
      console.error('Error fetching time clock data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshLocation]);

  // ============================================
  // Clock Actions
  // ============================================

  const clockIn = useCallback(async (notes?: string) => {
    setIsClockingIn(true);
    setError(null);

    try {
      await refreshLocation();

      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 800));

        const newEntry: TimeEntry = {
          _id: `te-${Date.now()}`,
          officerId: 'off-001',
          officerName: 'Current User',
          type: 'clock-in',
          timestamp: new Date().toISOString(),
          location: currentLocation || generateMockLocation(true),
          geofenceStatus: 'inside',
          siteId: 'site-001',
          siteName: 'Canary Wharf Tower',
          notes,
        };

        setTimeEntries(prev => [newEntry, ...prev]);
        setClockStatus('clocked-in');

        if (activeShift) {
          setActiveShift({
            ...activeShift,
            clockStatus: 'clocked-in',
            actualStart: new Date().toISOString(),
          });
        }
      } else {
        const payload: ClockActionPayload = {
          type: 'clock-in',
          location: currentLocation || undefined,
          siteId: activeShift?.site._id,
          notes,
        };

        await api.post('/api/timeClock/clock-in', payload);
        await fetchTimeClockData();
      }
    } catch (err) {
      setError('Failed to clock in. Please try again.');
      console.error('Clock in error:', err);
    } finally {
      setIsClockingIn(false);
    }
  }, [currentLocation, activeShift, refreshLocation, fetchTimeClockData]);

  const clockOut = useCallback(async (notes?: string) => {
    setIsClockingOut(true);
    setError(null);

    try {
      await refreshLocation();

      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 800));

        const newEntry: TimeEntry = {
          _id: `te-${Date.now()}`,
          officerId: 'off-001',
          officerName: 'Current User',
          type: 'clock-out',
          timestamp: new Date().toISOString(),
          location: currentLocation || generateMockLocation(true),
          geofenceStatus: 'inside',
          siteId: 'site-001',
          siteName: 'Canary Wharf Tower',
          notes,
        };

        setTimeEntries(prev => [newEntry, ...prev]);
        setClockStatus('clocked-out');

        if (activeShift) {
          setActiveShift({
            ...activeShift,
            clockStatus: 'clocked-out',
            actualEnd: new Date().toISOString(),
          });
        }
      } else {
        const payload: ClockActionPayload = {
          type: 'clock-out',
          location: currentLocation || undefined,
          notes,
        };

        await api.post('/api/timeClock/clock-out', payload);
        await fetchTimeClockData();
      }
    } catch (err) {
      setError('Failed to clock out. Please try again.');
      console.error('Clock out error:', err);
    } finally {
      setIsClockingOut(false);
    }
  }, [currentLocation, activeShift, refreshLocation, fetchTimeClockData]);

  const startBreak = useCallback(async (breakType: BreakType) => {
    setIsProcessingBreak(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const newEntry: TimeEntry = {
          _id: `te-${Date.now()}`,
          officerId: 'off-001',
          officerName: 'Current User',
          type: 'break-start',
          timestamp: new Date().toISOString(),
          location: currentLocation || generateMockLocation(true),
          geofenceStatus: 'inside',
          siteId: 'site-001',
          siteName: 'Canary Wharf Tower',
        };

        setTimeEntries(prev => [newEntry, ...prev]);
        setClockStatus('on-break');

        if (activeShift) {
          setActiveShift({
            ...activeShift,
            clockStatus: 'on-break',
          });
        }
      } else {
        const payload: ClockActionPayload = {
          type: 'break-start',
          location: currentLocation || undefined,
          breakType,
        };

        await api.post('/api/timeClock/break/start', payload);
        await fetchTimeClockData();
      }
    } catch (err) {
      setError('Failed to start break. Please try again.');
      console.error('Start break error:', err);
    } finally {
      setIsProcessingBreak(false);
    }
  }, [currentLocation, activeShift, fetchTimeClockData]);

  const endBreak = useCallback(async () => {
    setIsProcessingBreak(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const newEntry: TimeEntry = {
          _id: `te-${Date.now()}`,
          officerId: 'off-001',
          officerName: 'Current User',
          type: 'break-end',
          timestamp: new Date().toISOString(),
          location: currentLocation || generateMockLocation(true),
          geofenceStatus: 'inside',
          siteId: 'site-001',
          siteName: 'Canary Wharf Tower',
        };

        setTimeEntries(prev => [newEntry, ...prev]);
        setClockStatus('clocked-in');

        if (activeShift) {
          setActiveShift({
            ...activeShift,
            clockStatus: 'clocked-in',
          });
        }
      } else {
        const payload: ClockActionPayload = {
          type: 'break-end',
          location: currentLocation || undefined,
        };

        await api.post('/api/timeClock/break/end', payload);
        await fetchTimeClockData();
      }
    } catch (err) {
      setError('Failed to end break. Please try again.');
      console.error('End break error:', err);
    } finally {
      setIsProcessingBreak(false);
    }
  }, [currentLocation, activeShift, fetchTimeClockData]);

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    fetchTimeClockData();
  }, [fetchTimeClockData]);

  // ============================================
  // Return
  // ============================================

  return {
    clockStatus,
    activeShift,
    currentLocation,
    geofenceStatus,
    timeEntries,
    todayTimesheet,
    weeklySummary,
    stats,
    activeGuards,
    isLoading,
    isClockingIn,
    isClockingOut,
    isProcessingBreak,
    isLocationLoading,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    refreshLocation,
    refetch: fetchTimeClockData,
    error,
    locationError,
    clearError: () => setError(null),
  };
};

export default useTimeClockData;