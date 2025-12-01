import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../utils/api';
import type {
  DashboardState,
  OperationalMetrics,
  DashboardAlert,
  TodayScheduleOverview,
  GuardStatusEntry,
  ActivityEvent,
  Task,
  IncidentSummary,
} from '../types/dashboard.types';

// ============================================
// Configuration
// ============================================

const REFRESH_INTERVAL = 30000; // 30 seconds
const ACTIVITY_POLL_INTERVAL = 10000; // 10 seconds for activity feed

// ============================================
// Initial State
// ============================================

const initialState: DashboardState = {
  metrics: null,
  alerts: [],
  scheduleOverview: null,
  guardStatuses: [],
  activityFeed: [],
  pendingTasks: [],
  recentIncidents: [],
  isLoading: true,
  error: null,
  lastUpdated: null,
};

// ============================================
// Custom Hook
// ============================================

interface UseDashboardDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDashboardDataReturn extends DashboardState {
  refresh: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  markAlertRead: (alertId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
}

export const useDashboardData = (
  options: UseDashboardDataOptions = {}
): UseDashboardDataReturn => {
  const {
    autoRefresh = true,
    refreshInterval = REFRESH_INTERVAL
  } = options;

  const [state, setState] = useState<DashboardState>(initialState);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // ----------------------------------------
  // Fetch Functions
  // ----------------------------------------

  const fetchMetrics = useCallback(async (): Promise<OperationalMetrics> => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  }, []);

  const fetchAlerts = useCallback(async (): Promise<DashboardAlert[]> => {
    const response = await api.get('/dashboard/alerts');
    return response.data;
  }, []);

  const fetchScheduleOverview = useCallback(async (): Promise<TodayScheduleOverview> => {
    const response = await api.get('/dashboard/schedule-overview');
    return response.data;
  }, []);

  const fetchGuardStatuses = useCallback(async (): Promise<GuardStatusEntry[]> => {
    const response = await api.get('/dashboard/guard-statuses');
    return response.data;
  }, []);

  const fetchActivityFeed = useCallback(async (): Promise<ActivityEvent[]> => {
    const response = await api.get('/dashboard/activity-feed', {
      params: { limit: 20 },
    });
    return response.data;
  }, []);

  const fetchPendingTasks = useCallback(async (): Promise<Task[]> => {
    const response = await api.get('/dashboard/pending-tasks', {
      params: { limit: 10 },
    });
    return response.data;
  }, []);

  const fetchRecentIncidents = useCallback(async (): Promise<IncidentSummary[]> => {
    const response = await api.get('/dashboard/recent-incidents', {
      params: { limit: 5 },
    });
    return response.data;
  }, []);

  // ----------------------------------------
  // Main Data Fetch
  // ----------------------------------------

