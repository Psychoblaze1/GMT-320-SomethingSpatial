import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, PerspectiveCamera } from '@react-three/drei';
import { Box, CircularProgress, Typography } from '@mui/material';
import * as THREE from 'three';
import OSMBasemap from './OSMBasemap';

// Component that syncs background color with day/night mode
function SceneBackground({ isNight }) {
  const { scene } = useThree();

  useEffect(() => {
    const dayColor = new THREE.Color('#87CEEB'); // Sky blue for daytime
    const nightColor = new THREE.Color('#0a1929'); // Dark blue for nighttime
    scene.background = isNight ? nightColor : dayColor;
  }, [scene, isNight]);

  return null;
}

// Component that loads and displays the GLTF 3D model
function Model({ modelPath }) {
  const gltf = useGLTF(modelPath);
  const { camera, controls } = useThree();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('Model loading:', { hasGLTF: !!gltf, hasScene: !!gltf?.scene });
    
    if (gltf?.scene && !initialized) {
      const scene = gltf.scene;

      // Step 1: Calculate the bounding box of the entire model
      const box = new THREE.Box3().setFromObject(scene);
      const min = box.min;
      
      // Step 2: Position model so its bottom sits at ground level (y=0)
      const yOffset = -min.y;
      scene.position.y = yOffset;

      // Step 3: Recalculate bounding box after positioning
      const newBox = new THREE.Box3().setFromObject(scene);
      const center = newBox.getCenter(new THREE.Vector3());
      const size = newBox.getSize(new THREE.Vector3());

      // Step 4: Calculate optimal camera distance to fit entire model in view
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.2;

      // Step 5: Position camera at an angle for nice 3D perspective
      camera.position.set(
        center.x + distance * 0.5,
        center.y + distance * 0.8,
        center.z + distance * 0.5
      );
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      // Step 6: Configure orbit controls to focus on model center
      if (controls) {
        controls.target.copy(center);
        controls.update();
      }

      // Step 7: Enable shadows for realistic lighting
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      setInitialized(true);
      console.log('Model initialized successfully');
    }

    return () => {
      console.log('Model component unmounting (GLTF cache preserved)');
    };
  }, [gltf, camera, controls, initialized]);

  if (!gltf?.scene) return null;

  return <primitive object={gltf.scene} />;
}

// Main viewer component
export default function SimpleModelViewer({ isNight = false, showOSM = false, basemapType = 'osm' }) {
  const [modelPath] = useState('/FinalModel.gltf');

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        m: 0,
        p: 0
      }}
    >
      <Canvas
        shadows
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance'
        }}
      >
        {/* Dynamic background color */}
        <SceneBackground isNight={isNight} />

        {/* Camera setup */}
        <PerspectiveCamera makeDefault position={[0, 100, 200]} fov={75} />

        {/* Interactive camera controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2}
          minDistance={50}
          maxDistance={1000}
        />

        {/* Basemap with selected type */}
        {showOSM && <OSMBasemap visible={showOSM} basemapType={basemapType} />}

        {/* Lighting setup */}
        <ambientLight intensity={isNight ? 0.1 : 0.3} />
        <directionalLight
          position={isNight ? [-100, 80, -50] : [100, 150, 50]}
          intensity={isNight ? 0.3 : 1.5}
          color={isNight ? '#6495ED' : '#FFF5E1'}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight 
          skyColor={isNight ? '#0a1929' : '#87CEEB'} 
          groundColor={isNight ? '#1a1a2e' : '#6b5d47'} 
          intensity={isNight ? 0.2 : 0.5} 
        />

        {/* 3D Model */}
        <Suspense fallback={
          <Html center>
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Loading 3D Model...
              </Typography>
            </Box>
          </Html>
        }>
          <Model modelPath={modelPath} />
        </Suspense>
      </Canvas>

      {/* User instructions */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          bgcolor: 'rgba(255,255,255,0.9)',
          p: 2,
          borderRadius: 2,
          boxShadow: 2,
          zIndex: 1000
        }}
      >
        <Typography variant="caption" sx={{ display: 'block' }}>
          🖱️ Drag to rotate
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          📜 Scroll to zoom
        </Typography>
      </Box>
    </Box>
  );
}

useGLTF.preload('/FinalModel.gltf');