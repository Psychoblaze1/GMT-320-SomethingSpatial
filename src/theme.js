import { createTheme } from '@mui/material/styles';

// Main app theme with green sustainability colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green for sustainability theme
      light: '#60ad5e',
      dark: '#005005',
    },
    secondary: {
      main: '#1976d2', // Blue for water/innovation
      light: '#63a4ff',
      dark: '#004ba0',
    },
    background: {
      default: '#f1f8f4', // Light green tint
      paper: '#ffffff',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#f57c00', // Orange for solar energy
    },
    info: {
      main: '#0288d1', // Blue for information
    },
    success: {
      main: '#388e3c', // Green for positive metrics
      light: '#81c784',
      dark: '#1b5e20',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
});

// Glassmorphism styles - frosted glass effect for UI panels
export const glassStyle = {
  background: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
};

// Dark variant for overlays
export const glassDarkStyle = {
  background: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
};

// Hover state with lift effect
export const glassHoverStyle = {
  background: 'rgba(255, 255, 255, 0.25)',
  transform: 'translateY(-2px)',
  boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.25)',
};

export default theme;