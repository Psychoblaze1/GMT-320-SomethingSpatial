import React from 'react';
import { Box, Fade } from '@mui/material';
import MainLayout from '../components/layout/MainLayout';
import CampusModelViewer from '../components/3d/CampusModelViewer';
import WebGLErrorBoundary from '../components/3d/ErrorBoundary';
import { getBinMetrics } from '../services/sustainabilityData';

export default function MapViewer() {
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
        <Fade in timeout={800}>
          <Box sx={{ height: '100%', width: '100%' }}>
            <WebGLErrorBoundary>
              <CampusModelViewer binMetrics={binMetrics} />
            </WebGLErrorBoundary>
          </Box>
        </Fade>
      </Box>
    </MainLayout>
  );
}
