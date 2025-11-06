/**
 * Tour Welcome Dialog Component
 * Shows before the 3D campus tour starts
 * Explains what the tour includes and SDG 11 alignment
 */

import React, { useState } from 'react';
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
  Checkbox,
  FormControlLabel,
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import NatureIcon from '@mui/icons-material/Nature';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { WELCOME_DIALOG_CONTENT, SDG_11_INFO } from '../../data/tourNarration';

export default function TourWelcomeDialog({
  open,
  onStart,
  onSkip
}) {
  const theme = useTheme();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleStart = () => {
    onStart(dontShowAgain);
  };

  const handleSkip = () => {
    onSkip(dontShowAgain);
  };

  const featureIcons = [
    <SolarPowerIcon color="warning" />,
    <NatureIcon color="success" />,
    <WaterDropIcon color="primary" />,
    <DeleteOutlineIcon color="action" />,
    <CheckCircleIcon color="success" />
  ];

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          background: theme.palette.mode === 'dark'
            ? 'rgba(30, 30, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
              fontSize: '28px'
            }}
          >
            {SDG_11_INFO.icon}
          </Box>
          <Box flex={1}>
            <Typography variant="h5" fontWeight="bold">
              {WELCOME_DIALOG_CONTENT.title}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {WELCOME_DIALOG_CONTENT.subtitle}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* SDG 11 Badge */}
        <Box mb={2}>
          <Chip
            icon={<PublicIcon />}
            label={SDG_11_INFO.title}
            sx={{
              backgroundColor: SDG_11_INFO.color,
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        {/* Description */}
        <Typography variant="body2" paragraph>
          Experience an interactive journey through our sustainable campus, showcasing how we're achieving the UN Sustainable Development Goal 11 for sustainable cities and communities.
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Tour Features */}
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          What You'll Discover:
        </Typography>
        <List dense sx={{ mb: 2 }}>
          {WELCOME_DIALOG_CONTENT.features.map((feature, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {featureIcons[index]}
              </ListItemIcon>
              <ListItemText
                primary={feature}
                primaryTypographyProps={{
                  variant: 'body2'
                }}
              />
            </ListItem>
          ))}
        </List>

        {/* Duration */}
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          p={1.5}
          sx={{
            backgroundColor: theme.palette.action.hover,
            borderRadius: 1
          }}
        >
          <AccessTimeIcon fontSize="small" color="primary" />
          <Typography variant="body2">
            <strong>Duration:</strong> {WELCOME_DIALOG_CONTENT.duration}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tour Controls Info */}
        <Typography variant="caption" color="text.secondary" paragraph>
          The tour will automatically guide your camera through key sustainability features. You can skip sections or close the tour at any time using the on-screen controls.
        </Typography>

        {/* Don't Show Again Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              {WELCOME_DIALOG_CONTENT.checkboxLabel}
            </Typography>
          }
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleSkip}
          variant="outlined"
          color="inherit"
        >
          {WELCOME_DIALOG_CONTENT.skipText}
        </Button>
        <Button
          onClick={handleStart}
          variant="contained"
          color="primary"
          size="large"
          startIcon={<CheckCircleIcon />}
          sx={{
            px: 4,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
          }}
        >
          {WELCOME_DIALOG_CONTENT.buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
