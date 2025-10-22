import React, { useEffect, useRef } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// Available basemap providers
export const BASEMAP_TYPES = {
  OSM: 'osm',
  SATELLITE: 'satellite',
  TOPO: 'topo',
  DARK: 'dark',
  STREETS: 'streets'
};

// Component that renders basemap tiles as a 3D textured plane
function BasemapPlane({ center, zoom, visible, basemapType }) {
  const meshRef = useRef();
  const materialRef = useRef();

  /**
   * Get tile URL based on basemap type
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} zoom - Zoom level
   * @param {string} type - Basemap type
   * @returns {string} Tile URL
   */
  const getTileURL = (lat, lon, zoom, type) => {
    // Convert lat/lon to tile coordinates
    const n = Math.pow(2, zoom);
    const xtile = Math.floor((lon + 180) / 360 * n);
    const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    
    // Return URL based on basemap type
    switch (type) {
      case BASEMAP_TYPES.OSM:
        // OpenStreetMap - Standard map view
        return `https://tile.openstreetmap.org/${zoom}/${xtile}/${ytile}.png`;
      
      case BASEMAP_TYPES.SATELLITE:
        // ESRI World Imagery - Satellite/aerial imagery
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ytile}/${xtile}`;
      
      case BASEMAP_TYPES.TOPO:
        // OpenTopoMap - Topographic map with contours and terrain
        return `https://tile.opentopomap.org/${zoom}/${xtile}/${ytile}.png`;
      
      case BASEMAP_TYPES.DARK:
        // CartoDB Dark Matter - Dark theme map
        return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${zoom}/${xtile}/${ytile}.png`;
      
      case BASEMAP_TYPES.STREETS:
        // CartoDB Positron - Light/clean street map
        return `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${zoom}/${xtile}/${ytile}.png`;
      
      default:
        // Fallback to OSM
        return `https://tile.openstreetmap.org/${zoom}/${xtile}/${ytile}.png`;
    }
  };

  // Load the basemap tile as a texture
  const texture = useLoader(
    THREE.TextureLoader,
    getTileURL(center[0], center[1], zoom, basemapType)
  );

  useEffect(() => {
    if (texture) {
      // Apply texture filtering for better quality when zooming
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16; // Improve texture quality at angles
    }
  }, [texture]);

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to be horizontal (ground plane)
      position={[0, -0.1, 0]} // Slightly below the model
      visible={visible}
      receiveShadow // Allow shadows to be cast on the basemap
    >
      {/* Large plane to act as the ground - matches world scale */}
      <planeGeometry args={[2000, 2000, 1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent={true}
        opacity={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Component that synchronizes basemap zoom with camera movements
function DynamicBasemapTiles({ center, zoom, visible, basemapType }) {
  const { camera } = useThree();
  const [currentZoom, setCurrentZoom] = React.useState(zoom);
  const lastCameraY = useRef(camera.position.y);

  useFrame(() => {
    // Adjust zoom level based on camera height
    const cameraHeight = camera.position.y;
    
    // Calculate new zoom level (higher camera = lower zoom number)
    // Only update if camera moved significantly (> 10 units)
    if (Math.abs(cameraHeight - lastCameraY.current) > 10) {
      const newZoom = Math.max(10, Math.min(18, 
        Math.floor(18 - Math.log2(cameraHeight / 50))
      ));
      
      if (newZoom !== currentZoom) {
        setCurrentZoom(newZoom);
      }
      lastCameraY.current = cameraHeight;
    }
  });

  return <BasemapPlane center={center} zoom={currentZoom} visible={visible} basemapType={basemapType} />;
}

/**
 * Main basemap component to be used inside Three.js Canvas
 * @param {boolean} visible - Whether the basemap is visible
 * @param {array} center - [latitude, longitude] center point
 * @param {number} zoom - Initial zoom level (10-18)
 * @param {string} basemapType - Type of basemap (see BASEMAP_TYPES)
 */
export default function OSMBasemap({ 
  visible = true, 
  center = [-25.7553, 28.2316], // University of Pretoria coordinates (lat, lon)
  zoom = 16,
  basemapType = BASEMAP_TYPES.OSM
}) {
  if (!visible) return null;

  return <DynamicBasemapTiles center={center} zoom={zoom} visible={visible} basemapType={basemapType} />;
}

// Dummy export for compatibility (no longer needed in Canvas)
export function OSMCameraSync() {
  return null;
}