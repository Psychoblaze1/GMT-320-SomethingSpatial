/**
 * Solar GeoTIFF Service
 * Handles fetching and processing GeoTIFF data from Google Solar API
 */

import { fromUrl, fromArrayBuffer } from 'geotiff';
import { geoTiffCache } from '../utils/geoTiffCache';
import * as geokeysToProj4 from 'geotiff-geokeys-to-proj4';
import proj4 from 'proj4';

/**
 * Available GeoTIFF layer types from Solar API
 */
export const LAYER_TYPES = {
  MASK: 'mask',           // Building mask
  DSM: 'dsm',             // Digital Surface Model (height map)
  RGB: 'rgb',             // RGB imagery
  ANNUAL_FLUX: 'annualFlux',   // Annual solar flux (kWh/kW/year)
  MONTHLY_FLUX: 'monthlyFlux', // Monthly solar flux
  HOURLY_SHADE: 'hourlyShade'  // Hourly shade data
};

/**
 * Fetch GeoTIFF data from Solar API data layer URL with caching
 * @param {string} url - GeoTIFF download URL from Solar API (without API key)
 * @param {string} apiKey - Google API key to append to the URL
 * @returns {Promise<object>} GeoTIFF image data
 */
export async function fetchGeoTiff(url, apiKey) {
  try {
    // Check cache first (use URL without key for cache lookup)
    const cachedData = await geoTiffCache.getGeoTiff(url);
    if (cachedData) {
      console.log('Using cached GeoTIFF data');
      const tiff = await fromArrayBuffer(cachedData);
      const image = await tiff.getImage();
      return image;
    }

    // Append API key to the URL (required by Google Solar API)
    const urlWithKey = `${url}&key=${apiKey}`;

    // Fetch from API if not cached
    console.log('Downloading GeoTIFF data...');
    const response = await fetch(urlWithKey);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GeoTIFF fetch failed:', response.status, errorText);
      throw new Error(`Failed to fetch GeoTIFF: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // Cache the downloaded data
    await geoTiffCache.setGeoTiff(url, arrayBuffer);

    const tiff = await fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();

    return image;
  } catch (error) {
    console.error('Error fetching GeoTIFF:', error);
    throw error;
  }
}

/**
 * Extract image data and bounds from GeoTIFF
 * Reprojects bounds to WGS84 lat/lng for deck.gl compatibility
 * @param {object} geoTiffImage - GeoTIFF image object
 * @returns {Promise<object>} Image data with bounds in WGS84
 */
export async function processGeoTiff(geoTiffImage) {
  try {
    const width = geoTiffImage.getWidth();
    const height = geoTiffImage.getHeight();
    const rasters = await geoTiffImage.readRasters();

    // Get bounding box in the GeoTIFF's native projection
    const bbox = geoTiffImage.getBoundingBox();

    // Reproject the bounding box to WGS84 (lat/lng)
    const geoKeys = geoTiffImage.getGeoKeys();
    const projObj = geokeysToProj4.toProj4(geoKeys);
    const projection = proj4(projObj.proj4, 'WGS84');

    // Convert southwest corner
    const sw = projection.forward({
      x: bbox[0] * projObj.coordinatesConversionParameters.x,
      y: bbox[1] * projObj.coordinatesConversionParameters.y,
    });

    // Convert northeast corner
    const ne = projection.forward({
      x: bbox[2] * projObj.coordinatesConversionParameters.x,
      y: bbox[3] * projObj.coordinatesConversionParameters.y,
    });

    console.log('Reprojected bounds:', {
      original: bbox,
      wgs84: [sw.x, sw.y, ne.x, ne.y],
      projection: projObj.proj4
    });

    return {
      width,
      height,
      rasters,
      bbox,
      // deck.gl BitmapLayer expects bounds as [west, south, east, north] in WGS84
      bounds: [sw.x, sw.y, ne.x, ne.y]
    };
  } catch (error) {
    console.error('Error processing GeoTIFF:', error);
    throw error;
  }
}

/**
 * Convert flux data to heat map RGB image
 * @param {object} processedData - Processed GeoTIFF data
 * @param {number} minValue - Minimum flux value for scaling
 * @param {number} maxValue - Maximum flux value for scaling
 * @returns {ImageData} Canvas ImageData for rendering
 */
export function fluxToHeatMap(processedData, minValue = 0, maxValue = 1800) {
  const { width, height, rasters } = processedData;
  const fluxData = rasters[0]; // First band contains flux values

  // Create canvas to generate image data
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);

  // Heat map color scale: blue (low) -> green -> yellow -> red (high)
  const getHeatMapColor = (value, min, max) => {
    if (value === 0 || isNaN(value)) {
      return [0, 0, 0, 0]; // Transparent for no data
    }

    // Normalize value to 0-1
    const normalized = Math.min(Math.max((value - min) / (max - min), 0), 1);

    let r, g, b;

    if (normalized < 0.25) {
      // Blue to Cyan
      const t = normalized / 0.25;
      r = 0;
      g = Math.floor(255 * t);
      b = 255;
    } else if (normalized < 0.5) {
      // Cyan to Green
      const t = (normalized - 0.25) / 0.25;
      r = 0;
      g = 255;
      b = Math.floor(255 * (1 - t));
    } else if (normalized < 0.75) {
      // Green to Yellow
      const t = (normalized - 0.5) / 0.25;
      r = Math.floor(255 * t);
      g = 255;
      b = 0;
    } else {
      // Yellow to Red
      const t = (normalized - 0.75) / 0.25;
      r = 255;
      g = Math.floor(255 * (1 - t));
      b = 0;
    }

    return [r, g, b, 200]; // Semi-transparent
  };

  // Fill image data with heat map colors
  for (let i = 0; i < fluxData.length; i++) {
    const [r, g, b, a] = getHeatMapColor(fluxData[i], minValue, maxValue);
    const pixelIndex = i * 4;
    imageData.data[pixelIndex] = r;
    imageData.data[pixelIndex + 1] = g;
    imageData.data[pixelIndex + 2] = b;
    imageData.data[pixelIndex + 3] = a;
  }

  // Put image data on canvas and return as data URL
  ctx.putImageData(imageData, 0, 0);

  return {
    imageData,
    canvas,
    dataUrl: canvas.toDataURL()
  };
}

/**
 * Get solar flux layer from data layers
 * @param {object} dataLayers - Data layers from Solar API dataLayers:get endpoint
 * @param {string} apiKey - Google API key for fetching GeoTIFF files
 * @param {string} layerType - Type of layer to fetch (from LAYER_TYPES)
 * @returns {Promise<object>} Processed layer data with image and bounds
 */
export async function getSolarFluxLayer(dataLayers, apiKey, layerType = LAYER_TYPES.ANNUAL_FLUX) {
  try {
    console.log('Getting solar flux layer, type:', layerType);

    if (!dataLayers) {
      throw new Error('GeoTIFF data layers not available. Make sure to call fetchDataLayers() first.');
    }

    if (!apiKey) {
      throw new Error('API key is required to fetch GeoTIFF data');
    }

    console.log('Data layers available:', {
      hasAnnualFlux: !!dataLayers.annualFluxUrl,
      hasMonthlyFlux: !!dataLayers.monthlyFluxUrl,
      hasDSM: !!dataLayers.dsmUrl,
      hasRGB: !!dataLayers.rgbUrl,
      hasMask: !!dataLayers.maskUrl
    });

    // Find the requested layer
    let layerUrl;
    switch (layerType) {
      case LAYER_TYPES.ANNUAL_FLUX:
        layerUrl = dataLayers.annualFluxUrl;
        break;
      case LAYER_TYPES.MONTHLY_FLUX:
        layerUrl = dataLayers.monthlyFluxUrl;
        break;
      case LAYER_TYPES.DSM:
        layerUrl = dataLayers.dsmUrl;
        break;
      case LAYER_TYPES.RGB:
        layerUrl = dataLayers.rgbUrl;
        break;
      case LAYER_TYPES.MASK:
        layerUrl = dataLayers.maskUrl;
        break;
      case LAYER_TYPES.HOURLY_SHADE:
        layerUrl = dataLayers.hourlyShadeUrls?.[0]; // First hour as example
        break;
      default:
        throw new Error(`Unknown layer type: ${layerType}`);
    }

    if (!layerUrl) {
      throw new Error(`Layer URL not available for type: ${layerType}`);
    }

    console.log(`Fetching ${layerType} layer from:`, layerUrl);

    // Fetch and process the GeoTIFF (API key will be appended to URL)
    const geoTiffImage = await fetchGeoTiff(layerUrl, apiKey);
    console.log('GeoTIFF fetched successfully, processing...');

    const processedData = await processGeoTiff(geoTiffImage);
    console.log('GeoTIFF processed:', processedData);

    // Convert to heat map if it's flux data
    let visualizationData;
    if (layerType === LAYER_TYPES.ANNUAL_FLUX || layerType === LAYER_TYPES.MONTHLY_FLUX) {
      console.log('Converting flux data to heat map...');
      visualizationData = fluxToHeatMap(processedData);
      console.log('Heat map created successfully');
    } else {
      // For other layers, just return the raw data
      visualizationData = processedData;
    }

    const result = {
      ...visualizationData,
      bounds: processedData.bounds,
      width: processedData.width,
      height: processedData.height,
      layerType
    };

    console.log('Solar flux layer ready:', result);
    return result;
  } catch (error) {
    console.error('Error getting solar flux layer:', error);
    throw error;
  }
}

/**
 * Get bounds from building data for layer positioning
 * @param {object} buildingData - Building data from Solar API
 * @returns {Array} Bounds array [west, south, east, north] for deck.gl
 */
export function getBuildingBounds(buildingData) {
  const center = buildingData.center;
  const imageryQuality = buildingData.imageryQuality;

  if (!center || !imageryQuality) {
    return null;
  }

  // Use pixel scale to estimate bounds
  // This is approximate - actual bounds come from GeoTIFF
  const pixelsPerDegree = imageryQuality.pixelsPerDegree || 1000;
  const bufferDegrees = 50 / pixelsPerDegree; // 50 pixel buffer

  // deck.gl BitmapLayer expects bounds as [west, south, east, north]
  return [
    center.longitude - bufferDegrees,  // west
    center.latitude - bufferDegrees,   // south
    center.longitude + bufferDegrees,  // east
    center.latitude + bufferDegrees    // north
  ];
}
