/**
 * useUrlAction Hook
 *
 * Reads one-time action triggers from URL query parameters.
 * Use for triggering modals, buttons, or other one-time actions via URL.
 *
 * Returns current action value + clear function
 * Does NOT auto-sync state back to URL
 * Caller must clear the action after handling
 *
 * Features:
 * - Reads action from URL on mount and URL changes
 * - Provides clear function to remove param from URL
 * - Validates against allowed actions
 * - Supports browser back/forward
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlAction<T extends string = string>(
  paramName: string = 'action',
  validActions?: T[]
): [T | null, () => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get action from URL
  const getActionFromUrl = useCallback((): T | null => {
    const urlValue = searchParams.get(paramName) as T | null;

    if (!urlValue) return null;

    // Validate against allowed actions if provided
    if (validActions && !validActions.includes(urlValue)) {
      return null;
    }

    return urlValue;
  }, [searchParams, paramName, validActions]);

  const [action, setAction] = useState<T | null>(getActionFromUrl);

  // Sync from URL changes (browser back/forward, navigation)
  useEffect(() => {
    setAction(getActionFromUrl());
  }, [getActionFromUrl]);

  // Clear action from URL
  const clearAction = useCallback(() => {
    setAction(null);

    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete(paramName);
        return newParams;
      },
      { replace: true }
    );
  }, [setSearchParams, paramName]);

  return [action, clearAction];
}

export default useUrlAction;