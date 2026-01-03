/**
 * Geofence Configuration
 *
 * Centralised settings for geofence enforcement with simulation support.
 */

const geofenceConfig = {
  // Core settings
  defaultRadius: 150, // metres
  maxRadius: 1000,
  minRadius: 25,

  // Enforcement mode
  enforcement: {
    // In production: enforce, in dev: allow simulation
    mode: process.env.NODE_ENV === 'production' ? 'strict' : 'permissive',
    // strict = block clock-in if outside
    // permissive = allow with warning flag
  },

  // Simulation mode (for testing without GPS)
  simulation: {
    enabled: process.env.NODE_ENV !== 'production',
    allowedRoles: ['Admin', 'Manager'], // Who can use simulation
  },

  // Predefined test scenarios (distances from site center)
  testScenarios: {
    inside_center: { offset: { lat: 0, lng: 0 }, label: 'At Site Center' },
    inside_50m: { offset: { lat: 0.00045, lng: 0 }, label: '~50m North' },
    edge_boundary: { offset: { lat: 0.00135, lng: 0 }, label: 'At Boundary Edge (~150m)' },
    outside_200m: { offset: { lat: 0.0018, lng: 0 }, label: '~200m Outside' },
    outside_500m: { offset: { lat: 0.0045, lng: 0 }, label: '~500m Outside' },
  },
};

module.exports = geofenceConfig;