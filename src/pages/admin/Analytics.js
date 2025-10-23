// Analytics Dashboard - Admin analytics and activity monitoring
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import { getAnalytics, getAuditLogs } from '../../services/adminService';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, logsData] = await Promise.all([
        getAnalytics(),
        getAuditLogs({})
      ]);

      setAnalytics(analyticsData);
      setAuditLogs(logsData.slice(0, 20)); // Last 20 logs
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'upload':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';

    // Handle Firestore timestamp
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'MMM dd, yyyy HH:mm');
    }

    // Handle regular date
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Chart data
  const actionTypesData = {
    labels: ['Create', 'Update', 'Delete', 'Upload'],
    datasets: [
      {
        label: 'Actions by Type',
        data: [
          auditLogs.filter(log => log.action === 'create').length,
          auditLogs.filter(log => log.action === 'update').length,
          auditLogs.filter(log => log.action === 'delete').length,
          auditLogs.filter(log => log.action === 'upload').length
        ],
        backgroundColor: [
          'rgba(76, 175, 80, 0.6)',
          'rgba(33, 150, 243, 0.6)',
          'rgba(244, 67, 54, 0.6)',
          'rgba(156, 39, 176, 0.6)'
        ],
        borderColor: [
          'rgb(76, 175, 80)',
          'rgb(33, 150, 243)',
          'rgb(244, 67, 54)',
          'rgb(156, 39, 176)'
        ],
        borderWidth: 1
      }
    ]
  };

  const resourceTypesData = {
    labels: ['Map Layers', 'GeoPackages', 'Sustainability Data', 'Other'],
    datasets: [
      {
        data: [
          auditLogs.filter(log => log.resourceType === 'map-layer').length,
          auditLogs.filter(log => log.resourceType === 'geopackage').length,
          auditLogs.filter(log => log.resourceType === 'sustainability-item').length,
          auditLogs.filter(log => !['map-layer', 'geopackage', 'sustainability-item'].includes(log.resourceType)).length
        ],
        backgroundColor: [
          'rgba(255, 193, 7, 0.6)',
          'rgba(156, 39, 176, 0.6)',
          'rgba(76, 175, 80, 0.6)',
          'rgba(158, 158, 158, 0.6)'
        ],
        borderColor: [
          'rgb(255, 193, 7)',
          'rgb(156, 39, 176)',
          'rgb(76, 175, 80)',
          'rgb(158, 158, 158)'
        ],
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading analytics: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Analytics Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Monitor system activity, user actions, and resource usage
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <StorageIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics?.totalLayers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Map Layers
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AssessmentIcon color="secondary" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics?.totalGeoPackages || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    GeoPackages
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TrendingUpIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics?.totalActions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Actions
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PeopleIcon color="info" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {auditLogs.length > 0 ? new Set(auditLogs.map(log => log.userId)).size : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions by Type
              </Typography>
              <Bar
                data={actionTypesData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resources Distribution
              </Typography>
              <Doughnut
                data={resourceTypesData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity Log */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity Log
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {auditLogs.length === 0 ? (
            <Alert severity="info">No activity logs available yet</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource Type</TableCell>
                    <TableCell>Resource ID</TableCell>
                    <TableCell>User</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="caption">
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          size="small"
                          color={getActionColor(log.action)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.resourceType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {log.resourceId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {log.userId ? log.userId.substring(0, 8) + '...' : 'Unknown'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
