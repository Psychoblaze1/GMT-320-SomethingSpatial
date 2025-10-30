import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, PerspectiveCamera } from '@react-three/drei';
import {
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Zoom,
  Autocomplete,
  TextField
} from '@mui/material';
import * as THREE from 'three';
import { glassStyle, glassDarkStyle } from '../../theme';
import DataPanel from './DataPanel';
import BinPanel from './BinPanel';
import { binLocations } from '../../services/sustainabilityData';

import LayersIcon from '@mui/icons-material/Layers';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import TuneIcon from '@mui/icons-material/Tune';
import MapIcon from '@mui/icons-material/Map';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';

function SceneBackground({ isNight }) {
  const { scene } = useThree();

  useEffect(() => {
    const dayColor = new THREE.Color('#87CEEB');
    const nightColor = new THREE.Color('#0a1929');
    scene.background = isNight ? nightColor : dayColor;
  }, [scene, isNight]);

  return null;
}

function CampusModel({ modelPath, onMeshClick, onBinClick, onClearSelectionRef, onBuildingsExtracted }) {
  let gltf;
  try {
    gltf = useGLTF(modelPath);
  } catch (error) {
    console.error('Error loading GLTF:', error);
    throw error; // Re-throw to be caught by Suspense/ErrorBoundary
  }

  const { camera, controls } = useThree();
  const [initialized, setInitialized] = useState(false);
  const [selectedMesh, setSelectedMesh] = useState(null);
  const [originalMaterial, setOriginalMaterial] = useState(null);

  // Expose clearSelection function to parent
  useEffect(() => {
    if (onClearSelectionRef) {
      onClearSelectionRef.current = () => {
        if (selectedMesh && originalMaterial) {
          selectedMesh.material = originalMaterial;
        }
        setSelectedMesh(null);
        setOriginalMaterial(null);
      };
    }
  }, [selectedMesh, originalMaterial, onClearSelectionRef]);

  useEffect(() => {
    if (!gltf || !gltf.scene) {
      console.warn('GLTF or scene not loaded yet');
      return;
    }

    if (initialized) {
      return;
    }

    try {
      const scene = gltf.scene;
      console.log('Initializing 3D model...');

      // Calculate the bounding box of the model
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());

      // Center the model at world origin (0, 0, 0)
      // Subtract the center to move the model's center to (0, 0, 0)
      scene.position.x = -center.x;
      scene.position.y = -box.min.y; // Place bottom of model on ground plane
      scene.position.z = -center.z;

      // Recalculate after centering
      const centeredBox = new THREE.Box3().setFromObject(scene);
      const centeredSize = centeredBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(centeredSize.x, centeredSize.y, centeredSize.z);

      // Calculate optimal camera distance to fit entire model
      const fov = camera.fov * (Math.PI / 180);
      const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.8;

      // Position camera at an angle for good isometric view
      const cameraHeight = distance * 0.7;
      const cameraDistance = distance * 0.8;

      camera.position.set(
        cameraDistance * 0.7,
        cameraHeight,
        cameraDistance * 0.7
      );
      camera.lookAt(0, centeredSize.y * 0.3, 0); // Look slightly above ground
      camera.updateProjectionMatrix();

      // Update orbit controls
      if (controls) {
        controls.target.set(0, centeredSize.y * 0.3, 0);
        controls.minDistance = maxDim * 0.3;
        controls.maxDistance = maxDim * 4;
        controls.update();
      }

      // Enhance materials and shadows, make meshes clickable
      const buildingList = [];
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            child.material.needsUpdate = true;
            if (child.material.opacity !== undefined && child.material.opacity < 0.1) {
              child.material.opacity = 1.0;
            }
          }

          // Store GLTF extras in userData for later access
          if (child.extras) {
            child.userData = { ...child.userData, ...child.extras };
          }

          // Extract buildings for search functionality
          const properties = child.userData?.properties || [];
          const layerId = child.userData?.layerId;
          const buildingName = properties[3];

          // Only include valid buildings (layerId 1 with proper names)
          if (layerId === 1 && buildingName && buildingName !== 'NULL' && buildingName.trim() !== '') {
            buildingList.push({
              id: properties[0] || buildingList.length + 1,
              name: buildingName,
              mesh: child
            });
          }
        }
      });

      // Pass building list to parent component
      if (onBuildingsExtracted && buildingList.length > 0) {
        onBuildingsExtracted(buildingList);
        console.log(`Extracted ${buildingList.length} buildings for search`);
      }

      setInitialized(true);
      console.log('3D model initialized successfully');
    } catch (error) {
      console.error('Error initializing 3D model:', error);
      // Reset initialization flag to allow retry
      setInitialized(false);
    }
  }, [gltf, camera, controls, initialized]);
  // Handle mesh clicks
  const handleClick = (event) => {
    event.stopPropagation();
    const mesh = event.object;

    if (mesh && mesh.isMesh) {
      // Extract GLTF properties array from userData
      const properties = mesh.userData?.properties || [];
      const layerId = mesh.userData?.layerId;

      // Check if this is a bin (Survey_points layer)
      const lastProperty = properties[properties.length - 1];
      const isBin = lastProperty && typeof lastProperty === 'string' && lastProperty.includes('Survey_points');

      if (isBin && onBinClick) {
        // Handle bin click
        // Extract bin ID from properties (first property is usually the ID)
        const binId = parseInt(properties[0]) || null;

        // Find matching bin data from sustainabilityData
        const binData = binLocations.find(bin => bin.id === binId) || {
          id: binId || 'Unknown',
          type: 'general',
          fillLevel: 0,
          position: [0, 0, 0],
          lastEmptied: 'N/A'
        };

        // Reset previous selection
        if (selectedMesh && originalMaterial) {
          selectedMesh.material = originalMaterial;
        }

        // Apply blue highlight for bins
        if (mesh.material &&
            (!mesh.material.emissive ||
             (mesh.material.emissive.r === 0 && mesh.material.emissive.g === 0 && mesh.material.emissive.b === 0))) {
          const original = mesh.material.clone();
          setOriginalMaterial(original);
          setSelectedMesh(mesh);

          // Create highlighted material with blue glow
          const highlightedMaterial = mesh.material.clone();
          highlightedMaterial.emissive = new THREE.Color(0x2196F3); // Blue glow
          highlightedMaterial.emissiveIntensity = 0.5;
          mesh.material = highlightedMaterial;
        }

        // Clear building selection and show bin panel
        onMeshClick(null);
        onBinClick(binData);
        return;
      }

      // Handle building clicks
      if (onMeshClick) {
        // Skip ground/terrain objects (layerId 2 or objects without proper building data)
        // Buildings should have layerId 1 and proper name in properties[3]
        const buildingName = properties[3];
        if (layerId !== 1 || !buildingName || buildingName === 'NULL' || buildingName.trim() === '') {
          // Clear any selection
          if (selectedMesh && originalMaterial) {
            selectedMesh.material = originalMaterial;
          }
          setSelectedMesh(null);
          setOriginalMaterial(null);
          onMeshClick(null);
          if (onBinClick) onBinClick(null);
          return;
        }

        // Building data structure from GLTF:
        // [0] = fid (ID)
        // [2] = ism_way_id
        // [3] = name (Building name)
        // [5] = building type
        // [8] = height

        const objectData = {
          id: properties[0] || 'N/A',
          buildingName: properties[3] || 'Unnamed',
          height: properties[properties.length - 1] ? `${parseFloat(properties[properties.length - 1]).toFixed(2)} m` : 'N/A',
          layerId: layerId
        };

        // Reset previous selection
        if (selectedMesh && originalMaterial) {
          selectedMesh.material = originalMaterial;
        }

        // Apply green highlight for buildings
        if (mesh.material &&
            (!mesh.material.emissive ||
             (mesh.material.emissive.r === 0 && mesh.material.emissive.g === 0 && mesh.material.emissive.b === 0))) {
          const original = mesh.material.clone();
          setOriginalMaterial(original);
          setSelectedMesh(mesh);

          // Create highlighted material with green glow
          const highlightedMaterial = mesh.material.clone();
          highlightedMaterial.emissive = new THREE.Color(0x4caf50); // Green glow
          highlightedMaterial.emissiveIntensity = 0.5;
          mesh.material = highlightedMaterial;
        }

        // Clear bin selection and show building panel
        if (onBinClick) onBinClick(null);
        onMeshClick(objectData);
      }
    }
  };

  if (!gltf || !gltf.scene) {
    console.warn('GLTF scene not available for rendering');
    return null;
  }

  return <primitive object={gltf.scene} onClick={handleClick} />;
}


