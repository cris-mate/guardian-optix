/**
 * Shared Hooks
 *
 * App-level reusable hooks for URL state management and common functionality.
 *
 * URL State Hooks:
 * - useUrlParam: Persistent URL state (tabs, filters, sort)
 * - useUrlAction: One-time URL triggers (modals, buttons)
 */

export { useUrlParam } from './useUrlParam';
export { useUrlAction } from './useUrlAction';