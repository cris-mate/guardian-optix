/**
 * usePerformanceData Hook
 *
 * Custom hook for fetching and managing performance data.
 * Supports mock data for development and real API integration.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../utils/api';
import { MOCK_CONFIG, simulateDelay } from '../../../config/api.config';
import type {
  PerformanceFilters,
  OverviewMetrics,
  GuardPerformance,
  GuardRanking,
  PatrolMetrics,
  AttendanceMetrics,
  IncidentMetrics,
  PerformanceAlert,
  PerformanceRating,
} from '../../../types/performance.types';

const USE_MOCK_DATA = MOCK_CONFIG.performance;

// ============================================
// Mock Data Generators
// ============================================

const generateMockOverview = (): OverviewMetrics => ({
  patrolCompletion: {
    rate: 87.5,
    completed: 42,
    scheduled: 48,
    trend: 'up',
    trendValue: 3.2,
  },
  attendance: {
    rate: 94.2,
    onTime: 47,
    late: 2,
    noShow: 1,
    trend: 'up',
    trendValue: 1.5,
  },
  incidentResponse: {
    averageTime: 4.3,
    resolvedWithinSLA: 18,
    total: 20,
    trend: 'down',
    trendValue: 0.8,
  },
  checkpointScans: {
    completed: 324,
    missed: 12,
    rate: 96.4,
    trend: 'up',
    trendValue: 2.1,
  },
  geofenceCompliance: {
    rate: 98.5,
    violations: 3,
    trend: 'stable',
    trendValue: 0,
  },
  shiftCompletion: {
    rate: 95.8,
    completed: 46,
    early: 1,
    incomplete: 1,
  },
});

const getRating = (score: number): PerformanceRating => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'average';
  if (score >= 40) return 'needs-improvement';
  return 'poor';
};

const generateMockGuards = (): GuardPerformance[] => [
  {
    guardId: 'off-001',
    guardName: 'James Wilson',
    badgeNumber: 'GO-1001',
    guardType: 'Static',
    site: 'Corporate HQ',
    overallScore: 94,
    rating: 'excellent',
    rank: 1,
    metrics: {
      patrolCompletion: 98,
      attendanceRate: 100,
      punctualityRate: 96,
      incidentResponseAvg: 3.2,
      checkpointAccuracy: 99,
      geofenceCompliance: 100,
      shiftCompletion: 100,
      trainingCompletion: 95,
    },
    trends: { overall: 'up', value: 2.1 },
    recentActivity: {
      shiftsCompleted: 12,
      patrolsCompleted: 48,
      incidentsHandled: 3,
      lastActive: new Date().toISOString(),
    },
  },
  {
    guardId: 'off-002',
    guardName: 'Sarah Chen',
    badgeNumber: 'GO-1002',
    guardType: 'Mobile Patrol',
    site: 'Warehouse District',
    overallScore: 91,
    rating: 'excellent',
    rank: 2,
    metrics: {
      patrolCompletion: 96,
      attendanceRate: 98,
      punctualityRate: 94,
      incidentResponseAvg: 3.8,
      checkpointAccuracy: 97,
      geofenceCompliance: 99,
      shiftCompletion: 98,
      trainingCompletion: 100,
    },
    trends: { overall: 'up', value: 1.5 },
    recentActivity: {
      shiftsCompleted: 11,
      patrolsCompleted: 55,
      incidentsHandled: 5,
      lastActive: new Date(Date.now() - 3600000).toISOString(),
    },
  },
  {
    guardId: 'off-003',
    guardName: 'Michael Brown',
    badgeNumber: 'GO-1003',
    guardType: 'Static',
    site: 'Tech Park',
    overallScore: 85,
    rating: 'good',
    rank: 3,
    metrics: {
      patrolCompletion: 88,
      attendanceRate: 96,
      punctualityRate: 85,
      incidentResponseAvg: 4.5,
      checkpointAccuracy: 92,
      geofenceCompliance: 98,
      shiftCompletion: 94,
      trainingCompletion: 85,
    },
    trends: { overall: 'stable', value: 0.3 },
    recentActivity: {
      shiftsCompleted: 10,
      patrolsCompleted: 40,
      incidentsHandled: 2,
      lastActive: new Date(Date.now() - 7200000).toISOString(),
    },
  },
  {
    guardId: 'off-004',
    guardName: 'Emily Davis',
    badgeNumber: 'GO-1004',
    guardType: 'Dog Handler',
    site: 'Mall Complex',
    overallScore: 82,
    rating: 'good',
    rank: 4,
    metrics: {
      patrolCompletion: 85,
      attendanceRate: 94,
      punctualityRate: 88,
      incidentResponseAvg: 5.1,
      checkpointAccuracy: 90,
      geofenceCompliance: 96,
      shiftCompletion: 92,
      trainingCompletion: 80,
    },
    trends: { overall: 'up', value: 1.8 },
    recentActivity: {
      shiftsCompleted: 9,
      patrolsCompleted: 36,
      incidentsHandled: 4,
      lastActive: new Date(Date.now() - 1800000).toISOString(),
    },
  },
  {
    guardId: 'off-005',
    guardName: 'Robert Taylor',
    badgeNumber: 'GO-1005',
    guardType: 'Static',
    site: 'Corporate HQ',
    overallScore: 72,
    rating: 'average',
    rank: 5,
    metrics: {
      patrolCompletion: 78,
      attendanceRate: 88,
      punctualityRate: 75,
      incidentResponseAvg: 6.2,
      checkpointAccuracy: 82,
      geofenceCompliance: 90,
      shiftCompletion: 85,
      trainingCompletion: 70,
    },
    trends: { overall: 'down', value: 2.5 },
    recentActivity: {
      shiftsCompleted: 8,
      patrolsCompleted: 30,
      incidentsHandled: 1,
      lastActive: new Date(Date.now() - 14400000).toISOString(),
    },
  },
  {
    guardId: 'off-006',
    guardName: 'Lisa Anderson',
    badgeNumber: 'GO-1006',
    guardType: 'Close Protection',
    site: 'VIP Residence',
    overallScore: 89,
    rating: 'good',
    rank: 6,
    metrics: {
      patrolCompletion: 92,
      attendanceRate: 100,
      punctualityRate: 100,
      incidentResponseAvg: 2.8,
      checkpointAccuracy: 88,
      geofenceCompliance: 100,
      shiftCompletion: 100,
      trainingCompletion: 90,
    },
    trends: { overall: 'up', value: 3.2 },
    recentActivity: {
      shiftsCompleted: 14,
      patrolsCompleted: 28,
      incidentsHandled: 6,
      lastActive: new Date().toISOString(),
    },
  },
];

const generateMockRankings = (guards: GuardPerformance[]): GuardRanking[] =>
  guards
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((guard, index) => ({
      guardId: guard.guardId,
      guardName: guard.guardName,
      profileImage: guard.profileImage,
      rank: index + 1,
      previousRank: index + 1 + Math.floor(Math.random() * 3) - 1,
      overallScore: guard.overallScore,
      topMetric: {
        name: 'Patrol Completion',
        value: guard.metrics.patrolCompletion,
      },
    }));

const generateMockPatrolMetrics = (): PatrolMetrics => ({
  summary: {
    totalTours: 48,
    completed: 42,
    partial: 4,
    missed: 2,
    completionRate: 87.5,
  },
  checkpointStats: {
    totalScans: 336,
    missedScans: 12,
    avgScanTime: 45,
    scanAccuracy: 96.4,
  },
  byGuard: [
    { guardId: 'off-001', guardName: 'James Wilson', tours: 12, completed: 12, rate: 100 },
    { guardId: 'off-002', guardName: 'Sarah Chen', tours: 14, completed: 13, rate: 92.9 },
    { guardId: 'off-003', guardName: 'Michael Brown', tours: 10, completed: 8, rate: 80 },
    { guardId: 'off-004', guardName: 'Emily Davis', tours: 12, completed: 9, rate: 75 },
  ],
  bySite: [
    { siteId: 'site-001', siteName: 'Corporate HQ', tours: 20, completed: 18, rate: 90 },
    { siteId: 'site-002', siteName: 'Warehouse District', tours: 14, completed: 13, rate: 92.9 },
    { siteId: 'site-003', siteName: 'Tech Park', tours: 8, completed: 6, rate: 75 },
    { siteId: 'site-004', siteName: 'Mall Complex', tours: 6, completed: 5, rate: 83.3 },
  ],
  recentPatrols: [
    {
      id: 'patrol-001',
      tourName: 'Perimeter Check',
      guardId: 'off-001',
      guardName: 'James Wilson',
      site: 'Corporate HQ',
      scheduledTime: new Date(Date.now() - 3600000).toISOString(),
      startTime: new Date(Date.now() - 3540000).toISOString(),
      endTime: new Date(Date.now() - 2700000).toISOString(),
      status: 'completed',
      checkpoints: { total: 8, scanned: 8, missed: 0 },
      duration: 14,
      expectedDuration: 15,
      exceptions: 0,
    },
    {
      id: 'patrol-002',
      tourName: 'Interior Sweep',
      guardId: 'off-002',
      guardName: 'Sarah Chen',
      site: 'Warehouse District',
      scheduledTime: new Date(Date.now() - 7200000).toISOString(),
      startTime: new Date(Date.now() - 7140000).toISOString(),
      endTime: new Date(Date.now() - 5400000).toISOString(),
      status: 'completed',
      checkpoints: { total: 12, scanned: 12, missed: 0 },
      duration: 29,
      expectedDuration: 30,
      exceptions: 1,
    },
    {
      id: 'patrol-003',
      tourName: 'Loading Bay Check',
      guardId: 'off-003',
      guardName: 'Michael Brown',
      site: 'Tech Park',
      scheduledTime: new Date(Date.now() - 10800000).toISOString(),
      startTime: new Date(Date.now() - 10500000).toISOString(),
      status: 'partial',
      checkpoints: { total: 6, scanned: 4, missed: 2 },
      duration: 18,
      expectedDuration: 20,
      exceptions: 2,
      notes: 'Area B inaccessible due to construction',
    },
  ],
});

const generateMockAttendanceMetrics = (): AttendanceMetrics => ({
  summary: {
    totalShifts: 50,
    onTime: 45,
    late: 3,
    early: 1,
    noShow: 1,
    punctualityRate: 90,
    attendanceRate: 98,
  },
  lateArrivals: {
    count: 3,
    avgMinutesLate: 8,
    trend: 'down',
  },
  earlyDepartures: {
    count: 1,
    avgMinutesEarly: 12,
  },
  byGuard: [
    { guardId: 'off-001', guardName: 'James Wilson', shifts: 12, onTime: 12, late: 0, noShow: 0, punctualityRate: 100 },
    { guardId: 'off-002', guardName: 'Sarah Chen', shifts: 11, onTime: 10, late: 1, noShow: 0, punctualityRate: 90.9 },
    { guardId: 'off-003', guardName: 'Michael Brown', shifts: 10, onTime: 8, late: 1, noShow: 1, punctualityRate: 80 },
    { guardId: 'off-004', guardName: 'Emily Davis', shifts: 9, onTime: 8, late: 1, noShow: 0, punctualityRate: 88.9 },
    { guardId: 'off-005', guardName: 'Robert Taylor', shifts: 8, onTime: 7, late: 0, noShow: 0, punctualityRate: 87.5 },
  ],
  recentRecords: [
    {
      id: 'att-001',
      guardId: 'off-001',
      guardName: 'James Wilson',
      site: 'Corporate HQ',
      date: new Date().toISOString().split('T')[0],
      scheduledStart: '08:00',
      scheduledEnd: '16:00',
      actualStart: '07:55',
      actualEnd: '16:02',
      status: 'on-time',
      variance: -5,
      hoursWorked: 8.1,
      breaksTaken: 2,
      isGeofenceVerified: true,
    },
    {
      id: 'att-002',
      guardId: 'off-002',
      guardName: 'Sarah Chen',
      site: 'Warehouse District',
      date: new Date().toISOString().split('T')[0],
      scheduledStart: '16:00',
      scheduledEnd: '00:00',
      actualStart: '16:12',
      status: 'late',
      variance: 12,
      isGeofenceVerified: true,
    },
    {
      id: 'att-003',
      guardId: 'off-003',
      guardName: 'Michael Brown',
      site: 'Tech Park',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      scheduledStart: '00:00',
      scheduledEnd: '08:00',
      actualStart: '23:58',
      actualEnd: '08:00',
      status: 'on-time',
      variance: -2,
      hoursWorked: 8,
      breaksTaken: 1,
      isGeofenceVerified: true,
    },
  ],
});

const generateMockIncidentMetrics = (): IncidentMetrics => ({
  summary: {
    totalIncidents: 20,
    avgResponseTime: 4.3,
    avgResolutionTime: 28,
    slaCompliance: 90,
    resolvedWithinHour: 16,
  },
  bySeverity: {
    critical: { count: 1, avgResponseTime: 2.1, slaCompliance: 100 },
    high: { count: 4, avgResponseTime: 3.5, slaCompliance: 100 },
    medium: { count: 8, avgResponseTime: 4.8, slaCompliance: 87.5 },
    low: { count: 7, avgResponseTime: 5.2, slaCompliance: 85.7 },
  },
  byGuard: [
    { guardId: 'off-001', guardName: 'James Wilson', incidents: 3, avgResponseTime: 3.2, slaCompliance: 100 },
    { guardId: 'off-002', guardName: 'Sarah Chen', incidents: 5, avgResponseTime: 3.8, slaCompliance: 100 },
    { guardId: 'off-003', guardName: 'Michael Brown', incidents: 2, avgResponseTime: 4.5, slaCompliance: 100 },
    { guardId: 'off-004', guardName: 'Emily Davis', incidents: 4, avgResponseTime: 5.1, slaCompliance: 75 },
    { guardId: 'off-006', guardName: 'Lisa Anderson', incidents: 6, avgResponseTime: 2.8, slaCompliance: 100 },
  ],
  recentIncidents: [
    {
      id: 'inc-resp-001',
      incidentId: 'INC-2024-001',
      guardId: 'off-001',
      guardName: 'James Wilson',
      site: 'Corporate HQ',
      severity: 'medium',
      reportedAt: new Date(Date.now() - 3600000).toISOString(),
      respondedAt: new Date(Date.now() - 3360000).toISOString(),
      resolvedAt: new Date(Date.now() - 1800000).toISOString(),
      responseTime: 4,
      resolutionTime: 30,
      metSLA: true,
      category: 'Suspicious Activity',
    },
    {
      id: 'inc-resp-002',
      incidentId: 'INC-2024-002',
      guardId: 'off-002',
      guardName: 'Sarah Chen',
      site: 'Warehouse District',
      severity: 'high',
      reportedAt: new Date(Date.now() - 7200000).toISOString(),
      respondedAt: new Date(Date.now() - 7020000).toISOString(),
      resolvedAt: new Date(Date.now() - 5400000).toISOString(),
      responseTime: 3,
      resolutionTime: 30,
      metSLA: true,
      category: 'Access Breach',
    },
  ],
});

const generateMockAlerts = (): PerformanceAlert[] => [
  {
    id: 'alert-001',
    type: 'attendance',
    severity: 'warning',
    title: 'Late Arrival Pattern',
    message: 'Robert Taylor has been late 3 times this week',
    guardId: 'off-005',
    guardName: 'Robert Taylor',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    isRead: false,
    actionRequired: true,
    actionUrl: '/guards/off-005',
  },
  {
    id: 'alert-002',
    type: 'patrol',
    severity: 'critical',
    title: 'Missed Patrol',
    message: 'Tech Park perimeter patrol was missed at 14:00',
    site: 'Tech Park',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: false,
    actionRequired: true,
  },
  {
    id: 'alert-003',
    type: 'training',
    severity: 'info',
    title: 'Training Due',
    message: '3 guards have training certifications expiring within 30 days',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
    actionRequired: false,
    actionUrl: '/compliance/certifications',
  },
];

// ============================================
// Hook State Interface
// ============================================

interface PerformanceState {
  overview: OverviewMetrics | null;
  guards: GuardPerformance[];
  rankings: GuardRanking[];
  patrols: PatrolMetrics | null;
  attendance: AttendanceMetrics | null;
  incidents: IncidentMetrics | null;
  alerts: PerformanceAlert[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ============================================
// Hook Implementation
// ============================================

export const usePerformanceData = (initialFilters: PerformanceFilters = { timeRange: 'week' }) => {
  const [state, setState] = useState<PerformanceState>({
    overview: null,
    guards: [],
    rankings: [],
    patrols: null,
    attendance: null,
    incidents: null,
    alerts: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const [filters, setFilters] = useState<PerformanceFilters>(initialFilters);
  const [selectedGuardId, setSelectedGuardId] = useState<string | null>(null);

  // Fetch all performance data
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await simulateDelay('long');

        const guards = generateMockGuards();

        setState({
          overview: generateMockOverview(),
          guards,
          rankings: generateMockRankings(guards),
          patrols: generateMockPatrolMetrics(),
          attendance: generateMockAttendanceMetrics(),
          incidents: generateMockIncidentMetrics(),
          alerts: generateMockAlerts(),
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        });
      } else {
        // Real API calls would go here
        const [overview, guards, patrols, attendance, incidents, alerts] = await Promise.all([
          fetch('/api/performance/overview').then(r => r.json()),
          fetch('/api/performance/guards').then(r => r.json()),
          fetch('/api/performance/patrols').then(r => r.json()),
          fetch('/api/performance/attendance').then(r => r.json()),
          fetch('/api/performance/incidents').then(r => r.json()),
          fetch('/api/performance/alerts').then(r => r.json()),
        ]);

        setState({
          overview: overview.data,
          guards: guards.data,
          rankings: generateMockRankings(guards.data),
          patrols: patrols.data,
          attendance: attendance.data,
          incidents: incidents.data,
          alerts: alerts.data,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        });
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load performance data',
      }));
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get selected guard details
  const selectedGuard = useMemo(() => {
    if (!selectedGuardId) return null;
    return state.guards.find(o => o.guardId === selectedGuardId) || null;
  }, [selectedGuardId, state.guards]);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== alertId),
    }));
  }, []);

  // Mark alert as read
  const markAlertRead = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(a =>
        a.id === alertId ? { ...a, isRead: true } : a
      ),
    }));
  }, []);

  return {
    // Data
    overview: state.overview,
    guards: state.guards,
    rankings: state.rankings,
    patrols: state.patrols,
    attendance: state.attendance,
    incidents: state.incidents,
    alerts: state.alerts,
    selectedGuard,

    // State
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,

    // Filters
    filters,
    setFilters,
    selectedGuardId: selectedGuardId,
    setSelectedGuardId: setSelectedGuardId,

    // Actions
    refetch: fetchData,
    dismissAlert,
    markAlertRead,
  };
};

export default usePerformanceData;