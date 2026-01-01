/**
 * useShiftCoverage Hook
 *
 * Fetches shift coverage statistics for dashboard display.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';

// ============================================
// Types
// ============================================

export interface ShiftCoverageStats {
  totalShifts: number;
  assignedShifts: number;
  unassignedShifts: number;
  coveragePercentage: number;
  completedShifts: number;
  inProgressShifts: number;
}

export interface SiteNeedingCoverage {
  _id: string;
  siteName: string;
  count: number;
  shifts: Array<{
    _id: string;
    date: string;
    shiftType: string;
  }>;
}

export interface ActivityHubStats {
  summary: ShiftCoverageStats;
  attention: {
    sitesNeedingCoverage: number;
    urgentUnassigned: SiteNeedingCoverage[];
  };
  dateRange: {
    start: string;
    end: string;
    days: number;
  };
}

interface UseShiftCoverageReturn {
  stats: ActivityHubStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useShiftCoverage(days: number = 7): UseShiftCoverageReturn {
  const [stats, setStats] = useState<ActivityHubStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/scheduling/stats/activity-hub', {
        params: { days },
      });
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching shift coverage:', err);
      setError('Failed to load coverage statistics');

      // Set default empty stats on error
      setStats({
        summary: {
          totalShifts: 0,
          assignedShifts: 0,
          unassignedShifts: 0,
          coveragePercentage: 100,
          completedShifts: 0,
          inProgressShifts: 0,
        },
        attention: {
          sitesNeedingCoverage: 0,
          urgentUnassigned: [],
        },
        dateRange: {
          start: new Date().toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          days,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}

export default useShiftCoverage;