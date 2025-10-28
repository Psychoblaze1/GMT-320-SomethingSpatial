import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';

const drawerWidth = 240;

export default function MainLayout({ children, title = 'Dashboard' }) {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = e => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Base menu items for all users
  const baseMenuItems = [
    { text: 'Overview', icon: <DashboardIcon />, path: '/' },
    { text: '3D Campus View', icon: <ViewInArIcon />, path: '/map' },
    { text: '2D Map View', icon: <MapIcon />, path: '/map-2d' }
  ];

  // Admin menu item (only shown to admins)
  const adminMenuItem = {
    text: 'Admin',
    icon: <AdminPanelSettingsIcon />, 
    path: '/admin'
  };

  const menuItems = isAdmin ? [...baseMenuItems, adminMenuItem] : baseMenuItems;

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 1, gap: 1 }}>
        <RouterLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit' }}>
          <EnergySavingsLeafIcon sx={{ color: 'success.main', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main', ml: 1 }}>
            Campus Sustainability
          </Typography>
        </RouterLink>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={window.location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` } }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              {title}
            </RouterLink>
            {isAdmin && (
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 2, px: 1, py: 0.5, backgroundColor: 'error.main', color: 'white', borderRadius: 1, fontSize: '0.7rem' }}
              >
                ADMIN
              </Typography>
            )}
          </Typography>
          <Button color="inherit" onClick={handleMenuOpen} startIcon={
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {currentUser?.email?.charAt(0).toUpperCase() || <PersonIcon />}
            </Avatar>
          }>
            {currentUser?.email?.split('@')[0] || 'User'}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${drawerWidth}px)` }, height: '100vh', overflow: 'auto' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
