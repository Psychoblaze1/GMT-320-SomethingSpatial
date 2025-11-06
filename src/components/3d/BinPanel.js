import React from 'react';
import { Box, Typography, IconButton, LinearProgress, Stack, Divider, Zoom } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { glassStyle } from '../../theme';

export default function BinPanel({ selectedBin, onClose }) {
  if (!selectedBin) return null;

  const { id, type, fillLevel, position, lastEmptied } = selectedBin;

  // Color coding for fill level
  const getFillLevelColor = (level) => {
    if (level >= 80) return 'error';
    if (level >= 50) return 'warning';
    return 'success';
  };

  // Capitalize bin type
  const formatType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Zoom in timeout={400}>
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 200,
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
          <DeleteIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Waste Bin Info
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={1.5}>
        {/* Bin ID */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            Bin ID
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
            {id}
          </Typography>
        </Box>

        {/* Type */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            Type
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
            {formatType(type)}
          </Typography>
        </Box>

        {/* Fill Level */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            Fill Level
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={fillLevel}
              color={getFillLevelColor(fillLevel)}
              sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
            />
            <Typography variant="body2" sx={{ minWidth: 45, fontWeight: 500 }}>
              {fillLevel}%
            </Typography>
          </Box>
        </Box>

        {/* Last Emptied */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            Last Emptied
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {lastEmptied}
          </Typography>
        </Box>

        {/* Location */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            Location
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace', fontSize: '0.75rem' }}>
            X: {position[0].toFixed(1)}, Y: {position[1].toFixed(1)}, Z: {position[2].toFixed(1)}
          </Typography>
        </Box>
      </Stack>
    </Box>
    </Zoom>
  );
}
