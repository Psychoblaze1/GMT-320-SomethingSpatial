import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, PerspectiveCamera } from '@react-three/drei';
import {
  Box,
  CircularProgress,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Fade,
  Zoom
} from '@mui/material';
import * as THREE from 'three';
import { glassStyle, glassDarkStyle } from '../../theme';

// Icons
import LayersIcon from '@mui/icons-material/Layers';
import DeleteIcon from '@mui/icons-material/Delete';
import RouteIcon from '@mui/icons-material/Route';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import TuneIcon from '@mui/icons-material/Tune';
import MapIcon from '@mui/icons-material/Map';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

// Changes the sky color between day and night modes
function SceneBackground({ isNight }) {
  const { scene } = useThree();

  useEffect(() => {
    const dayColor = new THREE.Color('#87CEEB'); // Sky blue
    const nightColor = new THREE.Color('#0a1929'); // Dark blue night
    scene.background = isNight ? nightColor : dayColor;
  }, [scene, isNight]);

  return null;
}

// Loads the 3D campus model and positions the camera to frame it nicely
function CampusModel({ modelPath }) {
  const gltf = useGLTF(modelPath);
  const { camera, controls } = useThree();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (gltf && gltf.scene && !initialized) {
      const scene = gltf.scene;

      // Figure out how big the model is
      const box = new THREE.Box3().setFromObject(scene);
      const min = box.min;

      // Move model so the bottom sits at ground level (y=0)
      const yOffset = -min.y;
      scene.position.y = yOffset;

      // Recalculate size after moving it
      const newBox = new THREE.Box3().setFromObject(scene);
      const newCenter = newBox.getCenter(new THREE.Vector3());
      const newSize = newBox.getSize(new THREE.Vector3());

      // Calculate how far back the camera needs to be to see everything
      const maxDim = Math.max(newSize.x, newSize.y, newSize.z);
      const fov = camera.fov * (Math.PI / 180);
      const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.2;

      // Put camera at an angle so you can see the 3D perspective
      const newCameraPos = {
        x: newCenter.x + distance * 0.5,
        y: newCenter.y + distance * 0.8,
        z: newCenter.z + distance * 0.5
      };

      camera.position.set(newCameraPos.x, newCameraPos.y, newCameraPos.z);
      camera.lookAt(newCenter);
      camera.updateProjectionMatrix();

      // Make the controls focus on the center of the model
      if (controls) {
        controls.target.copy(newCenter);
        controls.update();
      }

      // Go through all parts of the model and make sure they're visible with shadows
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            child.material.needsUpdate = true;
            // Fix any invisible materials
            if (child.material.opacity !== undefined && child.material.opacity < 0.1) {
              child.material.opacity = 1.0;
            }
          }
        }
      });

      setInitialized(true);
    }
  }, [gltf, camera, controls, initialized]);

  if (!gltf || !gltf.scene) {
    return null;
  }

  return <primitive object={gltf.scene} />;
}

