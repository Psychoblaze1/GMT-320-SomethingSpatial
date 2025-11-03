import { geoTiffCache } from '../utils/geoTiffCache';

const SOLAR_API_BASE_URL = 'https://solar.googleapis.com/v1';

// Cache results for 24 hours to avoid hitting API limits
const buildingCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export async function findClosestBuilding(lat, lng, apiKey, requiredQuality = 'MEDIUM') {
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;

  // Return cached data if we have it
  const cached = buildingCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('Returning cached solar data for:', cacheKey);
    return cached.data;
  }

  const params = new URLSearchParams({
    'location.latitude': lat.toFixed(5),
    'location.longitude': lng.toFixed(5),
    'requiredQuality': requiredQuality,
    'key': apiKey
  });

  // Note: GeoTIFF data layers are included automatically when available
  // They appear in solarPotential.dataLayers if imagery is processed

  const url = `${SOLAR_API_BASE_URL}/buildingInsights:findClosest?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No building found within 50 meters of this location');
      }
      if (response.status === 429) {
        throw new Error('API rate limit exceeded (600 queries/min). Please try again later.');
      }
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    // Log whether data layers are available
    console.log(
      'Solar API response received. Data layers available:',
      (data.solarPotential?.dataLayers ?? null) !== null
    );

    buildingCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    console.error('Solar API Error:', error);
    throw error;
  }
}

/**
 * Fetch GeoTIFF data layers for a location
 * This returns URLs for downloadable TIFF files including DSM, RGB, mask, flux, and shade data
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} apiKey - Google Solar API key
 * @param {object} options - Optional parameters
 * @param {number} options.radiusMeters - Radius in meters (default: 50)
 * @param {string} options.requiredQuality - Quality level: HIGH, MEDIUM, LOW, BASE (default: BASE)
 * @param {boolean} options.useExpandedCoverage - Enable experimental expanded coverage (default: true)
 * @returns {Promise<object>} Data layers response with GeoTIFF URLs
 */
export async function fetchDataLayers(lat, lng, apiKey, options = {}) {
  const {
    radiusMeters = 50,
    requiredQuality = 'BASE',
    useExpandedCoverage = true
  } = options;

  // Check cache first
  const cachedData = await geoTiffCache.getDataLayers(lat, lng, radiusMeters);
  if (cachedData) {
    console.log('✅ Returning cached dataLayers response');
    return cachedData;
  }

  console.log('📡 No cache found, fetching from API...');

  // Note: Google's API expects snake_case parameter names, not camelCase
  const params = new URLSearchParams({
    'location.latitude': lat.toString(),
    'location.longitude': lng.toString(),
    'radius_meters': radiusMeters.toString(),      // snake_case!
    'required_quality': requiredQuality,            // snake_case!
    'key': apiKey
  });

  // Add experimental expanded coverage for broader availability
  if (useExpandedCoverage) {
    params.append('experiments', 'EXPANDED_COVERAGE');
  }

  const url = `${SOLAR_API_BASE_URL}/dataLayers:get?${params}`;

  console.log('Request parameters:', {
    lat,
    lng,
    radiusMeters,
    requiredQuality,
    useExpandedCoverage
  });

  try {
    console.log(`Fetching data layers for (${lat.toFixed(6)}, ${lng.toFixed(6)}) with radius ${radiusMeters}m, quality ${requiredQuality}`);
    console.log('Full API URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

    // Show exact URL parameters being sent
    console.log('URL Parameters:', params.toString());

    const response = await fetch(url);

    if (!response.ok) {
      // Get detailed error information
      const errorText = await response.text();
      console.error('❌ Data Layers API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: url.replace(apiKey, 'API_KEY_HIDDEN')
      });

      if (response.status === 404) {
        throw new Error('No solar imagery data available for this location. High-resolution imagery may not be processed yet. Try changing requiredQuality to BASE for broader coverage.');
      }
      if (response.status === 429) {
        throw new Error('API rate limit exceeded (600 queries/min). Please try again later.');
      }

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Data Layers API Error: ${response.status} ${response.statusText}`);
      }

      throw new Error(errorData?.error?.message || `Data Layers API Error: ${response.status}`);
    }

    const data = await response.json();

    // Validate that we received the expected data structure
    if (!data.dsmUrl && !data.rgbUrl && !data.annualFluxUrl) {
      console.warn('Data layers response missing expected URLs:', data);
      throw new Error('Incomplete data layers response from API');
    }

    console.log('Data layers received:', {
      imageryDate: data.imageryDate,
      imageryQuality: data.imageryQuality,
      hasFlux: !!data.annualFluxUrl,
      hasMonthlyFlux: !!data.monthlyFluxUrl,
      hourlyShadeUrls: data.hourlyShadeUrls?.length || 0
    });

    // Cache the response
    await geoTiffCache.setDataLayers(lat, lng, radiusMeters, data);

    return data;
  } catch (error) {
    console.error('Data Layers API Error:', error);
    throw error;
  }
}

