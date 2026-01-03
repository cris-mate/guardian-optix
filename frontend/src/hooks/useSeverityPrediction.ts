/**
 * useSeverityPrediction Hook
 *
 * Fetches ML-based severity predictions for incident creation.
 * Uses historical incident patterns to suggest appropriate severity levels.
 */

import { useState, useCallback } from 'react';
import { api } from '../utils/api';
import type { IncidentType, IncidentSeverity } from '../types/shared/common.types';

// ============================================
// Types
// ============================================

interface SeverityProbabilities {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface SeverityPrediction {
  predictedSeverity: IncidentSeverity;
  confidence: number;
  probabilities: SeverityProbabilities;
  basedOnCount: number;
}

export interface PatternInsight {
  type: string;
  riskScore: number;
}

export interface PatternInsights {
  highRiskTypes: PatternInsight[];
  totalIncidentsAnalysed: number;
  modelUpdatedAt: string;
}

interface UseSeverityPredictionReturn {
  prediction: SeverityPrediction | null;
  isLoading: boolean;
  error: string | null;
  fetchPrediction: (incidentType: IncidentType) => Promise<void>;
  clearPrediction: () => void;
}

interface UsePatternInsightsReturn {
  insights: PatternInsights | null;
  isLoading: boolean;
  error: string | null;
  fetchInsights: () => Promise<void>;
}

// ============================================
// Severity Prediction Hook
// ============================================

export const useSeverityPrediction = (): UseSeverityPredictionReturn => {
  const [prediction, setPrediction] = useState<SeverityPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async (incidentType: IncidentType) => {
    if (!incidentType) {
      setPrediction(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<{ success: boolean; data: SeverityPrediction }>(
        '/incidents/predict-severity',
        { incidentType }
      );

      if (response.data.success) {
        setPrediction(response.data.data);
      }
    } catch (err) {
      console.error('Severity prediction failed:', err);
      setError('Failed to fetch severity prediction');
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setError(null);
  }, []);

  return {
    prediction,
    isLoading,
    error,
    fetchPrediction,
    clearPrediction,
  };
};

// ============================================
// Pattern Insights Hook
// ============================================

export const usePatternInsights = (): UsePatternInsightsReturn => {
  const [insights, setInsights] = useState<PatternInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ success: boolean; data: PatternInsights }>(
        '/incidents/pattern-insights'
      );

      if (response.data.success) {
        setInsights(response.data.data);
      }
    } catch (err) {
      console.error('Pattern insights fetch failed:', err);
      setError('Failed to fetch pattern insights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    insights,
    isLoading,
    error,
    fetchInsights,
  };
};

export default useSeverityPrediction;