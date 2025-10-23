// Map Manager - Admin page for managing deck.gl map layers
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Alert,
  Snackbar,
  Divider,
  Paper
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PaletteIcon from '@mui/icons-material/Palette';
import { ChromePicker } from 'react-color';
import { getMapLayers, createMapLayer, updateMapLayer, deleteMapLayer } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import GeoJSONUploader from '../../components/admin/GeoJSONUploader';

const LAYER_TYPES = [
  { value: 'ScatterplotLayer', label: 'Points (Scatterplot)' },
  { value: 'PathLayer', label: 'Lines (Path)' },
  { value: 'PolygonLayer', label: 'Polygons' },
  { value: 'HeatmapLayer', label: 'Heatmap' },
  { value: 'IconLayer', label: 'Icons' },
  { value: 'TextLayer', label: 'Text Labels' }
];

const DEFAULT_LAYER_CONFIG = {
  ScatterplotLayer: {
    radiusScale: 6,
    radiusMinPixels: 5,
    radiusMaxPixels: 30,
    fillColor: [0, 128, 255],
    lineColor: [255, 255, 255],
    opacity: 0.8
  },
  PathLayer: {
    widthScale: 2,
    widthMinPixels: 2,
    color: [255, 128, 0],
    opacity: 0.8
  },
  PolygonLayer: {
    fillColor: [0, 200, 100, 100],
    lineColor: [0, 150, 75],
    lineWidth: 2,
    opacity: 0.6
  },
  HeatmapLayer: {
    intensity: 1,
    threshold: 0.05,
    radiusPixels: 60
  }
};

