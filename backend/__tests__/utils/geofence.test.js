/**
 * Geofence Utility Unit Tests
 *
 * Tests GPS distance calculation using Haversine formula.
 * Demonstrates: mathematical precision testing, boundary conditions.
 *
 * Key Formula: Haversine formula calculates great-circle distance
 * between two points on a sphere given their lat/long coordinates.
 */

// ============================================
// Haversine Implementation (extracted for testing)
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

/**
 * Check if a location is within a geofence radius
 * @param {Object} location - Guard's current location {latitude, longitude}
 * @param {Object} geofence - Site geofence {center: {latitude, longitude}, radius}
 * @returns {string} 'inside' | 'outside' | 'unknown'
 */
const checkGeofenceStatus = (location, geofence) => {
  if (!location || !geofence || !geofence.center) {
    return 'unknown';
  }

  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    geofence.center.latitude,
    geofence.center.longitude
  );

  const radius = geofence.radius || 150; // Default 150m
  return distance <= radius ? 'inside' : 'outside';
};

// ============================================
// Test Suite
// ============================================

describe('Geofence Utilities', () => {
  // ------------------------------------------
  // Haversine Distance Calculation
  // ------------------------------------------

  describe('calculateDistance (Haversine Formula)', () => {
    // Known UK locations for testing
    const locations = {
      // London landmarks
      bigBen: { lat: 51.5007, lon: -0.1246 },
      towerBridge: { lat: 51.5055, lon: -0.0754 },
      buckinghamPalace: { lat: 51.5014, lon: -0.1419 },

      // Manchester
      manchesterCityCenter: { lat: 53.4808, lon: -2.2426 },

      // Same point
      testPoint: { lat: 51.5074, lon: -0.1278 },
    };

    it('should return 0 for identical coordinates', () => {
      const distance = calculateDistance(
        locations.testPoint.lat,
        locations.testPoint.lon,
        locations.testPoint.lat,
        locations.testPoint.lon
      );

      expect(distance).toBe(0);
    });

    it('should calculate correct distance between Big Ben and Tower Bridge (~3.5km)', () => {
      const distance = calculateDistance(
        locations.bigBen.lat,
        locations.bigBen.lon,
        locations.towerBridge.lat,
        locations.towerBridge.lon
      );

      // Approximately 3.5km (3500m) - allow 10% tolerance
      expect(distance).toBeGreaterThan(3000);
      expect(distance).toBeLessThan(4000);
    });

    it('should calculate correct distance between Big Ben and Buckingham Palace (~800m)', () => {
      const distance = calculateDistance(
        locations.bigBen.lat,
        locations.bigBen.lon,
        locations.buckinghamPalace.lat,
        locations.buckinghamPalace.lon
      );

      // Approximately 800m - allow reasonable tolerance
      expect(distance).toBeGreaterThan(600);
      expect(distance).toBeLessThan(1200);
    });

    it('should calculate long distance: London to Manchester (~260km)', () => {
      const distance = calculateDistance(
        locations.bigBen.lat,
        locations.bigBen.lon,
        locations.manchesterCityCenter.lat,
        locations.manchesterCityCenter.lon
      );

      // Approximately 260km (260000m)
      expect(distance).toBeGreaterThan(250000);
      expect(distance).toBeLessThan(280000);
    });

    it('should handle negative longitudes correctly', () => {
      // Both UK locations have negative longitude
      const distance = calculateDistance(51.5, -0.1, 51.5, -0.2);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10000); // Should be ~7km
    });

    it('should be symmetric (A to B = B to A)', () => {
      const distanceAB = calculateDistance(
        locations.bigBen.lat,
        locations.bigBen.lon,
        locations.towerBridge.lat,
        locations.towerBridge.lon
      );

      const distanceBA = calculateDistance(
        locations.towerBridge.lat,
        locations.towerBridge.lon,
        locations.bigBen.lat,
        locations.bigBen.lon
      );

      expect(distanceAB).toBeCloseTo(distanceBA, 5);
    });

    it('should handle equator crossing', () => {
      const distance = calculateDistance(1.0, 0.0, -1.0, 0.0);
      // ~222km (2 degrees latitude at equator)
      expect(distance).toBeGreaterThan(200000);
      expect(distance).toBeLessThan(250000);
    });

    it('should handle prime meridian crossing', () => {
      const distance = calculateDistance(51.5, -0.5, 51.5, 0.5);
      expect(distance).toBeGreaterThan(0);
    });
  });

  // ------------------------------------------
  // Geofence Status Check
  // ------------------------------------------

  describe('checkGeofenceStatus', () => {
    const testSiteGeofence = {
      center: {
        latitude: 51.5074, // London
        longitude: -0.1278,
      },
      radius: 150, // 150 metres
    };

    it('should return "inside" when guard is at exact center', () => {
      const guardLocation = {
        latitude: 51.5074,
        longitude: -0.1278,
      };

      const status = checkGeofenceStatus(guardLocation, testSiteGeofence);
      expect(status).toBe('inside');
    });

    it('should return "inside" when guard is within radius', () => {
      // ~50m from center
      const guardLocation = {
        latitude: 51.5075,
        longitude: -0.1275,
      };

      const status = checkGeofenceStatus(guardLocation, testSiteGeofence);
      expect(status).toBe('inside');
    });

    it('should return "outside" when guard is beyond radius', () => {
      // ~500m from center
      const guardLocation = {
        latitude: 51.5120,
        longitude: -0.1278,
      };

      const status = checkGeofenceStatus(guardLocation, testSiteGeofence);
      expect(status).toBe('outside');
    });

    it('should return "inside" at exact boundary (edge case)', () => {
      // Calculate a point exactly at 150m
      // 150m north is approximately 0.00135 degrees latitude
      const guardLocation = {
        latitude: 51.5074 + 0.00135,
        longitude: -0.1278,
      };

      const status = checkGeofenceStatus(guardLocation, testSiteGeofence);
      // At boundary, should be inside (<=)
      expect(status).toBe('inside');
    });

    it('should return "outside" just beyond boundary', () => {
      // Just beyond 150m
      const guardLocation = {
        latitude: 51.5074 + 0.0015, // ~167m
        longitude: -0.1278,
      };

      const status = checkGeofenceStatus(guardLocation, testSiteGeofence);
      expect(status).toBe('outside');
    });

    it('should use default radius of 150m when not specified', () => {
      const geofenceNoRadius = {
        center: { latitude: 51.5074, longitude: -0.1278 },
      };

      const insideLocation = { latitude: 51.5074, longitude: -0.1278 };
      expect(checkGeofenceStatus(insideLocation, geofenceNoRadius)).toBe('inside');
    });

    it('should handle different radius values', () => {
      const smallGeofence = {
        center: { latitude: 51.5074, longitude: -0.1278 },
        radius: 50, // 50m
      };

      const largeGeofence = {
        center: { latitude: 51.5074, longitude: -0.1278 },
        radius: 500, // 500m
      };

      const guardLocation = { latitude: 51.5080, longitude: -0.1278 }; // ~66m away

      expect(checkGeofenceStatus(guardLocation, smallGeofence)).toBe('outside');
      expect(checkGeofenceStatus(guardLocation, largeGeofence)).toBe('inside');
    });
  });

  // ------------------------------------------
  // Invalid Input Handling
  // ------------------------------------------

  describe('Invalid Input Handling', () => {
    const validGeofence = {
      center: { latitude: 51.5074, longitude: -0.1278 },
      radius: 150,
    };

    it('should return "unknown" when location is null', () => {
      expect(checkGeofenceStatus(null, validGeofence)).toBe('unknown');
    });

    it('should return "unknown" when location is undefined', () => {
      expect(checkGeofenceStatus(undefined, validGeofence)).toBe('unknown');
    });

    it('should return "unknown" when geofence is null', () => {
      const location = { latitude: 51.5074, longitude: -0.1278 };
      expect(checkGeofenceStatus(location, null)).toBe('unknown');
    });

    it('should return "unknown" when geofence has no center', () => {
      const location = { latitude: 51.5074, longitude: -0.1278 };
      const badGeofence = { radius: 150 };
      expect(checkGeofenceStatus(location, badGeofence)).toBe('unknown');
    });

    it('should return "unknown" when geofence center is null', () => {
      const location = { latitude: 51.5074, longitude: -0.1278 };
      const badGeofence = { center: null, radius: 150 };
      expect(checkGeofenceStatus(location, badGeofence)).toBe('unknown');
    });
  });

  // ------------------------------------------
  // Real-World UK Security Site Scenarios
  // ------------------------------------------

  describe('UK Security Site Scenarios', () => {
    // Typical UK shopping centre geofence
    const shoppingCentreSite = {
      center: { latitude: 51.5069, longitude: -0.0955 }, // Westfield Stratford
      radius: 200,
    };

    it('should detect guard at main entrance (inside)', () => {
      const guardAtEntrance = { latitude: 51.5070, longitude: -0.0950 };
      expect(checkGeofenceStatus(guardAtEntrance, shoppingCentreSite)).toBe('inside');
    });

    it('should detect guard in car park (outside typical radius)', () => {
      const guardInCarPark = { latitude: 51.5100, longitude: -0.0955 }; // ~340m away
      expect(checkGeofenceStatus(guardInCarPark, shoppingCentreSite)).toBe('outside');
    });

    // Office building with tighter geofence
    const officeBuildingSite = {
      center: { latitude: 51.5137, longitude: -0.0897 }, // Canary Wharf area
      radius: 100,
    };

    it('should enforce tighter radius for office building', () => {
      const guardInLobby = { latitude: 51.5138, longitude: -0.0896 };
      const guardAcrossStreet = { latitude: 51.5147, longitude: -0.0897 }; // ~110m

      expect(checkGeofenceStatus(guardInLobby, officeBuildingSite)).toBe('inside');
      expect(checkGeofenceStatus(guardAcrossStreet, officeBuildingSite)).toBe('outside');
    });
  });

  // ------------------------------------------
  // Performance Considerations
  // ------------------------------------------

  describe('Performance', () => {
    it('should calculate 1000 distances quickly', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        calculateDistance(
          51.5074 + Math.random() * 0.01,
          -0.1278 + Math.random() * 0.01,
          51.5074,
          -0.1278
        );
      }

      const elapsed = Date.now() - start;
      // Should complete in under 100ms
      expect(elapsed).toBeLessThan(100);
    });
  });
});