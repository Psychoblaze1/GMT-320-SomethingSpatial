import React from 'react';
import { Box, Typography, IconButton, LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

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
    <Box
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 200,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 2,
        p: 2,
        minWidth: 250,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon color="action" />
          <Typography variant="h6">Bin Info</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Type</Typography>
          <Typography variant="body2">{formatType(type)}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Fill Level</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={fillLevel}
              color={getFillLevelColor(fillLevel)}
              sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
            />
            <Typography variant="body2" sx={{ minWidth: 45 }}>
              {fillLevel}%
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Coordinates</Typography>
          <Typography variant="body2">
            X: {position[0]}, Y: {position[1]}, Z: {position[2]}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Last Emptied</Typography>
          <Typography variant="body2">{lastEmptied}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">ID</Typography>
          <Typography variant="body2">{id}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
