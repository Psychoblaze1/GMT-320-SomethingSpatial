// GeoJSON/KML Uploader Component
import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Stack,
  IconButton,
  Collapse
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LayersIcon from '@mui/icons-material/Layers';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { parseGeoFile, validateGeoFile, calculateLayerStats } from '../../services/geoJSONService';
import { saveGeoPackage } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export default function GeoJSONUploader({ onUploadComplete }) {
  const { currentUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [expandedLayers, setExpandedLayers] = useState({});

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setParsedData(null);

    // Validate file
    const validation = validateGeoFile(file);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn('File warnings:', validation.warnings);
    }

    try {
      setUploading(true);
      setProgress(30);

      // Parse the file
      const data = await parseGeoFile(file);
      setProgress(60);

      // Calculate statistics for each layer
      const layersWithStats = data.layers.map(layer => ({
        ...layer,
        stats: calculateLayerStats(layer.geoJSON)
      }));

      const enrichedData = {
        ...data,
        layers: layersWithStats
      };

      setParsedData(enrichedData);
      setProgress(100);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to parse file');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveToFirestore = async () => {
    if (!parsedData) return;

    try {
      setUploading(true);
      setProgress(0);

      // Save to Firestore
      await saveGeoPackage(parsedData, currentUser.uid);

      setProgress(100);
      setSuccess(true);
      setParsedData(null);

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(parsedData);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setProgress(0);
      }, 3000);

    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save to database');
    } finally {
      setUploading(false);
    }
  };

  const toggleLayerExpand = (layerName) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CloudUploadIcon color="primary" />
          <Typography variant="h6">Upload GeoJSON / KML File</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          Upload a .geojson, .json, or .kml file to add spatial data layers to your map. Supports points, lines, and polygons.
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }} icon={<LayersIcon />}>
          <Typography variant="caption">
            <strong>QGIS Users:</strong> Export your layers as GeoJSON (Right-click layer → Export → Save Features As → GeoJSON)
          </Typography>
        </Alert>

        {/* File Input */}
        <Box mb={2}>
          <input
            accept=".geojson,.json,.kml"
            style={{ display: 'none' }}
            id="geojson-file-input"
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <label htmlFor="geojson-file-input">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={uploading}
              fullWidth
            >
              Select GeoJSON/KML File
            </Button>
          </label>
        </Box>

        {/* Progress Bar */}
        {uploading && (
          <Box mb={2}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary" align="center" display="block" mt={1}>
              {progress < 40 ? 'Uploading...' : progress < 70 ? 'Parsing...' : 'Processing...'}
            </Typography>
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
            File uploaded successfully!
          </Alert>
        )}

        {/* Parsed Data Preview */}
        {parsedData && !success && (
          <Box>
            <Card variant="outlined" sx={{ mb: 2, bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {parsedData.name}
                </Typography>

                <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" gap={0.5}>
                  <Chip
                    label={`${parsedData.layerCount} layer${parsedData.layerCount !== 1 ? 's' : ''}`}
                    size="small"
                    color="primary"
                  />
                  <Chip
                    label={`${(parsedData.fileSize / 1024).toFixed(2)} KB`}
                    size="small"
                  />
                  <Chip
                    label={parsedData.fileName.toLowerCase().endsWith('.kml') ? 'KML' : 'GeoJSON'}
                    size="small"
                    color="secondary"
                  />
                </Stack>

                {/* Bounds Info */}
                {parsedData.bounds && (
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Bounds: [{parsedData.bounds.minLon.toFixed(4)}, {parsedData.bounds.minLat.toFixed(4)}] to [{parsedData.bounds.maxLon.toFixed(4)}, {parsedData.bounds.maxLat.toFixed(4)}]
                  </Typography>
                )}

                {/* Layers List */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Layers:
                </Typography>
                <List dense>
                  {parsedData.layers.map((layer, index) => (
                    <Box key={index}>
                      <ListItem
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => toggleLayerExpand(layer.name)}
                          >
                            {expandedLayers[layer.name] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <LayersIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={layer.name}
                          secondary={`${layer.featureCount} features · ${layer.type}`}
                        />
                      </ListItem>

                      <Collapse in={expandedLayers[layer.name]} timeout="auto" unmountOnExit>
                        <Box pl={7} pr={2} pb={1}>
                          {layer.stats && (
                            <Typography variant="caption" color="text.secondary" component="div">
                              <strong>Geometry Types:</strong>
                              <Box sx={{ mt: 0.5 }}>
                                {Object.entries(layer.stats.geometryTypes).map(([type, count]) => (
                                  <Chip
                                    key={type}
                                    label={`${type}: ${count}`}
                                    size="small"
                                    sx={{ ml: 0.5, mt: 0.5 }}
                                  />
                                ))}
                              </Box>
                              <br />
                              <strong>Properties:</strong>
                              <Box sx={{ mt: 0.5 }}>
                                {layer.stats.propertyKeys.slice(0, 5).map(prop => (
                                  <Chip
                                    key={prop.name}
                                    label={prop.name}
                                    size="small"
                                    variant="outlined"
                                    sx={{ ml: 0.5, mt: 0.5 }}
                                  />
                                ))}
                                {layer.stats.propertyKeys.length > 5 && (
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                    ... and {layer.stats.propertyKeys.length - 5} more
                                  </Typography>
                                )}
                              </Box>
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={handleSaveToFirestore}
              disabled={uploading}
              startIcon={<CheckCircleIcon />}
            >
              Save to Database
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
