import React from 'react';
import { Box, Typography, Card, CardContent, Alert, AlertTitle, Chip } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // If an error occurs, set the state to indicate an error to the user
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for admins
    console.error('WebGL Error caught by boundary:', error, errorInfo);
  }


  render() {
    if (this.state.hasError) {
      const { binData = [], walkwayData = [] } = this.props;

      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            p: 4
          }}
        >
          <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom align="center">
            3D Viewer Not Available
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 600 }}>
            Your browser or system doesn't support WebGL, which is required for 3D visualization.
          </Typography>

          <Alert severity="info" sx={{ maxWidth: 600, mb: 3 }}>
            <AlertTitle>Possible Solutions</AlertTitle>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><strong>Enable Hardware Acceleration:</strong>
                <ul>
                  <li>Chrome/Edge: Settings → System → Use hardware acceleration</li>
                  <li>Firefox: Settings → General → Performance → Use hardware acceleration</li>
                </ul>
              </li>
              <li><strong>Update Graphics Drivers:</strong> Visit your GPU manufacturer's website</li>
              <li><strong>Try a Different Browser:</strong> Chrome, Firefox, or Edge usually have better WebGL support</li>
              <li><strong>Test WebGL Support:</strong> Visit <a href="https://get.webgl.org/" target="_blank" rel="noopener noreferrer">get.webgl.org</a></li>
            </ul>
          </Alert>

          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Campus Data Summary
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Waste Management Bins:</strong> {binData.length} locations across campus
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                {['recycling', 'compost', 'general'].map(type => {
                  const count = binData.filter(b => b.type === type).length;
                  return count > 0 ? (
                    <Chip
                      key={type}
                      label={`${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`}
                      size="small"
                      color={type === 'recycling' ? 'primary' : type === 'compost' ? 'success' : 'default'}
                    />
                  ) : null;
                })}
              </Box>
              <Typography variant="body2">
                <strong>Accessible Walkways:</strong> {walkwayData.length} paths mapped
              </Typography>
            </CardContent>
          </Card>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
            Note: The Dashboard and other pages will continue to work normally
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default WebGLErrorBoundary;