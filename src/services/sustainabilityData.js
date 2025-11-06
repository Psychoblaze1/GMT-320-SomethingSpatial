// Campus Sustainability Data Service
// All the data and calculations for the sustainability dashboard

// Real data from GLTF model (populated dynamically)
let realBuildingData = null;
let realBinData = null;

/**
 * Set real campus data from GLTF model
 * @param {object} campusData - Real data from realCampusDataService
 */
export function setRealCampusData(campusData) {
  if (campusData.buildings) {
    realBuildingData = campusData.buildings;
    console.log(`✓ Loaded ${realBuildingData.length} real buildings into sustainability data`);
  }
  if (campusData.bins) {
    realBinData = campusData.bins;
    console.log(`✓ Loaded ${realBinData.length} real bins into sustainability data`);
  }
}

/**
 * Check if real data is loaded
 */
export function hasRealData() {
  return realBuildingData !== null && realBinData !== null;
}

// Waste bin locations on the 3D map
// (x, y, z) coordinates - Y is raised to 30 so bins show above the ground model
export const binLocations = [
  { id: 1, position: [50, 30, 0], type: 'recycling', fillLevel: 45, lastEmptied: '2025-09-28' },
  { id: 2, position: [-30, 30, 30], type: 'compost', fillLevel: 70, lastEmptied: '2025-09-27' },
  { id: 3, position: [0, 30, -20], type: 'general', fillLevel: 80, lastEmptied: '2025-09-29' },
  { id: 4, position: [70, 30, -50], type: 'recycling', fillLevel: 30, lastEmptied: '2025-09-29' },
  { id: 5, position: [-60, 30, -30], type: 'compost', fillLevel: 55, lastEmptied: '2025-09-28' },
  { id: 6, position: [20, 30, 60], type: 'general', fillLevel: 65, lastEmptied: '2025-09-28' },
  { id: 7, position: [-40, 30, 70], type: 'recycling', fillLevel: 20, lastEmptied: '2025-09-30' },
  { id: 8, position: [80, 30, 20], type: 'general', fillLevel: 90, lastEmptied: '2025-09-26' },
];

// Campus walkways - arrays of points that connect to form paths
// Y is raised to 15 so walkways show above the ground
export const walkwayPaths = [
  {
    id: 1,
    name: 'Main Pathway',
    points: [
      [-80, 15, -80],
      [-40, 15, -40],
      [0, 15, 0],
      [40, 15, 40],
      [80, 15, 80]
    ],
    color: '#ffeb3b',
    accessibility: 'wheelchair-accessible'
  },
  {
    id: 2,
    name: 'East Connector',
    points: [
      [0, 15, 0],
      [30, 15, -10],
      [60, 15, -20],
      [80, 15, -30]
    ],
    color: '#ffeb3b',
    accessibility: 'wheelchair-accessible'
  },
  {
    id: 3,
    name: 'West Path',
    points: [
      [0, 15, 0],
      [-30, 15, 15],
      [-60, 15, 30],
      [-80, 15, 45]
    ],
    color: '#ffeb3b',
    accessibility: 'stairs'
  }
];