function Scene({ isNight, onMeshClick, onBinClick, onClearSelectionRef, onBuildingsExtracted }) {
  return (
    <>
      <SceneBackground isNight={isNight} />

      <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={60} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        dampingFactor={0.08}
        enableDamping={true}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={10}
        maxDistance={1000}
        target={[0, 0, 0]}
        screenSpacePanning={true}
      />

      <ambientLight intensity={isNight ? 0.1 : 0.3} />

      <directionalLight
        position={isNight ? [-100, 80, -50] : [100, 150, 50]}
        intensity={isNight ? 0.3 : 1.5}
        color={isNight ? '#6495ED' : '#FFF5E1'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-bias={-0.0001}
      />

      <directionalLight
        position={[-80, 100, -80]}
        intensity={isNight ? 0.1 : 0.4}
        color={isNight ? '#191970' : '#b3d4ff'}
      />

      <hemisphereLight
        skyColor={isNight ? '#0a1929' : '#87CEEB'}
        groundColor={isNight ? '#1a1a2e' : '#6b5d47'}
        intensity={isNight ? 0.2 : 0.5}
      />

      <Suspense fallback={
        <Html center>
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loading 3D Campus Model...
            </Typography>
          </Box>
        </Html>
      }>
        <CampusModel
          modelPath="/3dmodel.gltf"
          onMeshClick={onMeshClick}
          onBinClick={onBinClick}
          onClearSelectionRef={onClearSelectionRef}
          onBuildingsExtracted={onBuildingsExtracted}
        />
      </Suspense>
    </>
  );
}

export default function CampusModelViewer({ binMetrics }) {
  const [isNight, setIsNight] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedBin, setSelectedBin] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [searchValue, setSearchValue] = useState(null);
  const clearSelectionRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  const handleMeshClick = (objectData) => {
    setSelectedObject(objectData);
    setSelectedBin(null); // Close bin panel when building is clicked
  };

  const handleBinClick = (binData) => {
    setSelectedBin(binData);
    setSelectedObject(null); // Close building panel when bin is clicked
  };

  const handleCloseAttributes = () => {
    setSelectedObject(null);
    // Clear the visual highlight
    if (clearSelectionRef.current) {
      clearSelectionRef.current();
    }
  };

  const handleCloseBin = () => {
    setSelectedBin(null);
    // Clear the visual highlight
    if (clearSelectionRef.current) {
      clearSelectionRef.current();
    }
  };

  const handleBuildingsExtracted = (buildingList) => {
    setBuildings(buildingList);
  };

  const handleBuildingSearch = (event, building) => {
    if (!building) {
      setSearchValue(null);
      return;
    }

    setSearchValue(building);

    // Get the building's mesh and position
    const mesh = building.mesh;
    if (!mesh) return;

    // Get world position of the building
    const worldPosition = new THREE.Vector3();
    mesh.getWorldPosition(worldPosition);

    // Extract building data
    const properties = mesh.userData?.properties || [];
    const objectData = {
      id: properties[0] || 'N/A',
      buildingName: properties[3] || building.name,
      buildingType: properties[5] || 'N/A',
      height: properties[properties.length - 1] ? `${parseFloat(properties[properties.length - 1]).toFixed(2)} m` : 'N/A',
      layerId: mesh.userData?.layerId
    };

    // Show the attributes panel and trigger highlight
    handleMeshClick(objectData);

    console.log(`Selected building: ${building.name} at position`, worldPosition);
  };


  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Header with University Title and Search */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          ...glassStyle,
          borderRadius: 0,
          borderBottom: '2px solid rgba(46, 125, 50, 0.3)',
          py: 1.5,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 'fit-content' }}>
          <SchoolIcon fontSize="medium" color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'primary.main' }}>
            University of Pretoria
          </Typography>
        </Box>

        <Autocomplete
          options={buildings}
          getOptionLabel={(option) => option.name}
          value={searchValue}
          onChange={handleBuildingSearch}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search buildings..."
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: 2,
                }
              }}
            />
          )}
          sx={{
            width: '100%',
            maxWidth: 400,
            minWidth: 250
          }}
          size="small"
        />
      </Box>

      <Zoom in timeout={500}>
        <Box
          sx={{
            position: 'absolute',
            top: 72,
            left: 16,
            zIndex: 1000,
            ...glassStyle,
            borderRadius: 3,
            p: 2,
            minWidth: 180,
            transition: 'all 0.3s ease'
          }}
        >
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LayersIcon fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Layers
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Map layers controlled by QGIS export
            </Typography>
          </Stack>
        </Box>
      </Zoom>

      {showStats && binMetrics && (
        <Zoom in timeout={600}>
          <Box
            sx={{
              position: 'absolute',
              top: 72,
              right: 16,
              zIndex: 1000,
              ...glassStyle,
              borderRadius: 3,
              p: 2,
              minWidth: 220,
              transition: 'all 0.3s ease'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Statistics
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setShowStats(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Bins
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {binMetrics.totalBins}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Average Fill Level
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(binMetrics.avgFillLevel)}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {binMetrics.avgFillLevel}%
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Bins by Type
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                  {Object.entries(binMetrics.binsByType).map(([type, count]) => (
                    <Chip
                      key={type}
                      label={`${type}: ${count}`}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        height: 24,
                        bgcolor: type === 'recycling' ? '#2196f3' : type === 'compost' ? '#4caf50' : '#757575',
                        color: 'white'
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              {binMetrics.needsAttention > 0 && (
                <Chip
                  label={`${binMetrics.needsAttention} bins need attention`}
                  color="warning"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Stack>
          </Box>
        </Zoom>
      )}

      <Zoom in timeout={700}>
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 1000,
            display: 'flex',
            gap: 1
          }}
        >
          <Tooltip title={isNight ? 'Day Mode' : 'Night Mode'}>
            <IconButton
              onClick={() => setIsNight(!isNight)}
              sx={{
                ...glassDarkStyle,
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              {isNight ? <WbSunnyIcon /> : <NightsStayIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton
              onClick={() => setShowSettings(true)}
              sx={{
                ...glassDarkStyle,
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <TuneIcon />
            </IconButton>
          </Tooltip>

          {!showStats && (
            <Tooltip title="Show Stats">
              <IconButton
                onClick={() => setShowStats(true)}
                sx={{
                  ...glassDarkStyle,
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <InfoIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Zoom>

      <Zoom in timeout={800}>
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            ...glassStyle,
            borderRadius: 3,
            p: 2,
            minWidth: 160
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <MapIcon fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Controls
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem' }}>
            🖱️ Drag to rotate<br/>
            🔍 Scroll to zoom<br/>
            ✋ Right-click to pan
          </Typography>
        </Box>
      </Zoom>


      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Controls</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              🖱️ <strong>Rotate:</strong> Left-click and drag<br/>
              🔍 <strong>Zoom:</strong> Mouse wheel<br/>
              ✋ <strong>Pan:</strong> Right-click and drag
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Canvas
        shadows
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
          alpha: false
        }}
      >
        <Suspense fallback={
          <Html center>
            <CircularProgress />
          </Html>
        }>
          <Scene
            isNight={isNight}
            onMeshClick={handleMeshClick}
            onBinClick={handleBinClick}
            onClearSelectionRef={clearSelectionRef}
            onBuildingsExtracted={handleBuildingsExtracted}
          />
        </Suspense>
      </Canvas>

      <DataPanel
        selectedObject={selectedObject}
        onClose={handleCloseAttributes}
      />

      <BinPanel
        selectedBin={selectedBin}
        onClose={handleCloseBin}
      />
    </Box>
  );
}

try {
  useGLTF.preload('/3dmodel.gltf');
} catch (error) {
  console.warn('Could not preload GLTF model:', error);
}