import React, { useState } from 'react';
import { Box, Fade } from '@mui/material';
import MainLayout from '../components/layout/MainLayout';
import CampusModelViewer from '../components/3d/CampusModelViewer';
import WebGLErrorBoundary from '../components/3d/ErrorBoundary';
import { binLocations, getBinMetrics } from '../services/sustainabilityData';

export default function MapViewer() {
  const [selectedBin, setSelectedBin] = useState(null);
  const binMetrics = getBinMetrics();

  return (
    <MainLayout title="3D Campus View">
      <Box
        sx={{
          height: 'calc(100vh - 64px)',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)'
        }}
      >
        {/* 3D Viewer with Error Boundary */}
        <Fade in timeout={800}>
          <Box sx={{ height: '100%', width: '100%' }}>
            <WebGLErrorBoundary binData={binLocations} walkwayData={[]}>
              <CampusModelViewer
                binData={binLocations}
                walkwayData={[]}
                binMetrics={binMetrics}
                selectedBin={selectedBin}
                onBinSelect={setSelectedBin}
              />
            </WebGLErrorBoundary>
          </Box>
        </Fade>
      </Box>
    </MainLayout>
  );
}
