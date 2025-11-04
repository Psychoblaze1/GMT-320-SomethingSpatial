import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Tooltip,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InfoIcon from '@mui/icons-material/Info';
import Co2Icon from '@mui/icons-material/Co2';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PaletteIcon from '@mui/icons-material/Palette';

// TabPanel component for managing tab content
function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`solar-tabpanel-${index}`}
      aria-labelledby={`solar-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function SolarInsightsPanel({
  buildingData,
  solarConfig,
  buildingInfo,
  onClose,
  loading = false,
  error = null
}) {
  const [activeTab, setActiveTab] = React.useState(0);

  if (loading) {
    return (
      <Card
        sx={{
          position: 'absolute',
          top: '50%',
          right: 20,
          transform: 'translateY(-50%)',
          width: 380,
          maxHeight: '80vh',
          overflow: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Loading Solar Data...</Typography>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        sx={{
          position: 'absolute',
          top: '50%',
          right: 20,
          transform: 'translateY(-50%)',
          width: 380,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Solar Analysis Error</Typography>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!buildingData || !solarConfig) {
    return null;
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatRands = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `R ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num)}`;
  };

  // Calculate estimated savings using R3.50 per kWh (average between R3-4)
  const avgElectricityCostPerKwh = 3.5;
  const annualEnergyKwh = solarConfig?.bestConfig?.yearlyEnergyDcKwh || 0;
  const estimatedAnnualSavings = annualEnergyKwh * avgElectricityCostPerKwh;
  const estimated20YearSavings = estimatedAnnualSavings * 20;

  return (
    <Card
      sx={{
        position: 'absolute',
        top: '50%',
        right: 20,
        transform: 'translateY(-50%)',
        width: 400,
        maxHeight: '85vh',
        overflow: 'auto',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        boxShadow: 4
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <SolarPowerIcon color="warning" fontSize="large" />
            <Box>
              <Typography variant="h6">Solar Potential</Typography>
              {buildingInfo?.imageryDate && (
                <Typography variant="caption" color="text.secondary">
                  Data from: {new Date(buildingInfo.imageryDate.year,
                    buildingInfo.imageryDate.month - 1,
                    buildingInfo.imageryDate.day).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Quality Indicator */}
        {buildingInfo?.imageryQuality && (
          <Chip
            label={`${buildingInfo.imageryQuality} Quality Data`}
            size="small"
            color={buildingInfo.imageryQuality === 'HIGH' ? 'success' : 'warning'}
            sx={{ mb: 2 }}
          />
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
        >
          <Tab icon={<AnalyticsIcon />} label="Analysis" />
          <Tab icon={<PaletteIcon />} label="Legend" />
        </Tabs>

        {/* Tab 1: Analysis */}
        <TabPanel value={activeTab} index={0}>
          <Stack spacing={2.5}>
          {/* Max Solar Potential */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Maximum Solar Capacity
            </Typography>
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography variant="h4" color="warning.main">
                {solarConfig.maxArrayPanelsCount}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                panels
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatNumber(solarConfig.maxArrayAreaMeters2)} m² roof area
            </Typography>
          </Box>

          <Divider />

          {/* Energy Production */}
          {solarConfig.bestConfig && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Annual Energy Production
              </Typography>
              <Box display="flex" alignItems="baseline" gap={1}>
                <Typography variant="h5" color="primary">
                  {formatNumber(solarConfig.bestConfig.yearlyEnergyDcKwh)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  kWh/year
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                With {solarConfig.bestConfig.panelsCount} panels
              </Typography>
            </Box>
          )}

          {/* Estimated Savings */}
          {annualEnergyKwh > 0 && (
            <>
              <Divider />
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <AttachMoneyIcon color="success" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Estimated Savings
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  <Typography variant="caption">
                    Based on average electricity cost of R{avgElectricityCostPerKwh}/kWh
                  </Typography>
                </Alert>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Annual Savings
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {formatRands(estimatedAnnualSavings)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      per year
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      20-Year Savings
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {formatRands(estimated20YearSavings)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </>
          )}

          {/* Sunshine Hours */}
          {solarConfig.maxSunshineHoursPerYear && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Sunshine Availability
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">
                    {formatNumber(solarConfig.maxSunshineHoursPerYear)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    hours/year
                  </Typography>
                </Box>
              </Box>
            </>
          )}

          {/* Carbon Offset */}
          {solarConfig.carbonOffsetFactorKgPerMwh && solarConfig.bestConfig && (
            <>
              <Divider />
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Co2Icon color="success" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Carbon Offset Potential
                  </Typography>
                </Box>
                <Typography variant="h6" color="success.main">
                  {formatNumber(
                    (solarConfig.bestConfig.yearlyEnergyDcKwh / 1000) *
                    solarConfig.carbonOffsetFactorKgPerMwh / 1000
                  )} tons CO₂/year
                </Typography>
              </Box>
            </>
          )}

          {/* Configuration Options */}
          {solarConfig.configCount > 1 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {solarConfig.configCount} panel configurations available
              </Typography>
            </Box>
          )}
          </Stack>

          {/* Action Hint */}
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
              <Tooltip title="Click anywhere on the map to analyze another building">
                <InfoIcon fontSize="small" />
              </Tooltip>
              Click the map to analyze another building
            </Typography>
          </Box>
        </TabPanel>

        {/* Tab 2: Legend */}
        <TabPanel value={activeTab} index={1}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" gutterBottom>
              Solar Flux Heat Map Color Scale
            </Typography>

            <Typography variant="caption" color="text.secondary">
              The heat map shows annual solar irradiance potential in kWh/kW/year.
              Warmer colors indicate higher solar energy potential.
            </Typography>

            {/* Color Scale Gradient Bars */}
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {/* Low - Blue to Cyan */}
              <Box>
                <Box
                  sx={{
                    height: 30,
                    background: 'linear-gradient(to right, rgb(0, 0, 255), rgb(0, 255, 255))',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" fontWeight="bold">
                    0 - 450
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kWh/kW/year
                  </Typography>
                </Box>
                <Typography variant="caption" color="primary.main">
                  Low Solar Potential
                </Typography>
              </Box>

              {/* Moderate - Cyan to Green */}
              <Box>
                <Box
                  sx={{
                    height: 30,
                    background: 'linear-gradient(to right, rgb(0, 255, 255), rgb(0, 255, 0))',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" fontWeight="bold">
                    450 - 900
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kWh/kW/year
                  </Typography>
                </Box>
                <Typography variant="caption" color="info.main">
                  Moderate Potential
                </Typography>
              </Box>

              {/* Good - Green to Yellow */}
              <Box>
                <Box
                  sx={{
                    height: 30,
                    background: 'linear-gradient(to right, rgb(0, 255, 0), rgb(255, 255, 0))',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" fontWeight="bold">
                    900 - 1350
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kWh/kW/year
                  </Typography>
                </Box>
                <Typography variant="caption" color="success.main">
                  Good Potential
                </Typography>
              </Box>

              {/* Excellent - Yellow to Red */}
              <Box>
                <Box
                  sx={{
                    height: 30,
                    background: 'linear-gradient(to right, rgb(255, 255, 0), rgb(255, 0, 0))',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" fontWeight="bold">
                    1350 - 1800+
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kWh/kW/year
                  </Typography>
                </Box>
                <Typography variant="caption" color="error.main">
                  Excellent Potential
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </TabPanel>
      </CardContent>
    </Card>
  );
}
