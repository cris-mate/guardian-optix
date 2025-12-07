const axios = require('axios');

const WEIGHTS = {
  distance: 0.30,
  guardType: 0.25,
  availability: 0.20,
  licence: 0.15,
  certifications: 0.10,
};

const getPostcodeCoords = async (postcode) => {
  const res = await axios.get(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
  );
  return res.data.result;
};

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

const scoreGuard = async (guard, site, siteCoords, shiftDate) => {
  let score = 0;
  const breakdown = {};

  // Distance score (max 50km = 0, 0km = 100)
  try {
    const guardCoords = await getPostcodeCoords(guard.postCode);
    const dist = haversineDistance(
      siteCoords.latitude, siteCoords.longitude,
      guardCoords.latitude, guardCoords.longitude
    );
    // 1. DISTANCE (30% weight)
    // Uses postcodes.io API to get lat/long, then Haversine formula
    // Score: 100 at 0km, decreases by 2 points per km, min 0
    breakdown.distance = Math.max(0, 100 - (dist * 2));
  } catch {
    breakdown.distance = 50; // Unknown = neutral
  }

  // 2. GUARD TYPE (25% weight)
  // Exact match with site requirement = 100
  // No requirement specified = 50
  // Mismatch = 20
  breakdown.guardType =
    site.requiredGuardType === guard.guardType ? 100 :
      !site.requiredGuardType ? 50 : 20;

  // 3. LICENCE STATUS (15% weight)
  const licenceMap = { valid: 100, 'expiring-soon': 50, expired: 0, pending: 25 };
  breakdown.licence = licenceMap[guard.siaLicence?.status] ?? 0;

  // 4. AVAILABILITY (20% weight)
  breakdown.availability = guard.availability ? 100 : 0;

  // 5. CERTIFICATIONS (10% weight)
  // Percentage of site's required certs that guard holds
  const required = site.requiredCertifications || [];
  const held = guard.certifications || [];
  const matchCount = required.filter(c => held.includes(c)).length;
  breakdown.certifications = required.length === 0 ? 100 :
    (matchCount / required.length) * 100;

  // FINAL SCORE (weighted average)
  score = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + breakdown[key] * weight, 0
  );

  return { score: Math.round(score), breakdown, distanceKm: breakdown.distance };
};

module.exports = { scoreGuard: scoreGuard, getPostcodeCoords };