/**
 * Guard Matching Service
 *
 * Intelligent guard-to-shift matching using weighted scoring algorithm.
 * Considers: proximity, guard type, licence status, availability, certifications.
 *
 */

const axios = require('axios');

const WEIGHTS = {
  distance: 0.33,
  guardType: 0.26,
  availability: 0.21,
  licence: 0.13,
  certifications: 0.07,
};

/**
 * Get coordinates from UK postcode via postcodes.io API
 * @param {string} postcode - UK postcode
 */
const getPostcodeCoords = async (postcode) => {
  if (!postcode) return null;

  try {
    const res = await axios.get(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`
    );
    return res.data.result;
  } catch (error) {
    console.warn(`Postcode lookup failed for: ${postcode}`, error.message);
    return null;
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @returns {number} Distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
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
 * @param {Object} guard - Guard document
 * @param {Object} site - Site document
 * @param {Object} siteCoords - Pre-fetched site coordinates
 * @returns {Promise<{score: number, breakdown: Object, distanceKm: number|null}>}
 */
const scoreGuard = async (guard, site, siteCoords) => {
  const breakdown = {};
  let actualDistanceKm = null;

  // DISTANCE (33% weight)
  // Score: 100 at 0km, decreases by 2 points per km, min 0 at 50km+
  if (siteCoords && guard.postCode) {
    try {
      const guardCoords = await getPostcodeCoords(guard.postCode);
      if (guardCoords) {
        actualDistanceKm = haversineDistance(
          siteCoords.latitude,
          siteCoords.longitude,
          guardCoords.latitude,
          guardCoords.longitude
        );
        breakdown.distance = Math.max(0, 100 - (actualDistanceKm * 2));
      } else {
        breakdown.distance = 50; // Unknown = neutral
      }
    } catch {
      breakdown.distance = 50;
    }
  } else {
    breakdown.distance = 50;
  }

  // GUARD TYPE (26% weight)
  // Exact match = 100, no requirement = 50, mismatch = 20
  const requiredType = site.requiredGuardType || site.requirements?.guardType;
  if (requiredType) {
    breakdown.guardType = requiredType === guard.guardType ? 100 : 20;
  } else {
    breakdown.guardType = 50; // No specific requirement
  }

  // LICENCE STATUS (13% weight)
  const licenceMap = {
    valid: 100,
    'expiring-soon': 50,
    expired: 0,
    pending: 25,
  };
  breakdown.licence = licenceMap[guard.siaLicence?.status] ?? 0;

  // AVAILABILITY (21% weight)
  breakdown.availability = guard.availability !== false ? 100 : 0;

  // CERTIFICATIONS (7% weight)
  // Percentage of site's required certs that guard holds
  const requiredCerts = site.requiredCertifications || site.requirements?.certifications || [];
  const heldCerts = guard.certifications || [];

  if (requiredCerts.length === 0) {
    breakdown.certifications = 100; // No requirements = full score
  } else {
    const matchCount = requiredCerts.filter((c) => heldCerts.includes(c)).length;
    breakdown.certifications = (matchCount / requiredCerts.length) * 100;
  }

  // FINAL SCORE (weighted average)
  const score = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + (breakdown[key] || 0) * weight,
    0
  );

  return {
    score: Math.round(score),
    breakdown,
    distanceKm: actualDistanceKm !== null ? Math.round(actualDistanceKm * 10) / 10 : null,
  };
};

module.exports = {
  scoreGuard,
  getPostcodeCoords,
  haversineDistance,
  WEIGHTS,
};