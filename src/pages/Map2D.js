import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { PolygonLayer, ScatterplotLayer, BitmapLayer } from '@deck.gl/layers';
import {
  Box,
  Paper,
  Typography,
  Stack,
  FormControlLabel,
  Switch,
  Tooltip,
  IconButton,
  Fade,
  Select,
  MenuItem,
  FormControl,
  Snackbar,
  Alert as MuiAlert,
  Button,
  ButtonGroup
} from '@mui/material';
import MainLayout from '../components/layout/MainLayout';
import {
  findClosestBuilding,
  fetchDataLayers,
  getSolarPanelConfig,
  getBuildingInfo
} from '../services/solarApiService';
import {
  findGreenSpaceAtPoint,
  analyzeGreenSpace
} from '../services/greenSpaceService';
import { getSolarFluxLayer, LAYER_TYPES } from '../services/solarGeoTiffService';
import SolarInsightsPanel from '../components/map/SolarInsightsPanel';
import GreenSpaceAnalysisPanel from '../components/map/GreenSpaceAnalysisPanel';
import RainwaterHarvestingPanel from '../components/map/RainwaterHarvestingPanel';

// Icons
import LayersIcon from '@mui/icons-material/Layers';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import ParkIcon from '@mui/icons-material/Park';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import MapIcon from '@mui/icons-material/Map';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import DrawIcon from '@mui/icons-material/Draw';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

// Google Maps API Key - move to .env in production
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyD8EVh1LETYcVf4bZATYn1utuX9lG2WT5Q';

// Campus center coordinates - University of Pretoria main campus
const CAMPUS_CENTER = {
  lat: -25.7545,
  lng: 28.2293
};

// Map type options for Google Maps
const MAP_TYPES = [
  { value: 'roadmap', label: 'Roadmap', icon: <MapIcon /> },
  { value: 'satellite', label: 'Satellite', icon: <SatelliteAltIcon /> },
  { value: 'hybrid', label: 'Hybrid', icon: <SatelliteAltIcon /> },
  { value: 'terrain', label: 'Terrain', icon: <ParkIcon /> }
];

// Removed MAP_MODES and coordsToLatLng - using real polygon coordinates from data

