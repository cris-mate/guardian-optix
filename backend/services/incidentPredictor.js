/**
 * Incident Severity Predictor
 *
 * Uses historical incident patterns to suggest severity for new incidents.
 * Approach: Calculate probability P(severity | incidentType, timeOfDay)
 * using frequency counts from historical data.
 */

const Incident = require('../models/Incident');

// Cache for probability distributions (refreshed periodically)
let probabilityCache = null;
let cacheTimestamp = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Time of day buckets for pattern detection
 */
const getTimeOfDayBucket = (date) => {
  const hour = new Date(date).getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

/**
 * Build probability distributions from historical data
 */
const buildProbabilityModel = async () => {
  const now = Date.now();

  // Return cached model if still valid
  if (probabilityCache && cacheTimestamp && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return probabilityCache;
  }

  // Aggregate incident counts by type + severity
  const typeSeverityCounts = await Incident.aggregate([
    {
      $group: {
        _id: { type: '$incidentType', severity: '$severity' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Build probability lookup: P(severity | incidentType)
  const model = {
    byType: {},     // { 'theft': { 'low': 0.1, 'medium': 0.3, 'high': 0.4, 'critical': 0.2 } }
    byTimeOfDay: {},
    totalIncidents: 0,
  };

  // Calculate type-based probabilities
  const typeTotals = {};
  typeSeverityCounts.forEach(({ _id, count }) => {
    const { type, severity } = _id;
    if (!typeTotals[type]) typeTotals[type] = 0;
    typeTotals[type] += count;
    model.totalIncidents += count;
  });

  typeSeverityCounts.forEach(({ _id, count }) => {
    const { type, severity } = _id;
    if (!model.byType[type]) model.byType[type] = {};
    model.byType[type][severity] = count / typeTotals[type];
  });

  // Cache the model
  probabilityCache = model;
  cacheTimestamp = now;

  return model;
};

/**
 * Predict severity for a new incident
 * @param {Object} incidentData - { incidentType, timestamp? }
 * @returns {Object} - { predictedSeverity, confidence, probabilities }
 */
const predictSeverity = async (incidentData) => {
  const { incidentType, timestamp = new Date() } = incidentData;
  const model = await buildProbabilityModel();

  // Get probabilities for this incident type
  const typeProbabilities = model.byType[incidentType] || {
    low: 0.25,
    medium: 0.35,
    high: 0.25,
    critical: 0.15, // Default uniform-ish distribution
  };

  // Find the highest probability of severity
  let predictedSeverity = 'medium';
  let maxProb = 0;

  Object.entries(typeProbabilities).forEach(([severity, prob]) => {
    if (prob > maxProb) {
      maxProb = prob;
      predictedSeverity = severity;
    }
  });

  return {
    predictedSeverity,
    confidence: Math.round(maxProb * 100),
    probabilities: typeProbabilities,
    basedOnCount: model.totalIncidents,
  };
};

/**
 * Get incident pattern insights for dashboard
 */
const getPatternInsights = async () => {
  const model = await buildProbabilityModel();

  // Find high-risk incident types (>30% critical/high)
  const highRiskTypes = Object.entries(model.byType)
    .filter(([_, probs]) => (probs.critical || 0) + (probs.high || 0) > 0.3)
    .map(([type, probs]) => ({
      type,
      riskScore: Math.round(((probs.critical || 0) + (probs.high || 0)) * 100),
    }))
    .sort((a, b) => b.riskScore - a.riskScore);

  return {
    highRiskTypes,
    totalIncidentsAnalysed: model.totalIncidents,
    modelUpdatedAt: new Date(cacheTimestamp).toISOString(),
  };
};

module.exports = {
  predictSeverity,
  getPatternInsights,
  buildProbabilityModel,
};