// Pull out the useful solar panel info from Google's response
export function getSolarPanelConfig(buildingData) {
  if (!buildingData?.solarPotential) {
    return null;
  }

  const solar = buildingData.solarPotential;

  // Find the config with the most panels
  const configs = solar.solarPanelConfigs || [];
  const bestConfig = configs.reduce((best, current) => {
    return (current.panelsCount > (best?.panelsCount || 0)) ? current : best;
  }, null);

  return {
    maxArrayPanelsCount: solar.maxArrayPanelsCount,
    maxArrayAreaMeters2: solar.maxArrayAreaMeters2,
    maxSunshineHoursPerYear: solar.maxSunshineHoursPerYear,
    carbonOffsetFactorKgPerMwh: solar.carbonOffsetFactorKgPerMwh,

    bestConfig: bestConfig ? {
      panelsCount: bestConfig.panelsCount,
      yearlyEnergyDcKwh: bestConfig.yearlyEnergyDcKwh,
      roofSegmentSummaries: bestConfig.roofSegmentSummaries?.length || 0
    } : null,

    configCount: configs.length,
    configs: configs.map(config => ({
      panelsCount: config.panelsCount,
      yearlyEnergyDcKwh: config.yearlyEnergyDcKwh
    }))
  };
}

// Get financial breakdown (cash, loan, lease options)
export function getFinancialAnalysis(buildingData, configIndex = 0) {
  if (!buildingData?.solarPotential?.solarPanelConfigs?.[configIndex]) {
    return null;
  }

  const config = buildingData.solarPotential.solarPanelConfigs[configIndex];
  const financialAnalyses = config.financialAnalyses || [];

  return financialAnalyses.map(analysis => ({
    monthlyBill: analysis.monthlyBill?.units || 0,
    panelConfigIndex: analysis.panelConfigIndex,
    financialDetails: analysis.financialDetails ? {
      initialAcKwhPerYear: analysis.financialDetails.initialAcKwhPerYear,
      remainingLifetimeUtilityBill: analysis.financialDetails.remainingLifetimeUtilityBill?.units || 0,
      federalIncentive: analysis.financialDetails.federalIncentive?.units || 0,
      stateIncentive: analysis.financialDetails.stateIncentive?.units || 0,
      utilityIncentive: analysis.financialDetails.utilityIncentive?.units || 0,
      lifetimeSrecTotal: analysis.financialDetails.lifetimeSrecTotal?.units || 0,
      costOfElectricityWithoutSolar: analysis.financialDetails.costOfElectricityWithoutSolar?.units || 0,
      netMeteringAllowed: analysis.financialDetails.netMeteringAllowed,
      solarPercentage: analysis.financialDetails.solarPercentage,
      percentageExportedToGrid: analysis.financialDetails.percentageExportedToGrid
    } : null,

    leasingSavings: analysis.leasingSavings ? {
      leasesAllowed: analysis.leasingSavings.leasesAllowed,
      leasesSupported: analysis.leasingSavings.leasesSupported,
      annualLeasingCost: analysis.leasingSavings.annualLeasingCost?.units || 0,
      savings: analysis.leasingSavings.savings?.savingsYear1?.units || 0
    } : null,

    cashPurchaseSavings: analysis.cashPurchaseSavings ? {
      outOfPocketCost: analysis.cashPurchaseSavings.outOfPocketCost?.units || 0,
      upfrontCost: analysis.cashPurchaseSavings.upfrontCost?.units || 0,
      rebateValue: analysis.cashPurchaseSavings.rebateValue?.units || 0,
      paybackYears: analysis.cashPurchaseSavings.paybackYears,
      savings: analysis.cashPurchaseSavings.savings?.savingsYear20?.units || 0
    } : null,

    financedPurchaseSavings: analysis.financedPurchaseSavings ? {
      annualLoanPayment: analysis.financedPurchaseSavings.annualLoanPayment?.units || 0,
      loanInterestRate: analysis.financedPurchaseSavings.loanInterestRate,
      savings: analysis.financedPurchaseSavings.savings?.savingsYear20?.units || 0
    } : null
  }));
}

// Get individual roof segments (pitch, angle, sun exposure)
export function getRoofSegments(buildingData) {
  if (!buildingData?.solarPotential?.roofSegmentStats) {
    return [];
  }

  return buildingData.solarPotential.roofSegmentStats.map(segment => ({
    pitchDegrees: segment.pitchDegrees,
    azimuthDegrees: segment.azimuthDegrees,
    stats: segment.stats ? {
      areaMeters2: segment.stats.areaMeters2,
      sunshineQuantiles: segment.stats.sunshineQuantiles,
      groundAreaMeters2: segment.stats.groundAreaMeters2
    } : null,
    center: segment.center,
    boundingBox: segment.boundingBox,
    planeHeightAtCenterMeters: segment.planeHeightAtCenterMeters
  }));
}

// Get basic building info (location, imagery date, etc)
export function getBuildingInfo(buildingData) {
  if (!buildingData) {
    return null;
  }

  return {
    name: buildingData.name,
    center: buildingData.center,
    boundingBox: buildingData.boundingBox,
    imageryDate: buildingData.imageryDate,
    imageryQuality: buildingData.imageryQuality,
    imageryProcessedDate: buildingData.imageryProcessedDate,
    postalCode: buildingData.postalCode,
    administrativeArea: buildingData.administrativeArea,
    statisticalArea: buildingData.statisticalArea,
    regionCode: buildingData.regionCode
  };
}

export function clearCache() {
  buildingCache.clear();
  console.log('Solar API cache cleared');
}

export function getCacheStats() {
  return {
    size: buildingCache.size,
    entries: Array.from(buildingCache.keys())
  };
}
