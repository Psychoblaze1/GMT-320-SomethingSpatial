import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, IconButton, Typography, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, LinearProgress, Tooltip, Zoom, Switch, FormControlLabel } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TuneIcon from '@mui/icons-material/Tune';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MapIcon from '@mui/icons-material/Map';
import SimpleModelViewer from './SimpleModelViewer';
import { BASEMAP_TYPES } from './OSMBasemap';

// Lightweight glass styles (local copy so we don't touch other files)
const glass = {
  backdropFilter: 'blur(8px)',
  background: 'rgba(255,255,255,0.65)',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
  border: '1px solid rgba(255,255,255,0.35)'
};
const glassDark = {
  backdropFilter: 'blur(6px)',
  background: 'rgba(0,0,0,0.35)',
  color: '#fff',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255,255,255,0.15)'
};

export default function ModelExperience({ binMetrics }) {
  const containerRef = useRef(null);
  const [isNight, setIsNight] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState('high');
  const [showBasemap, setShowBasemap] = useState(false);
  const [basemapType, setBasemapType] = useState(BASEMAP_TYPES.OSM);
  const [cameraData, setCameraData] = useState(null);

  // CSS-only visual effects so SimpleModelViewer stays untouched
  // I need to change the intensity oof the lights when turning the night mode and use CampusModelViewer colours
  const canvasFilter = useMemo(() => {
    if (quality === 'low') return 'blur(0.2px)';
    return 'none';
  }, [quality]);

  const handleScreenshot = () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `campus-view-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Handler for camera updates from 3D scene
  const handleCameraUpdate = useCallback((data) => {
    setCameraData(data);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        m: 0,
        p: 0,
      }}
    >
      {/* 3D model - passes basemap settings */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          filter: canvasFilter,
          transition: 'filter 200ms ease',
          zIndex: 1
        }}
      >
        <SimpleModelViewer 
          isNight={isNight} 
          showOSM={showBasemap} 
          basemapType={basemapType}
          onCameraUpdate={handleCameraUpdate} 
        />
      </Box>

      {/* Night overlay tint (visual only) */}
      {isNight && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(120% 90% at 50% 10%, rgba(10,25,41,0.0) 0%, rgba(10,25,41,0.45) 60%, rgba(10,25,41,0.7) 100%)'
          }}
        />
      )}

      {/* Home (top-left) */}
      <Stack sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
        <Tooltip title="Home (Overview)">
          <IconButton
            component={RouterLink}
            to="/"
            size="large"
            sx={{ ...glass, borderRadius: 2 }}
          >
            <HomeIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Admin">
          <IconButton
            component={RouterLink}
            to="/admin"
            size="large"
            sx={{ ...glass, borderRadius: 2 }}
          >
            <AdminPanelSettingsIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Basemap Control (top-left, below nav buttons) */}
      <Zoom in>
        <Box
          sx={{
            position: 'absolute',
            top: 140,
            left: 12,
            zIndex: 10,
            ...glass,
            borderRadius: 2,
            p: 1.5,
            minWidth: 200
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MapIcon fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Basemaps
            </Typography>
          </Box>
          
          {/* Toggle basemap on/off */}
          <FormControlLabel
            control={
              <Switch 
                checked={showBasemap} 
                onChange={(e) => setShowBasemap(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="caption">
                Show Basemap
              </Typography>
            }
          />

          {/* Basemap type selector */}
          {showBasemap && (
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={basemapType}
                label="Type"
                onChange={(e) => setBasemapType(e.target.value)}
              >
                <MenuItem value={BASEMAP_TYPES.OSM}>OpenStreetMap</MenuItem>
                <MenuItem value={BASEMAP_TYPES.SATELLITE}>Satellite</MenuItem>
                <MenuItem value={BASEMAP_TYPES.TOPO}>Topographic</MenuItem>
                <MenuItem value={BASEMAP_TYPES.DARK}>Dark Theme</MenuItem>
                <MenuItem value={BASEMAP_TYPES.STREETS}>Light Streets</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Zoom>

      {/* Quick controls (bottom-left) */}
      <Zoom in>
        <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10, display: 'flex', gap: 1 }}>
          <Tooltip title={isNight ? 'Day Mode' : 'Night Mode'}>
            <IconButton onClick={() => setIsNight(v => !v)} sx={{ ...glassDark }}>
              {isNight ? <WbSunnyIcon /> : <NightsStayIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Screenshot">
            <IconButton onClick={handleScreenshot} sx={{ ...glassDark }}>
              <CameraAltIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton onClick={() => setShowSettings(true)} sx={{ ...glassDark }}>
              <TuneIcon />
            </IconButton>
          </Tooltip>

          {!showStats && (
            <Tooltip title="Show Stats">
              <IconButton onClick={() => setShowStats(true)} sx={{ ...glassDark }}>
                <InfoIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Zoom>

      {/* Stats (top-right) */}
      {showStats && (
        <Zoom in>
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
              p: 2,
              borderRadius: 2,
              minWidth: 220,
              ...glass
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon fontSize="small" /> Statistics
              </Typography>
              <IconButton size="small" onClick={() => setShowStats(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Bins</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {binMetrics?.totalBins ?? 0}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Average Fill Level</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Number(binMetrics?.avgFillLevel ?? 0)}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {binMetrics?.avgFillLevel ?? 0}%
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Bins by Type</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                  {Object.entries(binMetrics?.binsByType ?? {}).map(([type, count]) => (
                    <Chip
                      key={type}
                      label={`${type}: ${count}`}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        height: 24,
                        color: '#fff',
                        bgcolor: type === 'recycling' ? '#2196f3' : type === 'compost' ? '#4caf50' : '#757575'
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              {(binMetrics?.needsAttention ?? 0) > 0 && (
                <Chip label={`${binMetrics.needsAttention} bins need attention`} color="warning" size="small" />
              )}
            </Stack>
          </Box>
        </Zoom>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Display Settings</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1.5 }}>
            <InputLabel>Graphics Quality</InputLabel>
            <Select value={quality} label="Graphics Quality" onChange={(e) => setQuality(e.target.value)}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              This setting uses visual filters only (no changes to the 3D engine).
            </Typography>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}