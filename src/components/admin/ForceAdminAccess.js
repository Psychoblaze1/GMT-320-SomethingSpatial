// Force Admin Access - Helper component for brandon.cooley@live.com
import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, Alert, CircularProgress } from '@mui/material';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function ForceAdminAccess() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const grantAdminAccess = async () => {
    if (!currentUser) {
      setMessage('You must be logged in');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Update to admin role
        await setDoc(doc(db, 'users', currentUser.uid), {
          ...userData,
          role: 'admin'
        });

        setSuccess(true);
        setMessage('Admin access granted! Please refresh the page or log out and log back in.');
      } else {
        setMessage('User document not found. Please make sure you have signed up.');
      }
    } catch (error) {
      console.error('Error granting admin access:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ p: 3 }}>
      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <AdminPanelSettingsIcon color="primary" fontSize="large" />
            <Typography variant="h5">
              Grant Admin Access
            </Typography>
          </Box>

          {currentUser && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Currently logged in as: <strong>{currentUser.email}</strong>
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" paragraph>
            Click the button below to grant admin access to your account. This is useful if you're
            logged in as <code>brandon.cooley@live.com</code> but don't have admin privileges yet.
          </Typography>

          {message && (
            <Alert severity={success ? 'success' : 'error'} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            onClick={grantAdminAccess}
            disabled={loading || !currentUser}
            startIcon={loading ? <CircularProgress size={20} /> : <AdminPanelSettingsIcon />}
          >
            {loading ? 'Granting Access...' : 'Grant Admin Access'}
          </Button>

          {success && (
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
