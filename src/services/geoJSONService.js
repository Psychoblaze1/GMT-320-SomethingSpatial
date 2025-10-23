// GeoJSON Service - Parse and validate GeoJSON and KML files for deck.gl
import * as turf from '@turf/turf';
import * as toGeoJSON from '@tmcw/togeojson';

/**
 * Parse a GeoJSON or KML file
 * @param {File} file - The .geojson, .json, or .kml file to parse
 * @returns {Promise<Object>} - Parsed GeoJSON data with layers
 */
export async function parseGeoFile(file) {
  try {
    const text = await file.text();
    let geoJSON;

    // Determine file type and parse accordingly
    if (file.name.toLowerCase().endsWith('.kml')) {
      // Parse KML
      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(text, 'text/xml');
      geoJSON = toGeoJSON.kml(kmlDoc);
    } else {
      // Parse GeoJSON
      geoJSON = JSON.parse(text);
    }

    // Validate GeoJSON structure
    if (!geoJSON || typeof geoJSON !== 'object') {
      throw new Error('Invalid GeoJSON format');
    }

    // Handle single features vs feature collections
    if (geoJSON.type === 'Feature') {
      geoJSON = {
        type: 'FeatureCollection',
        features: [geoJSON]
      };
    } else if (geoJSON.type !== 'FeatureCollection') {
      throw new Error('GeoJSON must be a Feature or FeatureCollection');
    }

    // Extract layers (for multi-layer files, we'll group by properties or treat as single layer)
    const layers = extractLayers(geoJSON, file.name);

    // Get overall bounding box
    const overallBounds = calculateBounds(geoJSON);

    return {
      name: file.name.replace(/\.(geojson|json|kml)$/i, ''),
      fileName: file.name,
      fileSize: file.size,
      layerCount: layers.length,
      bounds: overallBounds,
      layers: layers,
      parsedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing geo file:', error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

/**
 * Extract layers from GeoJSON (group by geometry type or properties)
 */
function extractLayers(geoJSON, fileName) {
  if (!geoJSON.features || geoJSON.features.length === 0) {
    return [];
  }

  // Group features by geometry type
  const geometryTypes = {};

  geoJSON.features.forEach(feature => {
    const geomType = feature.geometry?.type || 'Unknown';
    if (!geometryTypes[geomType]) {
      geometryTypes[geomType] = [];
    }
    geometryTypes[geomType].push(feature);
  });

  // Create a layer for each geometry type
  const layers = Object.entries(geometryTypes).map(([geomType, features]) => {
    const layerGeoJSON = {
      type: 'FeatureCollection',
      features: features
    };

    const bounds = calculateBounds(layerGeoJSON);
    const layerType = geometryTypeToLayerType(geomType);

    return {
      name: `${fileName}_${geomType}`,
      type: layerType,
      featureCount: features.length,
      bounds: bounds,
      geometryType: geomType,
      geoJSON: layerGeoJSON,
      stats: calculateLayerStats(layerGeoJSON)
    };
  });

  return layers;
}

/**
 * Convert GeoJSON geometry type to deck.gl layer type
 */
function geometryTypeToLayerType(geometryType) {
  const typeMap = {
    'Point': 'point',
    'MultiPoint': 'point',
    'LineString': 'line',
    'MultiLineString': 'line',
    'Polygon': 'polygon',
    'MultiPolygon': 'polygon',
    'GeometryCollection': 'mixed'
  };

  return typeMap[geometryType] || 'point';
}

/**
 * Calculate bounding box for GeoJSON
 */
function calculateBounds(geoJSON) {
  if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
    return null;
  }

  try {
    const bbox = turf.bbox(geoJSON);
    const center = turf.center(geoJSON).geometry.coordinates;

    return {
      minLon: bbox[0],
      minLat: bbox[1],
      maxLon: bbox[2],
      maxLat: bbox[3],
      center: center
    };
  } catch (error) {
    console.warn('Could not calculate bounds:', error);
    return null;
  }
}

/**
 * Convert GeoJSON to deck.gl layer configuration
 * @param {Object} geoJSON - GeoJSON FeatureCollection
 * @param {String} layerType - Type of layer (point, line, polygon)
 * @param {String} layerName - Name for the layer
 * @returns {Object} - deck.gl layer configuration
 */
export function geoJSONToDeckLayer(geoJSON, layerType, layerName) {
  const baseConfig = {
    id: layerName,
    data: geoJSON.features,
    pickable: true,
    autoHighlight: true
  };

  switch (layerType) {
    case 'point':
      return {
        ...baseConfig,
        layerType: 'ScatterplotLayer',
        getPosition: d => {
          const coords = d.geometry.coordinates;
          return coords.length === 2 ? coords : [coords[0], coords[1]];
        },
        getRadius: 100,
        getFillColor: [0, 128, 255],
        getLineColor: [255, 255, 255],
        stroked: true,
        filled: true,
        radiusMinPixels: 5,
        radiusMaxPixels: 50,
        lineWidthMinPixels: 1
      };

    case 'line':
      return {
        ...baseConfig,
        layerType: 'PathLayer',
        getPath: d => {
          const coords = d.geometry.coordinates;
          // Handle both LineString and MultiLineString
          return coords[0] instanceof Array && coords[0][0] instanceof Array
            ? coords[0]
            : coords;
        },
        getColor: [255, 128, 0],
        getWidth: 5,
        widthMinPixels: 2,
        widthMaxPixels: 10
      };

    case 'polygon':
      return {
        ...baseConfig,
        layerType: 'PolygonLayer',
        getPolygon: d => {
          const coords = d.geometry.coordinates;
          // Handle both Polygon and MultiPolygon
          return coords[0][0] instanceof Array && coords[0][0][0] instanceof Array
            ? coords[0][0]
            : coords[0];
        },
        getFillColor: [0, 200, 100, 100],
        getLineColor: [0, 150, 75],
        getLineWidth: 2,
        stroked: true,
        filled: true,
        wireframe: false,
        lineWidthMinPixels: 1
      };

    default:
      return baseConfig;
  }
}

/**
 * Validate GeoJSON/KML file
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export function validateGeoFile(file) {
  const errors = [];
  const warnings = [];

  // Check file extension
  const validExtensions = ['.geojson', '.json', '.kml'];
  const hasValidExtension = validExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    errors.push('File must have .geojson, .json, or .kml extension');
  }

  // Check file size (max 10MB for client-side parsing)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

  // Warn if file is very small (might be empty or corrupted)
  if (file.size < 100) {
    warnings.push('File is very small and might be empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate statistics for a GeoJSON layer
 * @param {Object} geoJSON - GeoJSON FeatureCollection
 * @returns {Object} - Layer statistics
 */
export function calculateLayerStats(geoJSON) {
  if (!geoJSON || !geoJSON.features) {
    return null;
  }

  const features = geoJSON.features;
  const geometryTypes = {};
  const properties = {};

  features.forEach(feature => {
    // Count geometry types
    const geomType = feature.geometry?.type || 'Unknown';
    geometryTypes[geomType] = (geometryTypes[geomType] || 0) + 1;

    // Collect property keys
    if (feature.properties) {
      Object.keys(feature.properties).forEach(key => {
        if (!properties[key]) {
          properties[key] = { count: 0, types: new Set() };
        }
        properties[key].count++;
        properties[key].types.add(typeof feature.properties[key]);
      });
    }
  });

  // Calculate bounds using Turf
  const bounds = calculateBounds(geoJSON);

  return {
    featureCount: features.length,
    geometryTypes,
    propertyKeys: Object.keys(properties).map(key => ({
      name: key,
      count: properties[key].count,
      types: Array.from(properties[key].types)
    })),
    bounds
  };
}

/**
 * Extract attribute data from GeoJSON for table display
 * @param {Object} geoJSON - GeoJSON FeatureCollection
 * @returns {Array} - Array of feature attributes
 */
export function extractAttributes(geoJSON) {
  if (!geoJSON || !geoJSON.features) {
    return [];
  }

  return geoJSON.features.map((feature, index) => ({
    id: feature.id || index,
    geometryType: feature.geometry?.type || 'Unknown',
    ...feature.properties
  }));
}

/**
 * Validate GeoJSON structure
 * @param {Object} json - Parsed JSON object
 * @returns {Boolean} - Whether it's valid GeoJSON
 */
export function isValidGeoJSON(json) {
  if (!json || typeof json !== 'object') {
    return false;
  }

  // Check if it's a Feature or FeatureCollection
  if (json.type === 'Feature') {
    return json.geometry && json.properties !== undefined;
  }

  if (json.type === 'FeatureCollection') {
    return Array.isArray(json.features);
  }

  // Also accept raw geometries
  const validGeometryTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'];
  if (validGeometryTypes.includes(json.type)) {
    return json.coordinates !== undefined;
  }

  return false;
}

// Export all functions
const geoJSONService = {
  parseGeoFile,
  validateGeoFile,
  geoJSONToDeckLayer,
  calculateLayerStats,
  extractAttributes,
  isValidGeoJSON
};

export default geoJSONService;
