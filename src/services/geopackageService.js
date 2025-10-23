// GeoPackage Service - Parse and convert GeoPackage files to GeoJSON
import { GeoPackageAPI } from '@ngageoint/geopackage';
import * as turf from '@turf/turf';

/**
 * Parse a GeoPackage file and extract all layers as GeoJSON
 * @param {File} file - The .gpkg file to parse
 * @returns {Promise<Object>} - Parsed GeoPackage data with layers
 */
export async function parseGeoPackage(file) {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Open the GeoPackage
    const geoPackage = await GeoPackageAPI.open(uint8Array);

    // Get all feature tables (vector layers)
    const featureTables = geoPackage.getFeatureTables();

    // Extract layers
    const layers = [];

    for (const tableName of featureTables) {
      const featureDao = geoPackage.getFeatureDao(tableName);
      const features = [];

      // Get all features from the table
      const featureResultSet = featureDao.queryForAll();

      // Convert each feature to GeoJSON
      for (const row of featureResultSet) {
        try {
          const feature = row.toGeoJSON();
          if (feature) {
            features.push(feature);
          }
        } catch (err) {
          console.warn(`Error converting feature in ${tableName}:`, err);
        }
      }

      // Get layer metadata
      const boundingBox = featureDao.getBoundingBox();
      const srsId = featureDao.getSrs().getSrsId();
      const geometryType = featureDao.getGeometryType();

      layers.push({
        name: tableName,
        type: geometryTypeToLayerType(geometryType),
        featureCount: features.length,
        bounds: boundingBox ? {
          minLon: boundingBox.minLongitude,
          maxLon: boundingBox.maxLongitude,
          minLat: boundingBox.minLatitude,
          maxLat: boundingBox.maxLatitude
        } : null,
        srsId,
        geometryType,
        geoJSON: {
          type: 'FeatureCollection',
          features: features
        }
      });
    }

    // Get overall bounding box
    const overallBounds = calculateOverallBounds(layers);

    return {
      name: file.name.replace('.gpkg', ''),
      fileName: file.name,
      fileSize: file.size,
      layerCount: layers.length,
      bounds: overallBounds,
      layers: layers,
      parsedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing GeoPackage:', error);
    throw new Error(`Failed to parse GeoPackage: ${error.message}`);
  }
}

/**
 * Convert GeoPackage geometry type to deck.gl layer type
 */
function geometryTypeToLayerType(geometryType) {
  const typeMap = {
    'POINT': 'point',
    'MULTIPOINT': 'point',
    'LINESTRING': 'line',
    'MULTILINESTRING': 'line',
    'POLYGON': 'polygon',
    'MULTIPOLYGON': 'polygon',
    'GEOMETRYCOLLECTION': 'mixed'
  };

  const upperType = geometryType?.toUpperCase() || 'POINT';
  return typeMap[upperType] || 'point';
}

/**
 * Calculate overall bounds from all layers
 */
function calculateOverallBounds(layers) {
  if (layers.length === 0) return null;

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  layers.forEach(layer => {
    if (layer.bounds) {
      minLon = Math.min(minLon, layer.bounds.minLon);
      maxLon = Math.max(maxLon, layer.bounds.maxLon);
      minLat = Math.min(minLat, layer.bounds.minLat);
      maxLat = Math.max(maxLat, layer.bounds.maxLat);
    }
  });

  if (!isFinite(minLon)) return null;

  return { minLon, maxLon, minLat, maxLat };
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
 * Validate GeoPackage file
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export function validateGeoPackageFile(file) {
  const errors = [];
  const warnings = [];

  // Check file extension
  if (!file.name.toLowerCase().endsWith('.gpkg')) {
    errors.push('File must have .gpkg extension');
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    errors.push(`File size exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

  // Warn if file is very small (might be empty or corrupted)
  if (file.size < 1024) {
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
  let bounds = null;
  try {
    const bbox = turf.bbox(geoJSON);
    bounds = {
      minLon: bbox[0],
      minLat: bbox[1],
      maxLon: bbox[2],
      maxLat: bbox[3],
      center: turf.center(geoJSON).geometry.coordinates
    };
  } catch (error) {
    console.warn('Could not calculate bounds:', error);
  }

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
 * Convert coordinates to different projection (basic Web Mercator)
 * @param {Array} coords - [longitude, latitude]
 * @returns {Array} - Projected coordinates
 */
export function projectCoordinates(coords) {
  const [lon, lat] = coords;
  const x = (lon * 20037508.34) / 180;
  const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  const yMerc = (y * 20037508.34) / 180;
  return [x, yMerc];
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

// Export all functions
const geopackageService = {
  parseGeoPackage,
  validateGeoPackageFile,
  geoJSONToDeckLayer,
  calculateLayerStats,
  projectCoordinates,
  extractAttributes
};

export default geopackageService;
