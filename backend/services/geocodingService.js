/**
 * Geocoding Service
 *
 * Provides GPS coordinate to address conversion (reverse geocoding)
 * and address to coordinate conversion (forward geocoding).
 *
 * Uses OpenStreetMap Nominatim API (free, no API key required).
 * Rate limited to 1 request per second per their usage policy.
 */

const https = require('https');

// ============================================
// Constants
// ============================================

const NOMINATIM_BASE_URL = 'nominatim.openstreetmap.org';
const USER_AGENT = 'GuardianOptix/1.0 (security-workforce-management)';

// Simple in-memory cache to reduce API calls
const geocodeCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds between requests

// ============================================
// Helper Functions
// ============================================

/**
 * Wait for rate limit
 */
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
};

/**
 * Make HTTPS request to Nominatim
 */
const makeRequest = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: NOMINATIM_BASE_URL,
      path,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(new Error('Failed to parse geocoding response'));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Geocoding request timeout'));
    });

    req.end();
  });
};

/**
 * Generate cache key for coordinates
 */
const getCoordsCacheKey = (lat, lng) => {
  // Round to 5 decimal places (~1m precision) for cache efficiency
  const roundedLat = Math.round(lat * 100000) / 100000;
  const roundedLng = Math.round(lng * 100000) / 100000;
  return `coords:${roundedLat},${roundedLng}`;
};

/**
 * Generate cache key for address
 */
const getAddressCacheKey = (address) => {
  return `addr:${address.toLowerCase().trim()}`;
};

/**
 * Check cache and return if valid
 */
const checkCache = (key) => {
  const cached = geocodeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

/**
 * Store in cache
 */
const storeCache = (key, data) => {
  geocodeCache.set(key, {
    data,
    timestamp: Date.now(),
  });

  // Clean old entries if cache gets too large
  if (geocodeCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of geocodeCache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        geocodeCache.delete(k);
      }
    }
  }
};

// ============================================
// Main Functions
// ============================================

/**
 * Reverse geocode: Convert coordinates to address
 * @param {number} latitude - GPS latitude
 * @param {number} longitude - GPS longitude
 * @returns {Object} Address information
 */
const reverseGeocode = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required');
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude');
  }

  // Check cache
  const cacheKey = getCoordsCacheKey(latitude, longitude);
  const cached = checkCache(cacheKey);
  if (cached) {
    return cached;
  }

  // Wait for rate limit
  await waitForRateLimit();

  // Make request
  const path = `/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`;

  try {
    const response = await makeRequest(path);

    if (response.error) {
      throw new Error(response.error);
    }

    const result = {
      displayName: response.display_name || null,
      address: {
        houseNumber: response.address?.house_number || null,
        road: response.address?.road || null,
        neighbourhood: response.address?.neighbourhood || null,
        suburb: response.address?.suburb || null,
        city: response.address?.city || response.address?.town || response.address?.village || null,
        county: response.address?.county || null,
        state: response.address?.state || null,
        postCode: response.address?.postcode || null,
        country: response.address?.country || null,
        countryCode: response.address?.country_code?.toUpperCase() || null,
      },
      formatted: formatAddress(response.address),
      shortAddress: formatShortAddress(response.address),
      coordinates: {
        latitude: parseFloat(response.lat) || latitude,
        longitude: parseFloat(response.lon) || longitude,
      },
      boundingBox: response.boundingbox || null,
      placeId: response.place_id || null,
      osmType: response.osm_type || null,
      osmId: response.osm_id || null,
    };

    // Cache result
    storeCache(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);

    // Return fallback with coordinates only
    return {
      displayName: null,
      address: {},
      formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      shortAddress: 'Unknown Location',
      coordinates: { latitude, longitude },
      error: error.message,
    };
  }
};

/**
 * Forward geocode: Convert address to coordinates
 * @param {string} address - Address string to geocode
 * @returns {Object} Location information with coordinates
 */
const forwardGeocode = async (address) => {
  if (!address || typeof address !== 'string') {
    throw new Error('Address string is required');
  }

  // Check cache
  const cacheKey = getAddressCacheKey(address);
  const cached = checkCache(cacheKey);
  if (cached) {
    return cached;
  }

  // Wait for rate limit
  await waitForRateLimit();

  // Make request
  const encodedAddress = encodeURIComponent(address);
  const path = `/search?format=json&q=${encodedAddress}&addressdetails=1&limit=1`;

  try {
    const response = await makeRequest(path);

    if (!response || response.length === 0) {
      throw new Error('Address not found');
    }

    const location = response[0];

    const result = {
      displayName: location.display_name || null,
      coordinates: {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
      },
      address: {
        road: location.address?.road || null,
        city: location.address?.city || location.address?.town || null,
        postCode: location.address?.postcode || null,
        country: location.address?.country || null,
      },
      boundingBox: location.boundingbox || null,
      placeId: location.place_id || null,
      importance: location.importance || null,
    };

    // Cache result
    storeCache(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Forward geocoding error:', error.message);
    throw error;
  }
};

/**
 * Format full address from components
 */
const formatAddress = (address) => {
  if (!address) return null;

  const parts = [];

  if (address.house_number && address.road) {
    parts.push(`${address.house_number} ${address.road}`);
  } else if (address.road) {
    parts.push(address.road);
  }

  if (address.suburb) parts.push(address.suburb);
  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }
  if (address.postcode) parts.push(address.postcode);

  return parts.length > 0 ? parts.join(', ') : null;
};

/**
 * Format short address (street + city)
 */
const formatShortAddress = (address) => {
  if (!address) return 'Unknown Location';

  const parts = [];

  if (address.road) {
    if (address.house_number) {
      parts.push(`${address.house_number} ${address.road}`);
    } else {
      parts.push(address.road);
    }
  }

  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }

  return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
};

/**
 * Batch reverse geocode multiple coordinates
 * @param {Array} coordinates - Array of { latitude, longitude } objects
 * @returns {Array} Array of geocoded results
 */
const batchReverseGeocode = async (coordinates) => {
  if (!Array.isArray(coordinates)) {
    throw new Error('Coordinates must be an array');
  }

  const results = [];

  for (const coord of coordinates) {
    try {
      const result = await reverseGeocode(coord.latitude, coord.longitude);
      results.push({
        input: coord,
        result,
        success: true,
      });
    } catch (error) {
      results.push({
        input: coord,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
};

/**
 * Clear geocoding cache
 */
const clearCache = () => {
  geocodeCache.clear();
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return {
    size: geocodeCache.size,
    maxSize: 1000,
  };
};

// ============================================
// Exports
// ============================================

module.exports = {
  reverseGeocode,
  forwardGeocode,
  batchReverseGeocode,
  clearCache,
  getCacheStats,
};