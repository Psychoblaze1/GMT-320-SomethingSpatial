import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function Loader({ message = 'Loading…' }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        zIndex: 2000
      }}
    >
      <CircularProgress size={64} />
      <Typography sx={{ mt: 2, fontWeight: 'bold' }}>{message}</Typography>
    </Box>
  );
}