// 3D waste bin markers - realistic cylinder bins with icons and fill indicators
function BinMarker({ position, type, onClick, isSelected, isFiltered, fillLevel }) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();
  const glowRef = useRef();

  // Make the bin bounce up and down when it's selected, pulse the glow ring
  useFrame((state) => {
    if (groupRef.current && isSelected) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 2;
    } else if (groupRef.current) {
      groupRef.current.position.y = position[1];
    }

    // Pulsing glow effect
    if (glowRef.current && (hovered || isSelected)) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.15);
    }
  });

  const getColor = () => {
    switch (type) {
      case 'recycling': return '#1976d2'; // Darker blue
      case 'compost': return '#388e3c'; // Darker green
      case 'general': return '#616161'; // Dark gray
      default: return '#f57c00'; // Orange
    }
  };

  const getEmissiveColor = () => {
    switch (type) {
      case 'recycling': return '#2196f3'; // Bright blue
      case 'compost': return '#4caf50'; // Bright green
      case 'general': return '#9e9e9e'; // Light gray
      default: return '#ff9800'; // Bright orange
    }
  };

  if (isFiltered) return null;

  const baseScale = isSelected ? 1.8 : hovered ? 1.4 : 1;
  const binHeight = 8;
  const binRadius = 3;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={baseScale}
    >
      {/* Glowing base ring - shows bin is interactive */}
      <mesh
        ref={glowRef}
        position={[0, -binHeight / 2 - 0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={998}
      >
        <ringGeometry args={[binRadius * 1.2, binRadius * 1.5, 32]} />
        <meshBasicMaterial
          color={getEmissiveColor()}
          transparent
          opacity={hovered || isSelected ? 0.6 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Main bin body - realistic cylinder */}
      <mesh castShadow receiveShadow renderOrder={999}>
        <cylinderGeometry args={[binRadius, binRadius * 0.9, binHeight, 32]} />
        <meshStandardMaterial
          color={getColor()}
          emissive={getEmissiveColor()}
          emissiveIntensity={isSelected ? 0.6 : hovered ? 0.4 : 0.15}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Bin lid - darker top */}
      <mesh
        position={[0, binHeight / 2 + 0.3, 0]}
        castShadow
        renderOrder={999}
      >
        <cylinderGeometry args={[binRadius * 1.1, binRadius * 1.1, 0.6, 32]} />
        <meshStandardMaterial
          color={getColor()}
          emissive={getEmissiveColor()}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0.1}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Fill level indicator - vertical bar on the side */}
      <mesh position={[binRadius * 0.95, -binHeight / 2 + (binHeight * fillLevel / 100) / 2, 0]} renderOrder={1000}>
        <boxGeometry args={[0.5, binHeight * fillLevel / 100, 1]} />
        <meshBasicMaterial
          color={fillLevel >= 80 ? '#f44336' : fillLevel >= 50 ? '#ff9800' : '#4caf50'}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Icon indicator floating above bin */}
      {(hovered || isSelected) && (
        <mesh position={[0, binHeight / 2 + 4, 0]} renderOrder={1001}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial
            color={getColor()}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {/* Hover tooltip with info */}
      {hovered && !isSelected && (
        <Html distanceFactor={15} center position={[0, binHeight / 2 + 6, 0]}>
          <Box
            sx={{
              ...glassDarkStyle,
              p: 1.5,
              borderRadius: 2,
              color: 'white',
              minWidth: 120,
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', fontSize: '0.85rem' }}>
              {type.charAt(0).toUpperCase() + type.slice(1)} Bin
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
              ID: #{position[0]},{position[2]}
            </Typography>
            <Box sx={{
              mt: 0.5,
              p: 0.5,
              bgcolor: fillLevel >= 80 ? 'error.main' : fillLevel >= 50 ? 'warning.main' : 'success.main',
              borderRadius: 1
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                {fillLevel}% Full
              </Typography>
            </Box>
          </Box>
        </Html>
      )}
    </group>
  );
}

// Shows campus walkways as glowing tubes
function WalkwayPath({ points, color = '#ffeb3b', isHighlighted }) {
  // Create a smooth curve through all the walkway points
  const curve = new THREE.CatmullRomCurve3(
    points.map(p => new THREE.Vector3(p[0], p[1], p[2]))
  );

  return (
    <mesh renderOrder={998}>
      <tubeGeometry args={[curve, points.length * 10, isHighlighted ? 0.8 : 0.5, 8, false]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isHighlighted ? 0.7 : 0.4}
        roughness={0.5}
        metalness={0.1}
        depthTest={false}  // Makes sure walkways always show on top
        depthWrite={false}
        transparent={true}
        opacity={0.9}
      />
    </mesh>
  );
}

// Smoothly moves the camera when you click on a bin
function CameraAnimator({ targetPosition, targetLookAt, isAnimating, onComplete }) {
  const { camera, controls } = useThree();
  const animationProgress = useRef(0);

  useFrame((_state, delta) => {
    if (isAnimating && targetPosition && controls) {
      animationProgress.current += delta * 0.5;

      if (animationProgress.current < 1) {
        // Gradually move camera to target position
        camera.position.lerp(targetPosition, animationProgress.current);
        controls.target.lerp(targetLookAt, animationProgress.current);
        controls.update();
      } else {
        animationProgress.current = 0;
        onComplete();
      }
    }
  });

  return null;
}

// Main 3D scene with the campus model, bins, walkways, and lighting
function Scene({ binData, walkwayData, showBins, showWalkways, selectedBin, onBinSelect, isNight, filterBinType }) {
  const [cameraTarget, setCameraTarget] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleBinClick = (bin) => {
    onBinSelect(bin);

    // Fly camera to the clicked bin
    const targetPos = new THREE.Vector3(
      bin.position[0] + 50,
      bin.position[1] + 30,
      bin.position[2] + 50
    );
    const lookAt = new THREE.Vector3(...bin.position);

    setCameraTarget({ position: targetPos, lookAt });
    setIsAnimating(true);
  };

  return (
    <>
      <SceneBackground isNight={isNight} />

      <PerspectiveCamera makeDefault position={[0, 100, 200]} fov={75} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        dampingFactor={0.05}
        enableDamping={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={50}
        maxDistance={800}
      />

      {cameraTarget && (
        <CameraAnimator
          targetPosition={cameraTarget.position}
          targetLookAt={cameraTarget.lookAt}
          isAnimating={isAnimating}
          onComplete={() => setIsAnimating(false)}
        />
      )}

      {/* Enhanced ambient lighting for better bin visibility */}
      <ambientLight intensity={isNight ? 0.3 : 0.5} />

      {/* Main sun/moon light with improved shadows */}
      <directionalLight
        position={isNight ? [-100, 80, -50] : [100, 200, 80]}
        intensity={isNight ? 0.5 : 2.0}
        color={isNight ? '#6495ED' : '#FFF5E1'}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={600}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
        shadow-bias={-0.0001}
      />

      {/* Fill light to reduce harsh shadows on bins */}
      <directionalLight
        position={[-80, 120, -80]}
        intensity={isNight ? 0.3 : 0.7}
        color={isNight ? '#191970' : '#b3d4ff'}
      />

      {/* Additional light from opposite side for balanced illumination */}
      <directionalLight
        position={[80, 100, 80]}
        intensity={isNight ? 0.2 : 0.5}
        color={isNight ? '#4169E1' : '#87CEEB'}
      />

      {/* Sky and ground lighting with better balance */}
      <hemisphereLight
        skyColor={isNight ? '#0a1929' : '#87CEEB'}
        groundColor={isNight ? '#1a1a2e' : '#6b5d47'}
        intensity={isNight ? 0.4 : 0.7}
      />

      {/* Point lights near bins for enhanced visibility */}
      {showBins && binData.slice(0, 5).map((bin, idx) => (
        <pointLight
          key={`bin-light-${idx}`}
          position={[bin.position[0], bin.position[1] + 15, bin.position[2]]}
          intensity={isNight ? 0.5 : 0.3}
          distance={50}
          decay={2}
          color={isNight ? '#ffffff' : '#fff8dc'}
        />
      ))}

      {/* Campus 3D Model */}
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
        <CampusModel modelPath="/3dmodel.gltf" />
      </Suspense>

      {/* Bin Markers */}
      {showBins && binData.map((bin, index) => (
        <BinMarker
          key={`bin-${index}`}
          position={bin.position}
          type={bin.type}
          fillLevel={bin.fillLevel}
          onClick={() => handleBinClick(bin)}
          isSelected={selectedBin?.id === bin.id}
          isFiltered={filterBinType !== 'all' && filterBinType !== bin.type}
        />
      ))}

      {/* Walkway Paths */}
      {showWalkways && walkwayData.map((walkway, index) => (
        <WalkwayPath
          key={`walkway-${index}`}
          points={walkway.points}
          color={walkway.color || '#ffeb3b'}
          isHighlighted={false}
        />
      ))}
    </>
  );
}

// Main component - wraps everything and handles all the UI controls
export default function CampusModelViewer({ binData = [], walkwayData = [], binMetrics, selectedBin, onBinSelect }) {
  const [showBins, setShowBins] = useState(true);
  const [showWalkways, setShowWalkways] = useState(false); // Disabled by default for better bin visibility
  const [layers, setLayers] = useState(['bins']); // Only show bins by default
  const [isNight, setIsNight] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [filterBinType, setFilterBinType] = useState('all');
  const [quality, setQuality] = useState('high');

  const handleLayerToggle = (_event, newLayers) => {
    setLayers(newLayers);
    setShowBins(newLayers.includes('bins'));
    setShowWalkways(newLayers.includes('walkways'));
  };

  const handleScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `campus-view-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Layer Controls - Top Left */}
      <Zoom in timeout={500}>
        <Box
          sx={{
            position: 'absolute',
            top: 16,
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
            <ToggleButtonGroup
              value={layers}
              onChange={handleLayerToggle}
              orientation="vertical"
              size="small"
              sx={{ width: '100%' }}
            >
              <ToggleButton value="bins" sx={{ justifyContent: 'flex-start' }}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Bins
              </ToggleButton>
              <ToggleButton value="walkways" sx={{ justifyContent: 'flex-start' }}>
                <RouteIcon fontSize="small" sx={{ mr: 1 }} />
                Walkways
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Filter Bins */}
            {showBins && (
              <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                <InputLabel>Filter Bins</InputLabel>
                <Select
                  value={filterBinType}
                  label="Filter Bins"
                  onChange={(e) => setFilterBinType(e.target.value)}
                  sx={{ bgcolor: 'rgba(255,255,255,0.5)' }}
                >
                  <MuiMenuItem value="all">All Types</MuiMenuItem>
                  <MuiMenuItem value="recycling">Recycling</MuiMenuItem>
                  <MuiMenuItem value="compost">Compost</MuiMenuItem>
                  <MuiMenuItem value="general">General</MuiMenuItem>
                </Select>
              </FormControl>
            )}
          </Stack>
        </Box>
      </Zoom>

      {/* Statistics Panel - Top Right */}
      {showStats && binMetrics && (
        <Zoom in timeout={600}>
          <Box
            sx={{
              position: 'absolute',
              top: 16,
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

      {/* Quick Actions - Bottom Left */}
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

          <Tooltip title="Screenshot">
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

      {/* Legend - Bottom Right */}
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
              Legend
            </Typography>
          </Box>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#2196f3', borderRadius: '50%' }} />
              <Typography variant="caption">Recycling</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: '50%' }} />
              <Typography variant="caption">Compost</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#757575', borderRadius: '50%' }} />
              <Typography variant="caption">General</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 3, bgcolor: '#ffeb3b' }} />
              <Typography variant="caption">Walkway</Typography>
            </Box>
          </Stack>

          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary', fontSize: '0.65rem' }}>
            🖱️ Drag to rotate • Scroll to zoom • Click bins for details
          </Typography>
        </Box>
      </Zoom>

      {/* Bin Details Modal */}
      <Dialog
        open={!!selectedBin}
        onClose={() => onBinSelect(null)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        {selectedBin && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeleteIcon />
                <Typography variant="h6">
                  {selectedBin.type.charAt(0).toUpperCase() + selectedBin.type.slice(1)} Bin
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Bin ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    #{selectedBin.id}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Fill Level
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={selectedBin.fillLevel}
                      sx={{
                        flexGrow: 1,
                        height: 12,
                        borderRadius: 2,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: selectedBin.fillLevel >= 80 ? 'error.main' : selectedBin.fillLevel >= 50 ? 'warning.main' : 'success.main'
                        }
                      }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 'bold', minWidth: 50 }}>
                      {selectedBin.fillLevel}%
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Emptied
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedBin.lastEmptied).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Location Coordinates
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    X: {selectedBin.position[0]}, Y: {selectedBin.position[1]}, Z: {selectedBin.position[2]}
                  </Typography>
                </Box>

                {selectedBin.fillLevel >= 80 && (
                  <Chip
                    label="⚠️ Needs attention - Nearly full"
                    color="error"
                    sx={{ mt: 1 }}
                  />
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => onBinSelect(null)} color="primary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Display Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Graphics Quality</InputLabel>
              <Select
                value={quality}
                label="Graphics Quality"
                onChange={(e) => setQuality(e.target.value)}
              >
                <MuiMenuItem value="low">Low</MuiMenuItem>
                <MuiMenuItem value="medium">Medium</MuiMenuItem>
                <MuiMenuItem value="high">High</MuiMenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="caption" gutterBottom>
                Camera Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Use mouse wheel to zoom, left-click to rotate, right-click to pan
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* 3D Canvas - where all the 3D rendering happens */}
      <Canvas
        shadows
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: quality !== 'low',
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: quality === 'high' ? 'high-performance' : 'default',
          alpha: false
        }}
      >
        <Suspense fallback={
          <Html center>
            <CircularProgress />
          </Html>
        }>
          <Scene
            binData={binData}
            walkwayData={walkwayData}
            showBins={showBins}
            showWalkways={showWalkways}
            selectedBin={selectedBin}
            onBinSelect={onBinSelect}
            isNight={isNight}
            filterBinType={filterBinType}
          />
        </Suspense>
      </Canvas>
    </Box>
  );
}

// Load the 3D model ahead of time for faster startup
try {
  useGLTF.preload('/3dmodel.gltf');
} catch (error) {
  console.warn('Could not preload GLTF model:', error);
}
