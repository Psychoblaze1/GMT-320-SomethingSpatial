/**
 * Replay Tour Button Component
 * Displays a button to replay the 3D campus tour
 * Only shows after the tour has been seen at least once
 */

import React from 'react';
import {
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';

export default function ReplayTourButton({ onClick, visible = true }) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Tooltip title="Replay Campus Tour" arrow placement="left">
      <IconButton
        onClick={onClick}
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 900,
          width: 48,
          height: 48,
          background: theme.palette.mode === 'dark'
            ? 'rgba(30, 30, 30, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
          color: theme.palette.primary.main,
          transition: 'all 0.3s ease',
          '&:hover': {
            background: theme.palette.mode === 'dark'
              ? 'rgba(40, 40, 40, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            transform: 'scale(1.05)',
            boxShadow: '0 6px 20px 0 rgba(31, 38, 135, 0.3)'
          },
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        <ReplayIcon />
      </IconButton>
    </Tooltip>
  );
}
