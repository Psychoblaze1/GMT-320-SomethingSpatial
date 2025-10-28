// Green Space Analysis Service
// Uses Turf.js for geodesic area calculations

import { area, polygon, booleanPointInPolygon, point } from '@turf/turf';
import { greenSpaces } from './sustainabilityData';

/**
 * Calculate the geodesic area of a polygon
 * @param {Array} coordinates - Array of [lng, lat] coordinates
 * @returns {Object} Area in square meters and hectares
 */
export function calculateGreenSpaceArea(coordinates) {
  try {
    // Create a Turf.js polygon from coordinates
    const poly = polygon([coordinates]);

    // Calculate area in square meters (geodesic calculation)
    const areaInMeters = area(poly);
    const areaInHectares = areaInMeters / 10000;

    return {
      squareMeters: Math.round(areaInMeters),
      hectares: parseFloat(areaInHectares.toFixed(4)),
      acres: parseFloat((areaInHectares * 2.47105).toFixed(4)) // Convert to acres
    };
  } catch (error) {
    console.error('Error calculating green space area:', error);
    return null;
  }
}

/**
 * Find green space that contains a clicked point
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object|null} Matching green space or null
 */
export function findGreenSpaceAtPoint(lat, lng) {
  const clickedPoint = point([lng, lat]);

  // Check each green space polygon
  for (const space of greenSpaces) {
    if (space.polygon) {
      const poly = polygon([space.polygon]);

      // Check if point is inside polygon
      if (booleanPointInPolygon(clickedPoint, poly)) {
        return space;
      }
    }
  }

  return null;
}

/**
 * Calculate carbon offset potential based on area and green space type
 * @param {number} areaInMeters - Area in square meters
 * @param {string} type 
 * @returns {number} Estimated carbon offset in tons CO2 per year
 */
export function estimateCarbonOffset(areaInMeters, type = 'lawn') {
  // Carbon offset factors (tons CO2 per hectare per year)
  const offsetFactors = {
    'lawn': 0.6, 
    'native-plants': 2.0, 
    'mixed-woodland': 4.5, 
    'ornamental': 1.0, 
    'forest': 5.5, 
    'meadow': 1.2 
  };

  const factor = offsetFactors[type] || offsetFactors['lawn'];
  const hectares = areaInMeters / 10000;

  return parseFloat((hectares * factor).toFixed(2));
}

/**
 * Estimate tree count based on area and green space type
 * @param {number} areaInMeters - Area in square meters
 * @param {string} type - Type of green space
 * @returns {number} Estimated number of trees
 */
export function estimateTreeCount(areaInMeters, type = 'lawn') {
  // Trees per hectare by type
  const treesDensity = {
    'lawn': 25, 
    'native-plants': 60, 
    'mixed-woodland': 250, 
    'ornamental': 40,
    'forest': 400, 
    'meadow': 15 
  };

  const density = treesDensity[type] || treesDensity['lawn'];
  const hectares = areaInMeters / 10000;

  return Math.round(hectares * density);
}

/**
 * Calculate biodiversity score based on area, type, and tree count
 * @param {number} areaInMeters - Area in square meters
 * @param {string} type - Type of green space
 * @param {number} trees - Number of trees
 * @returns {number} Biodiversity score (0-10)
 */
export function calculateBiodiversityScore(areaInMeters, type, trees) {
  // Base scores by type
  const typeScores = {
    'lawn': 5.0,
    'native-plants': 9.2,
    'mixed-woodland': 8.8,
    'ornamental': 6.5,
    'forest': 9.5,
    'meadow': 7.5
  };

  let score = typeScores[type] || typeScores['lawn'];

  // Adjust for area (larger = slightly better)
  const hectares = areaInMeters / 10000;
  if (hectares > 1) {
    score += Math.min(0.5, hectares * 0.1);
  }

  // Adjust for tree density
  const density = trees / hectares;
  if (density > 20) {
    score += 0.3;
  } else if (density < 5) {
    score -= 0.2;
  }

  return Math.min(10, Math.max(0, parseFloat(score.toFixed(1))));
}

/**
 * Estimate annual maintenance cost based on area and type
 * @param {number} areaInMeters - Area in square meters
 * @param {string} type - Type of green space
 * @returns {number} Estimated annual maintenance cost in USD
 */
export function estimateMaintenanceCost(areaInMeters, type = 'lawn') {
  // Cost per square meter per year (USD)
  const costPerSqm = {
    'lawn': 0.60,
    'native-plants': 0.50,
    'mixed-woodland': 0.50,
    'ornamental': 1.50,
    'forest': 0.30,
    'meadow': 0.40
  };

  const rate = costPerSqm[type] || costPerSqm['lawn'];

  return Math.round(areaInMeters * rate);
}

/**
 * Get comprehensive green space analysis
 * @param {Object} greenSpace - Green space object with polygon
 * @param {boolean} recalculate - Whether to recalculate area from polygon
 * @returns {Object} Complete analysis data
 */
export function analyzeGreenSpace(greenSpace, recalculate = true) {
  let calculatedArea = null;

  if (recalculate && greenSpace.polygon) {
    calculatedArea = calculateGreenSpaceArea(greenSpace.polygon);
  }

  const areaToUse = calculatedArea?.squareMeters || greenSpace.area;
  const type = greenSpace.type || 'lawn';

  const carbonOffset = greenSpace.carbonOffsetPerYear || estimateCarbonOffset(areaToUse, type);
  const trees = greenSpace.trees || estimateTreeCount(areaToUse, type);
  const biodiversity = greenSpace.biodiversityScore || calculateBiodiversityScore(areaToUse, type, trees);
  const maintenanceCost = greenSpace.maintenanceCost || estimateMaintenanceCost(areaToUse, type);

  return {
    ...greenSpace,
    calculatedArea,
    analysis: {
      carbonOffsetPerYear: carbonOffset,
      estimatedTrees: trees,
      biodiversityScore: biodiversity,
      maintenanceCost,
      type: type,
      // Additional metrics
      oxygenProductionPerYear: carbonOffset * 0.73, // Rough estimate: 730kg O2 per ton CO2
      waterRetentionCapacity: Math.round(areaToUse * 0.15), // Liters (15% of surface area)
      coolingEffect: areaToUse > 5000 ? 'High' : areaToUse > 2000 ? 'Medium' : 'Low'
    }
  };
}

/**
 * Compare actual area to estimated area
 * @param {Object} greenSpace - Green space with both static area and polygon
 * @returns {Object} Comparison data
 */
export function compareAreas(greenSpace) {
  if (!greenSpace.polygon) {
    return null;
  }

  const calculated = calculateGreenSpaceArea(greenSpace.polygon);
  const staticArea = greenSpace.area;

  const difference = calculated.squareMeters - staticArea;
  const percentDifference = (difference / staticArea) * 100;

  return {
    staticArea,
    calculatedArea: calculated.squareMeters,
    difference: Math.round(difference),
    percentDifference: parseFloat(percentDifference.toFixed(2)),
    moreAccurate: calculated.squareMeters
  };
}

/**
 * Get all green spaces with calculated areas
 * @returns {Array} All green spaces with analysis
 */
export function getAllGreenSpacesWithAnalysis() {
  return greenSpaces.map(space => analyzeGreenSpace(space, true));
}
