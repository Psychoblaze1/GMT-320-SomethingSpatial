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
  Tabs,
  Tab,
  Tooltip,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InfoIcon from '@mui/icons-material/Info';
import RoofingIcon from '@mui/icons-material/Roofing';
import Co2Icon from '@mui/icons-material/Co2';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function SolarInsightsPanel({
  buildingData,
  solarConfig,
  financialData,
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

  const formatCurrency = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Get best cash purchase option from financial data
  const cashPurchase = financialData?.[0]?.cashPurchaseSavings;

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
            label={`${buildingInfo.imageryQuality} Quality`}
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
          <Tab icon={<SolarPowerIcon />} label="Solar" />
          <Tab icon={<AttachMoneyIcon />} label="Financial" />
          <Tab icon={<InfoIcon />} label="Details" />
        </Tabs>

        {/* Solar Tab */}
        <TabPanel value={activeTab} index={0}>
          <Stack spacing={2}>
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

            {/* Sunshine Hours */}
            {solarConfig.maxSunshineHoursPerYear && (
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
            )}

            {/* Carbon Offset */}
            {solarConfig.carbonOffsetFactorKgPerMwh && solarConfig.bestConfig && (
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
        </TabPanel>

        {/* Financial Tab */}
        <TabPanel value={activeTab} index={1}>
          {cashPurchase ? (
            <Stack spacing={2}>
              <Alert severity="info" icon={<AttachMoneyIcon />}>
                Based on cash purchase scenario
              </Alert>

              {/* Installation Cost */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Upfront Installation Cost
                </Typography>
                <Typography variant="h5" color="error.main">
                  {formatCurrency(cashPurchase.upfrontCost)}
                </Typography>
                {cashPurchase.rebateValue > 0 && (
                  <Typography variant="body2" color="success.main">
                    - {formatCurrency(cashPurchase.rebateValue)} rebate available
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* Out of Pocket */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Out-of-Pocket Cost
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(cashPurchase.outOfPocketCost)}
                </Typography>
              </Box>

              {/* Payback Period */}
              {cashPurchase.paybackYears && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Payback Period
                  </Typography>
                  <Box display="flex" alignItems="baseline" gap={1}>
                    <Typography variant="h5" color="primary">
                      {cashPurchase.paybackYears.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      years
                    </Typography>
                  </Box>
                </Box>
              )}

              <Divider />

              {/* 20-Year Savings */}
              {cashPurchase.savings && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Savings (20 years)
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(cashPurchase.savings)}
                  </Typography>
                </Box>
              )}

              {/* Financial Details from first analysis */}
              {financialData?.[0]?.financialDetails && (
                <Box>
                  <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                    Additional Details
                  </Typography>
                  <Stack spacing={0.5}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Solar Percentage:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {(financialData[0].financialDetails.solarPercentage * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    {financialData[0].financialDetails.federalIncentive > 0 && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Federal Incentive:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(financialData[0].financialDetails.federalIncentive)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          ) : (
            <Alert severity="warning">
              Financial analysis not available for this location
            </Alert>
          )}
        </TabPanel>

        {/* Details Tab */}
        <TabPanel value={activeTab} index={2}>
          <Stack spacing={2}>
            {/* Building Location */}
            {buildingInfo?.center && (
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <RoofingIcon color="action" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Building Location
                  </Typography>
                </Box>
                <Typography variant="body2" fontFamily="monospace">
                  {buildingInfo.center.latitude.toFixed(5)}, {buildingInfo.center.longitude.toFixed(5)}
                </Typography>
                {buildingInfo.postalCode && (
                  <Typography variant="body2" color="text.secondary">
                    {buildingInfo.postalCode}
                  </Typography>
                )}
              </Box>
            )}

            {/* Data Quality */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Data Information
              </Typography>
              <Stack spacing={0.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Quality:
                  </Typography>
                  <Chip
                    label={buildingInfo?.imageryQuality || 'N/A'}
                    size="small"
                    color={buildingInfo?.imageryQuality === 'HIGH' ? 'success' : 'default'}
                  />
                </Box>
                {buildingInfo?.imageryProcessedDate && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Processed:
                    </Typography>
                    <Typography variant="body2">
                      {new Date(buildingInfo.imageryProcessedDate.year,
                        buildingInfo.imageryProcessedDate.month - 1,
                        buildingInfo.imageryProcessedDate.day).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Roof Segments */}
            {solarConfig.bestConfig?.roofSegmentSummaries > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Roof Analysis
                </Typography>
                <Typography variant="body2">
                  {solarConfig.bestConfig.roofSegmentSummaries} roof segment{solarConfig.bestConfig.roofSegmentSummaries > 1 ? 's' : ''} analyzed
                </Typography>
              </Box>
            )}

            {/* API Source */}
            <Box>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="caption">
                  Data provided by Google Solar API using high-resolution aerial imagery and machine learning models.
                </Typography>
              </Alert>
            </Box>
          </Stack>
        </TabPanel>

        {/* Action Hint */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
            <Tooltip title="Click anywhere on the map to analyze another building">
              <InfoIcon fontSize="small" />
            </Tooltip>
            Click the map to analyze another building
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