export default function MapManager() {
  const { currentUser } = useAuth();
  const [layers, setLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'ScatterplotLayer',
    visible: true,
    opacity: 0.8,
    config: DEFAULT_LAYER_CONFIG.ScatterplotLayer,
    dataSource: 'static', // 'static', 'firestore', 'geopackage'
    dataPath: ''
  });

  const loadLayers = async () => {
    try {
      setLoading(true);
      const data = await getMapLayers();
      setLayers(data);
    } catch (error) {
      showSnackbar('Error loading layers: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (layer = null) => {
    if (layer) {
      // Edit mode
      setFormData(layer);
      setSelectedLayer(layer);
      setEditMode(true);
    } else {
      // Create mode
      setFormData({
        name: '',
        type: 'ScatterplotLayer',
        visible: true,
        opacity: 0.8,
        config: DEFAULT_LAYER_CONFIG.ScatterplotLayer,
        dataSource: 'static',
        dataPath: ''
      });
      setSelectedLayer(null);
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLayer(null);
    setEditMode(false);
  };

  const handleSaveLayer = async () => {
    try {
      if (editMode && selectedLayer) {
        // Update existing layer
        await updateMapLayer(selectedLayer.id, formData, currentUser.uid);
        showSnackbar('Layer updated successfully', 'success');
      } else {
        // Create new layer
        await createMapLayer(formData, currentUser.uid);
        showSnackbar('Layer created successfully', 'success');
      }
      await loadLayers();
      handleCloseDialog();
    } catch (error) {
      showSnackbar('Error saving layer: ' + error.message, 'error');
    }
  };

  const handleDeleteLayer = async (layerId) => {
    if (!window.confirm('Are you sure you want to delete this layer?')) {
      return;
    }

    try {
      await deleteMapLayer(layerId, currentUser.uid);
      showSnackbar('Layer deleted successfully', 'success');
      await loadLayers();
    } catch (error) {
      showSnackbar('Error deleting layer: ' + error.message, 'error');
    }
  };

  const handleToggleVisibility = async (layer) => {
    try {
      await updateMapLayer(layer.id, { visible: !layer.visible }, currentUser.uid);
      await loadLayers();
    } catch (error) {
      showSnackbar('Error updating visibility: ' + error.message, 'error');
    }
  };

  const handleLayerTypeChange = (type) => {
    setFormData({
      ...formData,
      type,
      config: DEFAULT_LAYER_CONFIG[type] || {}
    });
  };

  const handleConfigChange = (key, value) => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [key]: value
      }
    });
  };

  const handleColorPicker = (target, currentColor) => {
    setColorPickerTarget(target);
    setColorPickerOpen(true);
  };

  const handleColorChange = (color) => {
    const { r, g, b, a } = color.rgb;
    const colorArray = [r, g, b, Math.round(a * 255)];
    handleConfigChange(colorPickerTarget, colorArray);
  };

  const rgbArrayToHex = (rgb) => {
    if (!rgb || !Array.isArray(rgb)) return '#0080ff';
    const [r, g, b] = rgb;
    return '#' + [r, g, b].map(x => {
      const hex = (x || 0).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const handleGeoPackageUpload = async (geoPackageData) => {
    showSnackbar(`GeoPackage "${geoPackageData.name}" uploaded with ${geoPackageData.layerCount} layers`, 'success');
    // Optionally auto-create layers from GeoPackage
    // This would require additional logic to convert GeoPackage layers to map layers
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Map Layer Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Create and manage deck.gl map layers for your 2D map visualization
      </Typography>

      <Grid container spacing={3}>
        {/* Left Panel - Layer List */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <LayersIcon color="primary" />
                  <Typography variant="h6">Map Layers</Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  size="small"
                >
                  Add Layer
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Typography variant="body2" color="text.secondary">Loading...</Typography>
              ) : layers.length === 0 ? (
                <Alert severity="info">No layers configured yet. Create your first layer!</Alert>
              ) : (
                <List>
                  {layers.map((layer) => (
                    <Paper key={layer.id} variant="outlined" sx={{ mb: 1, p: 1 }}>
                      <ListItem
                        secondaryAction={
                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleToggleVisibility(layer)}
                            >
                              {layer.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                            </IconButton>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleOpenDialog(layer)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              size="small"
                              color="error"
                              onClick={() => handleDeleteLayer(layer.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        }
                      >
                        <ListItemIcon>
                          <LayersIcon color={layer.visible ? 'primary' : 'disabled'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={layer.name}
                          secondary={
                            <Stack direction="row" spacing={0.5} mt={0.5}>
                              <Chip label={layer.type} size="small" variant="outlined" />
                              <Chip
                                label={layer.visible ? 'Visible' : 'Hidden'}
                                size="small"
                                color={layer.visible ? 'success' : 'default'}
                              />
                            </Stack>
                          }
                        />
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - GeoJSON/KML Uploader */}
        <Grid item xs={12} md={6}>
          <GeoJSONUploader onUploadComplete={handleGeoPackageUpload} />
        </Grid>
      </Grid>

      {/* Layer Edit/Create Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Layer' : 'Create New Layer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Layer Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Layer Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>

            {/* Layer Type */}
            <Grid item xs={12} sm={6}>
              <Select
                fullWidth
                value={formData.type}
                onChange={(e) => handleLayerTypeChange(e.target.value)}
                label="Layer Type"
              >
                {LAYER_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </Grid>

            {/* Opacity */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" gutterBottom>Opacity</Typography>
              <Slider
                value={formData.opacity}
                onChange={(e, val) => setFormData({ ...formData, opacity: val })}
                min={0}
                max={1}
                step={0.1}
                valueLabelDisplay="auto"
                marks
              />
            </Grid>

            {/* Visibility */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.visible}
                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                  />
                }
                label="Visible by Default"
              />
            </Grid>

            {/* Type-specific Configuration */}
            {formData.type === 'ScatterplotLayer' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Point Configuration</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Min Radius (px)"
                    type="number"
                    value={formData.config.radiusMinPixels || 5}
                    onChange={(e) => handleConfigChange('radiusMinPixels', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Max Radius (px)"
                    type="number"
                    value={formData.config.radiusMaxPixels || 30}
                    onChange={(e) => handleConfigChange('radiusMaxPixels', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PaletteIcon />}
                    onClick={() => handleColorPicker('fillColor', formData.config.fillColor)}
                    sx={{
                      bgcolor: rgbArrayToHex(formData.config.fillColor),
                      color: 'white',
                      '&:hover': {
                        bgcolor: rgbArrayToHex(formData.config.fillColor)
                      }
                    }}
                  >
                    Fill Color
                  </Button>
                </Grid>
              </>
            )}

            {formData.type === 'PathLayer' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Line Configuration</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Width Scale"
                    type="number"
                    value={formData.config.widthScale || 2}
                    onChange={(e) => handleConfigChange('widthScale', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PaletteIcon />}
                    onClick={() => handleColorPicker('color', formData.config.color)}
                    sx={{
                      bgcolor: rgbArrayToHex(formData.config.color),
                      color: 'white'
                    }}
                  >
                    Line Color
                  </Button>
                </Grid>
              </>
            )}

            {formData.type === 'PolygonLayer' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Polygon Configuration</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PaletteIcon />}
                    onClick={() => handleColorPicker('fillColor', formData.config.fillColor)}
                    sx={{
                      bgcolor: rgbArrayToHex(formData.config.fillColor),
                      color: 'white'
                    }}
                  >
                    Fill Color
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PaletteIcon />}
                    onClick={() => handleColorPicker('lineColor', formData.config.lineColor)}
                    sx={{
                      bgcolor: rgbArrayToHex(formData.config.lineColor),
                      color: 'white'
                    }}
                  >
                    Stroke Color
                  </Button>
                </Grid>
              </>
            )}
          </Grid>

          {/* Color Picker Dialog */}
          <Dialog open={colorPickerOpen} onClose={() => setColorPickerOpen(false)}>
            <DialogTitle>Choose Color</DialogTitle>
            <DialogContent>
              <ChromePicker
                color={formData.config[colorPickerTarget] ? {
                  r: formData.config[colorPickerTarget][0] || 0,
                  g: formData.config[colorPickerTarget][1] || 0,
                  b: formData.config[colorPickerTarget][2] || 0,
                  a: (formData.config[colorPickerTarget][3] || 255) / 255
                } : { r: 0, g: 128, b: 255, a: 1 }}
                onChange={handleColorChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setColorPickerOpen(false)}>Done</Button>
            </DialogActions>
          </Dialog>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveLayer}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!formData.name}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
