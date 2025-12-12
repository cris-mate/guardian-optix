/**
 * Guard Matching Service Unit Tests
 *
 * Tests the algorithmic guard-to-shift matching with weighted scoring.
 * Demonstrates: algorithm testing, mocking external APIs, scoring validation.
 *
 * Scoring Weights:
 * - Distance: 30%
 * - Guard Type: 25%
 * - Availability: 20%
 * - SIA Licence: 15%
 * - Certifications: 10%
 */

const axios = require('axios');

// Mock axios before requiring the service
jest.mock('axios');

// ============================================
// Service Implementation (for isolated testing)
// ============================================

const WEIGHTS = {
  distance: 0.30,
  guardType: 0.25,
  availability: 0.20,
  licence: 0.15,
  certifications: 0.10,
};

/**
 * Haversine distance calculation (km)
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Score a guard for a specific site/shift
 */
const scoreGuard = async (guard, site, siteCoords) => {
  const breakdown = {};

  // 1. DISTANCE (30% weight)
  try {
    const response = await axios.get(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(guard.postCode)}`
    );
    const guardCoords = response.data.result;
    const dist = haversineDistance(
      siteCoords.latitude,
      siteCoords.longitude,
      guardCoords.latitude,
      guardCoords.longitude
    );
    // Score: 100 at 0km, decreases by 2 points per km, min 0
    breakdown.distance = Math.max(0, 100 - dist * 2);
  } catch {
    breakdown.distance = 50; // Unknown = neutral
  }

  // 2. GUARD TYPE (25% weight)
  breakdown.guardType =
    site.requiredGuardType === guard.guardType ? 100 :
      !site.requiredGuardType ? 50 : 20;

  // 3. LICENCE STATUS (15% weight)
  const licenceMap = { valid: 100, 'expiring-soon': 50, expired: 0, pending: 25 };
  breakdown.licence = licenceMap[guard.siaLicence?.status] ?? 0;

  // 4. AVAILABILITY (20% weight)
  breakdown.availability = guard.availability ? 100 : 0;

  // 5. CERTIFICATIONS (10% weight)
  const required = site.requiredCertifications || [];
  const held = guard.certifications || [];
  const matchCount = required.filter(c => held.includes(c)).length;
  breakdown.certifications =
    required.length === 0 ? 100 : (matchCount / required.length) * 100;

  // FINAL SCORE (weighted average)
  const score = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + breakdown[key] * weight,
    0
  );

  return { score: Math.round(score), breakdown };
};

// ============================================
// Test Suite
// ============================================

describe('Guard Matching Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------
  // Weight Configuration Tests
  // ------------------------------------------

  describe('Scoring Weights', () => {
    it('should have weights that sum to 1.0 (100%)', () => {
      const totalWeight = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });

    it('should prioritize distance as highest weight (30%)', () => {
      expect(WEIGHTS.distance).toBe(0.30);
      expect(WEIGHTS.distance).toBeGreaterThan(WEIGHTS.guardType);
    });

    it('should have correct weight order', () => {
      expect(WEIGHTS.distance).toBeGreaterThan(WEIGHTS.guardType);
      expect(WEIGHTS.guardType).toBeGreaterThan(WEIGHTS.availability);
      expect(WEIGHTS.availability).toBeGreaterThan(WEIGHTS.licence);
      expect(WEIGHTS.licence).toBeGreaterThan(WEIGHTS.certifications);
    });
  });

  // ------------------------------------------
  // Distance Scoring Tests
  // ------------------------------------------

  describe('Distance Scoring', () => {
    const mockSite = {
      requiredGuardType: 'Static',
      requiredCertifications: [],
    };
    const mockSiteCoords = { latitude: 51.5074, longitude: -0.1278 };

    it('should give 100 points for guard at 0km distance', async () => {
      axios.get.mockResolvedValue({
        data: { result: { latitude: 51.5074, longitude: -0.1278 } },
      });

      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: [],
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      expect(result.breakdown.distance).toBe(100);
    });

    it('should give 80 points for guard at 10km distance', async () => {
      // 10km north of London = approximately 51.5974
      axios.get.mockResolvedValue({
        data: { result: { latitude: 51.5974, longitude: -0.1278 } },
      });

      const guard = {
        postCode: 'N1 1AA',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: [],
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      // 100 - (10 * 2) = 80
      expect(result.breakdown.distance).toBeCloseTo(80, -1);
    });

    it('should give 0 points for guard at 50km+ distance', async () => {
      // 60km away
      axios.get.mockResolvedValue({
        data: { result: { latitude: 52.0474, longitude: -0.1278 } },
      });

      const guard = {
        postCode: 'MK1 1AA',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: [],
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      expect(result.breakdown.distance).toBe(0);
    });

    it('should give 50 points (neutral) when postcode lookup fails', async () => {
      axios.get.mockRejectedValue(new Error('Postcode not found'));

      const guard = {
        postCode: 'INVALID',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: [],
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      expect(result.breakdown.distance).toBe(50);
    });
  });

  // ------------------------------------------
  // Guard Type Matching Tests
  // ------------------------------------------

  describe('Guard Type Matching', () => {
    const mockSiteCoords = { latitude: 51.5074, longitude: -0.1278 };

    beforeEach(() => {
      axios.get.mockResolvedValue({
        data: { result: { latitude: 51.5074, longitude: -0.1278 } },
      });
    });

    it('should give 100 points for exact guard type match', async () => {
      const site = { requiredGuardType: 'Dog Handler' };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Dog Handler',
        availability: true,
        siaLicence: { status: 'valid' },
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);
      expect(result.breakdown.guardType).toBe(100);
    });

    it('should give 50 points when site has no guard type requirement', async () => {
      const site = { requiredGuardType: null };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);
      expect(result.breakdown.guardType).toBe(50);
    });

    it('should give 20 points for guard type mismatch', async () => {
      const site = { requiredGuardType: 'Close Protection' };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);
      expect(result.breakdown.guardType).toBe(20);
    });

    it('should handle all guard type values', async () => {
      const guardTypes = ['Static', 'Dog Handler', 'Close Protection', 'Mobile Patrol'];

      for (const guardType of guardTypes) {
        const site = { requiredGuardType: guardType };
        const guard = {
          postCode: 'EC1A 1BB',
          guardType,
          availability: true,
          siaLicence: { status: 'valid' },
        };

        const result = await scoreGuard(guard, site, mockSiteCoords);
        expect(result.breakdown.guardType).toBe(100);
      }
    });
  });

  // ------------------------------------------
  // SIA Licence Status Tests
  // ------------------------------------------

  describe('SIA Licence Status Scoring', () => {
    const mockSite = { requiredGuardType: 'Static' };
    const mockSiteCoords = { latitude: 51.5074, longitude: -0.1278 };

    beforeEach(() => {
      axios.get.mockResolvedValue({
        data: { result: { latitude: 51.5074, longitude: -0.1278 } },
      });
    });

    it('should give 100 points for valid licence', async () => {
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      expect(result.breakdown.licence).toBe(100);
    });

    it('should give 50 points for expiring-soon licence', async () => {
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'expiring-soon' },
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      expect(result.breakdown.licence).toBe(50);
    });

    it('should give 0 points for expired licence', async () => {
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'expired' },
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      expect(result.breakdown.licence).toBe(0);
    });

    it('should give 25 points for pending licence', async () => {
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'pending' },
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      expect(result.breakdown.licence).toBe(25);
    });

    it('should give 0 points when licence is missing', async () => {
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      expect(result.breakdown.licence).toBe(0);
    });
  });

  // ------------------------------------------
  // Availability Tests
  // ------------------------------------------

  describe('Availability Scoring', () => {
    const mockSite = { requiredGuardType: 'Static' };
    const mockSiteCoords = { latitude: 51.5074, longitude: -0.1278 };

    beforeEach(() => {
      axios.get.mockResolvedValue({
        data: { result: { latitude: 51.5074, longitude: -0.1278 } },
      });
    });

    it('should give 100 points when guard is available', async () => {
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      expect(result.breakdown.availability).toBe(100);
    });

    it('should give 0 points when guard is not available', async () => {
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: false,
        siaLicence: { status: 'valid' },
      };

      const result = await scoreGuard(guard, mockSite, mockSiteCoords);
      expect(result.breakdown.availability).toBe(0);
    });
  });

  // ------------------------------------------
  // Certifications Tests
  // ------------------------------------------

  describe('Certifications Scoring', () => {
    const mockSiteCoords = { latitude: 51.5074, longitude: -0.1278 };

    beforeEach(() => {
      axios.get.mockResolvedValue({
        data: { result: { latitude: 51.5074, longitude: -0.1278 } },
      });
    });

    it('should give 100 points when no certifications required', async () => {
      const site = { requiredGuardType: 'Static', requiredCertifications: [] };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: [],
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);
      expect(result.breakdown.certifications).toBe(100);
    });

    it('should give 100 points when guard has all required certifications', async () => {
      const site = {
        requiredGuardType: 'Static',
        requiredCertifications: ['First Aid', 'Fire Safety'],
      };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: ['First Aid', 'Fire Safety', 'CCTV'],
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);
      expect(result.breakdown.certifications).toBe(100);
    });

    it('should give 50 points when guard has half of required certifications', async () => {
      const site = {
        requiredGuardType: 'Static',
        requiredCertifications: ['First Aid', 'Fire Safety'],
      };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: ['First Aid'],
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);
      expect(result.breakdown.certifications).toBe(50);
    });

    it('should give 0 points when guard has no required certifications', async () => {
      const site = {
        requiredGuardType: 'Static',
        requiredCertifications: ['First Aid', 'Fire Safety'],
      };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: ['CCTV'],
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);
      expect(result.breakdown.certifications).toBe(0);
    });
  });

  // ------------------------------------------
  // Final Score Calculation Tests
  // ------------------------------------------

  describe('Final Score Calculation', () => {
    const mockSiteCoords = { latitude: 51.5074, longitude: -0.1278 };

    beforeEach(() => {
      axios.get.mockResolvedValue({
        data: { result: { latitude: 51.5074, longitude: -0.1278 } },
      });
    });

    it('should calculate perfect score (100) for ideal guard', async () => {
      const site = {
        requiredGuardType: 'Static',
        requiredCertifications: [],
      };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: [],
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);

      // All categories at 100: 100 * 1.0 = 100
      expect(result.score).toBe(100);
    });

    it('should calculate weighted average correctly', async () => {
      const site = {
        requiredGuardType: 'Static',
        requiredCertifications: [],
      };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: false, // 0 points (20% weight)
        siaLicence: { status: 'valid' },
        certifications: [],
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);

      // Expected: (100*0.30) + (100*0.25) + (0*0.20) + (100*0.15) + (100*0.10)
      // = 30 + 25 + 0 + 15 + 10 = 80
      expect(result.score).toBe(80);
    });

    it('should return integer score (rounded)', async () => {
      const site = {
        requiredGuardType: 'Static',
        requiredCertifications: ['First Aid', 'Fire Safety', 'CCTV'],
      };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: ['First Aid'], // 1/3 = 33.33%
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);

      expect(Number.isInteger(result.score)).toBe(true);
    });

    it('should include breakdown in result', async () => {
      const site = { requiredGuardType: 'Static', requiredCertifications: [] };
      const guard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
        certifications: [],
      };

      const result = await scoreGuard(guard, site, mockSiteCoords);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('distance');
      expect(result.breakdown).toHaveProperty('guardType');
      expect(result.breakdown).toHaveProperty('availability');
      expect(result.breakdown).toHaveProperty('licence');
      expect(result.breakdown).toHaveProperty('certifications');
    });
  });

  // ------------------------------------------
  // Guard Ranking Scenarios
  // ------------------------------------------

  describe('Guard Ranking Scenarios', () => {
    const mockSiteCoords = { latitude: 51.5074, longitude: -0.1278 };

    beforeEach(() => {
      axios.get.mockResolvedValue({
        data: { result: { latitude: 51.5074, longitude: -0.1278 } },
      });
    });

    it('should rank available guard higher than unavailable', async () => {
      const site = { requiredGuardType: 'Static', requiredCertifications: [] };

      const availableGuard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
      };

      const unavailableGuard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: false,
        siaLicence: { status: 'valid' },
      };

      const availableResult = await scoreGuard(availableGuard, site, mockSiteCoords);
      const unavailableResult = await scoreGuard(unavailableGuard, site, mockSiteCoords);

      expect(availableResult.score).toBeGreaterThan(unavailableResult.score);
    });

    it('should rank guard with valid licence higher than expired', async () => {
      const site = { requiredGuardType: 'Static', requiredCertifications: [] };

      const validLicenceGuard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'valid' },
      };

      const expiredLicenceGuard = {
        postCode: 'EC1A 1BB',
        guardType: 'Static',
        availability: true,
        siaLicence: { status: 'expired' },
      };

      const validResult = await scoreGuard(validLicenceGuard, site, mockSiteCoords);
      const expiredResult = await scoreGuard(expiredLicenceGuard, site, mockSiteCoords);

      expect(validResult.score).toBeGreaterThan(expiredResult.score);
    });
  });
});