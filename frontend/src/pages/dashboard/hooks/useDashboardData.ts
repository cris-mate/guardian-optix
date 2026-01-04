/**
 * useDashboardData Hook
 *
 * Custom hook for fetching and managing dashboard data.
 * Fetches real data from /api/dashboard endpoints.
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
    // Ensure proper ID mapping
    return (response.data || []).map((alert: Record<string, unknown>) => ({
      ...alert,
      _id: alert._id || alert.id,
    }));
  }, []);

  const fetchScheduleOverview = useCallback(async (): Promise<TodayScheduleOverview> => {
    const response = await api.get('/dashboard/schedule-overview');
    return response.data;
  }, []);

  const fetchGuardStatuses = useCallback(async (): Promise<GuardStatusEntry[]> => {
    const response = await api.get('/dashboard/guard-statuses');
    return response.data || [];
  }, []);

  const fetchActivityFeed = useCallback(async (): Promise<ActivityEvent[]> => {
    const response = await api.get('/dashboard/activity-feed');
    return response.data || [];
  }, []);

  const fetchPendingTasks = useCallback(async (): Promise<Task[]> => {
    const response = await api.get('/dashboard/pending-tasks');
    return response.data || [];
  }, []);

  const fetchRecentIncidents = useCallback(async (): Promise<IncidentSummary[]> => {
    const response = await api.get('/dashboard/recent-incidents');
    return response.data || [];
  }, []);

  // ----------------------------------------
  // Aggregated Fetch
  // ----------------------------------------

  const fetchAllData = useCallback(async () => {
    if (!mountedRef.current) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
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
      console.error('Failed to fetch dashboard data:', err);
      if (!mountedRef.current) return;

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load dashboard data. Please try again.',
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

  // Refresh just the activity feed (more frequent)
  const refreshActivityFeed = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const activityFeed = await fetchActivityFeed();
      if (!mountedRef.current) return;

      setState((prev) => ({
        ...prev,
        activityFeed,
        lastUpdated: new Date(),
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
        alerts: prev.alerts.filter((alert) => alert._id !== alertId),
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
// Mock Data Hook (for development/testing)
// ============================================

export const useMockDashboardData = (): UseDashboardDataReturn => {
  const [state] = useState<DashboardState>({
    ...DEFAULT_DASHBOARD_STATE,
    isLoading: false,
    lastUpdated: new Date(),
    metrics: {
      activeGuards: 12,
      totalScheduled: 15,
      shiftsToday: 18,
      shiftsCovered: 16,
      attendanceRate: 94.5,
      patrolCompletionRate: 87.3,
      openIncidents: 2,
      pendingTasks: 5,
      geofenceViolations: 1,
      complianceScore: 92,
    },
    alerts: [],
    scheduleOverview: {
      totalShifts: 18,
      activeShifts: 8,
      completedShifts: 6,
      scheduledShifts: 4,
      cancelledShifts: 0,
      upcomingShifts: 4,
      noShows: 0,
      lateArrivals: 1,
      shifts: [],
    },
    guardStatuses: [],
    activityFeed: [],
    pendingTasks: [],
    recentIncidents: [],
  });

  const refresh = useCallback(async () => {
    console.log('Mock refresh called');
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    console.log('Mock dismiss alert:', alertId);
  }, []);

  const markAlertRead = useCallback(async (alertId: string) => {
    console.log('Mock mark alert read:', alertId);
  }, []);

  const completeTask = useCallback(async (taskId: string) => {
    console.log('Mock complete task:', taskId);
  }, []);

  return {
    ...state,
    refresh,
    dismissAlert,
    markAlertRead,
    completeTask,
  };
};

export default useDashboardData;