// Audit Log Viewer - Track all admin actions
import React, { useState, useEffect } from 'react';
import {
  Box,
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  IconButton,
  Collapse,
  Stack,
  Tooltip,
  Button,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getAuditLogs } from '../../services/adminService';

// Action type categories for filtering
const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'bulk-create', label: 'Bulk Create' },
  { value: 'bulk-update', label: 'Bulk Update' },
  { value: 'bulk-delete', label: 'Bulk Delete' },
  { value: 'update-role', label: 'Update Role' },
  { value: 'upload', label: 'Upload' }
];

const RESOURCE_TYPES = [
  { value: '', label: 'All Resources' },
  { value: 'map-layer', label: 'Map Layers' },
  { value: 'geopackage', label: 'GeoPackages' },
  { value: 'sustainability-data', label: 'Sustainability Data' },
  { value: 'sustainability-item', label: 'Sustainability Items' },
  { value: 'user', label: 'Users' },
  { value: 'blog-post', label: 'Blog Posts' }
];

const SEVERITY_LEVELS = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' }
];

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    severity: '',
    search: ''
  });

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, logs]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const auditLogs = await getAuditLogs();
      setLogs(auditLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Filter by action type
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    // Filter by resource type
    if (filters.resourceType) {
      filtered = filtered.filter(log => log.resourceType === filters.resourceType);
    }

    // Filter by severity
    if (filters.severity) {
      filtered = filtered.filter(log => log.severity === filters.severity);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.userName?.toLowerCase().includes(searchLower) ||
        log.userEmail?.toLowerCase().includes(searchLower) ||
        log.resourceId?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const toggleRow = (logId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'major':
        return 'warning';
      case 'minor':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon fontSize="small" />;
      case 'major':
        return <WarningIcon fontSize="small" />;
      case 'minor':
        return <InfoIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';

    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getActionLabel = (action) => {
    return ACTION_TYPES.find(a => a.value === action)?.label || action;
  };

  const getResourceLabel = (resourceType) => {
    return RESOURCE_TYPES.find(r => r.value === resourceType)?.label || resourceType;
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      resourceType: '',
      severity: '',
      search: ''
    });
  };

  // Get statistics
  const stats = {
    total: logs.length,
    critical: logs.filter(l => l.severity === 'critical').length,
    major: logs.filter(l => l.severity === 'major').length,
    minor: logs.filter(l => l.severity === 'minor').length
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Audit Log
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Track all administrative actions and changes in the system
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4">{stats.total}</Typography>
              <Typography variant="caption" color="text.secondary">Total Events</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'error.light' }}>
            <CardContent>
              <Typography variant="h4">{stats.critical}</Typography>
              <Typography variant="caption">Critical Actions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography variant="h4">{stats.major}</Typography>
              <Typography variant="caption">Major Actions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="h4">{stats.minor}</Typography>
              <Typography variant="caption">Minor Actions</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          {/* Filters */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <FilterListIcon color="action" />
              <Typography variant="h6">Filters</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                size="small"
                onClick={clearFilters}
                disabled={!filters.action && !filters.resourceType && !filters.severity && !filters.search}
              >
                Clear All
              </Button>
              <Tooltip title="Refresh logs">
                <IconButton onClick={loadLogs} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="User, email, resource..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Action Type</InputLabel>
                  <Select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    label="Action Type"
                  >
                    {ACTION_TYPES.map(action => (
                      <MenuItem key={action.value} value={action.value}>
                        {action.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Resource Type</InputLabel>
                  <Select
                    value={filters.resourceType}
                    onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                    label="Resource Type"
                  >
                    {RESOURCE_TYPES.map(resource => (
                      <MenuItem key={resource.value} value={resource.value}>
                        {resource.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filters.severity}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                    label="Severity"
                  >
                    {SEVERITY_LEVELS.map(level => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {filteredLogs.length !== logs.length && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Showing {filteredLogs.length} of {logs.length} events
              </Alert>
            )}
          </Box>

          {/* Audit Log Table */}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="50px"></TableCell>
                    <TableCell><strong>Timestamp</strong></TableCell>
                    <TableCell><strong>Severity</strong></TableCell>
                    <TableCell><strong>User</strong></TableCell>
                    <TableCell><strong>Action</strong></TableCell>
                    <TableCell><strong>Resource</strong></TableCell>
                    <TableCell><strong>Resource ID</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No audit logs found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <React.Fragment key={log.id}>
                        <TableRow
                          hover
                          sx={{
                            cursor: 'pointer',
                            bgcolor: log.severity === 'critical' ? 'error.light' : 'inherit',
                            '&:hover': {
                              bgcolor: log.severity === 'critical' ? 'error.main' : 'action.hover'
                            }
                          }}
                          onClick={() => toggleRow(log.id)}
                        >
                          <TableCell>
                            <IconButton size="small">
                              {expandedRows.has(log.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatTimestamp(log.timestamp)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              icon={getSeverityIcon(log.severity)}
                              label={log.severity || 'minor'}
                              color={getSeverityColor(log.severity)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {log.userName || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.userEmail || log.userId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={getActionLabel(log.action)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getResourceLabel(log.resourceType)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {log.resourceId}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 0, borderBottom: 'none' }}>
                            <Collapse in={expandedRows.has(log.id)} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      User Details
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>Name:</strong> {log.userName || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>Email:</strong> {log.userEmail || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>Role:</strong> {log.userRole || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>User ID:</strong> {log.userId}
                                    </Typography>
                                    {log.ipAddress && (
                                      <Typography variant="body2">
                                        <strong>IP Address:</strong> {log.ipAddress}
                                      </Typography>
                                    )}
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      Changes
                                    </Typography>
                                    {log.changes ? (
                                      <Box
                                        component="pre"
                                        sx={{
                                          bgcolor: 'grey.900',
                                          color: 'grey.100',
                                          p: 1,
                                          borderRadius: 1,
                                          fontSize: '0.75rem',
                                          overflow: 'auto',
                                          maxHeight: '200px'
                                        }}
                                      >
                                        {JSON.stringify(log.changes, null, 2)}
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        No change data available
                                      </Typography>
                                    )}
                                  </Grid>
                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <Grid item xs={12}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Additional Metadata
                                      </Typography>
                                      <Box
                                        component="pre"
                                        sx={{
                                          bgcolor: 'grey.900',
                                          color: 'grey.100',
                                          p: 1,
                                          borderRadius: 1,
                                          fontSize: '0.75rem',
                                          overflow: 'auto',
                                          maxHeight: '150px'
                                        }}
                                      >
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </Box>
                                    </Grid>
                                  )}
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
