/**
 * Rainwater Harvesting Service
 * Provides calculations and analysis for rooftop rainwater collection potential
 */

// Constants for Pretoria, South Africa
const DEFAULT_ANNUAL_RAINFALL = 680; // mm per year
const COLLECTION_EFFICIENCY = 0.8; // 80% collection efficiency (accounting for losses)
const WATER_COST_PER_LITER = 61 / 1000; // R61 per 1000 liters = R0.061 per liter
const INSTALLATION_COST_PER_SQM = 200; // R500 per square meter (tanks, gutters, pipes)
const CO2_PER_LITER_PUMPED = 0.0003; // kg CO2 per liter (from pumping and treatment)

// Monthly rainfall distribution for Pretoria (percentage of annual rainfall)
const MONTHLY_RAINFALL_DISTRIBUTION = [
  { month: 'Jan', percentage: 0.15 }, // Wet season
  { month: 'Feb', percentage: 0.12 },
  { month: 'Mar', percentage: 0.10 },
  { month: 'Apr', percentage: 0.06 },
  { month: 'May', percentage: 0.03 }, // Dry season
  { month: 'Jun', percentage: 0.02 },
  { month: 'Jul', percentage: 0.02 },
  { month: 'Aug', percentage: 0.03 },
  { month: 'Sep', percentage: 0.05 },
  { month: 'Oct', percentage: 0.10 },
  { month: 'Nov', percentage: 0.13 },
  { month: 'Dec', percentage: 0.19 }  // Wet season
];

/**
 * Calculate rainwater collection potential for a roof
 * @param {number} roofArea - Roof area in square meters
 * @param {number} annualRainfall - Annual rainfall in mm (default: 680mm for Pretoria)
 * @returns {number} Annual collection potential in liters
 */
export function calculateRainwaterPotential(roofArea, annualRainfall = DEFAULT_ANNUAL_RAINFALL) {
  // Formula: Area (m²) × Rainfall (mm) × Efficiency
  // 1mm of rain on 1m² = 1 liter
  return roofArea * annualRainfall * COLLECTION_EFFICIENCY;
}

/**
 * Get monthly collection estimates
 * @param {number} annualCapacity - Annual collection capacity in liters
 * @returns {Array} Monthly collection data
 */
export function getMonthlyCollectionEstimate(annualCapacity) {
  return MONTHLY_RAINFALL_DISTRIBUTION.map(({ month, percentage }) => ({
    month,
    liters: Math.round(annualCapacity * percentage),
    percentage: Math.round(percentage * 100)
  }));
}

/**
 * Calculate cost savings from rainwater harvesting
 * @param {number} litersPerYear - Annual water collection in liters
 * @returns {object} Cost savings breakdown
 */
export function estimateCostSavings(litersPerYear) {
  const annualSavings = litersPerYear * WATER_COST_PER_LITER;
  const monthlySavings = annualSavings / 12;
  const fiveYearSavings = annualSavings * 5;
  const tenYearSavings = annualSavings * 10;

  return {
    annualSavings,
    monthlySavings,
    fiveYearSavings,
    tenYearSavings
  };
}

/**
 * Calculate installation cost and ROI
 * @param {number} roofArea - Roof area in square meters
 * @param {number} annualSavings - Annual cost savings in Rands
 * @returns {object} Installation cost and ROI analysis
 */
export function calculateInstallationROI(roofArea, annualSavings) {
  const installationCost = roofArea * INSTALLATION_COST_PER_SQM;
  const paybackPeriod = installationCost / annualSavings; // years
  const fiveYearROI = ((annualSavings * 5 - installationCost) / installationCost) * 100;
  const tenYearROI = ((annualSavings * 10 - installationCost) / installationCost) * 100;

  return {
    installationCost,
    paybackPeriod,
    fiveYearROI,
    tenYearROI
  };
}

/**
 * Calculate environmental impact
 * @param {number} litersPerYear - Annual water collection in liters
 * @returns {object} Environmental impact metrics
 */
export function calculateEnvironmentalImpact(litersPerYear) {
  const co2Saved = (litersPerYear * CO2_PER_LITER_PUMPED) / 1000; // in tons
  const treesEquivalent = co2Saved / 0.021; // One tree absorbs ~21kg CO2/year
  const stormwaterReduction = litersPerYear; // Liters diverted from stormwater

  return {
    co2SavedTons: co2Saved,
    treesEquivalent: Math.round(treesEquivalent),
    stormwaterReductionLiters: stormwaterReduction
  };
}

/**
 * Recommend tank size based on collection capacity and usage
 * @param {number} annualCapacity - Annual collection capacity in liters
 * @param {number} monthlyUsage - Estimated monthly water usage in liters (optional)
 * @returns {object} Tank size recommendations
 */
