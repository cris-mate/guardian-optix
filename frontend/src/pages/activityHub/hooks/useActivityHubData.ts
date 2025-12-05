/**
 * useActivityHubData Hook
 *
 * Centralised data fetching and state management for Activity Hub page.
 * Toggle USE_MOCK_DATA to switch between mock and API data.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../utils/api';
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
  ActivityCategory,
  ActivitySeverity,
} from '../../../types/activityHub.types';

// Toggle this to switch between mock data and API calls
const USE_MOCK_DATA = true;

// ============================================
// Mock Data
// ============================================

const generateMockActivities = (): SystemActivity[] => {
  const now = new Date();
  const activities: SystemActivity[] = [];

  // Authentication events
  activities.push({
    _id: 'act-001',
    category: 'authentication',
    action: 'Login',
    description: 'James Wilson logged in from mobile device',
    timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
    severity: 'info',
    actorId: 'usr-001',
    actorName: 'James Wilson',
    actorRole: 'Guard',
    deviceInfo: 'iPhone 14 Pro - iOS 17.2',
  });

  activities.push({
    _id: 'act-002',
    category: 'shift',
    action: 'Clock In',
    description: 'Sarah Mitchell clocked in for morning shift',
    timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
    severity: 'info',
    actorId: 'usr-002',
    actorName: 'Sarah Mitchell',
    actorRole: 'Guard',
    location: {
      siteName: 'Canary Wharf Tower',
      siteId: 'site-001',
      coordinates: { latitude: 51.5054, longitude: -0.0235 },
    },
  });

  activities.push({
    _id: 'act-003',
    category: 'patrol',
    action: 'Checkpoint Scan',
    description: 'David Chen completed checkpoint scan at Main Entrance',
    timestamp: new Date(now.getTime() - 22 * 60000).toISOString(),
    severity: 'info',
    actorId: 'usr-003',
    actorName: 'David Chen',
    actorRole: 'Guard',
    targetType: 'site',
    targetName: 'Main Entrance - NFC Tag #A142',
    location: {
      siteName: 'Westminster Office Complex',
      siteId: 'site-002',
    },
  });

  activities.push({
    _id: 'act-004',
    category: 'geofence',
    action: 'Zone Violation',
    description: 'Michael Brown entered restricted zone during patrol',
    timestamp: new Date(now.getTime() - 35 * 60000).toISOString(),
    severity: 'warning',
    actorId: 'usr-004',
    actorName: 'Michael Brown',
    actorRole: 'Guard',
    location: {
      siteName: 'Olympic Park',
      siteId: 'site-003',
      coordinates: { latitude: 51.5386, longitude: -0.0165 },
    },
    metadata: {
      zoneName: 'Construction Area B',
      duration: '3 minutes',
    },
  });

  activities.push({
    _id: 'act-005',
    category: 'incident',
    action: 'Incident Report',
    description: 'Emma Thompson submitted incident report - Suspicious Activity',
    timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
    severity: 'warning',
    actorId: 'usr-005',
    actorName: 'Emma Thompson',
    actorRole: 'Guard',
    targetType: 'incident',
    targetId: 'inc-001',
    targetName: 'INC-2024-0142',
    location: {
      siteName: 'King\'s Cross Hub',
      siteId: 'site-004',
    },
  });

  activities.push({
    _id: 'act-006',
    category: 'compliance',
    action: 'Document Uploaded',
    description: 'Lisa Anderson uploaded SIA Licence renewal document',
    timestamp: new Date(now.getTime() - 60 * 60000).toISOString(),
    severity: 'info',
    actorId: 'usr-006',
    actorName: 'Lisa Anderson',
    actorRole: 'Guard',
    targetType: 'document',
    targetName: 'SIA_Licence_Renewal_2024.pdf',
  });

  activities.push({
    _id: 'act-007',
    category: 'incident',
    action: 'Critical Incident',
    description: 'Security breach reported at SouthBank Centre - Emergency response initiated',
    timestamp: new Date(now.getTime() - 90 * 60000).toISOString(),
    severity: 'critical',
    actorId: 'usr-007',
    actorName: 'Robert Taylor',
    actorRole: 'Supervisor',
    targetType: 'incident',
    targetId: 'inc-002',
    targetName: 'INC-2024-0143',
    location: {
      siteName: 'SouthBank Centre',
      siteId: 'site-005',
    },
  });

  activities.push({
    _id: 'act-008',
    category: 'task',
    action: 'Task Completed',
    description: 'Vehicle patrol route A completed successfully',
    timestamp: new Date(now.getTime() - 120 * 60000).toISOString(),
    severity: 'info',
    actorId: 'usr-008',
    actorName: 'Tom Harris',
    actorRole: 'Guard',
    targetType: 'site',
    targetName: 'Mobile Patrol Route A',
  });

  activities.push({
    _id: 'act-009',
    category: 'shift',
    action: 'Shift Swap',
    description: 'Shift swap approved: James Wilson ↔ David Chen (Evening Shift)',
    timestamp: new Date(now.getTime() - 180 * 60000).toISOString(),
    severity: 'info',
    actorId: 'usr-009',
    actorName: 'Operations Manager',
    actorRole: 'Manager',
    targetType: 'shift',
    targetName: 'Evening Shift - Westminster',
  });

  activities.push({
    _id: 'act-010',
    category: 'system',
    action: 'System Maintenance',
    description: 'Scheduled backup completed successfully',
    timestamp: new Date(now.getTime() - 240 * 60000).toISOString(),
    severity: 'info',
    actorName: 'System',
    actorRole: 'System',
  });

  activities.push({
    _id: 'act-011',
    category: 'authentication',
    action: 'Failed Login',
    description: 'Multiple failed login attempts detected for account jwilson@guardianoptix.co.uk',
    timestamp: new Date(now.getTime() - 300 * 60000).toISOString(),
    severity: 'warning',
    ipAddress: '192.168.1.105',
    deviceInfo: 'Unknown Device',
  });

  activities.push({
    _id: 'act-012',
    category: 'patrol',
    action: 'Tour Completed',
    description: 'Night patrol tour completed - all 12 checkpoints scanned',
    timestamp: new Date(now.getTime() - 360 * 60000).toISOString(),
    severity: 'info',
    actorId: 'usr-010',
    actorName: 'Chris Evans',
    actorRole: 'Guard',
    location: {
      siteName: 'Canary Wharf Tower',
      siteId: 'site-001',
    },
    metadata: {
      checkpointsScanned: 12,
      checkpointsTotal: 12,
      duration: '45 minutes',
    },
  });

  return activities;
};

const generateMockUpdates = (): Update[] => {
  const now = new Date();

  return [
    {
      _id: 'upd-001',
      type: 'alert',
      title: 'Weather Alert: Storm Warning',
      content: 'Met Office has issued an amber weather warning for heavy rain and strong winds across London. All outdoor patrols should exercise extra caution. Mobile patrol units may need to adjust routes. Contact your supervisor if conditions become unsafe.',
      priority: 'high',
      createdAt: new Date(now.getTime() - 30 * 60000).toISOString(),
      authorId: 'mgr-001',
      authorName: 'Operations Control',
      authorRole: 'Operations Manager',
      targetAudience: 'all',
      readBy: ['usr-001', 'usr-002'],
      acknowledgedBy: ['usr-001'],
      requiresAcknowledgement: true,
      isPinned: true,
    },
    {
      _id: 'upd-002',
      type: 'announcement',
      title: 'New Client Onboarding: Tech Corp Ltd',
      content: 'We are pleased to announce a new contract with Tech Corp Ltd starting next Monday. Initial deployment will include 4 static guards and 2 mobile patrol officers. Site induction training will be conducted on Friday at 2pm. All assigned personnel must attend.',
      priority: 'medium',
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      authorId: 'mgr-002',
      authorName: 'Sarah Johnson',
      authorRole: 'Account Manager',
      targetAudience: 'all',
      readBy: ['usr-001', 'usr-002', 'usr-003'],
      requiresAcknowledgement: false,
      isPinned: false,
    },
    {
      _id: 'upd-003',
      type: 'policy',
      title: 'Updated Incident Reporting Procedures',
      content: 'Effective immediately, all incident reports must include photographic evidence where possible. The new mobile app version 2.4.0 includes enhanced camera functionality with automatic GPS tagging. Please ensure your app is updated. Contact IT support if you encounter any issues.',
      priority: 'medium',
      createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      authorId: 'mgr-003',
      authorName: 'Compliance Team',
      authorRole: 'Compliance Manager',
      targetAudience: 'guards',
      readBy: ['usr-001'],
      acknowledgedBy: [],
      requiresAcknowledgement: true,
      isPinned: false,
    },
    {
      _id: 'upd-004',
      type: 'recognition',
      title: 'Employee of the Month: James Wilson',
      content: 'Congratulations to James Wilson for being named Employee of the Month! James demonstrated exceptional professionalism during a challenging security incident at Westminster Office Complex, maintaining calm and following all protocols perfectly. Well done, James!',
      priority: 'low',
      createdAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
      authorId: 'mgr-001',
      authorName: 'HR Department',
      authorRole: 'HR Manager',
      targetAudience: 'all',
      readBy: ['usr-001', 'usr-002', 'usr-003', 'usr-004', 'usr-005'],
      requiresAcknowledgement: false,
      isPinned: false,
    },
    {
      _id: 'upd-005',
      type: 'schedule',
      title: 'Bank Holiday Schedule Changes',
      content: 'Please note the updated shift patterns for the upcoming bank holiday weekend. Double-time rates apply for all shifts worked. Confirm your availability through the scheduling app by end of day Wednesday. Contact your supervisor for any queries.',
      priority: 'medium',
      createdAt: new Date(now.getTime() - 72 * 3600000).toISOString(),
      authorId: 'mgr-004',
      authorName: 'Scheduling Team',
      authorRole: 'Operations Manager',
      targetAudience: 'guards',
      readBy: ['usr-001', 'usr-002'],
      requiresAcknowledgement: false,
      isPinned: false,
    },
    {
      _id: 'upd-006',
      type: 'general',
      title: 'Uniform Replacement Programme',
      content: 'The new uniform rollout begins next month. All personnel will receive new jackets and high-visibility vests. Size measurements will be taken during your next site visit. Please speak with your supervisor to arrange a convenient time.',
      priority: 'low',
      createdAt: new Date(now.getTime() - 96 * 3600000).toISOString(),
      authorId: 'mgr-005',
      authorName: 'Admin Team',
      authorRole: 'Administration',
      targetAudience: 'all',
      readBy: [],
      requiresAcknowledgement: false,
      isPinned: false,
    },
  ];
};

const generateMockStats = (
  activities: SystemActivity[],
  updates: Update[]
): { activityStats: ActivityStats; updateStats: UpdateStats } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayActivities = activities.filter(
    (a) => new Date(a.timestamp) >= today
  );

  const byCategory = {} as Record<ActivityCategory, number>;
  const bySeverity = {} as Record<ActivitySeverity, number>;

  todayActivities.forEach((a) => {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
  });

  // Generate daily breakdown for the week
  const dailyBreakdown = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dailyBreakdown.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 50) + 20,
    });
  }

  const updatesByType = {} as Record<string, number>;
  updates.forEach((u) => {
    updatesByType[u.type] = (updatesByType[u.type] || 0) + 1;
  });

  return {
    activityStats: {
      today: {
        total: todayActivities.length,
        byCategory,
        bySeverity,
      },
      week: {
        total: activities.length,
        dailyBreakdown,
      },
      recentCritical: activities.filter((a) => a.severity === 'critical').length,
      pendingAcknowledgements: 3,
    },
    updateStats: {
      total: updates.length,
      unread: updates.filter((u) => !u.readBy?.length).length,
      pendingAcknowledgement: updates.filter(
        (u) => u.requiresAcknowledgement && (!u.acknowledgedBy?.length)
      ).length,
      byType: updatesByType as Record<string, number>,
    },
  };
};

// ============================================
// Hook Implementation
// ============================================

interface UseActivityHubDataReturn {
  // Data
  activities: SystemActivity[];
  updates: Update[];
  activityStats: ActivityStats | null;
  updateStats: UpdateStats | null;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;

  // Error state
  error: string | null;

  // Filters
  activityFilters: ActivityFilters;
  updateFilters: UpdateFilters;

  // Pagination
  activityPagination: Pagination;
  updatePagination: Pagination;

  // Actions
  setActivityFilters: (filters: Partial<ActivityFilters>) => void;
  setUpdateFilters: (filters: Partial<UpdateFilters>) => void;
  resetFilters: () => void;
  loadMoreActivities: () => void;
  createUpdate: (data: UpdateFormData) => Promise<void>;
  markUpdateRead: (updateId: string) => Promise<void>;
  acknowledgeUpdate: (updateId: string) => Promise<void>;
  refetch: () => void;
}

export const useActivityHubData = (): UseActivityHubDataReturn => {
  // State
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [updateStats, setUpdateStats] = useState<UpdateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityFilters, setActivityFiltersState] = useState<ActivityFilters>(
    DEFAULT_ACTIVITY_FILTERS
  );
  const [updateFilters, setUpdateFiltersState] = useState<UpdateFilters>(
    DEFAULT_UPDATE_FILTERS
  );

  // ============================================
  // Computed Pagination
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

    // Filter by time range
    const now = new Date();
    switch (activityFilters.timeRange) {
      case 'today':
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        result = result.filter((a) => new Date(a.timestamp) >= todayStart);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        result = result.filter((a) => new Date(a.timestamp) >= weekStart);
        break;
      case 'month':
        const monthStart = new Date(now);
        monthStart.setMonth(monthStart.getMonth() - 1);
        result = result.filter((a) => new Date(a.timestamp) >= monthStart);
        break;
    }

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

    // Sort pinned first
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [updates, updateFilters]);

  const activityPagination: Pagination = useMemo(
    () => ({
      page: 1,
      limit: 20,
      total: filteredActivities.length,
      totalPages: Math.ceil(filteredActivities.length / 20),
    }),
    [filteredActivities.length]
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
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        const mockActivities = generateMockActivities();
        const mockUpdates = generateMockUpdates();
        const { activityStats, updateStats } = generateMockStats(
          mockActivities,
          mockUpdates
        );

        setActivities(mockActivities);
        setUpdates(mockUpdates);
        setActivityStats(activityStats);
        setUpdateStats(updateStats);
      } else {
        const [activitiesRes, updatesRes, statsRes] = await Promise.all([
          api.get('/api/activity-hub/activities'),
          api.get('/api/activity-hub/updates'),
          api.get('/api/activity-hub/stats'),
        ]);

        setActivities(activitiesRes.data.data || activitiesRes.data);
        setUpdates(updatesRes.data.data || updatesRes.data);
        setActivityStats(statsRes.data.activityStats);
        setUpdateStats(statsRes.data.updateStats);
      }
    } catch (err) {
      setError('Failed to load activity hub data');
      console.error('Error fetching activity hub data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreActivities = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        // In mock mode, we already have all activities
      } else {
        const response = await api.get('/api/activity-hub/activities', {
          params: {
            page: activityPagination.page + 1,
            limit: activityPagination.limit,
          },
        });
        setActivities((prev) => [...prev, ...response.data.data]);
      }
    } catch (err) {
      console.error('Error loading more activities:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activityPagination]);

  // ============================================
  // Actions
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

  const createUpdate = useCallback(async (data: UpdateFormData) => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        // In mock mode, add to local state
        const newUpdate: Update = {
          _id: `upd-${Date.now()}`,
          ...data,
          createdAt: new Date().toISOString(),
          authorId: 'current-user',
          authorName: 'Current User',
          authorRole: 'Manager',
          readBy: [],
          acknowledgedBy: [],
        };
        setUpdates((prev) => [newUpdate, ...prev]);
      } else {
        await api.post('/api/activity-hub/updates', data);
        await fetchData();
      }
    } catch (err) {
      console.error('Error creating update:', err);
      throw err;
    }
  }, [fetchData]);

  const markUpdateRead = useCallback(async (updateId: string) => {
    try {
      if (USE_MOCK_DATA) {
        setUpdates((prev) =>
          prev.map((u) =>
            u._id === updateId
              ? { ...u, readBy: [...(u.readBy || []), 'current-user'] }
              : u
          )
        );
      } else {
        await api.patch(`/api/activity-hub/updates/${updateId}/read`);
      }
    } catch (err) {
      console.error('Error marking update as read:', err);
    }
  }, []);

  const acknowledgeUpdate = useCallback(async (updateId: string) => {
    try {
      if (USE_MOCK_DATA) {
        setUpdates((prev) =>
          prev.map((u) =>
            u._id === updateId
              ? {
                ...u,
                acknowledgedBy: [...(u.acknowledgedBy || []), 'current-user'],
              }
              : u
          )
        );
      } else {
        await api.patch(`/api/activity-hub/updates/${updateId}/acknowledge`);
      }
    } catch (err) {
      console.error('Error acknowledging update:', err);
    }
  }, []);

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    activities: filteredActivities,
    updates: filteredUpdates,
    activityStats,
    updateStats,
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