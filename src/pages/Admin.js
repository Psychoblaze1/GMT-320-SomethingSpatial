// src/pages/Admin.js - Campus Sustainability Admin Panel
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import {
  Button, Typography, Container, Alert, Snackbar,
  Card, CardContent, CardHeader, Grid, Divider, Paper,
  List, ListItem, ListItemText, Chip,
  Tabs, Tab, Box, Select, MenuItem, FormControl,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import DatasetIcon from '@mui/icons-material/Dataset';
import ArticleIcon from '@mui/icons-material/Article';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getAllUsers, updateUserRole } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import DataManager from './admin/DataManager';
import BlogManager from './admin/BlogManager';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Admin() {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');
  const [showAlert, setShowAlert] = useState(false);
  const [users, setUsers] = useState([]);
  const [roleChangeDialog, setRoleChangeDialog] = useState({ open: false, user: null, newRole: '' });

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage(`Error fetching users: ${error.message}`);
      setSeverity('error');
      setShowAlert(true);
    }
  };

  const handleRoleChangeRequest = (user, newRole) => {
    setRoleChangeDialog({ open: true, user, newRole });
  };

  const handleRoleChangeConfirm = async () => {
    const { user, newRole } = roleChangeDialog;
    try {
      await updateUserRole(user.id, newRole, currentUser.uid);
      setMessage(`Successfully updated ${user.email} to ${newRole}`);
      setSeverity('success');
      setShowAlert(true);
      await fetchUsers();
    } catch (error) {
      setMessage(`Error updating role: ${error.message}`);
      setSeverity('error');
      setShowAlert(true);
    } finally {
      setRoleChangeDialog({ open: false, user: null, newRole: '' });
    }
  };

  const handleRoleChangeCancel = () => {
    setRoleChangeDialog({ open: false, user: null, newRole: '' });
  };

  // Function to make current user an admin
  const makeUserAdmin = async () => {
    try {
      const userEmail = 'brandon.cooley@live.com';
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      let userId = null;
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.email && userData.email.toLowerCase() === userEmail.toLowerCase()) {
          userId = doc.id;
        }
      });

      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          role: 'admin'
        });
        setMessage(`User ${userEmail} is now an admin. Please log out and log back in.`);
        setSeverity('success');
        setShowAlert(true);
        fetchUsers();
      } else {
        setMessage(`User ${userEmail} not found. Please register with this email first.`);
        setSeverity('warning');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error making user admin:', error);
      setMessage(`Error making user admin: ${error.message}`);
      setSeverity('error');
      setShowAlert(true);
    }
  };

  return (
    <MainLayout title="Admin Panel">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Campus Sustainability Admin Panel
        </Typography>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3, mb: 2 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab icon={<SettingsIcon />} label="Overview" />
            <Tab icon={<DatasetIcon />} label="Data Manager" />
            <Tab icon={<ArticleIcon />} label="Blog" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
          {/* Admin Access Card */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                avatar={<SettingsIcon color="primary" />}
                title="Admin Access Control"
                subheader="Manage administrator privileges"
              />
              <Divider />
              <CardContent>
                <Typography variant="body2" paragraph>
                  Grant admin access to brandon.cooley@live.com
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={makeUserAdmin}
                  startIcon={<CheckCircleIcon />}
                >
                  Make User Admin
                </Button>
              </CardContent>
            </Card>
          </Grid>


          {/* User Management Card */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                avatar={<PeopleIcon color="info" />}
                title="User Management"
                subheader={`Total users: ${users.length}`}
              />
              <Divider />
              <CardContent>
                {users.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No users registered yet
                  </Typography>
                ) : (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <List>
                      {users.map((user) => (
                        <ListItem
                          key={user.id}
                          sx={{
                            py: 2,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': { borderBottom: 'none' }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight="medium">
                                {user.email}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                              </Typography>
                            }
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={user.role || 'user'}
                                onChange={(e) => handleRoleChangeRequest(user, e.target.value)}
                                disabled={user.id === currentUser?.uid}
                              >
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                              </Select>
                            </FormControl>
                            <Chip
                              label={user.role === 'admin' ? 'Admin' : 'User'}
                              color={user.role === 'admin' ? 'primary' : 'default'}
                              size="small"
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>

        </Grid>
        </TabPanel>

        {/* Data Manager Tab */}
        <TabPanel value={currentTab} index={1}>
          <DataManager />
        </TabPanel>

        {/* Blog Tab */}
        <TabPanel value={currentTab} index={2}>
          <BlogManager />
        </TabPanel>

        {/* Role Change Confirmation Dialog */}
        <Dialog
          open={roleChangeDialog.open}
          onClose={handleRoleChangeCancel}
        >
          <DialogTitle>Confirm Role Change</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to change <strong>{roleChangeDialog.user?.email}</strong>'s role to <strong>{roleChangeDialog.newRole}</strong>?
              {roleChangeDialog.newRole === 'admin' && (
                <>
                  <br /><br />
                  Admin users will have full access to:
                  <ul>
                    <li>User management</li>
                    <li>Map layer configuration</li>
                    <li>Data management</li>
                    <li>System analytics</li>
                  </ul>
                </>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRoleChangeCancel} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleRoleChangeConfirm} variant="contained" color="primary">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Alert snackbar */}
        <Snackbar
          open={showAlert}
          autoHideDuration={6000}
          onClose={() => setShowAlert(false)}
        >
          <Alert severity={severity} onClose={() => setShowAlert(false)}>
            {message}
          </Alert>
        </Snackbar>
      </Container>
    </MainLayout>
  );
}
