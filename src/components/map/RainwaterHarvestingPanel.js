import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Stack,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ParkIcon from '@mui/icons-material/Park';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { glassStyle } from '../../theme';
import {
  getComprehensiveAnalysis,
  getAnalysisFromSolarAPI,
  formatCurrency,
  formatNumber
} from '../../services/rainwaterHarvestingService';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function RainwaterHarvestingPanel({ building, solarBuildingData, buildingInfo, onClose }) {
  const [tabValue, setTabValue] = useState(0);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (solarBuildingData && buildingInfo) {
      // Use Solar API data for analysis
      try {
        const comprehensiveAnalysis = getAnalysisFromSolarAPI(solarBuildingData, buildingInfo);
        setAnalysis(comprehensiveAnalysis);
      } catch (error) {
        console.error('Error analyzing building from Solar API:', error);
      }
    } else if (building) {
      // Use predefined building data
      const comprehensiveAnalysis = getComprehensiveAnalysis(building);
      setAnalysis(comprehensiveAnalysis);
    }
  }, [building, solarBuildingData, buildingInfo]);

  if (!analysis) {
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const { collection, economics, environmental } = analysis;

  return (
    <Paper
      sx={{
        position: 'fixed',
        right: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 450,
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1200,
        ...glassStyle,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WaterDropIcon />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Rainwater Harvesting Analysis
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {analysis.building.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Roof Area: {formatNumber(analysis.building.area)} m²
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {analysis.building.isInstalled && (
          <Chip
            icon={<CheckCircleIcon />}
            label="System Installed"
            size="small"
            sx={{
              mt: 1,
              bgcolor: 'rgba(76, 175, 80, 0.9)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Tab
          icon={<WaterDropIcon fontSize="small" />}
          label="Water Collection"
          iconPosition="start"
        />
        <Tab
          icon={<AttachMoneyIcon fontSize="small" />}
          label="Economics"
          iconPosition="start"
        />
        <Tab
          icon={<ParkIcon fontSize="small" />}
          label="Impact"
          iconPosition="start"
        />
      </Tabs>

      {/* Tab Content - Scrollable */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Tab 1: Water Collection */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            {/* Annual Capacity */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Annual Collection Capacity
              </Typography>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                {formatNumber(collection.annualCapacity)} L
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Based on 680mm annual rainfall in Pretoria
              </Typography>
            </Box>

            <Divider />

            {/* Tank Recommendation */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Recommended Tank Size
                </Typography>
                <Tooltip title="Tank should store dry season collection and handle peak usage">
                  <InfoIcon fontSize="small" color="action" />
                </Tooltip>
              </Box>
              <Stack direction="row" spacing={2} alignItems="baseline">
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                  {formatNumber(collection.tankRecommendation.standardSize)} L
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  (Standard size)
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Monthly average: {formatNumber(collection.tankRecommendation.monthlyAverage)} L
              </Typography>
            </Box>

            <Divider />

            {/* Monthly Distribution */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Monthly Collection Estimate
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Liters</TableCell>
                      <TableCell align="right">% of Annual</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collection.monthlyData.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell>{month.month}</TableCell>
                        <TableCell align="right">{formatNumber(month.liters)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={month.percentage}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
                            />
                            <Typography variant="caption">{month.percentage}%</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Usage Tips */}
            <Alert severity="info" icon={<WaterDropIcon />}>
              <Typography variant="caption">
                <strong>Usage Tips:</strong> Rainwater can be used for irrigation, toilet flushing,
                washing, and cooling systems. For potable use, additional filtration is required.
              </Typography>
            </Alert>
          </Stack>
        </TabPanel>

        {/* Tab 2: Economics */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            {/* Cost Savings */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Annual Water Cost Savings
              </Typography>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(economics.annualSavings)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Based on R0.08 per liter municipal water cost
              </Typography>
            </Box>

            <Divider />

            {/* Savings Breakdown */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Projected Savings
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Monthly Savings</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(economics.monthlySavings)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">5-Year Savings</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatCurrency(economics.fiveYearSavings)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">10-Year Savings</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatCurrency(economics.tenYearSavings)}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Installation Cost & ROI */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Installation Investment
              </Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
                {formatCurrency(economics.installationCost)}
              </Typography>

              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Payback Period
                  </Typography>
                  <Chip
                    label={`${economics.paybackPeriod.toFixed(1)} years`}
                    color={economics.paybackPeriod < 5 ? 'success' : economics.paybackPeriod < 10 ? 'warning' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Return on Investment
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Chip
                      label={`5-Year: ${economics.fiveYearROI.toFixed(0)}%`}
                      color={economics.fiveYearROI > 0 ? 'success' : 'error'}
                      size="small"
                    />
                    <Chip
                      label={`10-Year: ${economics.tenYearROI.toFixed(0)}%`}
                      color="success"
                      size="small"
                    />
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* Economic Benefits Alert */}
            <Alert severity="success" icon={<AttachMoneyIcon />}>
              <Typography variant="caption">
                <strong>Financial Benefits:</strong> {economics.paybackPeriod < 10
                  ? 'This investment will pay for itself in less than 10 years with ongoing savings thereafter.'
                  : 'This investment provides long-term cost savings and reduces dependency on municipal water.'}
              </Typography>
            </Alert>
          </Stack>
        </TabPanel>

        {/* Tab 3: Environmental Impact */}
        <TabPanel value={tabValue} index={2}>
          <Stack spacing={3}>
            {/* CO2 Reduction */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Annual CO₂ Reduction
              </Typography>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {environmental.co2SavedTons.toFixed(2)} tons
              </Typography>
              <Typography variant="caption" color="text.secondary">
                From reduced water pumping and treatment
              </Typography>
            </Box>

            <Divider />

            {/* Trees Equivalent */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ParkIcon color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Equivalent to Planting
                </Typography>
              </Box>
              <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                {environmental.treesEquivalent} trees
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Based on average tree carbon absorption (~21kg CO₂/year)
              </Typography>
            </Box>

            <Divider />

            {/* Stormwater Reduction */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Stormwater Runoff Reduction
              </Typography>
              <Typography variant="h5" color="info.main" sx={{ fontWeight: 'bold' }}>
                {formatNumber(environmental.stormwaterReductionLiters)} L
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Collected water diverted from stormwater system
              </Typography>
            </Box>

            <Divider />

            {/* Environmental Benefits Summary */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Environmental Benefits
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" color="success" sx={{ mt: 0.5 }} />
                  <Typography variant="body2">
                    Reduces pressure on municipal water infrastructure
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" color="success" sx={{ mt: 0.5 }} />
                  <Typography variant="body2">
                    Decreases stormwater runoff and erosion
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" color="success" sx={{ mt: 0.5 }} />
                  <Typography variant="body2">
                    Lowers energy consumption for water treatment and pumping
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" color="success" sx={{ mt: 0.5 }} />
                  <Typography variant="body2">
                    Provides water security during restrictions and droughts
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Impact Alert */}
            <Alert severity="info" icon={<ParkIcon />}>
              <Typography variant="caption">
                <strong>Sustainability Impact:</strong> Rainwater harvesting is a key strategy for
                water conservation in South Africa, helping to address water scarcity and reduce
                environmental impact.
              </Typography>
            </Alert>
          </Stack>
        </TabPanel>
      </Box>
    </Paper>
  );
}