export const roofSpaces = [
  {
    id: 1,
    buildingName: 'Main Academic Building',
    area: 2500, // square meters
    solarPotential: 375, // kW
    solarEfficiency: 0.15, // 15% efficiency
    annualRainfall: 680, // mm
    rainwaterCapacity: 1700000, // liters per year
    currentlyInstalled: {
      solar: 0,
      rainwater: false
    },
    location: {
      lat: -25.7545,
      lng: 28.2293
    }
  },
  {
    id: 2,
    buildingName: 'Science Laboratory Complex',
    area: 1800,
    solarPotential: 270,
    solarEfficiency: 0.15,
    annualRainfall: 680,
    rainwaterCapacity: 1224000,
    currentlyInstalled: {
      solar: 50, // kW
      rainwater: true
    },
    location: {
      lat: -25.7552,
      lng: 28.2305
    }
  },
  {
    id: 3,
    buildingName: 'Student Center',
    area: 3200,
    solarPotential: 480,
    solarEfficiency: 0.15,
    annualRainfall: 680,
    rainwaterCapacity: 2176000,
    currentlyInstalled: {
      solar: 0,
      rainwater: false
    },
    location: {
      lat: -25.7538,
      lng: 28.2285
    }
  },
  {
    id: 4,
    buildingName: 'Library',
    area: 2200,
    solarPotential: 330,
    solarEfficiency: 0.15,
    annualRainfall: 680,
    rainwaterCapacity: 1496000,
    currentlyInstalled: {
      solar: 100,
      rainwater: true
    },
    location: {
      lat: -25.7548,
      lng: 28.2280
    }
  },
  {
    id: 5,
    buildingName: 'Engineering Building',
    area: 2800,
    solarPotential: 420,
    solarEfficiency: 0.15,
    annualRainfall: 680,
    rainwaterCapacity: 1904000,
    currentlyInstalled: {
      solar: 0,
      rainwater: false
    },
    location: {
      lat: -25.7540,
      lng: 28.2310
    }
  }
];

export const greenSpaces = [
  {
    id: 1,
    name: 'LC de Villiers Sports Grounds',
    area: 8500,
    type: 'lawn',
    trees: 45,
    carbonOffsetPerYear: 12.75,
    biodiversityScore: 7.5,
    maintenanceCost: 5100,
    polygon: [
      [28.2285, -25.7540],
      [28.2300, -25.7540],
      [28.2300, -25.7550],
      [28.2285, -25.7550],
      [28.2285, -25.7540]
    ]
  },
  {
    id: 2,
    name: 'Botanical Gardens',
    area: 3200,
    type: 'native-plants',
    trees: 28,
    carbonOffsetPerYear: 8.4,
    biodiversityScore: 9.2,
    maintenanceCost: 1600,
    polygon: [
      [28.2305, -25.7548],
      [28.2315, -25.7548],
      [28.2315, -25.7556],
      [28.2305, -25.7556],
      [28.2305, -25.7548]
    ]
  },
  {
    id: 3,
    name: 'Amphitheatre Lawns',
    area: 5600,
    type: 'mixed-woodland',
    trees: 120,
    carbonOffsetPerYear: 36.0,
    biodiversityScore: 8.8,
    maintenanceCost: 2800,
    polygon: [
      [28.2270, -25.7535],
      [28.2320, -25.7535],
      [28.2320, -25.7542],
      [28.2270, -25.7542],
      [28.2270, -25.7535]
    ]
  },
  {
    id: 4,
    name: 'Old Arts Courtyard',
    area: 1200,
    type: 'ornamental',
    trees: 15,
    carbonOffsetPerYear: 2.25,
    biodiversityScore: 6.5,
    maintenanceCost: 1800,
    polygon: [
      [28.2275, -25.7552],
      [28.2282, -25.7552],
      [28.2282, -25.7558],
      [28.2275, -25.7558],
      [28.2275, -25.7552]
    ]
  },
  {
    id: 5,
    name: 'Universiteitsoord Green Belt',
    area: 4500,
    type: 'lawn',
    trees: 32,
    carbonOffsetPerYear: 9.6,
    biodiversityScore: 5.8,
    maintenanceCost: 2700,
    polygon: [
      [28.2310, -25.7542],
      [28.2325, -25.7542],
      [28.2325, -25.7552],
      [28.2310, -25.7552],
      [28.2310, -25.7542]
    ]
  },
  {
    id: 6,
    name: 'Roper Quad Gardens',
    area: 2800,
    type: 'ornamental',
    trees: 22,
    carbonOffsetPerYear: 4.2,
    biodiversityScore: 7.8,
    maintenanceCost: 2100,
    polygon: [
      [28.2288, -25.7545],
      [28.2298, -25.7545],
      [28.2298, -25.7552],
      [28.2288, -25.7552],
      [28.2288, -25.7545]
    ]
  }
];

/**
 * Get roof spaces data (real or mock)
 * Returns real building data if loaded, otherwise mock data
 */
