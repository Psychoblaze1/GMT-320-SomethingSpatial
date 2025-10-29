import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Stack
} from '@mui/material';
import MainLayout from '../components/layout/MainLayout';
import WelcomeTutorial, { TUTORIAL_STORAGE_KEY } from '../components/layout/WelcomeTutorial';

import SolarPowerIcon from '@mui/icons-material/SolarPower';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ParkIcon from '@mui/icons-material/Park';
import ChairIcon from '@mui/icons-material/Chair';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DeleteIcon from '@mui/icons-material/Delete';
import Co2Icon from '@mui/icons-material/Co2';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RecyclingIcon from '@mui/icons-material/Recycling';
import OpacityIcon from '@mui/icons-material/Opacity';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

import {
  getTotalRoofMetrics,
  getTotalGreenSpaceMetrics,
  getStudyPodMetrics,
  getBinMetrics,
  getSustainabilityScore,
  getWaterConservationMetrics,
  getEnergyProjections,
  getCarbonImpactComparison,
  getAchievements,
  roofSpaces,
  greenSpaces,
  studyPods
} from '../services/sustainabilityData';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Reusable card that shows a stat with an icon and optional trend arrow
const StatsCard = ({ title, value, icon, color, subtitle, trend, trendValue }) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />;
    if (trend === 'down') return <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />;
    return null;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={0.5}>
                {getTrendIcon()}
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {trendValue}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 28 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Bar chart showing installed solar vs available potential for each building
const SolarPotentialChart = ({ roofData }) => {
  const chartData = {
    labels: roofData.map(roof => roof.buildingName),
    datasets: [
      {
        label: 'Installed Solar (kW)',
        data: roofData.map(roof => roof.currentlyInstalled.solar),
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
      },
      {
        label: 'Available Potential (kW)',
        data: roofData.map(roof => roof.solarPotential - roof.currentlyInstalled.solar),
        backgroundColor: 'rgba(255, 193, 7, 0.7)',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true }
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Solar Energy Potential by Building" subheader="Current vs. Available Capacity" />
      <CardContent sx={{ height: 350 }}>
        <Bar data={chartData} options={options} />
      </CardContent>
    </Card>
  );
};

// Donut chart showing the breakdown of green space areas
const GreenSpaceChart = ({ greenSpaceData }) => {
  const chartData = {
    labels: greenSpaceData.map(space => space.name),
    datasets: [{
      label: 'Area (m²)',
      data: greenSpaceData.map(space => space.area),
      backgroundColor: [
        'rgba(76, 175, 80, 0.7)',
        'rgba(139, 195, 74, 0.7)',
        'rgba(67, 160, 71, 0.7)',
        'rgba(129, 199, 132, 0.7)',
        'rgba(102, 187, 106, 0.7)'
      ],
      borderColor: [
        'rgba(76, 175, 80, 1)',
        'rgba(139, 195, 74, 1)',
        'rgba(67, 160, 71, 1)',
        'rgba(129, 199, 132, 1)',
        'rgba(102, 187, 106, 1)'
      ],
      borderWidth: 2
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Green Space Distribution" subheader="Campus green areas by location" />
      <CardContent sx={{ height: 350 }}>
        <Doughnut data={chartData} options={options} />
      </CardContent>
    </Card>
  );
};

// Card showing waste bin stats and alerts for bins that need emptying
const WasteManagementSummary = ({ binMetrics }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Waste Management"
        subheader="Campus bin monitoring"
        avatar={<DeleteIcon color="action" />}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h5" color="primary">{binMetrics.totalBins}</Typography>
              <Typography variant="caption">Total Bins</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h5" color={binMetrics.avgFillLevel > 70 ? 'error.main' : 'success.main'}>
                {binMetrics.avgFillLevel}%
              </Typography>
              <Typography variant="caption">Avg Fill Level</Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Bin Distribution
        </Typography>
        <Stack spacing={1}>
          {Object.entries(binMetrics.binsByType).map(([type, count]) => (
            <Box key={type} display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                <RecyclingIcon fontSize="small" color={type === 'recycling' ? 'primary' : type === 'compost' ? 'success' : 'action'} />
                <Typography variant="body2">{type.charAt(0).toUpperCase() + type.slice(1)}</Typography>
              </Box>
              <Chip label={count} size="small" color="default" />
            </Box>
          ))}
        </Stack>

        {binMetrics.needsAttention > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>{binMetrics.needsAttention} bins</strong> need attention (≥80% full)
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Card showing rainwater collection stats and cost savings in Rands
const WaterConservationCard = ({ waterMetrics }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Water Conservation"
        subheader="Rainwater harvesting impact"
        avatar={<OpacityIcon color="info" />}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h5" color="info.main">
                {(waterMetrics.currentCollection / 1000000).toFixed(2)}M
              </Typography>
              <Typography variant="caption">Liters/Year Collected</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h5" color="success.main">
                R{waterMetrics.annualSavingsRands}
              </Typography>
              <Typography variant="caption">Annual Savings</Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" gutterBottom>
          Collection Progress
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">
              {waterMetrics.activeSystemsCount} active systems
            </Typography>
            <Typography variant="body2">{waterMetrics.coveragePercent}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={parseFloat(waterMetrics.coveragePercent)}
            color="info"
          />
        </Box>

        <List dense>
          <ListItem>
            <ListItemIcon><WaterDropIcon color="info" /></ListItemIcon>
            <ListItemText
              primary={`${(waterMetrics.monthlyAverage / 1000).toFixed(0)}K L/month`}
              secondary="Monthly average collection"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><TrendingUpIcon color="success" /></ListItemIcon>
            <ListItemText
              primary={`${(waterMetrics.potentialSavings / 1000000).toFixed(1)}M L potential`}
              secondary="Additional capacity available"
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
};

// Card showing CO2 offset with relatable comparisons (cars, trees, households)
const CarbonImpactCard = ({ carbonMetrics }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Carbon Impact"
        subheader="Annual CO₂ offset comparison"
        avatar={<Co2Icon color="success" />}
      />
      <Divider />
      <CardContent>
        <Box textAlign="center" sx={{ mb: 3 }}>
          <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
            {carbonMetrics.currentOffset}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            tons CO₂ offset per year
          </Typography>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          This is equivalent to:
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <EnergySavingsLeafIcon color="success" fontSize="small" />
            <Typography variant="body2">
              <strong>{carbonMetrics.equivalents.carsOffRoad}</strong> cars off the road
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <ParkIcon color="success" fontSize="small" />
            <Typography variant="body2">
              <strong>{carbonMetrics.equivalents.treesEquivalent}</strong> trees planted
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <EmojiNatureIcon color="success" fontSize="small" />
            <Typography variant="body2">
              <strong>{carbonMetrics.equivalents.householdsOffset}</strong> households' emissions
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Breakdown by Source:
        </Typography>
        <Stack spacing={1}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="caption">Green Spaces</Typography>
            <Chip label={`${carbonMetrics.breakdown.greenSpaces}t`} size="small" color="success" />
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="caption">Study Pods</Typography>
            <Chip label={`${carbonMetrics.breakdown.studyPods}t`} size="small" color="primary" />
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="caption">Solar Energy</Typography>
            <Chip label={`${carbonMetrics.breakdown.currentSolar}t`} size="small" color="warning" />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Energy Projections Chart
const EnergyProjectionsChart = ({ projections }) => {
  const chartData = {
    labels: projections.map(p => p.year),
    datasets: [
      {
        label: 'Solar Capacity (kW)',
        data: projections.map(p => p.solarCapacity),
        borderColor: 'rgba(255, 193, 7, 1)',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        yAxisID: 'y',
        fill: true
      },
      {
        label: 'Cost Savings (R)',
        data: projections.map(p => p.costSavings),
        borderColor: 'rgba(76, 175, 80, 1)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        yAxisID: 'y1',
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Solar Capacity (kW)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Cost Savings (R)' },
        grid: { drawOnChartArea: false }
      }
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="5-Year Energy Projections" subheader="Solar capacity growth and savings forecast" />
      <CardContent sx={{ height: 350 }}>
        <Line data={chartData} options={options} />
      </CardContent>
    </Card>
  );
};

// Achievements Component
const AchievementsSection = ({ achievements }) => {
  const getIconComponent = (iconName) => {
    const icons = {
      solar: <SolarPowerIcon />,
      park: <ParkIcon />,
      water: <WaterDropIcon />,
      eco: <EnergySavingsLeafIcon />,
      lightbulb: <LightbulbIcon />
    };
    return icons[iconName] || <EmojiEventsIcon />;
  };

  return (
    <Card>
      <CardHeader
        title="Sustainability Achievements"
        subheader={`${achievements.completedCount}/${achievements.totalCount} milestones completed`}
        avatar={<EmojiEventsIcon color="warning" />}
      />
      <Divider />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Overall Progress</Typography>
            <Typography variant="body2" fontWeight="bold">{achievements.overallProgress}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={parseFloat(achievements.overallProgress)}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        <Grid container spacing={2}>
          {achievements.achievements.map((achievement) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderColor: achievement.completed ? `${achievement.color}.main` : 'grey.300',
                  opacity: achievement.completed ? 1 : 0.7
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {React.cloneElement(getIconComponent(achievement.icon), {
                      color: achievement.completed ? achievement.color : 'disabled',
                      fontSize: 'large'
                    })}
                    <Typography variant="subtitle2" fontWeight="bold">
                      {achievement.title}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    {achievement.description}
                  </Typography>
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption">
                        {achievement.progress.toFixed(1)} / {achievement.target}
                      </Typography>
                      <Typography variant="caption">
                        {((achievement.progress / achievement.target) * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (achievement.progress / achievement.target) * 100)}
                      color={achievement.completed ? achievement.color : 'inherit'}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                  </Box>
                  {achievement.completed && (
                    <Chip
                      label="Completed"
                      size="small"
                      color={achievement.color}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Study Pod Benefits Component
const StudyPodBenefits = ({ podMetrics }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Study Pod Benefits" subheader="Environmental and student impact" />
      <Divider />
      <CardContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h5" color="success.main">{podMetrics.totalCO2Saved}</Typography>
              <Typography variant="caption">Tons CO₂ Saved/Year</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h5" color="primary">{podMetrics.avgSatisfaction}/5</Typography>
              <Typography variant="caption">Student Satisfaction</Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Utilization & Capacity
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Average Utilization</Typography>
            <Typography variant="body2" fontWeight="bold">{podMetrics.avgUtilization}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={parseFloat(podMetrics.avgUtilization)} color="success" />
        </Box>

        <List dense>
          <ListItem>
            <ListItemIcon><ChairIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary={`${podMetrics.totalPods} Study Pods`}
              secondary={`Total capacity: ${podMetrics.totalCapacity} students`}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><LightbulbIcon color="warning" /></ListItemIcon>
            <ListItemText
              primary={`${podMetrics.totalPowerUsage} kW Total Power`}
              secondary="Energy-efficient LED lighting and controls"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><EmojiNatureIcon color="success" /></ListItemIcon>
            <ListItemText
              primary="Natural Ventilation"
              secondary="Reduced HVAC energy consumption by 30%"
            />
          </ListItem>
        </List>

        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Impact:</strong> Study pods save {podMetrics.totalCO2Saved} tons CO₂ annually compared to
            traditional study spaces through energy-efficient design and natural lighting.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Roof Space Details Component
const RoofSpaceDetails = ({ roofMetrics }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Roof Space Utilization" subheader="Solar & rainwater harvesting potential" />
      <Divider />
      <CardContent>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h5" color="warning.main">{roofMetrics.totalArea.toLocaleString()} m²</Typography>
              <Typography variant="caption">Total Roof Area</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h5" color="primary">{roofMetrics.totalSolarPotential} kW</Typography>
              <Typography variant="caption">Solar Potential</Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" gutterBottom>Solar Installation Progress</Typography>
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Installed: {roofMetrics.installedSolar} kW</Typography>
            <Typography variant="body2">{roofMetrics.solarCoverage}% Complete</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={parseFloat(roofMetrics.solarCoverage)}
            color="primary"
          />
        </Box>

        <Typography variant="subtitle2" gutterBottom>Rainwater Harvesting</Typography>
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">{roofMetrics.rainwaterHarvestingCount} of {roofSpaces.length} buildings</Typography>
            <Typography variant="body2">{roofMetrics.rainwaterCoverage}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={parseFloat(roofMetrics.rainwaterCoverage)}
            color="info"
          />
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Potential:</strong> Full installation could generate {roofMetrics.remainingSolarPotential} kW
            additional solar power and collect {(roofMetrics.totalRainwaterCapacity / 1000000).toFixed(1)} million
            liters of rainwater annually.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Green Space Details Component
const GreenSpaceDetails = ({ greenMetrics }) => {
  return (
    <Card>
      <CardHeader title="Green Space Statistics" subheader="Environmental impact and biodiversity" />
      <Divider />
      <CardContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">{greenMetrics.totalArea.toLocaleString()} m²</Typography>
              <Typography variant="caption">Total Green Space</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h6" color="primary">{greenMetrics.greenSpacePercentage}%</Typography>
              <Typography variant="caption">Of Campus Area</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <Typography variant="h6" color="info.main">{greenMetrics.totalTrees}</Typography>
              <Typography variant="caption">Trees</Typography>
            </Box>
          </Grid>
        </Grid>

        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Green Space</strong></TableCell>
                <TableCell align="right"><strong>Area (m²)</strong></TableCell>
                <TableCell align="right"><strong>CO₂ Offset (t/yr)</strong></TableCell>
                <TableCell align="right"><strong>Biodiversity</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {greenSpaces.map((space) => (
                <TableRow key={space.id} hover>
                  <TableCell>{space.name}</TableCell>
                  <TableCell align="right">{space.area.toLocaleString()}</TableCell>
                  <TableCell align="right">{space.carbonOffsetPerYear}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={space.biodiversityScore}
                      size="small"
                      color={space.biodiversityScore > 8 ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Annual Carbon Offset:</strong> {greenMetrics.totalCarbonOffset} tons CO₂
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Average Biodiversity Score:</strong> {greenMetrics.avgBiodiversity}/10
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    roof: {},
    green: {},
    pods: {},
    bins: {},
    sustainability: {}
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTutorialClose = () => {
    setTutorialOpen(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  };

  const handleHelpClick = () => {
    setTutorialOpen(true);
  };

  // Check if user has seen tutorial before
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!hasSeenTutorial) {
      // Small delay so the dashboard loads first
      setTimeout(() => setTutorialOpen(true), 500);
    }
  }, []);

  useEffect(() => {
    const loadMetrics = () => {
      setLoading(true);

      const roofMetrics = getTotalRoofMetrics();
      const greenMetrics = getTotalGreenSpaceMetrics();
      const podMetrics = getStudyPodMetrics();
      const binMetrics = getBinMetrics();
      const sustainabilityScore = getSustainabilityScore();
      const waterMetrics = getWaterConservationMetrics();
      const energyProjections = getEnergyProjections();
      const carbonMetrics = getCarbonImpactComparison();
      const achievements = getAchievements();

      setMetrics({
        roof: roofMetrics,
        green: greenMetrics,
        pods: podMetrics,
        bins: binMetrics,
        sustainability: sustainabilityScore,
        water: waterMetrics,
        energy: energyProjections,
        carbon: carbonMetrics,
        achievements: achievements
      });

      setLoading(false);
    };

    loadMetrics();
  }, []);

  return (
    <MainLayout title="Campus Sustainability Dashboard" onHelpClick={handleHelpClick}>
      <WelcomeTutorial open={tutorialOpen} onClose={handleTutorialClose} />
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box mb={3}>
              <Typography variant="h5" gutterBottom>
                Campus Sustainability Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive metrics for sustainable campus operations (Updated: {new Date().toLocaleDateString()})
              </Typography>
            </Box>

            {/* Main Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Solar Potential"
                  value={`${metrics.roof.totalSolarPotential} kW`}
                  icon={<SolarPowerIcon />}
                  color="warning"
                  subtitle={`${metrics.roof.totalArea?.toLocaleString()} m² roof space`}
                  trend="up"
                  trendValue={`${metrics.roof.solarCoverage}% installed`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Rainwater Capacity"
                  value={`${(metrics.roof.totalRainwaterCapacity / 1000000).toFixed(1)}M L`}
                  icon={<WaterDropIcon />}
                  color="info"
                  subtitle="Liters per year potential"
                  trend="up"
                  trendValue={`${metrics.roof.rainwaterCoverage}% active`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Green Space"
                  value={`${metrics.green.greenSpacePercentage}%`}
                  icon={<ParkIcon />}
                  color="success"
                  subtitle={`${metrics.green.totalArea?.toLocaleString()} m² total area`}
                  trend="up"
                  trendValue={`${metrics.green.totalTrees} trees`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard
                  title="Study Pods"
                  value={metrics.pods.totalPods}
                  icon={<ChairIcon />}
                  color="primary"
                  subtitle={`${metrics.pods.totalCapacity} student capacity`}
                  trend="up"
                  trendValue={`${metrics.pods.totalCO2Saved}t CO₂ saved`}
                />
              </Grid>
            </Grid>

            {/* Sustainability Score */}
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <CardContent>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      Overall Sustainability Score
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      Based on solar coverage, green space, carbon offset, and efficiency metrics
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {metrics.sustainability.score}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        out of 100
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Overview" />
                <Tab label="Roof & Solar" />
                <Tab label="Green Spaces & Study Pods" />
              </Tabs>
            </Paper>

            {/* Tab Panel 1: Overview */}
            {tabValue === 0 && (
              <Grid container spacing={3}>
                {/* Energy Projections - Full Width */}
                <Grid item xs={12}>
                  <EnergyProjectionsChart projections={metrics.energy} />
                </Grid>

                {/* Key Metrics Row */}
                <Grid item xs={12} md={4}>
                  <WasteManagementSummary binMetrics={metrics.bins} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <WaterConservationCard waterMetrics={metrics.water} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <CarbonImpactCard carbonMetrics={metrics.carbon} />
                </Grid>

                {/* Charts Row */}
                <Grid item xs={12} md={6}>
                  <SolarPotentialChart roofData={roofSpaces} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <GreenSpaceChart greenSpaceData={greenSpaces} />
                </Grid>

                {/* Details Row */}
                <Grid item xs={12} md={6}>
                  <RoofSpaceDetails roofMetrics={metrics.roof} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <StudyPodBenefits podMetrics={metrics.pods} />
                </Grid>

                {/* Achievements - Full Width */}
                <Grid item xs={12}>
                  <AchievementsSection achievements={metrics.achievements} />
                </Grid>
              </Grid>
            )}

            {/* Tab Panel 2: Roof & Solar */}
            {tabValue === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <SolarPotentialChart roofData={roofSpaces} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <RoofSpaceDetails roofMetrics={metrics.roof} />
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Building-by-Building Analysis" />
                    <CardContent>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Building</strong></TableCell>
                              <TableCell align="right"><strong>Roof Area (m²)</strong></TableCell>
                              <TableCell align="right"><strong>Solar Potential (kW)</strong></TableCell>
                              <TableCell align="right"><strong>Installed (kW)</strong></TableCell>
                              <TableCell align="right"><strong>Rainwater (L/yr)</strong></TableCell>
                              <TableCell align="center"><strong>Rainwater System</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {roofSpaces.map((roof) => (
                              <TableRow key={roof.id} hover>
                                <TableCell>{roof.buildingName}</TableCell>
                                <TableCell align="right">{roof.area.toLocaleString()}</TableCell>
                                <TableCell align="right">{roof.solarPotential}</TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label={roof.currentlyInstalled.solar || 'None'}
                                    size="small"
                                    color={roof.currentlyInstalled.solar > 0 ? 'success' : 'default'}
                                  />
                                </TableCell>
                                <TableCell align="right">{roof.rainwaterCapacity.toLocaleString()}</TableCell>
                                <TableCell align="center">
                                  {roof.currentlyInstalled.rainwater ?
                                    <Chip label="Active" color="success" size="small" /> :
                                    <Chip label="Not Installed" size="small" />
                                  }
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Tab Panel 3: Green Spaces & Study Pods */}
            {tabValue === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <GreenSpaceDetails greenMetrics={metrics.green} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <GreenSpaceChart greenSpaceData={greenSpaces} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <StudyPodBenefits podMetrics={metrics.pods} />
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Study Pod Locations & Features" />
                    <CardContent>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Location</strong></TableCell>
                              <TableCell align="right"><strong>Capacity</strong></TableCell>
                              <TableCell align="right"><strong>Utilization</strong></TableCell>
                              <TableCell align="right"><strong>Satisfaction</strong></TableCell>
                              <TableCell align="center"><strong>Energy Rating</strong></TableCell>
                              <TableCell align="right"><strong>CO₂ Saved (t/yr)</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {studyPods.map((pod) => (
                              <TableRow key={pod.id} hover>
                                <TableCell>{pod.location}</TableCell>
                                <TableCell align="right">{pod.capacity}</TableCell>
                                <TableCell align="right">{(pod.utilizationRate * 100).toFixed(0)}%</TableCell>
                                <TableCell align="right">{pod.studentSatisfaction}/5</TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={pod.energyEfficiency}
                                    color={pod.energyEfficiency === 'A+' ? 'success' : 'primary'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">{pod.co2SavedVsTraditional}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </Box>
    </MainLayout>
  );
}