// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Import contexts
import { AuthProvider } from './contexts/AuthContext';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MapViewer from './pages/MapViewer';
import Map2D from './pages/Map2D';
import Admin from './pages/Admin';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/map" element={
              <PrivateRoute>
                <MapViewer />
              </PrivateRoute>
            } />
            <Route path="/map-2d" element={
              <PrivateRoute>
                <Map2D />
              </PrivateRoute>
            } />
            <Route path="/blog" element={
              <PrivateRoute>
                <BlogPage />
              </PrivateRoute>
            } />
            <Route path="/blog/:slug" element={
              <PrivateRoute>
                <BlogPostPage />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;