export function getRoofSpaces() {
  if (realBuildingData) {
    return realBuildingData.map(building => ({
      id: building.id,
      buildingName: building.name,
      area: building.area || 1500,
      solarPotential: building.solarPotential || 100,
      solarEfficiency: 0.15,
      annualRainfall: 680,
      rainwaterCapacity: building.rainwater?.annualCapacity || 0,
      currentlyInstalled: {
        solar: 0, // Assume none installed for individual buildings
        rainwater: false
      },
      location: building.location
    }));
  }
  return roofSpaces;
}

/**
 * Get bin locations (real or mock)
 */
export function getBinLocations() {
  return realBinData || binLocations;
}

export const studyPods = [
  {
    id: 1,
    location: 'Merensky 2 Library',
    capacity: 8,
    features: ['soundproofing', 'natural-light', 'ergonomic-furniture', 'whiteboard'],
    energyEfficiency: 'A+',
    powerUsage: 0.5,
    utilizationRate: 0.85,
    studentSatisfaction: 4.7,
    co2SavedVsTraditional: 2.5
  },
  {
    id: 2,
    location: 'Engineering Building 2',
    capacity: 6,
    features: ['soundproofing', 'natural-light', 'ergonomic-furniture', 'display-screen'],
    energyEfficiency: 'A',
    powerUsage: 0.8,
    utilizationRate: 0.78,
    studentSatisfaction: 4.5,
    co2SavedVsTraditional: 1.8
  },
  {
    id: 3,
    location: 'Aula',
    capacity: 4,
    features: ['soundproofing', 'ergonomic-furniture', 'whiteboard'],
    energyEfficiency: 'A+',
    powerUsage: 0.4,
    utilizationRate: 0.92,
    studentSatisfaction: 4.8,
    co2SavedVsTraditional: 1.2
  },
  {
    id: 4,
    location: 'Informatorium',
    capacity: 10,
    features: ['soundproofing', 'natural-light', 'ergonomic-furniture', 'whiteboard', 'display-screen'],
    energyEfficiency: 'A',
    powerUsage: 1.2,
    utilizationRate: 0.88,
    studentSatisfaction: 4.6,
    co2SavedVsTraditional: 3.0
  },
  {
    id: 5,
    location: 'Natural Sciences Building',
    capacity: 6,
    features: ['soundproofing', 'natural-light', 'ergonomic-furniture'],
    energyEfficiency: 'A+',
    powerUsage: 0.6,
    utilizationRate: 0.81,
    studentSatisfaction: 4.5,
    co2SavedVsTraditional: 1.9
  }
];

export function getTotalRoofMetrics() {
  // Use real data if available, otherwise fall back to mock data
  if (realBuildingData) {
    const totalArea = realBuildingData.reduce((sum, b) => sum + (b.area || 0), 0);
    const totalSolarPotential = realBuildingData.reduce((sum, b) => sum + (b.solarPotential || 0), 0);
    const totalRainwaterCapacity = realBuildingData.reduce((sum, b) => sum + (b.rainwater?.annualCapacity || 0), 0);
    const installedSolar = Math.round(totalSolarPotential * 0.1); // 10% installed
    const rainwaterHarvestingCount = Math.ceil(realBuildingData.length * 0.2); // 20% have systems

    return {
      totalArea: Math.round(totalArea),
      totalSolarPotential: Math.round(totalSolarPotential),
      totalRainwaterCapacity: Math.round(totalRainwaterCapacity),
      installedSolar,
      remainingSolarPotential: Math.round(totalSolarPotential - installedSolar),
      solarCoverage: (installedSolar / totalSolarPotential * 100).toFixed(1),
      rainwaterHarvestingCount,
      rainwaterCoverage: ((rainwaterHarvestingCount / realBuildingData.length) * 100).toFixed(1)
    };
  }

  // Fallback to mock data
  const totalArea = roofSpaces.reduce((sum, roof) => sum + roof.area, 0);
  const totalSolarPotential = roofSpaces.reduce((sum, roof) => sum + roof.solarPotential, 0);
  const totalRainwaterCapacity = roofSpaces.reduce((sum, roof) => sum + roof.rainwaterCapacity, 0);
  const installedSolar = roofSpaces.reduce((sum, roof) => sum + roof.currentlyInstalled.solar, 0);
  const rainwaterHarvestingCount = roofSpaces.filter(roof => roof.currentlyInstalled.rainwater).length;

  return {
    totalArea,
    totalSolarPotential,
    totalRainwaterCapacity,
    installedSolar,
    remainingSolarPotential: totalSolarPotential - installedSolar,
    solarCoverage: (installedSolar / totalSolarPotential * 100).toFixed(1),
    rainwaterHarvestingCount,
    rainwaterCoverage: (rainwaterHarvestingCount / roofSpaces.length * 100).toFixed(1)
  };
}

