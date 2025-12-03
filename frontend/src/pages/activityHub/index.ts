/**
 * Activity Hub Page Module
 *
 * Enables clean imports throughout the application.
 *
 * @example
 * import ActivityHub from '@/pages/activityHub';
 * import { useActivityHubData } from '@/pages/activityHub';
 */

// Main component
export { default } from './ActivityHub';
export { default as ActivityHub } from './ActivityHub';

// Hooks
export { useActivityHubData } from './hooks/useActivityHubData';

// Types
export type {
  // Core types
  ActivityCategory,
  ActivitySeverity,
  UpdateType,
  UpdatePriority,
  TimeRange,

  // Data types
  SystemActivity,
  Update,
  Attachment,
  UpdateStats,

  // Filter types
  ActivityFilters,
  UpdateFilters,

  // Form types
  UpdateFormData,

  // Pagination
  Pagination,

  // API response types
  ActivityHubResponse,
} from './types/activityHub.types';

// Constants
export {
  CATEGORY_CONFIG,
  SEVERITY_CONFIG,
  UPDATE_TYPE_CONFIG,
  PRIORITY_CONFIG,
  DEFAULT_ACTIVITY_FILTERS,
  DEFAULT_UPDATE_FILTERS,
} from './types/activityHub.types';