/**
 * useActivityHubData Hook
 *
 * Centralised data fetching and state management for Activity Hub page.
 * Fetches real data from API and integrates Socket.io for real-time updates.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../utils/api';
import { useSocket } from '../../../hooks/useSocket';
import {
  SystemActivity,
  Update,
  ActivityStats,
  UpdateStats,
  ActivityFilters,
  UpdateFilters,
  Pagination,
  UpdateFormData,
  DEFAULT_ACTIVITY_FILTERS,
  DEFAULT_UPDATE_FILTERS,
} from '../../../types/activityHub.types';

// ============================================
// Extended Types for Operational Stats
// ============================================

export interface OperationalStats {
  guardsOnDuty: number;
  guardsOnBreak: number;
  unassignedShifts: number;
  openIncidents: number;
  complianceAlerts: number;
}

export interface ActivityHubData {
  activities: SystemActivity[];
  updates: Update[];
  activityStats: ActivityStats | null;
  updateStats: UpdateStats | null;
  operationalStats: OperationalStats | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  activityFilters: ActivityFilters;
  updateFilters: UpdateFilters;
  activityPagination: Pagination;
  updatePagination: Pagination;
  setActivityFilters: (filters: Partial<ActivityFilters>) => void;
  setUpdateFilters: (filters: Partial<UpdateFilters>) => void;
  resetFilters: () => void;
  loadMoreActivities: () => Promise<void>;
  createUpdate: (data: UpdateFormData) => Promise<void>;
  markUpdateRead: (updateId: string) => Promise<void>;
  acknowledgeUpdate: (updateId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export const useActivityHubData = (): ActivityHubData => {
  // Core data state
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [updateStats, setUpdateStats] = useState<UpdateStats | null>(null);
  const [operationalStats, setOperationalStats] = useState<OperationalStats | null>(null);

  // Loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [activityFilters, setActivityFiltersState] = useState<ActivityFilters>(
    DEFAULT_ACTIVITY_FILTERS
  );
  const [updateFilters, setUpdateFiltersState] = useState<UpdateFilters>(
    DEFAULT_UPDATE_FILTERS
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);

  // Socket connection for real-time updates
  const { on, off, isConnected } = useSocket();

  // ============================================
  // Filtered Data (Client-side filtering)
  // ============================================

  const filteredActivities = useMemo(() => {
    let result = [...activities];

    // Filter by search
    if (activityFilters.search) {
      const searchLower = activityFilters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.description.toLowerCase().includes(searchLower) ||
          a.action.toLowerCase().includes(searchLower) ||
          a.actorName?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by categories
    if (activityFilters.categories.length > 0) {
      result = result.filter((a) =>
        activityFilters.categories.includes(a.category)
      );
    }

    // Filter by severities
    if (activityFilters.severities.length > 0) {
      result = result.filter((a) =>
        activityFilters.severities.includes(a.severity)
      );
    }

    // Sort by timestamp descending
    result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return result;
  }, [activities, activityFilters]);

  const filteredUpdates = useMemo(() => {
    let result = [...updates];

    // Filter by search
    if (updateFilters.search) {
      const searchLower = updateFilters.search.toLowerCase();
      result = result.filter(
        (u) =>
          u.title.toLowerCase().includes(searchLower) ||
          u.content.toLowerCase().includes(searchLower)
      );
    }

    // Filter by types
    if (updateFilters.types.length > 0) {
      result = result.filter((u) => updateFilters.types.includes(u.type));
    }

    // Filter by priorities
    if (updateFilters.priorities.length > 0) {
      result = result.filter((u) =>
        updateFilters.priorities.includes(u.priority)
      );
    }

    // Filter read/unread
    if (!updateFilters.showRead) {
      result = result.filter(
        (u) => !u.readBy || u.readBy.length === 0
      );
    }

    // Sort by creation date descending
    result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return result;
  }, [updates, updateFilters]);

  // ============================================
  // Pagination Calculations
  // ============================================

  const activityPagination: Pagination = useMemo(
    () => ({
      page: currentPage,
      limit: 20,
      total: totalActivities || filteredActivities.length,
      totalPages: Math.ceil((totalActivities || filteredActivities.length) / 20),
    }),
    [currentPage, totalActivities, filteredActivities.length]
  );

  const updatePagination: Pagination = useMemo(
    () => ({
      page: 1,
      limit: 10,
      total: filteredUpdates.length,
      totalPages: Math.ceil(filteredUpdates.length / 10),
    }),
    [filteredUpdates.length]
  );

  // ============================================
  // Data Fetching
  // ============================================

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      // Note: api utility already has /api as baseURL, so we use relative paths
      const [activitiesRes, updatesRes, statsRes] = await Promise.all([
        api.get('/activityHub/activities'),
        api.get('/activityHub/updates'),
        api.get('/activityHub/stats'),
      ]);

      // Process activities response
      const activitiesData = activitiesRes.data.data || activitiesRes.data || [];
      setActivities(activitiesData);
      if (activitiesRes.data.pagination) {
        setTotalActivities(activitiesRes.data.pagination.total);
      }

      // Process updates response
      const updatesData = updatesRes.data.data || updatesRes.data || [];
      setUpdates(updatesData);

      // Process stats response
      if (statsRes.data.activityStats) {
        setActivityStats(statsRes.data.activityStats);
      }
      if (statsRes.data.updateStats) {
        setUpdateStats(statsRes.data.updateStats);
      }
      if (statsRes.data.operationalStats) {
        setOperationalStats(statsRes.data.operationalStats);
      }
    } catch (err) {
      console.error('Error fetching activity hub data:', err);
      setError('Failed to load activity hub data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreActivities = useCallback(async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await api.get('/activityHub/activities', {
        params: {
          page: nextPage,
          limit: 20,
        },
      });

      const newActivities = response.data.data || response.data || [];
      setActivities((prev) => [...prev, ...newActivities]);
      setCurrentPage(nextPage);

      if (response.data.pagination) {
        setTotalActivities(response.data.pagination.total);
      }
    } catch (err) {
      console.error('Error loading more activities:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, isLoadingMore]);

  // ============================================
  // Filter Actions
  // ============================================

  const setActivityFilters = useCallback((filters: Partial<ActivityFilters>) => {
    setActivityFiltersState((prev) => ({ ...prev, ...filters }));
  }, []);

  const setUpdateFilters = useCallback((filters: Partial<UpdateFilters>) => {
    setUpdateFiltersState((prev) => ({ ...prev, ...filters }));
  }, []);

  const resetFilters = useCallback(() => {
    setActivityFiltersState(DEFAULT_ACTIVITY_FILTERS);
    setUpdateFiltersState(DEFAULT_UPDATE_FILTERS);
  }, []);

  // ============================================
  // Update Actions
  // ============================================

  const createUpdate = useCallback(
    async (data: UpdateFormData) => {
      try {
        await api.post('/activityHub/updates', data);
        // Refetch to get the new update
        await fetchData();
      } catch (err) {
        console.error('Error creating update:', err);
        throw err;
      }
    },
    [fetchData]
  );

  const markUpdateRead = useCallback(async (updateId: string) => {
    try {
      await api.patch(`/activityHub/updates/${updateId}/read`);

      // Optimistically update local state
      setUpdates((prev) =>
        prev.map((u) =>
          u._id === updateId
            ? { ...u, readBy: [...(u.readBy || []), 'current-user'] }
            : u
        )
      );

      // Update stats
      setUpdateStats((prev) =>
        prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : prev
      );
    } catch (err) {
      console.error('Error marking update as read:', err);
    }
  }, []);

  const acknowledgeUpdate = useCallback(async (updateId: string) => {
    try {
      await api.patch(`/activityHub/updates/${updateId}/acknowledge`);

      // Optimistically update local state
      setUpdates((prev) =>
        prev.map((u) =>
          u._id === updateId
            ? {
              ...u,
              readBy: [...(u.readBy || []), 'current-user'],
              acknowledgedBy: [...(u.acknowledgedBy || []), 'current-user'],
            }
            : u
        )
      );

      // Update stats
      setUpdateStats((prev) =>
        prev
          ? {
            ...prev,
            unread: Math.max(0, prev.unread - 1),
            pendingAcknowledgement: Math.max(0, prev.pendingAcknowledgement - 1),
          }
          : prev
      );
    } catch (err) {
      console.error('Error acknowledging update:', err);
    }
  }, []);

  // ============================================
  // Socket.io Real-time Updates
  // ============================================

  useEffect(() => {
    if (!isConnected) return;

    // Listen for new activities
    const handleNewActivity = (activity: SystemActivity) => {
      setActivities((prev) => [activity, ...prev]);
      setTotalActivities((prev) => prev + 1);

      // Update stats based on activity type
      setActivityStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          today: {
            ...prev.today,
            total: prev.today.total + 1,
            byCategory: {
              ...prev.today.byCategory,
              [activity.category]: (prev.today.byCategory[activity.category] || 0) + 1,
            },
            bySeverity: {
              ...prev.today.bySeverity,
              [activity.severity]: (prev.today.bySeverity[activity.severity] || 0) + 1,
            },
          },
          recentCritical:
            activity.severity === 'critical'
              ? prev.recentCritical + 1
              : prev.recentCritical,
        };
      });
    };

    // Listen for new updates/announcements
    const handleNewUpdate = () => {
      // Refetch to get the new update with proper formatting
      fetchData();
    };

    // Listen for incident events
    const handleIncidentCreated = () => {
      fetchData();
    };

    // Listen for clock events
    const handleClockEvent = () => {
      // Refresh operational stats
      api.get('/activityHub/stats').then((res) => {
        if (res.data.operationalStats) {
          setOperationalStats(res.data.operationalStats);
        }
      });
    };

    // Subscribe to events
    on('activity:new', handleNewActivity);
    on('update-created', handleNewUpdate);
    on('incident:created', handleIncidentCreated);
    on('clock:in', handleClockEvent);
    on('clock:out', handleClockEvent);

    // Cleanup
    return () => {
      off('activity:new');
      off('update-created');
      off('incident:created');
      off('clock:in');
      off('clock:out');
    };
  }, [isConnected, on, off, fetchData]);

  // ============================================
  // Initial Data Fetch
  // ============================================

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================
  // Return Hook Data
  // ============================================

  return {
    activities: filteredActivities,
    updates: filteredUpdates,
    activityStats,
    updateStats,
    operationalStats,
    isLoading,
    isLoadingMore,
    error,
    activityFilters,
    updateFilters,
    activityPagination,
    updatePagination,
    setActivityFilters,
    setUpdateFilters,
    resetFilters,
    loadMoreActivities,
    createUpdate,
    markUpdateRead,
    acknowledgeUpdate,
    refetch: fetchData,
  };
};

export default useActivityHubData;