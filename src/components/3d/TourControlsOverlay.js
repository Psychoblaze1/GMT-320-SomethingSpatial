/**
 * Tour Controls Overlay Component - Simplified
 * Displays progress bar and close button during the tour
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Fade,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TOUR_DURATION } from '../../data/tourNarration';

export default function TourControlsOverlay({
  currentTime,
  isPlaying,
  onClose,
  autoHide = true
}) {
  const theme = useTheme();
  const [visible, setVisible] = useState(true);
  const [hideTimeout, setHideTimeout] = useState(null);

  // Calculate progress percentage
  const progress = (currentTime / TOUR_DURATION) * 100;

  // Auto-hide after 3 seconds of no interaction
  useEffect(() => {
    if (autoHide && isPlaying) {
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 3000);

      setHideTimeout(timeout);

      return () => clearTimeout(timeout);
    }
  }, [autoHide, isPlaying, currentTime]); // Reset timer when time changes (user interaction)

  // Show controls on mouse movement
  const handleMouseEnter = () => {
    if (autoHide) {
      setVisible(true);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    }
  };

  const handleMouseLeave = () => {
    if (autoHide && isPlaying) {
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 3000);
      setHideTimeout(timeout);
    }
  };

  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '90%',
        maxWidth: 600,
        pointerEvents: 'auto'
      }}
    >
      <Fade in={visible} timeout={300}>
        <Paper
          elevation={8}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Progress Bar */}
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              backgroundColor: theme.palette.action.hover,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                transition: 'transform 0.3s ease'
              }
            }}
          />

          {/* Content */}
          <Box p={2}>
            {/* Header with controls */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              {/* Title and Time */}
              <Box flex={1}>
                <Typography variant="caption" color="primary" fontWeight="bold">
                  CAMPUS SUSTAINABILITY TOUR
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatTime(currentTime)} / {formatTime(TOUR_DURATION)}
                </Typography>
              </Box>

              {/* Control Button */}
              <Tooltip title="Close Tour" arrow>
                <IconButton
                  onClick={onClose}
                  size="small"
                  sx={{
                    color: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
}
