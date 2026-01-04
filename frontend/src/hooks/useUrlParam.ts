/**
 * useUrlParam Hook
 *
 * Syncs tab state with URL query parameters for deep-linking and browser navigation.
 * Use for persistent state like tabs, filters, sort orders.
 *
 * * Features:
 *  * - Reads initial value from URL on mount
 *  * - Updates URL when state changes
 *  * - Cleans URL when returning to default value
 *  * - Validates against allowed values
 *  * - Works with browser back/forward
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlParam<T extends string>(
  paramName: string = 'tab',
  defaultValue: T,
  validValues?: T[]
): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial value from URL or default
  const getInitialValue = useCallback((): T => {
    const urlValue = searchParams.get(paramName) as T | null;

    if (!urlValue) return defaultValue;

    // Validate against allowed values if provided
    if (validValues && !validValues.includes(urlValue)) {
      return defaultValue;
    }

    return urlValue;
  }, [searchParams, paramName, defaultValue, validValues]);

  const [value, setValue] = useState<T>(getInitialValue);

  // Sync from URL changes (browser back/forward)
  useEffect(() => {
    const urlValue = searchParams.get(paramName) as T | null;

    if (!urlValue) {
      setValue(defaultValue);
      return;
    }

    if (validValues && !validValues.includes(urlValue)) {
      setValue(defaultValue);
      return;
    }

    setValue(urlValue);
  }, [searchParams, paramName, defaultValue, validValues]);

  // Update state and sync to URL
  const setParam = useCallback(
    (newValue: T) => {
      setValue(newValue);

      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);

          if (newValue === defaultValue) {
            // Remove param when returning to default (cleaner URLs)
            newParams.delete(paramName);
          } else {
            newParams.set(paramName, newValue);
          }

          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams, paramName, defaultValue]
  );

  return [value, setParam];
}

export default useUrlParam;