export default function Map2D() {
  const mapRef = useRef(null);
  const deckOverlayRef = useRef(null);
  const [map, setMap] = useState(null);
  const [mapType, setMapType] = useState('satellite'); // Default to satellite for better green space visibility

  // Solar API state
  const [solarAnalysisMode, setSolarAnalysisMode] = useState(false);
  const [solarData, setSolarData] = useState(null);
  const [loadingSolar, setLoadingSolar] = useState(false);
  const [solarError, setSolarError] = useState(null);
  const [solarFluxLayer, setSolarFluxLayer] = useState(null);
  const [showFluxOverlay, setShowFluxOverlay] = useState(true); // Toggle for flux visualization

  // Green Space Analysis state
  const [greenSpaceAnalysisMode, setGreenSpaceAnalysisMode] = useState(false);
  const [greenSpaceData, setGreenSpaceData] = useState(null);
  const [loadingGreenSpace, setLoadingGreenSpace] = useState(false);
  const [greenSpaceError, setGreenSpaceError] = useState(null);
  const [greenSpaceLayerData, setGreenSpaceLayerData] = useState([]);

  // Rainwater Harvesting Analysis state
  const [rainwaterAnalysisMode, setRainwaterAnalysisMode] = useState(false);
  const [rainwaterData, setRainwaterData] = useState(null);
  const [loadingRainwater, setLoadingRainwater] = useState(false);
  const [rainwaterError, setRainwaterError] = useState(null);

  // Custom polygon drawing state
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [customPolygon, setCustomPolygon] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Initialize Google Maps
  useEffect(() => {
    let isMounted = true;
    let scriptElement = null;

    // Load Google Maps script
    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.Map) {
        // Already loaded - check if it's fully initialized
        if (window.google.maps.version) {
          initializeMap();
          return;
        }
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        // Script is already in the DOM, wait for it to load
        if (window.google && window.google.maps && window.google.maps.Map) {
          initializeMap();
        } else {
          existingScript.addEventListener('load', () => {
            if (isMounted) {
              // Wait a bit for Google Maps to fully initialize
              setTimeout(() => {
                if (isMounted) {
                  initializeMap();
                }
              }, 100);
            }
          });
        }
        return;
      }

      // Create new script element
      scriptElement = document.createElement('script');
      scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
      scriptElement.async = true;
      scriptElement.defer = true;
      scriptElement.onload = () => {
        if (isMounted) {
          // Wait for Google Maps to fully initialize
          setTimeout(() => {
            if (isMounted && window.google && window.google.maps && window.google.maps.Map) {
              initializeMap();
            }
          }, 100);
        }
      };
      scriptElement.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load Google Maps. Please refresh the page.',
          severity: 'error'
        });
      };
      document.head.appendChild(scriptElement);
    };

    const initializeMap = () => {
      if (!mapRef.current) {
        console.error('Map container not available');
        return;
      }

      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        console.error('Google Maps API not fully loaded');
        return;
      }

      try {
        const googleMap = new window.google.maps.Map(mapRef.current, {
          center: CAMPUS_CENTER,
          zoom: 17,
          mapTypeId: 'satellite',
          tilt: 0,
          heading: 0,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          scaleControl: true
        });

        // Wait for map to be fully initialized before setting state
        window.google.maps.event.addListenerOnce(googleMap, 'idle', () => {
          if (isMounted) {
            try {
              const overlay = new GoogleMapsOverlay({
                layers: []
              });
              overlay.setMap(googleMap);
              deckOverlayRef.current = overlay;
              setMap(googleMap);
            } catch (error) {
              console.error('Error initializing deck.gl overlay:', error);
              setSnackbar({
                open: true,
                message: 'Error initializing map layers',
                severity: 'error'
              });
            }
          }
        });
      } catch (error) {
        console.error('Error initializing Google Map:', error);
        setSnackbar({
          open: true,
          message: 'Error initializing map. Please refresh the page.',
          severity: 'error'
        });
      }
    };

    loadGoogleMaps();

    return () => {
      isMounted = false;
      // Clean up the overlay
      if (deckOverlayRef.current) {
        try {
          deckOverlayRef.current.setMap(null);
        } catch (error) {
          console.error('Error cleaning up deck overlay:', error);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add Solar API click handler to map
  useEffect(() => {
    if (!map || !solarAnalysisMode) return;

    const clickListener = map.addListener('click', async (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      setLoadingSolar(true);
      setSolarError(null);
      setSolarData(null);

      try {
        // Step 1: Get building insights
        const buildingData = await findClosestBuilding(lat, lng, GOOGLE_MAPS_API_KEY);
        const solarConfig = getSolarPanelConfig(buildingData);
        const buildingInfo = getBuildingInfo(buildingData);

        setSolarData({
          buildingData,
          solarConfig,
          buildingInfo
        });

        // Step 2: Fetch GeoTIFF data layers separately
        let hasFluxLayer = false;
        try {
          console.log('🔍 Starting GeoTIFF fetch process...');
          console.log('📍 Location:', { lat, lng });
          console.log('🔑 API Key present:', !!GOOGLE_MAPS_API_KEY);
          console.log('📦 fetchDataLayers function:', typeof fetchDataLayers);

          // Use BASE quality with EXPANDED_COVERAGE for broadest coverage
          // BASE quality (0.25 m/pixel) works globally with experimental expanded coverage
          // Note: MEDIUM quality has known issues and may not work
          const dataLayersOptions = {
            radiusMeters: 100,
            requiredQuality: 'BASE',
            useExpandedCoverage: true
          };
          console.log('⚙️ Options:', dataLayersOptions);

          console.log('📡 Calling fetchDataLayers...');
          const dataLayers = await fetchDataLayers(lat, lng, GOOGLE_MAPS_API_KEY, dataLayersOptions);
          console.log('✅ Data layers received:', dataLayers);

          console.log('🎨 Fetching solar flux layer...');
          const fluxLayer = await getSolarFluxLayer(dataLayers, GOOGLE_MAPS_API_KEY, LAYER_TYPES.ANNUAL_FLUX);
          console.log('✅ Solar flux layer received:', fluxLayer);

          setSolarFluxLayer(fluxLayer);
          hasFluxLayer = true;
          console.log('✅ Solar flux layer state updated successfully');
        } catch (fluxError) {
          console.error('❌ Could not load solar flux overlay:', fluxError);
          console.error('❌ Error stack:', fluxError.stack);
          console.error('❌ Error type:', fluxError.constructor.name);

          // Check for specific error types
          if (fluxError.message?.includes('404') || fluxError.message?.includes('NOT_FOUND')) {
            console.warn('⚠️ Solar data not available for this location. Try a different area with coverage.');
          } else if (fluxError.message?.includes('403') || fluxError.message?.includes('PERMISSION_DENIED')) {
            console.error('🔒 API key issue. Check that Solar API is enabled in Google Cloud Console.');
          } else {
            console.error('💥 Unexpected error:', fluxError.message);
          }

          // Continue without flux overlay - not critical for building analysis
          setSolarFluxLayer(null);
        }

        // Show completion message (works with or without flux overlay)
        setSnackbar({
          open: true,
          message: hasFluxLayer ? 'Solar analysis complete with heat map!' : 'Solar analysis complete!',
          severity: 'success'
        });
      } catch (error) {
        console.error('Solar API error:', error);
        setSolarError(error.message);
        setSnackbar({
          open: true,
          message: error.message,
          severity: 'error'
        });
      } finally {
        setLoadingSolar(false);
      }
    });

    // Cleanup listener
    return () => {
      if (clickListener) {
        window.google.maps.event.removeListener(clickListener);
      }
    };
  }, [map, solarAnalysisMode]);

  // Add Green Space Analysis click handler to map
  useEffect(() => {
    if (!map || !greenSpaceAnalysisMode) return;

    const clickListener = map.addListener('click', async (event) => {
      // Validate event and latLng
      if (!event || !event.latLng) {
        console.error('Invalid click event:', event);
        return;
      }

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      // If in drawing mode, add point to polygon
      if (drawingMode) {
        const newPoints = [...drawnPoints, [lng, lat]];
        setDrawnPoints(newPoints);

        setSnackbar({
          open: true,
          message: `Point ${newPoints.length} added. Click "Finish Drawing" when done.`,
          severity: 'info'
        });
        return;
      }

      setLoadingGreenSpace(true);
      setGreenSpaceError(null);
      setGreenSpaceData(null);

      try {
        // Find green space at clicked location
        const greenSpace = findGreenSpaceAtPoint(lat, lng);

        if (!greenSpace) {
          throw new Error('No predefined green space here. Use "Draw Custom Area" to measure any location.');
        }

        // Analyze the green space
        const analysis = analyzeGreenSpace(greenSpace, true);

        setGreenSpaceData(analysis);

        setSnackbar({
          open: true,
          message: `Analyzed ${greenSpace.name}!`,
          severity: 'success'
        });
      } catch (error) {
        console.error('Green space analysis error:', error);
        setGreenSpaceError(error.message);
        setSnackbar({
          open: true,
          message: error.message,
          severity: 'warning'
        });
      } finally {
        setLoadingGreenSpace(false);
      }
    });

    // Cleanup listener
    return () => {
      if (clickListener) {
        window.google.maps.event.removeListener(clickListener);
      }
    };
  }, [map, greenSpaceAnalysisMode, drawingMode, drawnPoints]);

  // Add Rainwater Harvesting Analysis click handler to map
  useEffect(() => {
    if (!map || !rainwaterAnalysisMode) return;

    const clickListener = map.addListener('click', async (event) => {
      if (!event || !event.latLng) {
        console.error('Invalid click event:', event);
        return;
      }

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      setLoadingRainwater(true);
      setRainwaterError(null);
      setRainwaterData(null);

      try {
        // Use Google Solar API to find building (same as solar mode)
        const buildingData = await findClosestBuilding(lat, lng, GOOGLE_MAPS_API_KEY);
        const buildingInfo = getBuildingInfo(buildingData);

        setRainwaterData({
          buildingData,
          buildingInfo
        });

        setSnackbar({
          open: true,
          message: 'Rainwater analysis complete!',
          severity: 'success'
        });
      } catch (error) {
        console.error('Rainwater analysis error:', error);
        setRainwaterError(error.message);
        setSnackbar({
          open: true,
          message: error.message,
          severity: 'error'
        });
      } finally {
        setLoadingRainwater(false);
      }
    });

    // Cleanup listener
    return () => {
      if (clickListener) {
        window.google.maps.event.removeListener(clickListener);
      }
    };
  }, [map, rainwaterAnalysisMode]);

  // Handle map type change
  const handleMapTypeChange = (newType) => {
    setMapType(newType);
    if (map) {
      map.setMapTypeId(newType);
      map.setTilt(0); // Always top-down view
    }
  };

  // Handle finishing polygon drawing
  const handleFinishDrawing = () => {
    if (drawnPoints.length < 3) {
      setSnackbar({
        open: true,
        message: 'Need at least 3 points to create a polygon',
        severity: 'warning'
      });
      return;
    }

    // Close the polygon
    const closedPolygon = [...drawnPoints, drawnPoints[0]];

    // Create custom green space object
    const customGreenSpace = {
      id: 'custom',
      name: 'Custom Measured Area',
      polygon: closedPolygon,
      type: 'lawn' // Default type for calculations
    };

    // Analyze the custom area
    const analysis = analyzeGreenSpace(customGreenSpace, true);

    // Update state in correct order to trigger re-render
    setDrawingMode(false);
    setDrawnPoints([]);
    setCustomPolygon(closedPolygon);
    setGreenSpaceData(analysis);

    setSnackbar({
      open: true,
      message: 'Custom area analyzed!',
      severity: 'success'
    });
  };

  // Handle canceling drawing
  const handleCancelDrawing = () => {
    setDrawingMode(false);
    setDrawnPoints([]);
    setSnackbar({
      open: true,
      message: 'Drawing cancelled',
      severity: 'info'
    });
  };

  // Handle starting new drawing
  const handleStartDrawing = () => {
    // Clear all previous state
    setCustomPolygon(null);
    setGreenSpaceData(null);
    setGreenSpaceError(null);
    setDrawnPoints([]);

    // Enable drawing mode last so the click listener sees clean state
    setDrawingMode(true);

    setSnackbar({
      open: true,
      message: 'Click on the map to draw polygon vertices. Need at least 3 points.',
      severity: 'info'
    });
  };

  // Removed predefined green space layer - only show selected/custom polygons

  // Deck.gl layers - only show green spaces and analysis highlights
  const layers = useMemo(() => {
    const layerArray = [];

    // Green spaces layer - only show when in analysis mode
    if (greenSpaceLayerData.length > 0) {
      layerArray.push(
        new PolygonLayer({
          id: 'green-spaces-layer',
          data: greenSpaceLayerData,
          pickable: true,
          stroked: true,
          filled: true,
          wireframe: false,
          lineWidthMinPixels: 1,
          getPolygon: d => d.polygon,
          getFillColor: d => d.color,
          getLineColor: [67, 160, 71],
          getLineWidth: 1
        })
      );
    }

    // Drawing mode: show points being drawn
    if (drawingMode && drawnPoints.length > 0) {
      layerArray.push(
        new ScatterplotLayer({
          id: 'drawn-points',
          data: drawnPoints.map((pt, idx) => ({ position: pt, index: idx })),
          pickable: false,
          opacity: 0.9,
          stroked: true,
          filled: true,
          radiusScale: 1,
          radiusMinPixels: 8,
          radiusMaxPixels: 12,
          lineWidthMinPixels: 2,
          getPosition: d => d.position,
          getRadius: 8,
          getFillColor: [255, 152, 0, 200],
          getLineColor: [255, 255, 255, 255]
        })
      );

      // Show lines connecting the points
      if (drawnPoints.length > 1) {
        const lineData = [{
          path: [...drawnPoints]
        }];

        layerArray.push(
          new PolygonLayer({
            id: 'drawing-preview',
            data: lineData,
            pickable: false,
            stroked: true,
            filled: false,
            wireframe: false,
            lineWidthMinPixels: 3,
            getPolygon: d => d.path,
            getLineColor: [255, 152, 0, 200],
            getLineWidth: 3
          })
        );
      }
    }

    // Show custom polygon if it exists
    if (customPolygon && !drawingMode) {
      layerArray.push(
        new PolygonLayer({
          id: 'custom-polygon',
          data: [{ polygon: customPolygon }],
          pickable: false,
          stroked: true,
          filled: true,
          wireframe: false,
          lineWidthMinPixels: 3,
          getPolygon: d => d.polygon,
          getFillColor: [33, 150, 243, 100],
          getLineColor: [21, 101, 192, 255],
          getLineWidth: 3
        })
      );
    }

    // Solar flux heat map overlay (GeoTIFF)
    if (showFluxOverlay && solarFluxLayer && solarData) {
      console.log('✅ Adding solar flux heat map layer to map:', {
        bounds: solarFluxLayer.bounds,
        boundsFormat: Array.isArray(solarFluxLayer.bounds) ?
          (Array.isArray(solarFluxLayer.bounds[0]) ? 'nested array (wrong)' : 'flat array (correct)') : 'invalid',
        width: solarFluxLayer.width,
        height: solarFluxLayer.height,
        hasDataUrl: !!solarFluxLayer.dataUrl
      });

      layerArray.push(
        new BitmapLayer({
          id: 'solar-flux-heatmap',
          image: solarFluxLayer.dataUrl,
          bounds: solarFluxLayer.bounds,
          opacity: 0.7,
          pickable: false,
          desaturate: 0  // Keep colors vibrant
        })
      );
    }

    // Solar API building highlight layer
    if (solarData?.buildingInfo?.center) {
      layerArray.push(
        new ScatterplotLayer({
          id: 'solar-api-building',
          data: [{
            position: [solarData.buildingInfo.center.longitude, solarData.buildingInfo.center.latitude],
            panelCount: solarData.solarConfig?.maxArrayPanelsCount || 0
          }],
          pickable: false,
          opacity: 0.6,
          stroked: true,
          filled: true,
          radiusScale: 6,
          radiusMinPixels: 20,
          radiusMaxPixels: 60,
          lineWidthMinPixels: 3,
          getPosition: d => d.position,
          getRadius: d => Math.max(15, d.panelCount / 5),
          getFillColor: [255, 193, 7, 100],
          getLineColor: [255, 152, 0, 255]
        })
      );

      // Add pulsing effect with second layer
      layerArray.push(
        new ScatterplotLayer({
          id: 'solar-api-building-pulse',
          data: [{
            position: [solarData.buildingInfo.center.longitude, solarData.buildingInfo.center.latitude]
          }],
          pickable: false,
          opacity: 0.3,
          stroked: false,
          filled: true,
          radiusScale: 8,
          radiusMinPixels: 30,
          radiusMaxPixels: 80,
          getPosition: d => d.position,
          getRadius: 20,
          getFillColor: [255, 193, 7, 80]
        })
      );
    }

    // Green Space highlight layer - only show if it's not a custom polygon
    if (greenSpaceData?.polygon && greenSpaceData?.id !== 'custom') {
      layerArray.push(
        new PolygonLayer({
          id: 'green-space-highlight',
          data: [{
            polygon: greenSpaceData.polygon,
            name: greenSpaceData.name
          }],
          pickable: false,
          stroked: true,
          filled: true,
          wireframe: false,
          lineWidthMinPixels: 4,
          getPolygon: d => d.polygon,
          getFillColor: [139, 195, 74, 150], // Bright green with transparency
          getLineColor: [76, 175, 80, 255], // Green border
          getLineWidth: 4
        })
      );

      // Add pulsing border effect
      layerArray.push(
        new PolygonLayer({
          id: 'green-space-highlight-pulse',
          data: [{
            polygon: greenSpaceData.polygon
          }],
          pickable: false,
          stroked: true,
          filled: false,
          wireframe: false,
          lineWidthMinPixels: 6,
          getPolygon: d => d.polygon,
          getLineColor: [205, 220, 57, 180], // Light green-yellow pulsing border
          getLineWidth: 6
        })
      );
    }

    // Rainwater harvesting building highlight - show detected building
    if (rainwaterData?.buildingInfo?.center) {
      layerArray.push(
        new ScatterplotLayer({
          id: 'rainwater-building-highlight',
          data: [{
            position: [rainwaterData.buildingInfo.center.longitude, rainwaterData.buildingInfo.center.latitude],
            area: rainwaterData.buildingData.solarPotential?.wholeRoofStats?.areaMeters2 || 0
          }],
          pickable: false,
          opacity: 0.7,
          stroked: true,
          filled: true,
          radiusScale: 6,
          radiusMinPixels: 20,
          radiusMaxPixels: 60,
          lineWidthMinPixels: 3,
          getPosition: d => d.position,
          getRadius: d => Math.max(15, Math.sqrt(d.area) / 2),
          getFillColor: [33, 150, 243, 150], // Blue
          getLineColor: [21, 101, 192, 255] // Dark blue border
        })
      );

      // Add pulsing effect for detected building
      layerArray.push(
        new ScatterplotLayer({
          id: 'rainwater-building-pulse',
          data: [{
            position: [rainwaterData.buildingInfo.center.longitude, rainwaterData.buildingInfo.center.latitude]
          }],
          pickable: false,
          opacity: 0.3,
          stroked: false,
          filled: true,
          radiusScale: 8,
          radiusMinPixels: 30,
          radiusMaxPixels: 80,
          getPosition: d => d.position,
          getRadius: 20,
          getFillColor: [33, 150, 243, 80]
        })
      );
    }

    return layerArray;
  }, [greenSpaceLayerData, solarData, solarFluxLayer, showFluxOverlay, greenSpaceData, drawingMode, drawnPoints, customPolygon, greenSpaceAnalysisMode, rainwaterAnalysisMode, rainwaterData]);

  // Update deck.gl overlay when layers change
  useEffect(() => {
    if (deckOverlayRef.current) {
      deckOverlayRef.current.setProps({ layers });
    }
  }, [layers]);

  return (
    <MainLayout title="2D Campus Map">
      <Box sx={{ position: 'relative', height: 'calc(100vh - 64px)' }}>
        {/* Google Maps Container */}
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />

        {/* Layer Controls Panel */}
        <Fade in timeout={500}>
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              p: 2,
              maxWidth: 320,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <LayersIcon color="primary" />
              <Typography variant="h6">Map Controls</Typography>
            </Box>

            <Stack spacing={2}>
              {/* Map Type Selector */}
              <Box>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  Map Style
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={mapType}
                    onChange={(e) => handleMapTypeChange(e.target.value)}
                  >
                    {MAP_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {type.icon}
                          <Typography variant="body2">{type.label}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Solar Analysis Mode */}
              <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={solarAnalysisMode}
                      onChange={(e) => {
                        const isEnabled = e.target.checked;
                        setSolarAnalysisMode(isEnabled);

                        // Disable other modes if enabling solar mode
                        if (isEnabled) {
                          if (greenSpaceAnalysisMode) {
                            setGreenSpaceAnalysisMode(false);
                            setGreenSpaceData(null);
                          }
                          if (rainwaterAnalysisMode) {
                            setRainwaterAnalysisMode(false);
                            setRainwaterData(null);
                          }
                        }

                        if (!isEnabled) {
                          setSolarData(null);
                          setSolarError(null);
                          setSolarFluxLayer(null);
                        } else {
                          setSnackbar({
                            open: true,
                            message: 'Click any building to analyze solar potential',
                            severity: 'info'
                          });
                        }
                      }}
                      size="small"
                      color="warning"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <SolarPowerIcon fontSize="small" color={solarAnalysisMode ? 'warning' : 'action'} />
                      <Typography variant="body2">Solar Analysis Mode</Typography>
                    </Box>
                  }
                />
                {solarAnalysisMode && (
                  <>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
                      Click any building to analyze solar potential
                    </Typography>
                    {solarFluxLayer && (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showFluxOverlay}
                            onChange={(e) => setShowFluxOverlay(e.target.checked)}
                            size="small"
                            color="warning"
                          />
                        }
                        label={
                          <Typography variant="caption">
                            Show Solar Flux Heat Map
                          </Typography>
                        }
                        sx={{ mt: 1, ml: 2 }}
                      />
                    )}
                  </>
                )}
              </Box>

              {/* Green Space Analysis Mode */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={greenSpaceAnalysisMode}
                      onChange={(e) => {
                        const isEnabled = e.target.checked;
                        setGreenSpaceAnalysisMode(isEnabled);

                        // Disable other modes if enabling green space mode
                        if (isEnabled) {
                          if (solarAnalysisMode) {
                            setSolarAnalysisMode(false);
                            setSolarData(null);
                          }
                          if (rainwaterAnalysisMode) {
                            setRainwaterAnalysisMode(false);
                            setRainwaterData(null);
                          }
                        }

                        if (!isEnabled) {
                          setGreenSpaceData(null);
                          setGreenSpaceError(null);
                        } else {
                          setSnackbar({
                            open: true,
                            message: 'Click any green space to calculate area and environmental impact',
                            severity: 'info'
                          });
                        }
                      }}
                      size="small"
                      color="success"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <ParkIcon fontSize="small" color={greenSpaceAnalysisMode ? 'success' : 'action'} />
                      <Typography variant="body2">Green Space Analysis Mode</Typography>
                    </Box>
                  }
                />
                {greenSpaceAnalysisMode && !drawingMode && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
                    Click green areas or draw custom polygons
                  </Typography>
                )}

                {/* Drawing Mode Controls */}
                {greenSpaceAnalysisMode && (
                  <Box sx={{ mt: 2, ml: 4 }}>
                    {!drawingMode ? (
                      <Button
                        variant="outlined"
                        size="small"
                        color="success"
                        startIcon={<DrawIcon />}
                        onClick={handleStartDrawing}
                        fullWidth
                      >
                        Draw Custom Area
                      </Button>
                    ) : (
                      <Stack spacing={1}>
                        <Typography variant="caption" color="warning.main" fontWeight="bold">
                          Drawing Mode: {drawnPoints.length} point{drawnPoints.length !== 1 ? 's' : ''} placed
                        </Typography>
                        <ButtonGroup variant="contained" size="small" fullWidth>
                          <Button
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={handleFinishDrawing}
                            disabled={drawnPoints.length < 3}
                          >
                            Finish
                          </Button>
                          <Button
                            color="error"
                            startIcon={<CloseIcon />}
                            onClick={handleCancelDrawing}
                          >
                            Cancel
                          </Button>
                        </ButtonGroup>
                      </Stack>
                    )}
                  </Box>
                )}
              </Box>

              {/* Rainwater Harvesting Analysis Mode */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={rainwaterAnalysisMode}
                      onChange={(e) => {
                        const isEnabled = e.target.checked;
                        setRainwaterAnalysisMode(isEnabled);

                        // Disable other modes if enabling rainwater mode
                        if (isEnabled) {
                          if (solarAnalysisMode) {
                            setSolarAnalysisMode(false);
                            setSolarData(null);
                          }
                          if (greenSpaceAnalysisMode) {
                            setGreenSpaceAnalysisMode(false);
                            setGreenSpaceData(null);
                          }
                        }

                        if (!isEnabled) {
                          setRainwaterData(null);
                          setRainwaterError(null);
                        } else {
                          setSnackbar({
                            open: true,
                            message: 'Click any building to analyze rainwater harvesting potential',
                            severity: 'info'
                          });
                        }
                      }}
                      size="small"
                      color="info"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <WaterDropIcon fontSize="small" color={rainwaterAnalysisMode ? 'info' : 'action'} />
                      <Typography variant="body2">Rainwater Analysis Mode</Typography>
                    </Box>
                  }
                />
                {rainwaterAnalysisMode && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
                    Click any building to see rainwater collection potential
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>
        </Fade>


        {/* Reset View Button */}
        <Tooltip title="Reset View">
          <IconButton
            onClick={() => {
              if (map) {
                map.panTo(CAMPUS_CENTER);
                map.setZoom(17);
              }
            }}
            sx={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              bgcolor: 'white',
              '&:hover': { bgcolor: 'grey.100' },
              boxShadow: 3
            }}
          >
            <MyLocationIcon />
          </IconButton>
        </Tooltip>

        {/* Solar Insights Panel */}
        {(solarAnalysisMode && (loadingSolar || solarData || solarError)) && (
          <SolarInsightsPanel
            buildingData={solarData?.buildingData}
            solarConfig={solarData?.solarConfig}
            buildingInfo={solarData?.buildingInfo}
            loading={loadingSolar}
            error={solarError}
            onClose={() => {
              setSolarData(null);
              setSolarError(null);
              setLoadingSolar(false);
              setSolarFluxLayer(null);
            }}
          />
        )}

        {/* Green Space Analysis Panel */}
        {(greenSpaceAnalysisMode && (loadingGreenSpace || greenSpaceData || greenSpaceError)) && (
          <GreenSpaceAnalysisPanel
            greenSpaceData={greenSpaceData}
            loading={loadingGreenSpace}
            error={greenSpaceError}
            onClose={() => {
              setGreenSpaceData(null);
              setGreenSpaceError(null);
              setLoadingGreenSpace(false);
              setCustomPolygon(null); // Clear custom polygon to remove highlights
            }}
          />
        )}

        {/* Rainwater Harvesting Analysis Panel */}
        {(rainwaterAnalysisMode && (loadingRainwater || rainwaterData || rainwaterError)) && (
          <RainwaterHarvestingPanel
            solarBuildingData={rainwaterData?.buildingData}
            buildingInfo={rainwaterData?.buildingInfo}
            onClose={() => {
              setRainwaterData(null);
              setRainwaterError(null);
              setLoadingRainwater(false);
            }}
          />
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <MuiAlert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}
