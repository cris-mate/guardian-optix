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
    breakdown.distance = Math.max(0, 100 - (dist * 2));
  } catch {
    breakdown.distance = 50; // Unknown = neutral
  }

  // Guard type match
  breakdown.guardType =
    site.requiredGuardType === guard.guardType ? 100 :
      !site.requiredGuardType ? 80 : 30;

  // Licence status
  const licenceMap = { valid: 100, 'expiring-soon': 50, expired: 0, pending: 25 };
  breakdown.licence = licenceMap[guard.siaLicence?.status] ?? 0;

  // Availability (simplified)
  breakdown.availability = guard.availability ? 100 : 0;

  // Certifications
  const required = site.requiredCertifications || [];
  const held = guard.certifications || [];
  breakdown.certifications = required.length === 0 ? 100 :
    (required.filter(c => held.includes(c)).length / required.length) * 100;

  // Weighted total
  score = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + breakdown[key] * weight, 0
  );

  return { score: Math.round(score), breakdown, distanceKm: breakdown.distance };
};

module.exports = { scoreGuard: scoreGuard, getPostcodeCoords };