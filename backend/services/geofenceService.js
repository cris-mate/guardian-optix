/**
 * Geofence Service
 *
 * Handles all geofence verification logic with simulation support.
 * Demonstrates: Service layer pattern, Haversine formula, feature flags.
 */

const Site = require('../models/Site');
const geofenceConfig = require('../config/geofenceConfig');

// ============================================
// Distance Calculation (Haversine Formula)
// ============================================

/**
 * Calculate distance between two GPS coordinates
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in metres
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in metres
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// ============================================
// Simulation Coordinate Generator
// ============================================

/**
 * Generate simulated coordinates based on test scenario
 * @param {Object} siteGeofence - Site's geofence center
 * @param {string} scenario - Test scenario key
 * @returns {Object} Simulated coordinates
 */
const generateSimulatedCoords = (siteGeofence, scenario) => {
  const testScenario = geofenceConfig.testScenarios[scenario];

  if (!testScenario || !siteGeofence?.center) {
    return null;
  }

  return {
    latitude: siteGeofence.center.latitude + testScenario.offset.lat,
    longitude: siteGeofence.center.longitude + testScenario.offset.lng,
    isSimulated: true,
    scenario: scenario,
    scenarioLabel: testScenario.label,
  };
};

// ============================================
// Core Verification
// ============================================

/**
 * Verify if location is within site geofence
 * @param {Object} location - { latitude, longitude }
 * @param {string} siteId - Site ID to check against
 * @param {Object} options - { simulationScenario, userRole }
 * @returns {Object} Verification result
 */
const verifyGeofence = async (location, siteId, options = {}) => {
  const { simulationScenario, userRole } = options;

  // Default response for missing data
  const unknownResult = {
    status: 'unknown',
    distance: null,
    isSimulated: false,
    message: 'Unable to verify location',
  };

  // If no siteId provided, return unknown
  if (!siteId) {
    return { ...unknownResult, message: 'No site specified' };
  }

  try {
    // Fetch site with geofence data
    const site = await Site.findById(siteId).select('geofence name');

    if (!site) {
      return { ...unknownResult, message: 'Site not found' };
    }

    // Check if geofence is configured and enabled
    if (!site.geofence?.isEnabled) {
      return {
        status: 'inside', // No geofence = always valid
        distance: 0,
        isSimulated: false,
        message: 'Geofence not enabled for this site',
        geofenceDisabled: true,
      };
    }

    // Handle simulation mode
    let checkLocation = location;
    let isSimulated = false;

    if (simulationScenario && geofenceConfig.simulation.enabled) {
      // Verify user has permission to simulate
      if (!geofenceConfig.simulation.allowedRoles.includes(userRole)) {
        return { ...unknownResult, message: 'Simulation not permitted for this role' };
      }

      const simCoords = generateSimulatedCoords(site.geofence, simulationScenario);
      if (simCoords) {
        checkLocation = simCoords;
        isSimulated = true;
      }
    }

    // Validate location data
    if (!checkLocation?.latitude || !checkLocation?.longitude) {
      return { ...unknownResult, message: 'Invalid location coordinates' };
    }

    // Calculate distance from site center
    const distance = calculateDistance(
      checkLocation.latitude,
      checkLocation.longitude,
      site.geofence.center.latitude,
      site.geofence.center.longitude
    );

    const radius = site.geofence.radius || geofenceConfig.defaultRadius;
    const isInside = distance <= radius;

    return {
      status: isInside ? 'inside' : 'outside',
      distance: Math.round(distance),
      radius,
      isSimulated,
      simulationScenario: isSimulated ? simulationScenario : null,
      coordinates: {
        checked: checkLocation,
        siteCenter: site.geofence.center,
      },
      message: isInside
        ? 'Within site boundary'
        : `${Math.round(distance - radius)}m outside boundary`,
    };
  } catch (error) {
    console.error('Geofence verification error:', error);
    return { ...unknownResult, message: error.message };
  }
};

// ============================================
// Configuration Helpers
// ============================================

/**
 * Get available test scenarios for frontend
 */
const getTestScenarios = () => {
  if (!geofenceConfig.simulation.enabled) {
    return [];
  }

  return Object.entries(geofenceConfig.testScenarios).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));
};

/**
 * Check if simulation is allowed for user
 */
const canUserSimulate = (userRole) => {
  return (
    geofenceConfig.simulation.enabled &&
    geofenceConfig.simulation.allowedRoles.includes(userRole)
  );
};

module.exports = {
  calculateDistance,
  verifyGeofence,
  generateSimulatedCoords,
  getTestScenarios,
  canUserSimulate,
  geofenceConfig,
};