/**
 * useDashboardData Hook
 *
 * Custom hook for fetching and managing dashboard data.
 * Supports auto-refresh and provides actions for alerts/tasks.
 */

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
} from '../../../types/dashboard.types';
import {
  REFRESH_INTERVALS,
  DEFAULT_DASHBOARD_STATE,
} from '../../../types/dashboard.types';

// ============================================
// Hook Options & Return Types
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

// ============================================
// Main Hook
// ============================================

export const useDashboardData = (
  options: UseDashboardDataOptions = {}
): UseDashboardDataReturn => {
  const {
    autoRefresh = true,
    refreshInterval = REFRESH_INTERVALS.metrics,
  } = options;

  const [state, setState] = useState<DashboardState>(DEFAULT_DASHBOARD_STATE);
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

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

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

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load dashboard data';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
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
  // Activity Feed Refresh (More Frequent)
  // ----------------------------------------

  const refreshActivityFeed = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const activityFeed = await fetchActivityFeed();
      if (!mountedRef.current) return;

      setState((prev) => ({
        ...prev,
        activityFeed,
      }));
    } catch (err) {
      console.error('Failed to refresh activity feed:', err);
    }
  }, [fetchActivityFeed]);

  // ----------------------------------------
  // Alert Actions
  // ----------------------------------------

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      await api.patch(`/dashboard/alerts/${alertId}/dismiss`);
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.map((alert) =>
          alert._id === alertId ? { ...alert, isDismissed: true } : alert
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
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.map((alert) =>
          alert._id === alertId ? { ...alert, isRead: true } : alert
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
      await api.patch(`/scheduling/shifts/tasks/${taskId}/complete`);
      setState((prev) => ({
        ...prev,
        pendingTasks: prev.pendingTasks.filter((task) => task._id !== taskId),
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

    activityTimerRef.current = setInterval(
      refreshActivityFeed,
      REFRESH_INTERVALS.activity
    );

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
    ...DEFAULT_DASHBOARD_STATE,
    isLoading: false,
    lastUpdated: new Date(),
    metrics: {
      activeGuards: 12,
      totalScheduled: 15,
      shiftsToday: 18,
      shiftsCovered: 16,
      attendanceRate: 88.9,
      patrolCompletionRate: 92.5,
      openIncidents: 2,
      pendingTasks: 7,
      geofenceViolations: 1,
      complianceScore: 94,
    },
    alerts: [
      {
        _id: 'alert-1',
        type: 'attendance',
        severity: 'warning',
        title: 'Late Arrival',
        message: 'James Wilson arrived 12 minutes late for morning shift',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        actionRequired: false,
        actionUrl: '/guards/guard-1',
        isRead: false,
        isDismissed: false,
      },
      {
        _id: 'alert-2',
        type: 'compliance',
        severity: 'warning',
        title: 'Certification Expiring',
        message: '2 guard certifications expiring within 30 days',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        actionRequired: true,
        actionUrl: '/compliance',
        isRead: false,
        isDismissed: false,
      },
    ],
    scheduleOverview: {
      totalShifts: 18,
      activeShifts: 8,
      completedShifts: 4,
      scheduledShifts: 5,
      cancelledShifts: 1,
      upcomingShifts: 5,
      noShows: 0,
      lateArrivals: 2,
      shifts: [
        {
          _id: 'shift-1',
          guardId: 'guard-1',
          guardName: 'James Wilson',
          siteName: 'Westfield Shopping Centre',
          siteId: 'site-1',
          role: 'Static',
          startTime: '2024-01-15T06:00:00',
          endTime: '2024-01-15T14:00:00',
          status: 'in-progress',
          shiftType: 'Morning',
          tasksTotal: 5,
          tasksCompleted: 3,
        },
        {
          _id: 'shift-2',
          guardId: 'guard-2',
          guardName: 'Sarah Chen',
          siteName: 'Tech Park Building A',
          siteId: 'site-2',
          role: 'Mobile Patrol',
          startTime: '2024-01-15T07:00:00',
          endTime: '2024-01-15T15:00:00',
          status: 'in-progress',
          shiftType: 'Morning',
          tasksTotal: 8,
          tasksCompleted: 6,
        },
      ],
    },
    guardStatuses: [
      {
        _id: 'guard-1',
        name: 'James Wilson',
        role: 'Guard',
        guardType: 'Static',
        status: 'on-duty',
        currentSite: 'Westfield Shopping Centre',
        shiftTime: 'Morning',
        contactInfo: { phone: '07700 900123', email: 'james.wilson@example.com' },
        availability: true,
        lastActivity: new Date(Date.now() - 15 * 60000).toISOString(),
        avatar: undefined,
      },
      {
        _id: 'guard-2',
        name: 'Sarah Chen',
        role: 'Guard',
        guardType: 'Mobile Patrol',
        status: 'on-duty',
        currentSite: 'Tech Park Building A',
        shiftTime: 'Morning',
        contactInfo: { phone: '07700 900124', email: 'sarah.chen@example.com' },
        availability: true,
        lastActivity: new Date(Date.now() - 5 * 60000).toISOString(),
        avatar: undefined,
      },
      {
        _id: 'guard-3',
        name: 'Michael Brown',
        role: 'Guard',
        guardType: 'Dog Handler',
        status: 'scheduled',
        currentSite: null,
        shiftTime: 'Afternoon',
        contactInfo: { phone: '07700 900125', email: 'michael.brown@example.com' },
        availability: true,
        lastActivity: undefined,
        avatar: undefined,
      },
    ],
    activityFeed: [
      {
        _id: 'activity-1',
        type: 'clock-in',
        guardId: 'guard-1',
        guardName: 'James Wilson',
        siteName: 'Westfield Shopping Centre',
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
        geofenceStatus: 'inside',
        description: 'Clocked in for morning shift',
      },
      {
        _id: 'activity-2',
        type: 'task-completed',
        guardId: 'guard-2',
        guardName: 'Sarah Chen',
        siteName: 'Tech Park Building A',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        notes: 'Morning patrol completed',
        description: 'Completed morning patrol checkpoint',
      },
    ],
    pendingTasks: [
      {
        _id: 'task-1',
        title: 'Fire Exit Check',
        description: 'Check fire exits - North Wing',
        frequency: 'once',
        priority: 'high',
        completed: false,
      },
      {
        _id: 'task-2',
        title: 'Perimeter Patrol',
        description: 'Hourly patrol - Perimeter',
        frequency: 'hourly',
        priority: 'medium',
        completed: false,
      },
    ],
    recentIncidents: [
      {
        _id: 'incident-1',
        title: 'Suspicious Activity - Car Park',
        incidentType: 'suspicious-activity',
        severity: 'medium',
        status: 'under-review',
        location: 'Car Park Level 2',
        description: 'Unknown individual observed checking vehicle doors',
        reportedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        reportedBy: { _id: 'guard-1', name: 'James Wilson' },
      },
    ],
  });

  // Mock actions
  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, lastUpdated: new Date() }));
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((alert) =>
        alert._id === alertId ? { ...alert, isDismissed: true } : alert
      ),
    }));
  }, []);

  const markAlertRead = useCallback(async (alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((alert) =>
        alert._id === alertId ? { ...alert, isRead: true } : alert
      ),
    }));
  }, []);

  const completeTask = useCallback(async (taskId: string) => {
    setState((prev) => ({
      ...prev,
      pendingTasks: prev.pendingTasks.filter((task) => task._id !== taskId),
      metrics: prev.metrics
        ? { ...prev.metrics, pendingTasks: prev.metrics.pendingTasks - 1 }
        : null,
    }));
  }, []);

  return {
    ...state,
    refresh,
    dismissAlert,
    markAlertRead,
    completeTask,
  };
};