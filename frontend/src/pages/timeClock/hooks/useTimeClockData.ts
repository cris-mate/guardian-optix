/**
 * useTimeClockData Hook
 *
 * Centralised data fetching and state management for TimeClock page.
 * Toggle USE_MOCK_DATA to switch between mock and API data.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';
import { MOCK_CONFIG, simulateDelay } from '../../../config/api.config';
import {
  ClockStatus,
  GeofenceStatus,
  GPSLocation,
  TimeEntry,
  ActiveShift,
  TodayTimesheet,
  WeeklySummary,
  TimeClockStats,
  ActiveGuard,
  ClockActionPayload,
  GeofenceConfig,
} from '../../../types/timeClock.types';


const USE_MOCK_DATA = MOCK_CONFIG.timeClock;

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
  guardId: 'off-001',
  guardName: 'Current User',
  siaLicenceNumber: 'GO-2024-001',
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
    guardId: 'off-001',
    guardName: 'James Wilson',
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
    guardId: 'off-001',
    guardName: 'James Wilson',
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
    guardId: 'off-001',
    guardName: 'James Wilson',
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
    guardId: 'off-001',
    guardName: 'James Wilson',
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
    guardId: 'off-001',
    guardName: 'James Wilson',
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
    guardId: 'off-001',
    fullName: 'James Wilson',
    siaLicenceNumber: 'GO-2024-001',
    clockStatus: 'clocked-in',
    clockedInAt: new Date(new Date().setHours(7, 58, 0, 0)).toISOString(),
    currentSite: 'Canary Wharf Tower',
    geofenceStatus: 'inside',
    hoursToday: 6.5,
  },
  {
    _id: 'ag-002',
    guardId: 'off-002',
    fullName: 'Sarah Mitchell',
    siaLicenceNumber: 'GO-2024-002',
    clockStatus: 'on-break',
    clockedInAt: new Date(new Date().setHours(6, 0, 0, 0)).toISOString(),
    currentSite: 'Westminster Office Complex',
    geofenceStatus: 'inside',
    hoursToday: 8.2,
  },
  {
    _id: 'ag-003',
    guardId: 'off-003',
    fullName: 'David Chen',
    siaLicenceNumber: 'GO-2024-003',
    clockStatus: 'clocked-in',
    clockedInAt: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    currentSite: "King's Cross Hub",
    geofenceStatus: 'inside',
    hoursToday: 2.3,
  },
  {
    _id: 'ag-004',
    guardId: 'off-004',
    fullName: 'Emma Thompson',
    siaLicenceNumber: 'GO-2024-004',
    clockStatus: 'clocked-in',
    clockedInAt: new Date(new Date().setHours(8, 15, 0, 0)).toISOString(),
    currentSite: 'SouthBank Centre',
    geofenceStatus: 'outside',
    hoursToday: 5.8,
  },
  {
    _id: 'ag-005',
    guardId: 'off-005',
    fullName: 'Michael Brown',
    siaLicenceNumber: 'GO-2024-005',
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
  weeklySummary: WeeklySummary | null;
  stats: TimeClockStats | null;
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
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  refreshLocation: () => Promise<GPSLocation | null | undefined>;
  refetch: () => Promise<void>;

  // Error handling
  error: string | null;
  locationError: string | null;
  clearError: () => void;

  // Simulation controls
  geofenceConfig: GeofenceConfig | null;
  geofenceViolations: number;
  simulationEnabled: boolean;
  setSimulationEnabled: (enabled: boolean) => void;
  selectedScenario: string;
  setSelectedScenario: (scenario: string) => void;
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
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [stats, setStats] = useState<TimeClockStats | null>(null);
  const [activeGuards, setActiveGuards] = useState<ActiveGuard[]>([]);
  const [geofenceViolations, setGeofenceViolations] = useState<number>(0);

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
  // Simulation State
  // ============================================
  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig | null>(null);
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('inside_center');

  // ============================================
  // Fetch Geofence Config
  // ============================================
  const fetchGeofenceConfig = useCallback(async () => {
    try {
      const response = await api.get('/timeClock/geofence-config');
      if (response.data.success) {
        setGeofenceConfig(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch geofence config:', err);
    }
  }, []);

  // ============================================
  // Location Handling
  // ============================================

  const refreshLocation = useCallback(async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('medium');
        const mockLoc = generateMockLocation(true);
        setCurrentLocation(mockLoc);
        setGeofenceStatus('inside');
      } else {
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
        return location;
      }
    } catch (err) {
      setLocationError('Unable to get current location. Please enable GPS.');
      console.error('Location error:', err);
      return null;
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
        await simulateDelay('medium');

        setActiveShift(MOCK_ACTIVE_SHIFT);
        setTimeEntries(generateMockTimeEntries());
        setActiveGuards(MOCK_ACTIVE_GUARDS);
        setStats(MOCK_STATS);
        setWeeklySummary(MOCK_WEEKLY_SUMMARY);

        // Set mock timesheet
        const mockTimesheet: TodayTimesheet = {
          date: new Date().toISOString().split('T')[0],
          guardId: 'off-001',
          guardName: 'James Wilson',
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
        const [statusRes, entriesRes, timesheetRes] = await Promise.all([
          api.get('/timeClock/status'),
          api.get('/timeClock/entries/today'),
          api.get('/timeClock/timesheet/today'),
        ]);

        if (statusRes.data.success) {
          const data = statusRes.data.data;
          setClockStatus(data.clockStatus);
          setActiveShift(data.site ? {
            _id: data._id,
            shiftId: data.shift?._id,
            guardId: data.guard,
            guardName: '',
            site: data.site,
            scheduledStart: data.shift?.startTime,
            scheduledEnd: data.shift?.endTime,
            clockStatus: data.clockStatus,
            geofenceStatus: data.geofenceStatus,
            breaks: [],
            totalBreakMinutes: data.totalBreakMinutesToday || 0,
            totalWorkedMinutes: 0,
          } : null);
          setGeofenceStatus(data.geofenceStatus || 'unknown');
        }

        if (entriesRes.data.success) {
          setTimeEntries(entriesRes.data.data);
        }

        if (timesheetRes.data.success) {
          setTodayTimesheet(timesheetRes.data.data);
        }
        const statsRes = await api.get('/timeClock/stats');
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
          setGeofenceViolations(statsRes.data.data.geofenceViolations || 0);
        }
      }
      await refreshLocation();
    } catch (err) {
      setError('Failed to load time clock data');
      console.error('Error fetching time clock data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshLocation]);

  // ============================================
  // Clock In
  // ============================================

  const clockIn = useCallback(async (notes?: string) => {
    setIsClockingIn(true);
    setError(null);

    try {
      await refreshLocation();

      if (USE_MOCK_DATA) {
        await simulateDelay('long');

        const newEntry: TimeEntry = {
          _id: `te-${Date.now()}`,
          guardId: 'off-001',
          guardName: 'Current User',
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
        const payload: ClockActionPayload & { simulationScenario?: string } = {
          type: 'clock-in',
          location: currentLocation || undefined,
          siteId: activeShift?.site._id,
          notes,
        };

        // Add simulation scenario if enabled
        if (simulationEnabled && geofenceConfig?.simulationEnabled) {
          payload.simulationScenario = selectedScenario;
        }

        const response = await api.post('/timeClock/clock-in', payload);

        if (response.data.success) {
          // Update geofence status from response
          if (response.data.data.geofence) {
            setGeofenceStatus(response.data.data.geofence.status);
          }
        }

        await fetchTimeClockData();
      }
    } catch (err) {
      setError('Failed to clock in. Please try again.');
      console.error('Clock in error:', err);
    } finally {
      setIsClockingIn(false);
    }
  }, [
    currentLocation,
    activeShift,
    refreshLocation,
    fetchTimeClockData,
    simulationEnabled,
    selectedScenario,
    geofenceConfig,
  ]);

  // ============================================
  // Clock Out
  // ============================================
  const clockOut = useCallback(async (notes?: string) => {
    setIsClockingOut(true);
    setError(null);

    try {
      await refreshLocation();

      if (USE_MOCK_DATA) {
        await simulateDelay('long');

        const newEntry: TimeEntry = {
          _id: `te-${Date.now()}`,
          guardId: 'off-001',
          guardName: 'Current User',
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
        const payload: ClockActionPayload & { simulationScenario?: string } = {
          type: 'clock-out',
          location: currentLocation || undefined,
          notes,
        };

        if (simulationEnabled && geofenceConfig?.simulationEnabled) {
          payload.simulationScenario = selectedScenario;
        }

        await api.post('/timeClock/clock-out', payload);
        await fetchTimeClockData();
      }
    } catch (err) {
      setError('Failed to clock out. Please try again.');
      console.error('Clock out error:', err);
    } finally {
      setIsClockingOut(false);
    }
  }, [
    currentLocation,
    activeShift,
    refreshLocation,
    fetchTimeClockData,
    simulationEnabled,
    selectedScenario,
    geofenceConfig,
  ]);

  // ============================================
  // Start Break
  // ============================================
  const startBreak = useCallback(async () => {
    setIsProcessingBreak(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('medium');

        const newEntry: TimeEntry = {
          _id: `te-${Date.now()}`,
          guardId: 'off-001',
          guardName: 'Current User',
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
        const payload: ClockActionPayload & { simulationScenario?: string } = {
          type: 'break-start',
          location: currentLocation || undefined,
        };

        if (simulationEnabled && geofenceConfig?.simulationEnabled) {
          payload.simulationScenario = selectedScenario;
        }

        await api.post('/timeClock/break/start', payload);
        await fetchTimeClockData();
      }
    } catch (err) {
      setError('Failed to start break. Please try again.');
      console.error('Start break error:', err);
    } finally {
      setIsProcessingBreak(false);
    }
  }, [
    currentLocation,
    activeShift,
    fetchTimeClockData,
    simulationEnabled,
    selectedScenario,
    geofenceConfig
  ]);

  // ============================================
  // End Break
  // ============================================
  const endBreak = useCallback(async () => {
    setIsProcessingBreak(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await simulateDelay('medium');

        const newEntry: TimeEntry = {
          _id: `te-${Date.now()}`,
          guardId: 'off-001',
          guardName: 'Current User',
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
        const payload: ClockActionPayload & { simulationScenario?: string } = {
          type: 'break-end',
          location: currentLocation || undefined,
        };

        if (simulationEnabled && geofenceConfig?.simulationEnabled) {
          payload.simulationScenario = selectedScenario;
        }

        await api.post('/timeClock/break/end', payload);
        await fetchTimeClockData();
      }
    } catch (err) {
      setError('Failed to end break. Please try again.');
      console.error('End break error:', err);
    } finally {
      setIsProcessingBreak(false);
    }
  }, [
    currentLocation,
    activeShift,
    fetchTimeClockData,
    simulationEnabled,
    selectedScenario,
    geofenceConfig,
  ]);

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    fetchTimeClockData();
    fetchGeofenceConfig();
  }, [fetchTimeClockData, fetchGeofenceConfig]);

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
    geofenceConfig,
    simulationEnabled,
    setSimulationEnabled,
    selectedScenario,
    setSelectedScenario,
    geofenceViolations,
  };
};

export default useTimeClockData;