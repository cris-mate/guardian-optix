/**
 * Incident Predictor Service Tests
 *
 * Unit tests for ML-based severity prediction.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Incident = require('../../models/Incident');
const {
  predictSeverity,
  getPatternInsights,
  buildProbabilityModel,
} = require('../../services/incidentPredictor');

// ============================================
// Test Setup
// ============================================

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Incident.deleteMany({});
});

// ============================================
// Helper Functions
// ============================================

const createTestUser = () => new mongoose.Types.ObjectId();

const seedIncidents = async (incidents) => {
  const userId = createTestUser();
  return Incident.insertMany(
    incidents.map((i) => ({
      reportedBy: userId,
      location: 'Test Site',
      description: 'Test incident',
      ...i,
    }))
  );
};

// ============================================
// Tests: predictSeverity
// ============================================

describe('predictSeverity', () => {
  it('should return default probabilities when no historical data exists', async () => {
    const result = await predictSeverity({ incidentType: 'theft' });

    expect(result).toHaveProperty('predictedSeverity');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('probabilities');
    expect(result).toHaveProperty('basedOnCount', 0);
  });

  it('should predict based on historical incident patterns', async () => {
    // Seed: 10 theft incidents - 8 high severity, 2 medium
    await seedIncidents([
      ...Array(8).fill({ incidentType: 'theft', severity: 'high' }),
      ...Array(2).fill({ incidentType: 'theft', severity: 'medium' }),
    ]);

    const result = await predictSeverity({ incidentType: 'theft' });

    expect(result.predictedSeverity).toBe('high');
    expect(result.confidence).toBe(80); // 8/10 = 80%
    expect(result.probabilities.high).toBe(0.8);
    expect(result.probabilities.medium).toBe(0.2);
    expect(result.basedOnCount).toBe(10);
  });

  it('should handle mixed incident types correctly', async () => {
    await seedIncidents([
      // Theft: mostly high
      ...Array(5).fill({ incidentType: 'theft', severity: 'high' }),
      { incidentType: 'theft', severity: 'medium' },
      // Vandalism: mostly low
      ...Array(4).fill({ incidentType: 'vandalism', severity: 'low' }),
    ]);

    const theftResult = await predictSeverity({ incidentType: 'theft' });
    const vandalismResult = await predictSeverity({ incidentType: 'vandalism' });

    expect(theftResult.predictedSeverity).toBe('high');
    expect(vandalismResult.predictedSeverity).toBe('low');
  });

  it('should return default for unknown incident types', async () => {
    await seedIncidents([
      { incidentType: 'theft', severity: 'high' },
    ]);

    const result = await predictSeverity({ incidentType: 'unknown-type' });

    // Should return default distribution
    expect(result.probabilities).toHaveProperty('low');
    expect(result.probabilities).toHaveProperty('medium');
    expect(result.probabilities).toHaveProperty('high');
    expect(result.probabilities).toHaveProperty('critical');
  });

  it('should handle critical severity incidents', async () => {
    await seedIncidents([
      ...Array(7).fill({ incidentType: 'assault', severity: 'critical' }),
      ...Array(3).fill({ incidentType: 'assault', severity: 'high' }),
    ]);

    const result = await predictSeverity({ incidentType: 'assault' });

    expect(result.predictedSeverity).toBe('critical');
    expect(result.confidence).toBe(70);
  });
});

// ============================================
// Tests: getPatternInsights
// ============================================

describe('getPatternInsights', () => {
  it('should return empty high-risk types when no data', async () => {
    const insights = await getPatternInsights();

    expect(insights.highRiskTypes).toEqual([]);
    expect(insights.totalIncidentsAnalysed).toBe(0);
  });

  it('should identify high-risk incident types', async () => {
    await seedIncidents([
      // Assault: 80% critical/high (should be flagged)
      ...Array(4).fill({ incidentType: 'assault', severity: 'critical' }),
      ...Array(4).fill({ incidentType: 'assault', severity: 'high' }),
      ...Array(2).fill({ incidentType: 'assault', severity: 'medium' }),
      // Trespassing: 20% high (should NOT be flagged)
      ...Array(2).fill({ incidentType: 'trespassing', severity: 'high' }),
      ...Array(8).fill({ incidentType: 'trespassing', severity: 'low' }),
    ]);

    const insights = await getPatternInsights();

    expect(insights.highRiskTypes.length).toBe(1);
    expect(insights.highRiskTypes[0].type).toBe('assault');
    expect(insights.highRiskTypes[0].riskScore).toBe(80);
    expect(insights.totalIncidentsAnalysed).toBe(20);
  });

  it('should sort high-risk types by risk score descending', async () => {
    await seedIncidents([
      // Type A: 50% high-risk
      ...Array(5).fill({ incidentType: 'security-breach', severity: 'critical' }),
      ...Array(5).fill({ incidentType: 'security-breach', severity: 'low' }),
      // Type B: 80% high-risk
      ...Array(8).fill({ incidentType: 'assault', severity: 'high' }),
      ...Array(2).fill({ incidentType: 'assault', severity: 'low' }),
    ]);

    const insights = await getPatternInsights();

    expect(insights.highRiskTypes[0].type).toBe('assault');
    expect(insights.highRiskTypes[1].type).toBe('security-breach');
  });

  it('should include model timestamp', async () => {
    await seedIncidents([
      { incidentType: 'theft', severity: 'medium' },
    ]);

    const insights = await getPatternInsights();

    expect(insights.modelUpdatedAt).toBeDefined();
    expect(new Date(insights.modelUpdatedAt)).toBeInstanceOf(Date);
  });
});

// ============================================
// Tests: buildProbabilityModel (Caching)
// ============================================

describe('buildProbabilityModel', () => {
  it('should build model from incident data', async () => {
    await seedIncidents([
      { incidentType: 'theft', severity: 'high' },
      { incidentType: 'theft', severity: 'high' },
      { incidentType: 'vandalism', severity: 'low' },
    ]);

    const model = await buildProbabilityModel();

    expect(model.byType).toHaveProperty('theft');
    expect(model.byType).toHaveProperty('vandalism');
    expect(model.totalIncidents).toBe(3);
  });

  it('should calculate correct probabilities', async () => {
    await seedIncidents([
      { incidentType: 'theft', severity: 'high' },
      { incidentType: 'theft', severity: 'high' },
      { incidentType: 'theft', severity: 'medium' },
      { incidentType: 'theft', severity: 'low' },
    ]);

    const model = await buildProbabilityModel();

    expect(model.byType.theft.high).toBe(0.5);    // 2/4
    expect(model.byType.theft.medium).toBe(0.25); // 1/4
    expect(model.byType.theft.low).toBe(0.25);    // 1/4
  });
});