/**
 * useGenerateShifts Hook
 *
 * Provides shift generation functionality for UI.
 */

import { useState, useCallback } from 'react';
import { api } from '../../../utils/api';

interface GenerateResult {
  created: number;
  dateRange: {
    start: string;
    end: string;
  };
}

interface UseGenerateShiftsReturn {
  generate: (siteId: string, weeks?: number) => Promise<GenerateResult>;
  generateAll: (weeks?: number) => Promise<{ totalShiftsCreated: number; totalSites: number }>;
  isGenerating: boolean;
  error: string | null;
}

export function useGenerateShifts(): UseGenerateShiftsReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (siteId: string, weeks: number = 2): Promise<GenerateResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.post(`/scheduling/generate/${siteId}`, { weeks });
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to generate shifts';
      setError(message);
      throw new Error(message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateAll = useCallback(async (weeks: number = 2) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.post('/scheduling/generate-all', { weeks });
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to generate shifts';
      setError(message);
      throw new Error(message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generate,
    generateAll,
    isGenerating,
    error,
  };
}

export default useGenerateShifts;