  const fetchAllData = useCallback(async () => {
    if (!mountedRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Parallel fetch for performance
      const [
        metrics,
        alerts,
        scheduleOverview,
        guardStatuses,
        activityFeed,
        pendingTasks,
        recentIncidents,
      ] = await Promise.all([
        fetchMetrics(),
        fetchAlerts(),
        fetchScheduleOverview(),
        fetchGuardStatuses(),
        fetchActivityFeed(),
        fetchPendingTasks(),
        fetchRecentIncidents(),
      ]);

      if (!mountedRef.current) return;

      setState({
        metrics,
        alerts,
        scheduleOverview,
        guardStatuses,
        activityFeed,
        pendingTasks,
        recentIncidents,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to load dashboard data';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      console.error('Dashboard data fetch error:', err);
    }
  }, [
    fetchMetrics,
    fetchAlerts,
    fetchScheduleOverview,
    fetchGuardStatuses,
    fetchActivityFeed,
    fetchPendingTasks,
    fetchRecentIncidents,
  ]);

  // ----------------------------------------
  // Refresh ActivityHub Feed Only (more frequent)
  // ----------------------------------------

  const refreshActivityFeed = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const activityFeed = await fetchActivityFeed();
      if (mountedRef.current) {
        setState(prev => ({ ...prev, activityFeed }));
      }
    } catch (err) {
      console.error('ActivityHub feed refresh error:', err);
    }
  }, [fetchActivityFeed]);

  // ----------------------------------------
  // Alert Actions
  // ----------------------------------------

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      await api.patch(`/dashboard/alerts/${alertId}/dismiss`);
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.map(alert =>
          alert.id === alertId ? { ...alert, isDismissed: true } : alert
        ),
      }));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
      throw err;
    }
  }, []);

  const markAlertRead = useCallback(async (alertId: string) => {
    try {
      await api.patch(`/dashboard/alerts/${alertId}/read`);
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.map(alert =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        ),
      }));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
      throw err;
    }
  }, []);

  // ----------------------------------------
  // Task Actions
  // ----------------------------------------

  const completeTask = useCallback(async (taskId: string) => {
    try {
      await api.patch(`/tasks/${taskId}/complete`);
      setState(prev => ({
        ...prev,
        pendingTasks: prev.pendingTasks.filter(task => task.id !== taskId),
        metrics: prev.metrics
          ? { ...prev.metrics, pendingTasks: prev.metrics.pendingTasks - 1 }
          : null,
      }));
    } catch (err) {
      console.error('Failed to complete task:', err);
      throw err;
    }
  }, []);

  // ----------------------------------------
  // Effects
  // ----------------------------------------

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchAllData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchAllData]);

  // Auto-refresh main data
  useEffect(() => {
    if (!autoRefresh) return;

    refreshTimerRef.current = setInterval(fetchAllData, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchAllData]);

  // More frequent activity feed refresh
  useEffect(() => {
    if (!autoRefresh) return;

    activityTimerRef.current = setInterval(refreshActivityFeed, ACTIVITY_POLL_INTERVAL);

    return () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, [autoRefresh, refreshActivityFeed]);

  return {
    ...state,
    refresh: fetchAllData,
    dismissAlert,
    markAlertRead,
    completeTask,
  };
};

// ============================================
// Mock Data Hook (for development)
// ============================================

export const useMockDashboardData = (): UseDashboardDataReturn => {
  const [state, setState] = useState<DashboardState>({
    ...initialState,
    isLoading: false,
    metrics: {
      activeGuards: 12,
      totalScheduled: 15,
      shiftsToday: 18,
      shiftsCovered: 16,
      attendanceRate: 94.5,
      patrolCompletionRate: 87.2,
      openIncidents: 3,
      pendingTasks: 7,
      geofenceViolations: 1,
      complianceScore: 92,
    },
    alerts: [
      {
        id: '1',
        type: 'attendance',
        severity: 'critical',
        title: 'No-Show Alert',
        message: 'John Smith has not clocked in for shift at Site A',
        timestamp: new Date().toISOString(),
        actionRequired: true,
        actionUrl: '/schedules',
        relatedEntity: { type: 'guard', id: 'g1', name: 'John Smith' },
        isRead: false,
        isDismissed: false,
      },
      {
        id: '2',
        type: 'geofence',
        severity: 'warning',
        title: 'Geofence Violation',
        message: 'Guard detected outside permitted zone at Warehouse B',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        actionRequired: true,
        isRead: false,
        isDismissed: false,
      },
      {
        id: '3',
        type: 'compliance',
        severity: 'info',
        title: 'License Expiring',
        message: '2 guard licenses expiring within 30 days',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        actionRequired: false,
        actionUrl: '/compliance',
        isRead: true,
        isDismissed: false,
      },
    ],
    scheduleOverview: {
      totalShifts: 18,
      activeShifts: 12,
      upcomingShifts: 4,
      completedShifts: 2,
      noShows: 1,
      lateArrivals: 2,
      shifts: [],
    },
    guardStatuses: [
      {
        id: 'g1',
        name: 'John Smith',
        role: 'Senior Guard',
        status: 'on-duty',
        currentSite: 'Corporate HQ',
        lastActivity: {
          type: 'checkpoint-scan',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          description: 'Scanned checkpoint B3',
        },
      },
      {
        id: 'g2',
        name: 'Sarah Johnson',
        role: 'Patrol Officer',
        status: 'on-duty',
        currentSite: 'Warehouse District',
        lastActivity: {
          type: 'clock-in',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          description: 'Started shift',
        },
      },
      {
        id: 'g3',
        name: 'Mike Brown',
        role: 'Security Guard',
        status: 'break',
        currentSite: 'Mall Complex',
        lastActivity: {
          type: 'break-start',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          description: 'Started 15-min break',
        },
      },
    ],
    activityFeed: [
      {
        id: 'a1',
        type: 'clock-in',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        guardName: 'Alex Turner',
        siteName: 'Tech Park',
        description: 'Clocked in for evening shift',
      },
      {
        id: 'a2',
        type: 'checkpoint-scan',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        guardName: 'John Smith',
        siteName: 'Corporate HQ',
        description: 'Completed checkpoint tour (12/12)',
      },
      {
        id: 'a3',
        type: 'incident-report',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        guardName: 'Sarah Johnson',
        siteName: 'Warehouse District',
        description: 'Submitted incident report: Suspicious vehicle',
        severity: 'warning',
      },
    ],
    pendingTasks: [
      {
        id: 't1',
        title: 'Equipment Inspection',
        description: 'Monthly radio equipment check',
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        site: { id: 's1', name: 'Corporate HQ' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't2',
        title: 'Training Completion',
        description: 'Complete annual safety training',
        priority: 'medium',
        status: 'in-progress',
        dueDate: new Date(Date.now() + 172800000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    recentIncidents: [
      {
        id: 'i1',
        title: 'Unauthorized Access Attempt',
        severity: 'high',
        status: 'under-review',
        reportedAt: new Date(Date.now() - 3600000).toISOString(),
        reportedBy: { id: 'g1', name: 'John Smith' },
        site: { id: 's1', name: 'Corporate HQ' },
        category: 'Security Breach',
      },
    ],
    lastUpdated: new Date(),
  });

  const refresh = async () => {
    setState(prev => ({ ...prev, lastUpdated: new Date() }));
  };

  const dismissAlert = async (alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== alertId),
    }));
  };

  const markAlertRead = async (alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(a =>
        a.id === alertId ? { ...a, isRead: true } : a
      ),
    }));
  };

  const completeTask = async (taskId: string) => {
    setState(prev => ({
      ...prev,
      pendingTasks: prev.pendingTasks.filter(t => t.id !== taskId),
    }));
  };

  return {
    ...state,
    refresh,
    dismissAlert,
    markAlertRead,
    completeTask,
  };
};

export default useDashboardData;