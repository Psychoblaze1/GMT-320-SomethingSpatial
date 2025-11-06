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
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { glassStyle, glassDarkStyle } from '../../theme';
import DataPanel from './DataPanel';
import BinPanel from './BinPanel';
import LayerLegendPanel from './LayerLegendPanel';
import TourWelcomeDialog from './TourWelcomeDialog';
import NarrativeTourController from './NarrativeTourController';
import ReplayTourButton from './ReplayTourButton';
import useNarrativeTour from '../../hooks/useNarrativeTour';

import LayersIcon from '@mui/icons-material/Layers';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import TuneIcon from '@mui/icons-material/Tune';
import MapIcon from '@mui/icons-material/Map';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DownloadIcon from '@mui/icons-material/Download';

function SceneBackground({ isNight }) {
  const { scene } = useThree();

  useEffect(() => {
    const dayColor = new THREE.Color('#87CEEB');
    const nightColor = new THREE.Color('#0a1929');
    scene.background = isNight ? nightColor : dayColor;
  }, [scene, isNight]);

  return null;
}

function CampusModel({ modelPath, onMeshClick, onBinClick, onClearSelectionRef, onBuildingsExtracted, onHighlightBuildingRef, layerVisibility, onModelLoaded, sceneRef }) {
  // useGLTF hook - Suspense boundary will handle loading state
  const gltf = useGLTF(modelPath);

  const { camera, controls } = useThree();
  const [initialized, setInitialized] = useState(false);
  const [selectedMesh, setSelectedMesh] = useState(null);
  const [originalMaterial, setOriginalMaterial] = useState(null);
  const localSceneRef = useRef(null);

  const flashBuilding = (mesh) => {
    const highlightColor = 0x4caf50;
    const flashDuration = 500; // ms
    const flashIntensity = 2;

    // Ensure material supports emissive properties
    if (!mesh.material.emissive) {
      mesh.material.emissive = new THREE.Color(0x000000);
    }
    if (mesh.material.emissiveIntensity === undefined) {
      mesh.material.emissiveIntensity = 0;
    }

    const startTime = Date.now();

    const animateFlash = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = elapsedTime / flashDuration;

        if (progress < 1) {
            const intensity = Math.sin(progress * Math.PI) * flashIntensity;
            mesh.material.emissiveIntensity = intensity;
            mesh.material.emissive.setHex(highlightColor);
            mesh.material.needsUpdate = true;
            requestAnimationFrame(animateFlash);
        } else {
            mesh.material.emissiveIntensity = 0.8;
            mesh.material.emissive.setHex(highlightColor);
            mesh.material.needsUpdate = true;
        }
    };

    animateFlash();
  };

  const highlightBuilding = (mesh) => {
    console.log('Highlighting building:', mesh);
    console.log('Current material type:', mesh.material.type);

    // Clear previous selection
    if (selectedMesh && originalMaterial) {
      selectedMesh.material = originalMaterial;
      selectedMesh.material.needsUpdate = true;
    }

    if (mesh.material) {
      // Save reference to original material (before modifying)
      const original = mesh.material;

      // Create a new material instance by deep cloning
      const highlightedMaterial = mesh.material.clone();

      // Ensure emissive properties are available and cloned
      if (!highlightedMaterial.emissive) {
        highlightedMaterial.emissive = new THREE.Color(0x000000);
      } else {
        // Clone the emissive color to avoid shared references
        highlightedMaterial.emissive = highlightedMaterial.emissive.clone();
      }
      if (highlightedMaterial.emissiveIntensity === undefined) {
        highlightedMaterial.emissiveIntensity = 0;
      }

      // Apply the new material and force update
      mesh.material = highlightedMaterial;
      mesh.material.needsUpdate = true;

      // Save state after applying new material
      setOriginalMaterial(original);
      setSelectedMesh(mesh);

      console.log('Material set up for highlight, starting flash');
      console.log('Emissive before flash:', highlightedMaterial.emissive, 'Intensity:', highlightedMaterial.emissiveIntensity);
      flashBuilding(mesh);
    }
  };

  useEffect(() => {
    if (onHighlightBuildingRef) {
      onHighlightBuildingRef.current = highlightBuilding;
    }
  }, [selectedMesh, originalMaterial, onHighlightBuildingRef]);

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
      const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 3.6;

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

      // Update orbit controls (wait for controls to be ready)
      if (controls && controls.target) {
        controls.target.set(0, centeredSize.y * 0.3, 0);
        controls.minDistance = maxDim * 0.3;
        controls.maxDistance = maxDim * 6;
        controls.update();
      } else {
        console.warn('Controls not ready yet, camera may not be positioned correctly');
      }

      // Store scene reference for layer visibility updates
      localSceneRef.current = scene;
      // Also store in parent ref for export functionality
      if (sceneRef) {
        sceneRef.current = scene;
      }

      // Enhance materials and shadows, make meshes clickable
      const buildingList = [];
      scene.traverse((child) => {
        if (child.isMesh) {
          // Store GLTF extras in userData for later access FIRST
          if (child.extras) {
            child.userData = { ...child.userData, ...child.extras };
          }

          // Extract layer ID and properties for processing
          const layerId = child.userData?.layerId;
          const properties = child.userData?.properties || [];

          // Only enable shadows for buildings and ground - skip for small objects
          if (layerId === 0 || layerId === 2 || layerId === 10 || layerId === 12 || layerId === 13 || layerId === 14) {
            child.castShadow = (layerId === 0 || layerId === 2); // Only buildings cast shadows
            child.receiveShadow = true; // Ground and buildings receive shadows
          } else {
            child.castShadow = false;
            child.receiveShadow = false;
          }

          if (child.material) {
            child.material.needsUpdate = true;
            if (child.material.opacity !== undefined && child.material.opacity < 0.1) {
              child.material.opacity = 1.0;
            }

            // Initialize emissive properties for all materials to support highlighting
            if (!child.material.emissive) {
              child.material.emissive = new THREE.Color(0x000000);
            }
            if (child.material.emissiveIntensity === undefined) {
              child.material.emissiveIntensity = 0;
            }
          }

          // Disable raycasting on basemap and ground layers so they don't block building clicks
          if (layerId === 10 || layerId === 12 || layerId === 13 || layerId === 14) {
            child.raycast = () => {}; // Disable raycasting for basemaps and ground
          }

          // Extract buildings for search functionality
          const buildingName = properties[1]; // Building name is at index 1

          // Include valid buildings (layerId 0 for Solar or layerId 2 for Building Height)
          if ((layerId === 0 || layerId === 2) && buildingName && buildingName !== 'NULL' && buildingName.trim() !== '') {
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

      // Notify parent that model loaded successfully
      if (onModelLoaded) {
        onModelLoaded();
      }
      console.log('Original box - min:', box.min, 'max:', box.max);
      console.log('Original center:', center);
      console.log('Scene position offset:', scene.position);
      console.log('Centered box - min:', centeredBox.min, 'max:', centeredBox.max);
      console.log('Centered size:', centeredSize);
      console.log('Max dimension:', maxDim);
      console.log('Calculated distance:', distance);
      console.log('Camera position:', camera.position);
      if (controls && controls.target) {
        console.log('Controls target:', controls.target);
      } else {
        console.warn('Controls not yet available during initialization');
      }
    } catch (error) {
      console.error('Error initializing 3D model:', error);
      // Reset initialization flag to allow retry
      setInitialized(false);
    }
  }, [gltf, camera, controls, initialized]);

  // Update controls when they become available
  useEffect(() => {
    if (!controls || !controls.target || !initialized || !localSceneRef.current) return;

    // Recalculate model size for controls
    const box = new THREE.Box3().setFromObject(localSceneRef.current);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    console.log('Setting up controls after initialization...');
    controls.target.set(0, size.y * 0.3, 0);
    controls.minDistance = maxDim * 0.3;
    controls.maxDistance = maxDim * 6;
    controls.update();
    console.log('Controls configured - target:', controls.target);
  }, [controls, initialized]);

  // Update layer visibility when layerVisibility prop changes or after initialization
  useEffect(() => {
    if (!localSceneRef.current || !initialized) return;

    console.log('Applying layer visibility:', layerVisibility);
    let updatedCount = 0;
    const layerCounts = {};

    localSceneRef.current.traverse((child) => {
      if (child.isMesh) {
        const layerId = child.userData?.layerId;
        if (layerId !== undefined && layerVisibility) {
          const shouldBeVisible = layerVisibility[layerId] !== false;

          // Track layer mesh counts for debugging
          if (!layerCounts[layerId]) layerCounts[layerId] = 0;
          layerCounts[layerId]++;

          if (child.visible !== shouldBeVisible) {
            child.visible = shouldBeVisible;
            updatedCount++;

            // For layers that should be visible, ensure material properties support visibility
            if (shouldBeVisible && child.material) {
              // Ensure material is not transparent or invisible
              if (child.material.opacity !== undefined && child.material.opacity < 0.1) {
                child.material.opacity = 1.0;
              }
              if (child.material.transparent !== undefined) {
                child.material.transparent = child.material.opacity < 1.0;
              }
              // Force material update
              child.material.needsUpdate = true;
            }

            console.log(`Layer ${layerId}: ${shouldBeVisible ? 'showing' : 'hiding'} mesh`);
          }
        }
      }
    });

    // Log layer counts for debugging
    console.log('Layer mesh counts:', layerCounts);
    console.log(`Updated visibility for ${updatedCount} meshes`);
  }, [layerVisibility, initialized]);

  // Handle mesh clicks
  const handleClick = (event) => {
    event.stopPropagation();
    const mesh = event.object;

    console.log('Click detected on mesh:', mesh);
    console.log('Mesh userData:', mesh.userData);

    if (mesh && mesh.isMesh) {
      // Extract GLTF properties array from userData
      const properties = mesh.userData?.properties || [];
      const layerId = mesh.userData?.layerId;

      console.log('Click - LayerId:', layerId, 'Properties:', properties);

      // Check if this is a bin (Survey_points layer = layerId 5)
      const isBin = layerId === 5;

      if (isBin && onBinClick) {
        console.log('Bin detected! Generating bin data...');
        // Handle bin click
        // Extract bin ID from properties (first property is usually the ID)
        const binId = parseInt(properties[0]) || Math.floor(Math.random() * 1000);

        // Generate random bin data
        const binTypes = ['general', 'recycling', 'compost', 'paper', 'plastic'];
        const randomType = binTypes[Math.floor(Math.random() * binTypes.length)];
        const randomFillLevel = Math.floor(Math.random() * 100);
        const randomDaysAgo = Math.floor(Math.random() * 30) + 1;
        const lastEmptiedDate = new Date();
        lastEmptiedDate.setDate(lastEmptiedDate.getDate() - randomDaysAgo);

        const binData = {
          id: `BIN-${binId}`,
          type: randomType,
          fillLevel: randomFillLevel,
          position: mesh.position ? [mesh.position.x, mesh.position.y, mesh.position.z] : [0, 0, 0],
          lastEmptied: lastEmptiedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        // Reset previous selection
        if (selectedMesh && originalMaterial) {
          selectedMesh.material = originalMaterial;
          selectedMesh.material.needsUpdate = true;
        }

        // Apply blue highlight for bins
        if (mesh.material) {
          const original = mesh.material;
          setOriginalMaterial(original);
          setSelectedMesh(mesh);

          // Create highlighted material with blue glow
          const highlightedMaterial = mesh.material.clone();

          // Ensure emissive properties exist
          if (!highlightedMaterial.emissive) {
            highlightedMaterial.emissive = new THREE.Color(0x2196F3);
          } else {
            highlightedMaterial.emissive = highlightedMaterial.emissive.clone();
            highlightedMaterial.emissive.setHex(0x2196F3);
          }
          highlightedMaterial.emissiveIntensity = 0.8;
          highlightedMaterial.needsUpdate = true;

          mesh.material = highlightedMaterial;
          mesh.material.needsUpdate = true;

          console.log('Bin highlighted with blue glow');
        }

        // Clear building selection and show bin panel
        onMeshClick(null);
        onBinClick(binData);
        return;
      }

      // Handle building clicks
      if (onMeshClick) {
        // Buildings can be layerId 0 (Solar) or layerId 2 (Building Height)
        const buildingName = properties[1];
        if ((layerId !== 0 && layerId !== 2) || !buildingName || buildingName === 'NULL' || buildingName.trim() === '') {
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
        // [0] = OBJECTID/FID
        // [1] = Building Name
        // [2-4] = Additional fields
        // [5] = Base/Min Height
        // [6] = Top/Max Height
        // [7] = Building Height

        const objectData = {
          id: properties[0] || 'N/A',
          buildingName: properties[1] || 'Unnamed',
          baseHeight: properties[5] ? `${parseFloat(properties[5]).toFixed(2)} m` : 'N/A',
          topHeight: properties[6] ? `${parseFloat(properties[6]).toFixed(2)} m` : 'N/A',
          height: properties[7] ? `${parseFloat(properties[7]).toFixed(2)} m` : 'N/A',
          layerId: layerId
        };

        console.log('Calling highlightBuilding for:', objectData.buildingName);
        highlightBuilding(mesh);
        console.log('After highlightBuilding call');

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


function Scene({ isNight, onMeshClick, onBinClick, onClearSelectionRef, onBuildingsExtracted, cameraRef, controlsRef, onHighlightBuildingRef, layerVisibility, onModelLoaded, sceneRef }) {
  return (
    <>
      <SceneBackground isNight={isNight} />

      <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={60} ref={cameraRef} />
      <OrbitControls
        ref={controlsRef}
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

      <ambientLight intensity={isNight ? 0.1 : 0.5} />

      <directionalLight
        position={isNight ? [-100, 80, -50] : [100, 150, 50]}
        intensity={isNight ? 0.3 : 1.8}
        color={isNight ? '#6495ED' : '#FFF5E1'}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-far={500}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-bias={-0.0001}
      />

      <directionalLight
        position={[-80, 100, -80]}
        intensity={isNight ? 0.1 : 0.6}
        color={isNight ? '#191970' : '#b3d4ff'}
        castShadow={false}
      />

      <hemisphereLight
        skyColor={isNight ? '#0a1929' : '#87CEEB'}
        groundColor={isNight ? '#1a1a2e' : '#6b5d47'}
        intensity={isNight ? 0.2 : 0.7}
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
          onHighlightBuildingRef={onHighlightBuildingRef}
          layerVisibility={layerVisibility}
          onModelLoaded={onModelLoaded}
          sceneRef={sceneRef}
        />
      </Suspense>
    </>
  );
}

export default function CampusModelViewer() {
  const [isNight, setIsNight] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedBin, setSelectedBin] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [searchValue, setSearchValue] = useState(null);
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading 3D Campus Model...');
  const [modelLoaded, setModelLoaded] = useState(false);

  // Layer visibility state - start with all layers visible
  const [layerVisibility, setLayerVisibility] = useState({
    0: false,  // Solar (alternative to Building Height)
    2: true,   // Building Height
    3: true,   // Blind Walkways
    5: true,   // Survey Points
    6: true,   // Boreholes
    7: true,   // Green Spaces
    12: true,  // OSM Standard (initially visible)
    13: false, // Google Maps
    14: false  // Google Satellite
  });

  // Active basemap (only one visible at a time)
  const [activeBasemap, setActiveBasemap] = useState(12); // Default to OSM Standard

  const clearSelectionRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const highlightBuildingRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);

  // Narrative Tour Hook
  const {
    showWelcomeDialog,
    tourActive,
    tourSeen,
    tourError,
    startTour,
    skipTour,
    replayTour,
    handleTourComplete,
    handleTourError
  } = useNarrativeTour(true, 500); // Auto-show after 500ms on first visit

  // Auto-reload only if model fails to load
  useEffect(() => {
    const hasReloaded = sessionStorage.getItem('mapReloaded');

    // Set a timeout to check if model loaded successfully
    const loadTimeout = setTimeout(() => {
      if (!modelLoaded && !hasReloaded) {
        console.log('Model failed to load - reloading page...');
        sessionStorage.setItem('mapReloaded', 'true');
        window.location.reload();
      }
    }, 5000); // Wait 5 seconds for model to load

    // Clear reload flag after successful load
    if (modelLoaded && hasReloaded) {
      console.log('Model loaded successfully after reload - clearing flag');
      sessionStorage.removeItem('mapReloaded');
    }

    return () => clearTimeout(loadTimeout);
  }, [modelLoaded]);

  useEffect(() => {
    if (!searchValue || !cameraRef.current || !controlsRef.current) {
      return;
    }

    const mesh = searchValue.mesh;
    if (!mesh) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 2.5;

    const newCameraPosition = new THREE.Vector3(
        center.x + cameraDistance * 0.6,
        center.y + cameraDistance * 0.8,
        center.z + cameraDistance * 0.6,
    );

    console.log('=== Building Search Camera Animation ===');
    console.log('Building:', searchValue.name);
    console.log('Building box - min:', box.min, 'max:', box.max);
    console.log('Building center:', center);
    console.log('Building size:', size);
    console.log('Max dim:', maxDim);
    console.log('Camera distance:', cameraDistance);
    console.log('Current camera position:', camera.position);
    console.log('New camera position:', newCameraPosition);
    console.log('Current target:', controls.target);
    console.log('New target:', center);

    const animationDuration = 1000;
    const startTime = Date.now();

    const initialCameraPosition = camera.position.clone();
    const initialTarget = controls.target.clone();

    const animate = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / animationDuration, 1);

        const easeProgress = 1 - Math.pow(1 - progress, 3);

        camera.position.lerpVectors(initialCameraPosition, newCameraPosition, easeProgress);
        controls.target.lerpVectors(initialTarget, center, easeProgress);
        controls.update();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            console.log('Camera animation complete - final position:', camera.position);
        }
    };

    animate();

}, [searchValue, cameraRef, controlsRef]);

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

  // Layer control handlers
  const handleLayerToggle = (layerId, visible) => {
    setLayerVisibility(prev => {
      // If visible is undefined, toggle the current state
      const newVisible = visible !== undefined ? visible : !prev[layerId];
      const newVisibility = { ...prev, [layerId]: newVisible };

      // Solar (Layer 0) and Building Height (Layer 2) are mutually exclusive
      if (layerId === 0 && newVisible) {
        // When Solar is turned on, turn off Building Height
        newVisibility[2] = false;
      } else if (layerId === 2 && newVisible) {
        // When Building Height is turned on, turn off Solar
        newVisibility[0] = false;
      }

      return newVisibility;
    });
  };

  const handleBasemapChange = (newBasemapId) => {
    console.log('Basemap change requested:', newBasemapId);
    // Hide all basemaps, then show only the selected one
    setLayerVisibility(prev => {
      const newVisibility = {
        ...prev,
        12: false,
        13: false,
        14: false,
        [newBasemapId]: true
      };
      console.log('New layer visibility:', newVisibility);
      return newVisibility;
    });
    setActiveBasemap(newBasemapId);
  };

  // Screenshot handler
  const handleScreenshot = () => {
    if (!canvasRef.current) {
      console.error('Canvas not available for screenshot');
      return;
    }

    try {
      // Get the canvas and convert to blob
      const canvas = canvasRef.current;
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          link.download = `campus-map-${timestamp}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          console.log('Screenshot saved successfully');
        } else {
          console.error('Failed to create blob from canvas');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }
  };

  // 3D Model export handler
  const handleExportModel = () => {
    if (!sceneRef.current) {
      console.error('Scene not available for export');
      return;
    }

    try {
      const exporter = new GLTFExporter();

      // Export the scene
      exporter.parse(
        sceneRef.current,
        (gltf) => {
          // Convert to JSON string
          const output = JSON.stringify(gltf, null, 2);
          const blob = new Blob([output], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          link.download = `campus-model-${timestamp}.gltf`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          console.log('3D model exported successfully');
        },
        (error) => {
          console.error('Error exporting model:', error);
        },
        { binary: false } // Export as GLTF (text), not GLB (binary)
      );
    } catch (error) {
      console.error('Error exporting model:', error);
    }
  };

  const handleBuildingSearch = (event, building) => {
    if (!building) {
      setSearchValue(null);
      return;
    }

    setSearchValue(building);

    const mesh = building.mesh;
    if (!mesh) return;

    if (highlightBuildingRef.current) {
      highlightBuildingRef.current(mesh);
    }

    const properties = mesh.userData?.properties || [];
    const objectData = {
      id: properties[0] || 'N/A',
      buildingName: properties[1] || building.name,
      baseHeight: properties[5] ? `${parseFloat(properties[5]).toFixed(2)} m` : 'N/A',
      topHeight: properties[6] ? `${parseFloat(properties[6]).toFixed(2)} m` : 'N/A',
      height: properties[7] ? `${parseFloat(properties[7]).toFixed(2)} m` : 'N/A',
      layerId: mesh.userData?.layerId
    };

    handleMeshClick(objectData);
  };

  // Tour Handlers
  const handleTourHighlightBuilding = (buildingName) => {
    const building = buildings.find(b =>
      b.name.toLowerCase().includes(buildingName.toLowerCase())
    );

    if (building && highlightBuildingRef.current) {
      highlightBuildingRef.current(building.mesh);
    }
  };

  const handleTourHighlightBin = (binId) => {
    // Generate random bin data for tour
    const binTypes = ['general', 'recycling', 'compost', 'paper', 'plastic'];
    const randomType = binTypes[Math.floor(Math.random() * binTypes.length)];
    const randomFillLevel = Math.floor(Math.random() * 100);
    const randomDaysAgo = Math.floor(Math.random() * 30) + 1;
    const lastEmptiedDate = new Date();
    lastEmptiedDate.setDate(lastEmptiedDate.getDate() - randomDaysAgo);

    const binData = {
      id: `BIN-${binId}`,
      type: randomType,
      fillLevel: randomFillLevel,
      position: [0, 0, 0],
      lastEmptied: lastEmptiedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    handleBinClick(binData);
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

      {showLayerPanel && (
        <LayerLegendPanel
          layerVisibility={layerVisibility}
          onLayerToggle={handleLayerToggle}
          activeBasemap={activeBasemap}
          onBasemapChange={handleBasemapChange}
          onClose={() => setShowLayerPanel(false)}
        />
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

          <Tooltip title="Take Screenshot">
            <IconButton
              onClick={handleScreenshot}
              sx={{
                ...glassDarkStyle,
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <CameraAltIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export 3D Model">
            <IconButton
              onClick={handleExportModel}
              sx={{
                ...glassDarkStyle,
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          {!showLayerPanel && (
            <Tooltip title="Show Layers">
              <IconButton
                onClick={() => setShowLayerPanel(true)}
                sx={{
                  ...glassDarkStyle,
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <LayersIcon />
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
          antialias: false, // Disable for performance
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
          alpha: false,
          preserveDrawingBuffer: true, // Enable for screenshots
          failIfMajorPerformanceCaveat: false,
          depth: true,
          stencil: false // Disable stencil buffer
        }}
        onCreated={({ gl }) => {
          console.log('WebGL renderer created');

          // Store references for screenshots and exports
          canvasRef.current = gl.domElement;
          rendererRef.current = gl;

          // Optimize renderer settings
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;

          // Handle WebGL context loss
          const canvas = gl.domElement;

          canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('WebGL context lost - preventing default and attempting restore');
          }, false);

          canvas.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored successfully');
            // Reload the page to reinitialize everything
            window.location.reload();
          }, false);
        }}
      >
        <Suspense fallback={
          <Html center>
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                {loadingMessage}
              </Typography>
            </Box>
          </Html>
        }>
          <Scene
            isNight={isNight}
            onMeshClick={handleMeshClick}
            onBinClick={handleBinClick}
            onClearSelectionRef={clearSelectionRef}
            onBuildingsExtracted={handleBuildingsExtracted}
            cameraRef={cameraRef}
            controlsRef={controlsRef}
            onHighlightBuildingRef={highlightBuildingRef}
            layerVisibility={layerVisibility}
            onModelLoaded={() => setModelLoaded(true)}
            sceneRef={sceneRef}
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

      {/* Narrative Tour Components */}
      <TourWelcomeDialog
        open={showWelcomeDialog}
        onStart={startTour}
        onSkip={skipTour}
      />

      <NarrativeTourController
        isActive={tourActive}
        cameraRef={cameraRef}
        controlsRef={controlsRef}
        onComplete={handleTourComplete}
        onError={handleTourError}
      />

      <ReplayTourButton
        visible={tourSeen && !tourActive}
        onClick={replayTour}
      />
    </Box>
  );
}

// Preload GLTF model for faster initial load
useGLTF.preload('/3dmodel.gltf');