// Calculate all the green space stats - trees, carbon offset, etc.
export function getTotalGreenSpaceMetrics() {
  const totalArea = greenSpaces.reduce((sum, space) => sum + space.area, 0);
  const totalTrees = greenSpaces.reduce((sum, space) => sum + space.trees, 0);
  const totalCarbonOffset = greenSpaces.reduce((sum, space) => sum + space.carbonOffsetPerYear, 0);
  const totalMaintenanceCost = greenSpaces.reduce((sum, space) => sum + space.maintenanceCost, 0);
  const avgBiodiversity = greenSpaces.reduce((sum, space) => sum + space.biodiversityScore, 0) / greenSpaces.length;

  // Assuming total campus area of 100,000 m² (10 hectares)
  const campusArea = 100000;
  const greenSpacePercentage = (totalArea / campusArea * 100).toFixed(1);

  return {
    totalArea,
    totalTrees,
    totalCarbonOffset,
    totalMaintenanceCost,
    avgBiodiversity: avgBiodiversity.toFixed(1),
    greenSpacePercentage,
    campusArea
  };
}

// Calculate study pod usage and efficiency stats
export function getStudyPodMetrics() {
  const totalCapacity = studyPods.reduce((sum, pod) => sum + pod.capacity, 0);
  const avgUtilization = studyPods.reduce((sum, pod) => sum + pod.utilizationRate, 0) / studyPods.length;
  const avgSatisfaction = studyPods.reduce((sum, pod) => sum + pod.studentSatisfaction, 0) / studyPods.length;
  const totalCO2Saved = studyPods.reduce((sum, pod) => sum + pod.co2SavedVsTraditional, 0);
  const totalPowerUsage = studyPods.reduce((sum, pod) => sum + pod.powerUsage, 0);

  // Calculate energy efficiency distribution
  const efficiencyCount = studyPods.reduce((acc, pod) => {
    acc[pod.energyEfficiency] = (acc[pod.energyEfficiency] || 0) + 1;
    return acc;
  }, {});

  return {
    totalPods: studyPods.length,
    totalCapacity,
    avgUtilization: (avgUtilization * 100).toFixed(1),
    avgSatisfaction: avgSatisfaction.toFixed(1),
    totalCO2Saved,
    totalPowerUsage: totalPowerUsage.toFixed(1),
    efficiencyCount,
    estimatedStudentsPerDay: Math.floor(totalCapacity * avgUtilization * 3) // Assuming 3 sessions per day
  };
}

// Get waste bin stats - how full they are, how many of each type
export function getBinMetrics() {
  // Use real bin data if available
  const bins = realBinData || binLocations;

  const binsByType = bins.reduce((acc, bin) => {
    acc[bin.type] = (acc[bin.type] || 0) + 1;
    return acc;
  }, {});

  const avgFillLevel = bins.reduce((sum, bin) => sum + bin.fillLevel, 0) / bins.length;
  const fullBins = bins.filter(bin => bin.fillLevel >= 80).length;
  const nearlyEmpty = bins.filter(bin => bin.fillLevel < 30).length;

  return {
    totalBins: bins.length,
    binsByType,
    avgFillLevel: avgFillLevel.toFixed(1),
    fullBins,
    nearlyEmpty,
    needsAttention: fullBins
  };
}

