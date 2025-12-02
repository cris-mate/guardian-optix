/**
 * Activity Hub Types
 *
 * TypeScript interfaces for the Activity Hub page.
 * Covers both system-generated audit logs and human-generated updates.
 */

// ============================================
// Core Enums & Types
// ============================================

// System activity categories (audit log events)
export type ActivityCategory =
  | 'authentication'   // Login, logout, password changes
  | 'shift'            // Clock-in, clock-out, shift swap
  | 'patrol'           // Checkpoint scans, tour completions
  | 'incident'         // Incident reports, escalations
  | 'compliance'       // Document uploads, licence verifications
  | 'geofence'         // Zone entries, violations
  | 'task'             // Task assignments, completions
  | 'system';          // System events, maintenance

// Activity severity levels
export type ActivitySeverity = 'info' | 'warning' | 'critical';

// Update types (human-generated content)
export type UpdateType =
  | 'announcement'     // Company-wide announcements
  | 'policy'           // Policy updates
  | 'schedule'         // Schedule changes
  | 'alert'            // Urgent alerts
  | 'recognition'      // Employee recognition
  | 'general';         // General updates

// Priority levels for updates
export type UpdatePriority = 'low' | 'medium' | 'high' | 'urgent';

// Filter time ranges
export type TimeRange = 'today' | 'week' | 'month' | 'custom';

// ============================================
// System Activity (Audit Log)
// ============================================

export interface SystemActivity {
  _id: string;
  category: ActivityCategory;
  action: string;
  description: string;
  timestamp: string;
  severity: ActivitySeverity;

  // Actor information
  actorId?: string;
  actorName?: string;
  actorRole?: string;

  // Target information
  targetType?: 'guard' | 'site' | 'shift' | 'document' | 'incident' | 'system';
  targetId?: string;
  targetName?: string;

  // Location data
  location?: {
    siteName?: string;
    siteId?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  // Additional metadata
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceInfo?: string;
}

// ============================================
// Updates (Human-Generated)
// ============================================

export interface Update {
  _id: string;
  type: UpdateType;
  title: string;
  content: string;
  priority: UpdatePriority;
  createdAt: string;
  updatedAt?: string;

  // Author information
  authorId: string;
  authorName: string;
  authorRole: string;

  // Targeting
  targetAudience: 'all' | 'guards' | 'managers' | 'admins' | 'specific';
  targetIds?: string[]; // Specific user IDs if targetAudience is 'specific'

  // Engagement tracking
  readBy?: string[];
  acknowledgedBy?: string[];
  requiresAcknowledgement: boolean;

  // Scheduling
  publishAt?: string;
  expiresAt?: string;
  isPinned: boolean;

  // Attachments
  attachments?: Attachment[];
}

export interface Attachment {
  _id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

// ============================================
// Statistics & Summaries
// ============================================

export interface ActivityStats {
  today: {
    total: number;
    byCategory: Record<ActivityCategory, number>;
    bySeverity: Record<ActivitySeverity, number>;
  };
  week: {
    total: number;
    dailyBreakdown: { date: string; count: number }[];
  };
  recentCritical: number;
  pendingAcknowledgements: number;
}

export interface UpdateStats {
  total: number;
  unread: number;
  pendingAcknowledgement: number;
  byType: Record<UpdateType, number>;
}

// ============================================
// Filters
// ============================================

export interface ActivityFilters {
  search: string;
  categories: ActivityCategory[];
  severities: ActivitySeverity[];
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
  actorId?: string;
  siteId?: string;
}

export interface UpdateFilters {
  search: string;
  types: UpdateType[];
  priorities: UpdatePriority[];
  showRead: boolean;
  showExpired: boolean;
}

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  search: '',
  categories: [],
  severities: [],
  timeRange: 'today',
};

export const DEFAULT_UPDATE_FILTERS: UpdateFilters = {
  search: '',
  types: [],
  priorities: [],
  showRead: true,
  showExpired: false,
};

// ============================================
// Pagination
// ============================================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Form Data
// ============================================

export interface UpdateFormData {
  type: UpdateType;
  title: string;
  content: string;
  priority: UpdatePriority;
  targetAudience: 'all' | 'guards' | 'managers' | 'admins' | 'specific';
  targetIds?: string[];
  requiresAcknowledgement: boolean;
  isPinned: boolean;
  publishAt?: string;
  expiresAt?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ActivityHubResponse {
  success: boolean;
  data: {
    activities: SystemActivity[];
    updates: Update[];
    activityStats: ActivityStats;
    updateStats: UpdateStats;
  };
  pagination?: Pagination;
  timestamp: string;
}

// ============================================
// Configuration Maps
// ============================================

export const CATEGORY_CONFIG: Record<ActivityCategory, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  authentication: { label: 'Authentication', color: 'blue.500', bgColor: 'blue.50' },
  shift: { label: 'Shift', color: 'green.500', bgColor: 'green.50' },
  patrol: { label: 'Patrol', color: 'teal.500', bgColor: 'teal.50' },
  incident: { label: 'Incident', color: 'orange.500', bgColor: 'orange.50' },
  compliance: { label: 'Compliance', color: 'purple.500', bgColor: 'purple.50' },
  geofence: { label: 'Geofence', color: 'red.500', bgColor: 'red.50' },
  task: { label: 'Task', color: 'cyan.500', bgColor: 'cyan.50' },
  system: { label: 'System', color: 'gray.500', bgColor: 'gray.50' },
};

export const SEVERITY_CONFIG: Record<ActivitySeverity, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  info: { label: 'Info', color: 'blue.500', bgColor: 'blue.50' },
  warning: { label: 'Warning', color: 'orange.500', bgColor: 'orange.50' },
  critical: { label: 'Critical', color: 'red.500', bgColor: 'red.50' },
};

export const UPDATE_TYPE_CONFIG: Record<UpdateType, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  announcement: { label: 'Announcement', color: 'blue.500', bgColor: 'blue.50' },
  policy: { label: 'Policy Update', color: 'purple.500', bgColor: 'purple.50' },
  schedule: { label: 'Schedule Change', color: 'cyan.500', bgColor: 'cyan.50' },
  alert: { label: 'Alert', color: 'red.500', bgColor: 'red.50' },
  recognition: { label: 'Recognition', color: 'green.500', bgColor: 'green.50' },
  general: { label: 'General', color: 'gray.500', bgColor: 'gray.50' },
};

export const PRIORITY_CONFIG: Record<UpdatePriority, {
  label: string;
  color: string;
}> = {
  low: { label: 'Low', color: 'gray' },
  medium: { label: 'Medium', color: 'blue' },
  high: { label: 'High', color: 'orange' },
  urgent: { label: 'Urgent', color: 'red' },
};