import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  ViewInAr as ViewInArIcon,
  Map as MapIcon,
  Article as ArticleIcon,
  AdminPanelSettings as AdminIcon,
  EmojiObjects as TipIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export const TUTORIAL_STORAGE_KEY = 'campusSustainability_tutorialCompleted';

/**
 * WelcomeTutorial Component
 * Shows a multi-step tutorial dialog for first-time users
 * @param {boolean} open - Control whether the dialog is open
 * @param {function} onClose - Callback when dialog closes
 */
const WelcomeTutorial = ({ open = false, onClose }) => {
  const { isAdmin } = useAuth();
  const [activeStep, setActiveStep] = useState(0);

  const handleClose = () => {
    setActiveStep(0); // Reset to first step
    if (onClose) {
      onClose();
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const tutorialSteps = [
    {
      title: 'Welcome to Campus Sustainability Dashboard',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: 'success.main', fontWeight: 'bold' }}>
            🌱 Track and Visualize Campus Sustainability
          </Typography>
          <Typography variant="body1" paragraph>
            This dashboard helps you monitor and analyze sustainability efforts across campus, including:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <TipIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Solar Potential Analysis"
                secondary="Identify optimal locations for solar panel installation"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TipIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Green Space Monitoring"
                secondary="Track parks, gardens, and natural areas"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TipIcon color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Waste Management"
                secondary="Monitor recycling bins and waste collection points"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TipIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Water Conservation"
                secondary="Track rainwater harvesting and water usage"
              />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      title: 'Dashboard Pages Overview',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Navigate through different views using the sidebar menu:
          </Typography>
          <List>
            <ListItem sx={{ mb: 2 }}>
              <ListItemIcon>
                <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="h6">Overview</Typography>}
                secondary="Main dashboard with key metrics, charts, and sustainability statistics for the entire campus"
              />
            </ListItem>
            <Divider />
            <ListItem sx={{ mb: 2, mt: 2 }}>
              <ListItemIcon>
                <ViewInArIcon color="primary" sx={{ fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="h6">3D Campus View</Typography>}
                secondary="Interactive 3D visualization of campus with sustainability features like green spaces, solar panels, and waste bins"
              />
            </ListItem>
            <Divider />
            <ListItem sx={{ mb: 2, mt: 2 }}>
              <ListItemIcon>
                <MapIcon color="primary" sx={{ fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="h6">2D Map View</Typography>}
                secondary="Traditional map interface for analyzing campus data layers and geospatial information"
              />
            </ListItem>
            <Divider />
            <ListItem sx={{ mt: 2 }}>
              <ListItemIcon>
                <ArticleIcon color="primary" sx={{ fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="h6">Blog</Typography>}
                secondary="Stay updated with campus sustainability news, events, and initiatives"
              />
            </ListItem>
          </List>
          {isAdmin && (
            <>
              <Divider sx={{ my: 2 }} />
              <ListItem>
                <ListItemIcon>
                  <AdminIcon color="error" sx={{ fontSize: 32 }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="h6" color="error.main">Admin Panel</Typography>}
                  secondary="As an admin, you have access to manage data, blog posts, and user permissions"
                />
              </ListItem>
            </>
          )}
        </Box>
      )
    }
  ];

  const currentStep = tutorialSteps[activeStep];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 6
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          {currentStep.title}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Stepper */}
      <Box sx={{ px: 3, pt: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {tutorialSteps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{`Step ${index + 1}`}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {currentStep.content}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={handleClose}
          color="inherit"
          variant="outlined"
        >
          Skip Tutorial
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<BackIcon />}
          >
            Back
          </Button>
          {activeStep === tutorialSteps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleClose}
              color="success"
            >
              Get Started!
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NextIcon />}
            >
              Next
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default WelcomeTutorial;
