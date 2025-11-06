import React from 'react';
import { Box, Typography, IconButton, Stack, Divider, Zoom } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { glassStyle } from '../../theme';

export default function DataPanel({ selectedObject, onClose }) {
  if (!selectedObject) return null;

  const { id, buildingName, baseHeight, topHeight, height } = selectedObject;

  // Helper function to check if a value should be displayed
  const shouldDisplay = (value) => {
    return value && value !== 'N/A' && value !== 'NULL' && value.trim() !== '';
  };

  return (
    <Zoom in timeout={400}>
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 200, // Position left of the controls panel
          zIndex: 1000,
          ...glassStyle,
          borderRadius: 3,
          p: 2,
          minWidth: 250,
          maxWidth: 280,
          transition: 'all 0.3s ease'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoOutlinedIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Building Info
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={1.5}>
          {/* Building Name */}
          {shouldDisplay(buildingName) && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                Name
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                {buildingName}
              </Typography>
            </Box>
          )}

          {/* ID */}
          {shouldDisplay(id) && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                ID
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                {id}
              </Typography>
            </Box>
          )}

          {/* Height */}
          {shouldDisplay(height) && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                Height
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                {height}
              </Typography>
            </Box>
          )}

          {/* Base Height */}
          {shouldDisplay(baseHeight) && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                Base Elevation
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {baseHeight}
              </Typography>
            </Box>
          )}

          {/* Top Height */}
          {shouldDisplay(topHeight) && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                Top Elevation
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {topHeight}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Zoom>
  );
}