// Calculate the overall sustainability score out of 100
export function getSustainabilityScore() {
  const roofMetrics = getTotalRoofMetrics();
  const greenMetrics = getTotalGreenSpaceMetrics();
  const podMetrics = getStudyPodMetrics();

  // Each category gets a weighted score
  const solarScore = (parseFloat(roofMetrics.solarCoverage) / 100) * 30; // 30% weight
  const greenSpaceScore = (parseFloat(greenMetrics.greenSpacePercentage) / 30) * 25; // 25% weight (30% green space is excellent)
  const carbonScore = (greenMetrics.totalCarbonOffset / 100) * 20; // 20% weight
  const podEfficiencyScore = (parseFloat(podMetrics.avgUtilization) / 100) * 15; // 15% weight
  const satisfactionScore = (parseFloat(podMetrics.avgSatisfaction) / 5) * 10; // 10% weight

  const totalScore = Math.min(100, solarScore + greenSpaceScore + carbonScore + podEfficiencyScore + satisfactionScore);

  return {
    score: totalScore.toFixed(1),
    breakdown: {
      solar: solarScore.toFixed(1),
      greenSpace: greenSpaceScore.toFixed(1),
      carbon: carbonScore.toFixed(1),
      podEfficiency: podEfficiencyScore.toFixed(1),
      satisfaction: satisfactionScore.toFixed(1)
    }
  };
}

// Calculate rainwater collection stats and cost savings in Rands
export function getWaterConservationMetrics() {
  const roofMetrics = getTotalRoofMetrics();
  const activeSystemsCount = roofMetrics.rainwaterHarvestingCount;
  const totalLitersPerYear = roofMetrics.totalRainwaterCapacity;

  // Figure out how much water we're actually collecting
  const currentCollection = (activeSystemsCount / roofSpaces.length) * totalLitersPerYear;
  const potentialSavings = totalLitersPerYear - currentCollection;

  // Cost savings at R0.08 per liter
  const annualSavings = (currentCollection * 0.08).toFixed(0);
  const potentialAnnualSavings = (totalLitersPerYear * 0.08).toFixed(0);

  return {
    currentCollection: Math.round(currentCollection),
    totalPotential: totalLitersPerYear,
    potentialSavings: Math.round(potentialSavings),
    annualSavingsRands: annualSavings,
    potentialAnnualSavingsRands: potentialAnnualSavings,
    activeSystemsCount,
    coveragePercent: ((activeSystemsCount / roofSpaces.length) * 100).toFixed(1),
    monthlyAverage: Math.round(currentCollection / 12)
  };
}

// Project solar energy growth over the next 5 years
export function getEnergyProjections() {
  const roofMetrics = getTotalRoofMetrics();
  const currentSolar = roofMetrics.installedSolar;
  const totalPotential = roofMetrics.totalSolarPotential;

  // Assuming we increase solar by 20% each year
  const projections = [];
  const costPerKWh = 2.5; // Rands per kWh
  const hoursPerYear = 2500; // average sunlight hours in SA

  for (let year = 0; year <= 5; year++) {
    const solarCapacity = Math.min(totalPotential, currentSolar * Math.pow(1.2, year));
    const energyProduced = solarCapacity * hoursPerYear; // kWh
    const costSavings = energyProduced * costPerKWh;
    const co2Offset = energyProduced * 0.0005; // tons CO2 (0.5 kg per kWh)

    projections.push({
      year: new Date().getFullYear() + year,
      solarCapacity: Math.round(solarCapacity),
      energyProduced: Math.round(energyProduced),
      costSavings: Math.round(costSavings),
      co2Offset: co2Offset.toFixed(1)
    });
  }

  return projections;
}