export function recommendTankSize(annualCapacity, monthlyUsage = null) {
  const monthlyAverage = annualCapacity / 12;

  // If no usage provided, assume 50% of collection is used
  const estimatedUsage = monthlyUsage || (monthlyAverage * 0.5);

  // Tank should hold at least 1-2 months of dry season collection
  const minTankSize = monthlyAverage * 0.02 * 2; // Dry season collection × 2 months
  const recommendedTankSize = Math.max(minTankSize, estimatedUsage * 1.5);

  // Standard tank sizes in South Africa
  const standardSizes = [1000, 2500, 5000, 10000, 15000, 20000, 25000, 30000];
  const closestStandardSize = standardSizes.find(size => size >= recommendedTankSize) || standardSizes[standardSizes.length - 1];

  return {
    recommendedSize: Math.round(recommendedTankSize),
    standardSize: closestStandardSize,
    monthlyAverage: Math.round(monthlyAverage),
    drySeasonMonthly: Math.round(monthlyAverage * 0.02)
  };
}

/**
 * Find building at clicked point
 * @param {number} lat - Latitude of clicked point
 * @param {number} lng - Longitude of clicked point
 * @param {Array} buildings - Array of building objects with location property
 * @param {number} threshold - Distance threshold in degrees (default: 0.002 ≈ 220m)
 * @returns {object|null} Building object or null if not found
 */
export function findBuildingAtPoint(lat, lng, buildings, threshold = 0.002) {
  let closestBuilding = null;
  let minDistance = threshold;

  buildings.forEach(building => {
    if (building.location) {
      const distance = Math.sqrt(
        Math.pow(building.location.lat - lat, 2) +
        Math.pow(building.location.lng - lng, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestBuilding = building;
      }
    }
  });

  return closestBuilding;
}

/**
 * Get comprehensive rainwater analysis for a building
 * @param {object} building - Building object with area and location
 * @returns {object} Complete rainwater harvesting analysis
 */
export function getComprehensiveAnalysis(building) {
  const annualCapacity = calculateRainwaterPotential(building.area);
  const monthlyData = getMonthlyCollectionEstimate(annualCapacity);
  const costSavings = estimateCostSavings(annualCapacity);
  const roi = calculateInstallationROI(building.area, costSavings.annualSavings);
  const environmental = calculateEnvironmentalImpact(annualCapacity);
  const tankRecommendation = recommendTankSize(annualCapacity);

  return {
    building: {
      id: building.id,
      name: building.buildingName,
      area: building.area,
      isInstalled: building.currentlyInstalled?.rainwater || false
    },
    collection: {
      annualCapacity,
      monthlyData,
      tankRecommendation
    },
    economics: {
      ...costSavings,
      ...roi
    },
    environmental
  };
}

/**
 * Get comprehensive rainwater analysis from Google Solar API building data
 * @param {object} solarBuildingData - Building data from Google Solar API
 * @param {object} buildingInfo - Building info from Solar API
 * @returns {object} Complete rainwater harvesting analysis
 */
export function getAnalysisFromSolarAPI(solarBuildingData, buildingInfo) {
  // Extract roof area from Solar API data
  // The Solar API provides area in square meters
  const roofArea = solarBuildingData.solarPotential?.wholeRoofStats?.areaMeters2 ||
                   buildingInfo?.regionCode?.areaMeters2 ||
                   0;

  if (roofArea === 0) {
    throw new Error('Unable to determine roof area from building data');
  }

  const annualCapacity = calculateRainwaterPotential(roofArea);
  const monthlyData = getMonthlyCollectionEstimate(annualCapacity);
  const costSavings = estimateCostSavings(annualCapacity);
  const roi = calculateInstallationROI(roofArea, costSavings.annualSavings);
  const environmental = calculateEnvironmentalImpact(annualCapacity);
  const tankRecommendation = recommendTankSize(annualCapacity);

  return {
    building: {
      id: buildingInfo?.name || 'detected-building',
      name: buildingInfo?.name || 'Detected Building',
      area: roofArea,
      isInstalled: false,
      center: buildingInfo?.center
    },
    collection: {
      annualCapacity,
      monthlyData,
      tankRecommendation
    },
    economics: {
      ...costSavings,
      ...roi
    },
    environmental,
    solarBuildingData, // Include for visualization
    buildingInfo
  };
}

/**
 * Format currency in South African Rands
 * @param {number} amount - Amount in Rands
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format number with thousand separators
 * @param {number} number - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(number) {
  return new Intl.NumberFormat('en-ZA').format(Math.round(number));
}
