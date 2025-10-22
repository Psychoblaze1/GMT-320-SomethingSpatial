import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, PerspectiveCamera } from '@react-three/drei';
import { Box, CircularProgress, Typography } from '@mui/material';
import * as THREE from 'three';

// Simple component that loads and displays the GLTF model
function Model({ modelPath }) {
  const gltf = useGLTF(modelPath);
  const { camera, controls } = useThree();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('Model loading:', { hasGLTF: !!gltf, hasScene: !!gltf?.scene });
    
    if (gltf?.scene && !initialized) {
      const scene = gltf.scene;

      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(scene);
      const min = box.min;
      
      // Position model at ground level
      const yOffset = -min.y;
      scene.position.y = yOffset;

      // Recalculate box after positioning
      const newBox = new THREE.Box3().setFromObject(scene);
      const center = newBox.getCenter(new THREE.Vector3());
      const size = newBox.getSize(new THREE.Vector3());

      // Calculate camera distance to fit entire model
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.2;

      // Position camera
      camera.position.set(
        center.x + distance * 0.5,
        center.y + distance * 0.8,
        center.z + distance * 0.5
      );
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      // Update controls
      if (controls) {
        controls.target.copy(center);
        controls.update();
      }

      // Enable shadows
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
      console.log('Model component unmounting (cache preserved)');
    };
  }, [gltf, camera, controls, initialized]);

  if (!gltf?.scene) return null;

  return <primitive object={gltf.scene} />;
}

// Main viewer component
export default function SimpleModelViewer() {
  const [modelPath] = useState('/3dmodel.gltf');

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
        {/* Sky background */}
        <color attach="background" args={['#87CEEB']} />

        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 100, 200]} fov={75} />

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2}
          minDistance={50}
          maxDistance={1000}
        />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[100, 150, 50]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight skyColor="#87CEEB" groundColor="#6b5d47" intensity={0.5} />

        {/* Model */}
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

      {/* Instructions */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          bgcolor: 'rgba(255,255,255,0.9)',
          p: 2,
          borderRadius: 2,
          boxShadow: 2
        }}
      >
        <Typography variant="caption" sx={{ display: 'block' }}>
          🖱️ Drag to rotate and move
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          📜 Scroll to zoom
        </Typography>
      </Box>
    </Box>
  );
}

// Preload model
useGLTF.preload('/3dmodel.gltf');