// Calculate CO2 offset and convert to relatable comparisons (cars, trees, etc.)
export function getCarbonImpactComparison() {
  const greenMetrics = getTotalGreenSpaceMetrics();
  const podMetrics = getStudyPodMetrics();
  const roofMetrics = getTotalRoofMetrics();

  // How much CO2 we're offsetting now
  const greenSpaceCO2 = greenMetrics.totalCarbonOffset;
  const studyPodsCO2 = podMetrics.totalCO2Saved;

  // How much we could offset with full solar
  const solarEnergyPerYear = roofMetrics.totalSolarPotential * 2500; // kWh
  const solarCO2Potential = (solarEnergyPerYear * 0.0005).toFixed(1); // tons

  // Current solar offset
  const currentSolarEnergy = roofMetrics.installedSolar * 2500;
  const currentSolarCO2 = (currentSolarEnergy * 0.0005).toFixed(1);

  const totalCurrentOffset = greenSpaceCO2 + studyPodsCO2 + parseFloat(currentSolarCO2);
  const totalPotentialOffset = greenSpaceCO2 + studyPodsCO2 + parseFloat(solarCO2Potential);

  // Convert to real-world equivalents people can understand
  const carsOffRoad = Math.round(totalCurrentOffset / 4.6); // Average car = 4.6 tons/year
  const treesEquivalent = Math.round(totalCurrentOffset / 0.06); // One tree = ~60kg/year

  return {
    currentOffset: totalCurrentOffset.toFixed(1),
    potentialOffset: totalPotentialOffset.toFixed(1),
    breakdown: {
      greenSpaces: greenSpaceCO2.toFixed(1),
      studyPods: studyPodsCO2.toFixed(1),
      currentSolar: currentSolarCO2,
      potentialSolar: solarCO2Potential
    },
    equivalents: {
      carsOffRoad,
      treesEquivalent,
      householdsOffset: Math.round(totalCurrentOffset / 7.5) // Average household emits 7.5 tons/year
    }
  };
}

// Get the list of sustainability milestones and track progress
export function getAchievements() {
  const roofMetrics = getTotalRoofMetrics();
  const greenMetrics = getTotalGreenSpaceMetrics();
  const waterMetrics = getWaterConservationMetrics();
  const carbonMetrics = getCarbonImpactComparison();

  const achievements = [
    {
      id: 1,
      title: 'Solar Energy Deployment',
      description: 'Achieve 10% solar coverage',
      progress: parseFloat(roofMetrics.solarCoverage),
      target: 10,
      completed: parseFloat(roofMetrics.solarCoverage) >= 10,
      icon: 'solar',
      color: 'warning'
    },
    {
      id: 2,
      title: 'Green Space Optimization',
      description: 'Maintain 20% campus green space',
      progress: parseFloat(greenMetrics.greenSpacePercentage),
      target: 20,
      completed: parseFloat(greenMetrics.greenSpacePercentage) >= 20,
      icon: 'park',
      color: 'success'
    },
    {
      id: 3,
      title: 'Water Conservation Target',
      description: 'Collect 1M liters rainwater annually',
      progress: waterMetrics.currentCollection / 1000000,
      target: 1,
      completed: waterMetrics.currentCollection >= 1000000,
      icon: 'water',
      color: 'info'
    },
    {
      id: 4,
      title: 'Carbon Offset Goal',
      description: 'Offset 50 tons CO₂ per year',
      progress: parseFloat(carbonMetrics.currentOffset),
      target: 50,
      completed: parseFloat(carbonMetrics.currentOffset) >= 50,
      icon: 'eco',
      color: 'success'
    },
    {
      id: 5,
      title: 'Renewable Energy Capacity',
      description: 'Install 200+ kW solar capacity',
      progress: roofMetrics.installedSolar,
      target: 200,
      completed: roofMetrics.installedSolar >= 200,
      icon: 'lightbulb',
      color: 'warning'
    }
  ];

  const completedCount = achievements.filter(a => a.completed).length;
  const overallProgress = (completedCount / achievements.length) * 100;

  return {
    achievements,
    completedCount,
    totalCount: achievements.length,
    overallProgress: overallProgress.toFixed(0)
  };
}

const sustainabilityData = {
  binLocations,
  walkwayPaths,
  roofSpaces,
  greenSpaces,
  studyPods,
  getRoofSpaces,
  getBinLocations,
  setRealCampusData,
  hasRealData,
  getTotalRoofMetrics,
  getTotalGreenSpaceMetrics,
  getStudyPodMetrics,
  getBinMetrics,
  getSustainabilityScore,
  getWaterConservationMetrics,
  getEnergyProjections,
  getCarbonImpactComparison,
  getAchievements
};

export default sustainabilityData;