// Coordinate Picker - Interactive map tool for selecting coordinates
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
import 'mapbox-gl/dist/mapbox-gl.css';

const CAMPUS_CENTER = {
  longitude: 28.2293,
  latitude: -25.7479,
  zoom: 16,
  pitch: 0,
  bearing: 0
};

export default function CoordinatePicker({ open, onClose, onSelect, initialCoords = null }) {
  const [viewState, setViewState] = useState(CAMPUS_CENTER);
  const [selectedPoint, setSelectedPoint] = useState(initialCoords || null);
  const [manualLat, setManualLat] = useState(initialCoords ? initialCoords.latitude : '');
  const [manualLon, setManualLon] = useState(initialCoords ? initialCoords.longitude : '');

  const handleMapClick = (info) => {
    if (info.coordinate) {
      const [longitude, latitude] = info.coordinate;
      setSelectedPoint({ longitude, latitude });
      setManualLat(latitude.toFixed(6));
      setManualLon(longitude.toFixed(6));
    }
  };

  const handleManualUpdate = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (!isNaN(lat) && !isNaN(lon)) {
      setSelectedPoint({ latitude: lat, longitude: lon });
      setViewState({ ...viewState, latitude: lat, longitude: lon });
    }
  };

  const handleReset = () => {
    setViewState(CAMPUS_CENTER);
  };

  const handleCopyCoords = () => {
    if (selectedPoint) {
      const coordString = `${selectedPoint.latitude}, ${selectedPoint.longitude}`;
      navigator.clipboard.writeText(coordString);
    }
  };

  const handleSelect = () => {
    if (selectedPoint && onSelect) {
      onSelect(selectedPoint);
      onClose();
    }
  };

  const layers = selectedPoint
    ? [
        new ScatterplotLayer({
          id: 'selected-point',
          data: [selectedPoint],
          getPosition: d => [d.longitude, d.latitude],
          getFillColor: [255, 0, 0],
          getRadius: 200,
          radiusMinPixels: 10,
          radiusMaxPixels: 20,
          pickable: false
        })
      ]
    : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Select Coordinates
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Click on the map to select a location or enter coordinates manually.
        </Alert>

        {/* Manual Coordinate Input */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Latitude"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              size="small"
              type="number"
              inputProps={{ step: 0.000001 }}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Longitude"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              size="small"
              type="number"
              inputProps={{ step: 0.000001 }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleManualUpdate}
              size="small"
              sx={{ height: '40px' }}
            >
              Go
            </Button>
          </Grid>
        </Grid>

        {/* Map */}
        <Box sx={{ position: 'relative', height: 400, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
          <DeckGL
            viewState={viewState}
            onViewStateChange={({ viewState }) => setViewState(viewState)}
            controller={true}
            layers={layers}
            onClick={handleMapClick}
          >
            <Map
              mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'}
            />
          </DeckGL>

          {/* Map Controls */}
          <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Tooltip title="Reset to Campus Center">
              <IconButton
                size="small"
                onClick={handleReset}
                sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
              >
                <MyLocationIcon />
              </IconButton>
            </Tooltip>
            {selectedPoint && (
              <Tooltip title="Copy Coordinates">
                <IconButton
                  size="small"
                  onClick={handleCopyCoords}
                  sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Selected Coordinates Display */}
          {selectedPoint && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                p: 1,
                borderRadius: 1,
                boxShadow: 2
              }}
            >
              <Typography variant="caption" fontWeight="bold" display="block">
                Selected Point:
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
                Lat: {selectedPoint.latitude.toFixed(6)}
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
                Lon: {selectedPoint.longitude.toFixed(6)}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Tip: Use mouse wheel to zoom, drag to pan
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          disabled={!selectedPoint}
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );
}
