// Data Manager - CRUD operations for sustainability data
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Chip,
  Stack,
  Tooltip,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import {
  binLocations,
  roofSpaces,
  greenSpaces,
  studyPods,
  walkwayPaths,
  setRealCampusData,
  hasRealData
} from '../../services/sustainabilityData';
import {
  addSustainabilityItem,
  updateSustainabilityItem,
  deleteSustainabilityItem,
  saveSustainabilityData,
  getSustainabilityData
} from '../../services/adminService';
import { getRealCampusData } from '../../services/realCampusDataService';
import { useAuth } from '../../contexts/AuthContext';

const DATA_TYPES = [
  { value: 'realData', label: 'Real GLTF Data', data: [] },
  { value: 'bins', label: 'Waste Bins', data: binLocations },
  { value: 'roofs', label: 'Roof Spaces', data: roofSpaces },
  { value: 'greenSpaces', label: 'Green Spaces', data: greenSpaces },
  { value: 'studyPods', label: 'Study Pods', data: studyPods },
  { value: 'walkways', label: 'Walkways', data: walkwayPaths }
];

export default function DataManager() {
  const { currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [data, setData] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [realCampusData, setRealCampusData] = useState(null);
  const [loadingRealData, setLoadingRealData] = useState(false);
  const [savingRealData, setSavingRealData] = useState(false);
  const [loadingFirestoreData, setLoadingFirestoreData] = useState(false);

  const loadData = useCallback(async () => {
    const currentType = DATA_TYPES[selectedTab];

    if (currentType.value === 'realData' && realCampusData) {
      // Show real data if loaded
      setData(realCampusData.buildings || []);
    } else if (currentType.value === 'bins' || currentType.value === 'roofs') {
      // Load from Firestore for bins and roofs
      setLoadingFirestoreData(true);
      try {
        const firestoreData = await getSustainabilityData(currentType.value);
        if (firestoreData && firestoreData.length > 0) {
          setData(firestoreData);
          console.log(`✓ Loaded ${firestoreData.length} ${currentType.value} items from Firestore`);
        } else {
          // Fallback to mock data if no Firestore data
          setData(currentType.data);
          console.log(`No Firestore data for ${currentType.value}, using mock data`);
        }
      } catch (error) {
        console.error(`Error loading ${currentType.value} from Firestore:`, error);
        // Fallback to mock data on error
        setData(currentType.data);
        showSnackbar(`Could not load ${currentType.value} from database, showing mock data`, 'warning');
      } finally {
        setLoadingFirestoreData(false);
      }
    } else {
      // Use mock data for other tabs
      setData(currentType.data);
    }
  }, [selectedTab, realCampusData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load real data from GLTF
  const handleLoadRealData = async () => {
    setLoadingRealData(true);
    try {
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      showSnackbar('Loading real data from GLTF model...', 'info');

      const campusData = await getRealCampusData(apiKey);
      setRealCampusData(campusData);
      setRealCampusData(campusData); // Set in sustainability service too

      showSnackbar(`Successfully loaded ${campusData.buildings.length} buildings and ${campusData.bins.length} bins from GLTF model`, 'success');
      loadData(); // Refresh display
    } catch (error) {
      console.error('Error loading real data:', error);
      showSnackbar('Error loading real data: ' + error.message, 'error');
    } finally {
      setLoadingRealData(false);
    }
  };

  // Save real data to Firestore
  const handleSaveRealData = async () => {
    if (!realCampusData) {
      showSnackbar('No real data loaded. Please load data first.', 'warning');
      return;
    }

    setSavingRealData(true);
    try {
      showSnackbar('Saving real data to Firestore...', 'info');

      // Save buildings as roof spaces
      const roofData = realCampusData.buildings.map(building => ({
        id: building.id,
        buildingName: building.name,
        area: Math.round(building.area || 1500),
        solarPotential: Math.round(building.solarPotential || 100),
        solarEfficiency: 0.15,
        annualRainfall: 680,
        rainwaterCapacity: Math.round(building.rainwater?.annualCapacity || 0),
        currentlyInstalled: {
          solar: 0,
          rainwater: false
        },
        location: building.location,
        // Additional metadata from API
        solarDataAvailable: building.solarDataAvailable || false,
        yearlyEnergyKwh: building.yearlyEnergyKwh || 0
      }));

      await saveSustainabilityData('roofs', roofData, currentUser.uid);
      showSnackbar(`Successfully saved ${roofData.length} buildings to database`, 'success');

      // Save bins
      await saveSustainabilityData('bins', realCampusData.bins, currentUser.uid);
      showSnackbar(`Successfully saved ${realCampusData.bins.length} bins to database`, 'success');

    } catch (error) {
      console.error('Error saving real data:', error);
      showSnackbar('Error saving real data: ' + error.message, 'error');
    } finally {
      setSavingRealData(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setFormData(item);
      setSelectedItem(item);
      setEditMode(true);
    } else {
      setFormData(getDefaultFormData());
      setSelectedItem(null);
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setEditMode(false);
    setFormData({});
  };

  const getDefaultFormData = () => {
    const currentType = DATA_TYPES[selectedTab].value;

    switch (currentType) {
      case 'bins':
        return {
          id: data.length + 1,
          position: [0, 30, 0],
          type: 'recycling',
          fillLevel: 0,
          lastEmptied: new Date().toISOString().split('T')[0]
        };
      case 'roofs':
        return {
          id: data.length + 1,
          buildingName: '',
          area: 0,
          solarPotential: 0,
          solarEfficiency: 0.15,
          annualRainfall: 680,
          rainwaterCapacity: 0,
          currentlyInstalled: { solar: 0, rainwater: false }
        };
      case 'greenSpaces':
        return {
          id: data.length + 1,
          name: '',
          area: 0,
          type: 'lawn',
          trees: 0,
          carbonOffsetPerYear: 0,
          biodiversityScore: 5.0,
          maintenanceCost: 0
        };
      case 'studyPods':
        return {
          id: data.length + 1,
          location: '',
          capacity: 4,
          features: [],
          energyEfficiency: 'A',
          powerUsage: 0.5,
          utilizationRate: 0.75,
          studentSatisfaction: 4.0,
          co2SavedVsTraditional: 1.0
        };
      case 'walkways':
        return {
          id: data.length + 1,
          name: '',
          points: [[0, 15, 0], [10, 15, 10]],
          color: '#ffeb3b',
          accessibility: 'wheelchair-accessible'
        };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    try {
      const currentType = DATA_TYPES[selectedTab].value;

      if (editMode && selectedItem) {
        await updateSustainabilityItem(currentType, selectedItem.id, formData, currentUser.uid);
        showSnackbar('Item updated successfully', 'success');
      } else {
        await addSustainabilityItem(currentType, formData, currentUser.uid);
        showSnackbar('Item added successfully', 'success');
      }

      loadData();
      handleCloseDialog();
    } catch (error) {
      showSnackbar('Error saving item: ' + error.message, 'error');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const currentType = DATA_TYPES[selectedTab].value;
      await deleteSustainabilityItem(currentType, item.id, currentUser.uid);
      showSnackbar('Item deleted successfully', 'success');
      loadData();
    } catch (error) {
      showSnackbar('Error deleting item: ' + error.message, 'error');
    }
  };

  const handleExport = () => {
    const currentType = DATA_TYPES[selectedTab];
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${currentType.value}_export_${new Date().toISOString().split('T')[0]}.csv`);
    showSnackbar('Data exported successfully', 'success');
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        console.log('Imported data:', results.data);
        showSnackbar(`Imported ${results.data.length} rows. Please review and save to database.`, 'info');
        // Here you would process and save the imported data
      },
      error: (error) => {
        showSnackbar('Error importing file: ' + error.message, 'error');
      }
    });

    event.target.value = null;
  };

  const renderTableHeaders = () => {
    const currentType = DATA_TYPES[selectedTab].value;

    switch (currentType) {
      case 'realData':
        return (
          <>
            <TableCell><strong>ID</strong></TableCell>
            <TableCell><strong>Building Name</strong></TableCell>
            <TableCell><strong>Area (m²)</strong></TableCell>
            <TableCell><strong>Solar Potential (kW)</strong></TableCell>
            <TableCell><strong>Yearly Energy (kWh)</strong></TableCell>
            <TableCell><strong>Rainwater (L/yr)</strong></TableCell>
            <TableCell><strong>Data Source</strong></TableCell>
          </>
        );
      case 'bins':
        return (
          <>
            <TableCell>ID</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Fill Level</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>Last Emptied</TableCell>
            <TableCell align="right">Actions</TableCell>
          </>
        );
      case 'roofs':
        return (
          <>
            <TableCell>ID</TableCell>
            <TableCell>Building Name</TableCell>
            <TableCell>Area (m²)</TableCell>
            <TableCell>Solar Potential (kW)</TableCell>
            <TableCell>Installed Solar (kW)</TableCell>
            <TableCell align="right">Actions</TableCell>
          </>
        );
      case 'greenSpaces':
        return (
          <>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Area (m²)</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Trees</TableCell>
            <TableCell>CO₂ Offset (t/year)</TableCell>
            <TableCell align="right">Actions</TableCell>
          </>
        );
      case 'studyPods':
        return (
          <>
            <TableCell>ID</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Capacity</TableCell>
            <TableCell>Energy Efficiency</TableCell>
            <TableCell>Utilization</TableCell>
            <TableCell align="right">Actions</TableCell>
          </>
        );
      case 'walkways':
        return (
          <>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Points</TableCell>
            <TableCell>Accessibility</TableCell>
            <TableCell align="right">Actions</TableCell>
          </>
        );
      default:
        return null;
    }
  };

  const renderTableRow = (item) => {
    const currentType = DATA_TYPES[selectedTab].value;

    switch (currentType) {
      case 'realData':
        return (
          <>
            <TableCell>{item.id || 'N/A'}</TableCell>
            <TableCell><strong>{item.name || 'Unnamed Building'}</strong></TableCell>
            <TableCell>{item.area ? Math.round(item.area).toLocaleString() : '0'}</TableCell>
            <TableCell>{item.solarPotential ? Math.round(item.solarPotential) : 0}</TableCell>
            <TableCell>{item.yearlyEnergyKwh ? Math.round(item.yearlyEnergyKwh).toLocaleString() : 'N/A'}</TableCell>
            <TableCell>{item.rainwater?.annualCapacity ? Math.round(item.rainwater.annualCapacity).toLocaleString() : '0'}</TableCell>
            <TableCell>
              <Chip
                label={item.solarDataAvailable ? 'Google Solar API' : 'Estimated'}
                size="small"
                color={item.solarDataAvailable ? 'success' : 'default'}
              />
            </TableCell>
          </>
        );
      case 'bins':
        return (
          <>
            <TableCell>{item.id || 'N/A'}</TableCell>
            <TableCell>
              <Chip
                label={item.type || 'N/A'}
                size="small"
                color={item.type === 'recycling' ? 'primary' : item.type === 'compost' ? 'success' : 'default'}
              />
            </TableCell>
            <TableCell>
              <Chip
                label={`${item.fillLevel || 0}%`}
                size="small"
                color={item.fillLevel >= 80 ? 'error' : item.fillLevel >= 50 ? 'warning' : 'success'}
              />
            </TableCell>
            <TableCell>{item.position ? `[${item.position.join(', ')}]` : 'N/A'}</TableCell>
            <TableCell>{item.lastEmptied || 'N/A'}</TableCell>
          </>
        );
      case 'roofs':
        return (
          <>
            <TableCell>{item.id || 'N/A'}</TableCell>
            <TableCell>{item.buildingName || 'N/A'}</TableCell>
            <TableCell>{item.area ? item.area.toLocaleString() : '0'}</TableCell>
            <TableCell>{item.solarPotential || 0}</TableCell>
            <TableCell>{item.currentlyInstalled?.solar || 0}</TableCell>
          </>
        );
      case 'greenSpaces':
        return (
          <>
            <TableCell>{item.id || 'N/A'}</TableCell>
            <TableCell>{item.name || 'N/A'}</TableCell>
            <TableCell>{item.area ? item.area.toLocaleString() : '0'}</TableCell>
            <TableCell><Chip label={item.type || 'N/A'} size="small" /></TableCell>
            <TableCell>{item.trees || 0}</TableCell>
            <TableCell>{item.carbonOffsetPerYear || 0}</TableCell>
          </>
        );
      case 'studyPods':
        return (
          <>
            <TableCell>{item.id || 'N/A'}</TableCell>
            <TableCell>{item.location || 'N/A'}</TableCell>
            <TableCell>{item.capacity || 0}</TableCell>
            <TableCell><Chip label={item.energyEfficiency || 'N/A'} size="small" color="success" /></TableCell>
            <TableCell>{item.utilizationRate ? (item.utilizationRate * 100).toFixed(0) : 0}%</TableCell>
          </>
        );
      case 'walkways':
        return (
          <>
            <TableCell>{item.id || 'N/A'}</TableCell>
            <TableCell>{item.name || 'N/A'}</TableCell>
            <TableCell>{item.points ? `${item.points.length} points` : 'N/A'}</TableCell>
            <TableCell><Chip label={item.accessibility || 'N/A'} size="small" /></TableCell>
          </>
        );
      default:
        return null;
    }
  };

  const renderDialogContent = () => {
    const currentType = DATA_TYPES[selectedTab].value;

    const handleFieldChange = (field, value) => {
      setFormData({ ...formData, [field]: value });
    };

    const handleNestedFieldChange = (parent, field, value) => {
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [field]: value
        }
      });
    };

    switch (currentType) {
      case 'bins':
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bin ID"
                  type="number"
                  value={formData.id || ''}
                  onChange={(e) => handleFieldChange('id', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type || 'general'}
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="recycling">Recycling</MenuItem>
                    <MenuItem value="compost">Compost</MenuItem>
                    <MenuItem value="general">General Waste</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fill Level (%)"
                  type="number"
                  value={formData.fillLevel || 0}
                  onChange={(e) => handleFieldChange('fillLevel', parseInt(e.target.value))}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Emptied"
                  type="date"
                  value={formData.lastEmptied || ''}
                  onChange={(e) => handleFieldChange('lastEmptied', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Position [X, Y, Z]</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="X"
                      type="number"
                      value={formData.position?.[0] || 0}
                      onChange={(e) => handleFieldChange('position', [parseFloat(e.target.value), formData.position?.[1] || 30, formData.position?.[2] || 0])}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Y"
                      type="number"
                      value={formData.position?.[1] || 30}
                      onChange={(e) => handleFieldChange('position', [formData.position?.[0] || 0, parseFloat(e.target.value), formData.position?.[2] || 0])}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Z"
                      type="number"
                      value={formData.position?.[2] || 0}
                      onChange={(e) => handleFieldChange('position', [formData.position?.[0] || 0, formData.position?.[1] || 30, parseFloat(e.target.value)])}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        );

      case 'roofs':
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Building ID"
                  type="number"
                  value={formData.id || ''}
                  onChange={(e) => handleFieldChange('id', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Building Name"
                  value={formData.buildingName || ''}
                  onChange={(e) => handleFieldChange('buildingName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Area (m²)"
                  type="number"
                  value={formData.area || 0}
                  onChange={(e) => handleFieldChange('area', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Solar Potential (kW)"
                  type="number"
                  value={formData.solarPotential || 0}
                  onChange={(e) => handleFieldChange('solarPotential', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Solar Efficiency"
                  type="number"
                  value={formData.solarEfficiency || 0.15}
                  onChange={(e) => handleFieldChange('solarEfficiency', parseFloat(e.target.value))}
                  inputProps={{ step: 0.01, min: 0, max: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Annual Rainfall (mm)"
                  type="number"
                  value={formData.annualRainfall || 680}
                  onChange={(e) => handleFieldChange('annualRainfall', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rainwater Capacity (L/year)"
                  type="number"
                  value={formData.rainwaterCapacity || 0}
                  onChange={(e) => handleFieldChange('rainwaterCapacity', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>Currently Installed</Divider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Installed Solar (kW)"
                  type="number"
                  value={formData.currentlyInstalled?.solar || 0}
                  onChange={(e) => handleNestedFieldChange('currentlyInstalled', 'solar', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.currentlyInstalled?.rainwater || false}
                      onChange={(e) => handleNestedFieldChange('currentlyInstalled', 'rainwater', e.target.checked)}
                    />
                  }
                  label="Rainwater Harvesting System"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 'greenSpaces':
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Space ID"
                  type="number"
                  value={formData.id || ''}
                  onChange={(e) => handleFieldChange('id', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Area (m²)"
                  type="number"
                  value={formData.area || 0}
                  onChange={(e) => handleFieldChange('area', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type || 'lawn'}
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="lawn">Lawn</MenuItem>
                    <MenuItem value="native-plants">Native Plants</MenuItem>
                    <MenuItem value="mixed-woodland">Mixed Woodland</MenuItem>
                    <MenuItem value="ornamental">Ornamental</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Number of Trees"
                  type="number"
                  value={formData.trees || 0}
                  onChange={(e) => handleFieldChange('trees', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="CO₂ Offset (t/year)"
                  type="number"
                  value={formData.carbonOffsetPerYear || 0}
                  onChange={(e) => handleFieldChange('carbonOffsetPerYear', parseFloat(e.target.value))}
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Biodiversity Score"
                  type="number"
                  value={formData.biodiversityScore || 5.0}
                  onChange={(e) => handleFieldChange('biodiversityScore', parseFloat(e.target.value))}
                  inputProps={{ step: 0.1, min: 0, max: 10 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Annual Maintenance Cost"
                  type="number"
                  value={formData.maintenanceCost || 0}
                  onChange={(e) => handleFieldChange('maintenanceCost', parseInt(e.target.value))}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 'studyPods':
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pod ID"
                  type="number"
                  value={formData.id || ''}
                  onChange={(e) => handleFieldChange('id', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location || ''}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Capacity (students)"
                  type="number"
                  value={formData.capacity || 4}
                  onChange={(e) => handleFieldChange('capacity', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Energy Efficiency</InputLabel>
                  <Select
                    value={formData.energyEfficiency || 'A'}
                    onChange={(e) => handleFieldChange('energyEfficiency', e.target.value)}
                    label="Energy Efficiency"
                  >
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A">A</MenuItem>
                    <MenuItem value="B">B</MenuItem>
                    <MenuItem value="C">C</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Power Usage (kW)"
                  type="number"
                  value={formData.powerUsage || 0.5}
                  onChange={(e) => handleFieldChange('powerUsage', parseFloat(e.target.value))}
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Utilization Rate"
                  type="number"
                  value={formData.utilizationRate || 0.75}
                  onChange={(e) => handleFieldChange('utilizationRate', parseFloat(e.target.value))}
                  inputProps={{ step: 0.01, min: 0, max: 1 }}
                  helperText="0.0 to 1.0 (75% = 0.75)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Student Satisfaction"
                  type="number"
                  value={formData.studentSatisfaction || 4.0}
                  onChange={(e) => handleFieldChange('studentSatisfaction', parseFloat(e.target.value))}
                  inputProps={{ step: 0.1, min: 0, max: 5 }}
                  helperText="Out of 5.0"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="CO₂ Saved vs Traditional (t/year)"
                  type="number"
                  value={formData.co2SavedVsTraditional || 1.0}
                  onChange={(e) => handleFieldChange('co2SavedVsTraditional', parseFloat(e.target.value))}
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 'walkways':
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Walkway ID"
                  type="number"
                  value={formData.id || ''}
                  onChange={(e) => handleFieldChange('id', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Color (hex)"
                  value={formData.color || '#ffeb3b'}
                  onChange={(e) => handleFieldChange('color', e.target.value)}
                  placeholder="#ffeb3b"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Accessibility</InputLabel>
                  <Select
                    value={formData.accessibility || 'wheelchair-accessible'}
                    onChange={(e) => handleFieldChange('accessibility', e.target.value)}
                    label="Accessibility"
                  >
                    <MenuItem value="wheelchair-accessible">Wheelchair Accessible</MenuItem>
                    <MenuItem value="stairs">Stairs</MenuItem>
                    <MenuItem value="mixed">Mixed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  To edit walkway points, use the JSON editor or import from GeoJSON
                </Alert>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return (
          <Alert severity="warning">
            Form not available for this data type. Please use JSON editor.
          </Alert>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Sustainability Data Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage all sustainability data including bins, roofs, green spaces, and more
      </Typography>

      <Card>
        <CardContent>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
              {DATA_TYPES.map((type, index) => (
                <Tab key={type.value} label={type.label} />
              ))}
            </Tabs>
          </Box>

          {/* Real Data Summary */}
          {selectedTab === 0 && realCampusData && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Real Data Loaded Successfully</strong>
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    <strong>Buildings:</strong> {realCampusData.buildings.length}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    <strong>Bins:</strong> {realCampusData.bins.length}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    <strong>Total Solar:</strong> {Math.round(realCampusData.metrics.totalSolarPotential).toLocaleString()} kW
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2">
                    <strong>Total Roof Area:</strong> {Math.round(realCampusData.metrics.totalRoofArea).toLocaleString()} m²
                  </Typography>
                </Grid>
              </Grid>
            </Alert>
          )}

          {/* Firestore Data Info for Bins and Roofs */}
          {(selectedTab === 1 || selectedTab === 2) && data.length > 0 && !loadingFirestoreData && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Database Data:</strong> Showing {data.length} {DATA_TYPES[selectedTab].label.toLowerCase()} loaded from Firestore.
                {' '}To update this data, use the "Real GLTF Data" tab to extract and save new data from the 3D model.
              </Typography>
            </Alert>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 2 }}>
            {selectedTab === 0 ? (
              // Real Data Tab Actions
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<UploadIcon />}
                  onClick={handleLoadRealData}
                  disabled={loadingRealData}
                >
                  {loadingRealData ? 'Loading...' : 'Load Real Data from GLTF'}
                </Button>
                {realCampusData && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveRealData}
                    disabled={savingRealData}
                  >
                    {savingRealData ? 'Saving...' : 'Save to Database'}
                  </Button>
                )}
              </>
            ) : (
              // Other Tabs Actions
              <>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add New
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                >
                  Export CSV
                </Button>
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="import-csv-file"
                  type="file"
                  onChange={handleImport}
                />
                <label htmlFor="import-csv-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                  >
                    Import CSV
                  </Button>
                </label>
              </>
            )}
          </Stack>

          {/* Data Table */}
          {loadingFirestoreData ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {renderTableHeaders()}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item.id || item.name} hover>
                        {renderTableRow(item)}
                        {selectedTab !== 0 && (
                          <TableCell align="right">
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(item)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {data.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {selectedTab === 0
                    ? 'No real data loaded. Click "Load Real Data from GLTF" to extract data from the 3D model.'
                    : (selectedTab === 1 || selectedTab === 2)
                    ? 'No data in database yet. Use the "Real GLTF Data" tab to load and save data from the 3D model.'
                    : 'No data available. Click "Add New" to create your first entry.'}
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {editMode ? <EditIcon /> : <AddIcon />}
            <Typography variant="h6">
              {editMode ? 'Edit' : 'Add New'} {DATA_TYPES[selectedTab].label.slice(0, -1)}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderDialogContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
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
