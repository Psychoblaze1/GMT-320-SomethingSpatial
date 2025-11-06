import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Divider,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Layers as LayersIcon,
  Domain as DomainIcon,
  Timeline as TimelineIcon,
  LocationOn as LocationOnIcon,
  Map as MapIcon,
  Satellite as SatelliteIcon,
  SolarPower as SolarPowerIcon,
  Park as ParkIcon,
} from '@mui/icons-material';
import { glassStyle } from '../../theme';

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`layer-tabpanel-${index}`}
      aria-labelledby={`layer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const LayerLegendPanel = ({
  layerVisibility,
  onLayerToggle,
  activeBasemap,
  onBasemapChange,
  onClose,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLayerToggle = (layerId) => {
    onLayerToggle(layerId, !layerVisibility[layerId]);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        top: 90,
        left: 20,
        width: 320,
        maxHeight: 'calc(100vh - 120px)',
        zIndex: 1001,
        ...glassStyle,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LayersIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Map Layers
          </Typography>
        </Box>
        <Box>
          <Tooltip title={isExpanded ? 'Collapse' : 'Expand'}>
            <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Layers" />
          <Tab label="Legend" />
        </Tabs>

        {/* Tab Panel 1 - Layer Controls */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 2, pb: 2, maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
            {/* Basemap Section */}
            <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
              <FormLabel
                component="legend"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <MapIcon fontSize="small" />
                Basemap
              </FormLabel>
              <RadioGroup
                value={activeBasemap.toString()}
                onChange={(e) => onBasemapChange(parseInt(e.target.value))}
              >
                <FormControlLabel
                  value="12"
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapIcon fontSize="small" />
                      <Typography variant="body2">OSM Standard</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="13"
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MapIcon fontSize="small" />
                      <Typography variant="body2">Google Maps</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="14"
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SatelliteIcon fontSize="small" />
                      <Typography variant="body2">Google Satellite</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            {/* Feature Layers Section */}
            <FormControl component="fieldset" fullWidth>
              <FormLabel
                component="legend"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <LayersIcon fontSize="small" />
                Feature Layers
              </FormLabel>

              {/* Solar */}
              <FormControlLabel
                control={
                  <Switch
                    checked={layerVisibility[0] !== false}
                    onChange={() => handleLayerToggle(0)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SolarPowerIcon fontSize="small" sx={{ color: '#ff9800' }} />
                    <Typography variant="body2">Solar</Typography>
                  </Box>
                }
              />

              {/* Buildings */}
              <FormControlLabel
                control={
                  <Switch
                    checked={layerVisibility[2] !== false}
                    onChange={() => handleLayerToggle(2)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DomainIcon fontSize="small" sx={{ color: '#1976d2' }} />
                    <Typography variant="body2">Buildings</Typography>
                  </Box>
                }
              />

              {/* Blind Walkways */}
              <FormControlLabel
                control={
                  <Switch
                    checked={layerVisibility[3] !== false}
                    onChange={() => handleLayerToggle(3)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon fontSize="small" sx={{ color: '#f57c00' }} />
                    <Typography variant="body2">Blind Walkways</Typography>
                  </Box>
                }
              />

              {/* Survey Points */}
              <FormControlLabel
                control={
                  <Switch
                    checked={layerVisibility[5] !== false}
                    onChange={() => handleLayerToggle(5)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ color: '#2e7d32' }} />
                    <Typography variant="body2">Survey Points</Typography>
                  </Box>
                }
              />

              {/* Boreholes */}
              <FormControlLabel
                control={
                  <Switch
                    checked={layerVisibility[6] !== false}
                    onChange={() => handleLayerToggle(6)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                    <Typography variant="body2">Boreholes</Typography>
                  </Box>
                }
              />

              {/* Green Spaces */}
              <FormControlLabel
                control={
                  <Switch
                    checked={layerVisibility[7] !== false}
                    onChange={() => handleLayerToggle(7)}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ParkIcon fontSize="small" sx={{ color: '#4caf50' }} />
                    <Typography variant="body2">Green Spaces</Typography>
                  </Box>
                }
              />
            </FormControl>
          </Box>
        </TabPanel>

        {/* Tab Panel 2 - Legend */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 2, pb: 2, maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Layer symbols and descriptions
            </Typography>

            {/* Solar */}
            <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5, mb: 2 }}>
              <SolarPowerIcon sx={{ color: '#ff9800', mt: 0.5 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Solar
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Buildings with solar panel installation data (alternative view)
                </Typography>
              </Box>
            </Box>

            {/* Buildings */}
            <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5, mb: 2 }}>
              <DomainIcon sx={{ color: '#1976d2', mt: 0.5 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Buildings
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  3D building models with height information
                </Typography>
              </Box>
            </Box>

            {/* Blind Walkways */}
            <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5, mb: 2 }}>
              <TimelineIcon sx={{ color: '#f57c00', mt: 0.5 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Blind Walkways
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Accessible pathways for visually impaired navigation
                </Typography>
              </Box>
            </Box>

            {/* Survey Points */}
            <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5, mb: 2 }}>
              <LocationOnIcon sx={{ color: '#2e7d32', mt: 0.5 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Survey Points
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Survey point locations across campus
                </Typography>
              </Box>
            </Box>

            {/* Boreholes */}
            <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5, mb: 2 }}>
              <LocationOnIcon sx={{ color: '#d32f2f', mt: 0.5 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Boreholes
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Borehole drilling locations and data points
                </Typography>
              </Box>
            </Box>

            {/* Green Spaces */}
            <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5, mb: 2 }}>
              <ParkIcon sx={{ color: '#4caf50', mt: 0.5 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Green Spaces
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Parks, gardens, and natural green areas on campus
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Click on any feature in the 3D view to see detailed information
            </Typography>
          </Box>
        </TabPanel>
      </Collapse>
    </Paper>
  );
};

export default LayerLegendPanel;
