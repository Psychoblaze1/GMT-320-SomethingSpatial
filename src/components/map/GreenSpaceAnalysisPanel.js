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
import ParkIcon from '@mui/icons-material/Park';
import Co2Icon from '@mui/icons-material/Co2';
import InfoIcon from '@mui/icons-material/Info';
import NatureIcon from '@mui/icons-material/Nature';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function GreenSpaceAnalysisPanel({
  greenSpaceData,
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
            <Typography variant="h6">Analyzing Green Space...</Typography>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <LinearProgress color="success" />
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
            <Typography variant="h6">Analysis Error</Typography>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!greenSpaceData) {
    return null;
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatCurrency = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const { analysis, calculatedArea } = greenSpaceData;

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
            <ParkIcon color="success" fontSize="large" />
            <Box>
              <Typography variant="h6">{greenSpaceData.name}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {analysis.type.replace('-', ' ')}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Area Chips */}
        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
          {calculatedArea && (
            <>
              <Chip
                label={`${formatNumber(calculatedArea.squareMeters)} m²`}
                size="small"
                color="success"
              />
              <Chip
                label={`${calculatedArea.hectares} ha`}
                size="small"
                color="success"
                variant="outlined"
              />
            </>
          )}
        </Stack>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
        >
          <Tab icon={<NatureIcon />} label="Environment" />
          <Tab icon={<AttachMoneyIcon />} label="Economics" />
          <Tab icon={<InfoIcon />} label="Details" />
        </Tabs>

        {/* Environment Tab */}
        <TabPanel value={activeTab} index={0}>
          <Stack spacing={2}>
            {/* Carbon Offset */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Co2Icon color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Carbon Offset
                </Typography>
              </Box>
              <Box display="flex" alignItems="baseline" gap={1}>
                <Typography variant="h4" color="success.main">
                  {analysis.carbonOffsetPerYear}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  tons CO₂/year
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Equivalent to removing {Math.round(analysis.carbonOffsetPerYear / 4.6)} cars from the road
              </Typography>
            </Box>

            <Divider />

            {/* Oxygen Production */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <WaterDropIcon color="info" />
                <Typography variant="subtitle2" color="text.secondary">
                  Oxygen Production
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                {formatNumber(analysis.oxygenProductionPerYear)} kg O₂/year
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports ~{Math.round(analysis.oxygenProductionPerYear / 740)} people annually
              </Typography>
            </Box>

            {/* Tree Count */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <NatureIcon color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Estimated Trees
                </Typography>
              </Box>
              <Typography variant="h6">
                {formatNumber(analysis.estimatedTrees)} trees
              </Typography>
            </Box>

            {/* Biodiversity Score */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Biodiversity Score
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={analysis.biodiversityScore * 10}
                    color={analysis.biodiversityScore >= 8 ? 'success' : analysis.biodiversityScore >= 6 ? 'warning' : 'error'}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  {analysis.biodiversityScore}/10
                </Typography>
              </Box>
            </Box>

            {/* Water Retention */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <WaterDropIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Water Retention Capacity
                </Typography>
              </Box>
              <Typography variant="h6">
                {formatNumber(analysis.waterRetentionCapacity)} L
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Helps reduce stormwater runoff
              </Typography>
            </Box>

            {/* Cooling Effect */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <ThermostatIcon color="info" />
                <Typography variant="subtitle2" color="text.secondary">
                  Cooling Effect
                </Typography>
              </Box>
              <Chip
                label={analysis.coolingEffect}
                color={analysis.coolingEffect === 'High' ? 'success' : analysis.coolingEffect === 'Medium' ? 'warning' : 'default'}
                size="small"
              />
            </Box>
          </Stack>
        </TabPanel>

        {/* Economics Tab */}
        <TabPanel value={activeTab} index={1}>
          <Stack spacing={2}>
            {/* Maintenance Cost */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Annual Maintenance Cost
              </Typography>
              <Typography variant="h4" color="primary">
                {formatCurrency(analysis.maintenanceCost)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Includes mowing, irrigation, and upkeep
              </Typography>
            </Box>

            <Divider />

            {/* Cost Breakdown */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Cost per Unit Area
              </Typography>
              <Stack spacing={0.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Per Square Meter:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    R {(analysis.maintenanceCost / (calculatedArea?.squareMeters || greenSpaceData.area)).toFixed(2)}/m²
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Per Hectare:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    R {formatNumber(analysis.maintenanceCost / (calculatedArea?.hectares || (greenSpaceData.area / 10000)))}/ha
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Environmental Value */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Environmental Benefits Value
              </Typography>
              <Alert severity="success" icon={<Co2Icon />}>
                <Typography variant="body2">
                  Carbon offset value: <strong>R {formatNumber(analysis.carbonOffsetPerYear * 900)}/year</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Based on R900 per ton CO₂ social cost of carbon
                </Typography>
              </Alert>
            </Box>

            {/* ROI Indicator */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Environmental ROI
              </Typography>
              <Box display="flex" alignItems="baseline" gap={1}>
                <Typography variant="h6" color="success.main">
                  {((analysis.carbonOffsetPerYear * 900 / analysis.maintenanceCost) * 100).toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  return on investment
                </Typography>
              </Box>
            </Box>
          </Stack>
        </TabPanel>

        {/* Details Tab */}
        <TabPanel value={activeTab} index={2}>
          <Stack spacing={2}>
            {/* Area Comparison */}
            {calculatedArea && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Area Measurement
                </Typography>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Calculated (Turf.js):
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatNumber(calculatedArea.squareMeters)} m²
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Static Data:
                    </Typography>
                    <Typography variant="body2">
                      {formatNumber(greenSpaceData.area)} m²
                    </Typography>
                  </Box>
                  {Math.abs(calculatedArea.squareMeters - greenSpaceData.area) > 100 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="warning.main">
                        Difference:
                      </Typography>
                      <Typography variant="body2" color="warning.main">
                        {formatNumber(Math.abs(calculatedArea.squareMeters - greenSpaceData.area))} m²
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {/* Green Space Type */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Green Space Classification
              </Typography>
              <Chip
                label={analysis.type.replace('-', ' ').toUpperCase()}
                color="success"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>

            {/* Coordinates Info */}
            {greenSpaceData.polygon && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Polygon Boundaries
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {greenSpaceData.polygon.length} coordinate points
                </Typography>
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                  Center: {greenSpaceData.polygon[0][1].toFixed(5)}, {greenSpaceData.polygon[0][0].toFixed(5)}
                </Typography>
              </Box>
            )}

            {/* Calculation Method */}
            <Box>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="caption">
                  Area calculated using Turf.js geodesic polygon algorithm, which accounts for Earth's curvature for accurate measurements.
                </Typography>
              </Alert>
            </Box>
          </Stack>
        </TabPanel>

        {/* Action Hint */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
            <Tooltip title="Click another green space on the map to analyze">
              <InfoIcon fontSize="small" />
            </Tooltip>
            Click another green space to analyze
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
