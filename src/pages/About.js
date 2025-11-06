import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Map as MapIcon,
  ViewInAr as ViewInArIcon,
  Storage as StorageIcon,
  Build as BuildIcon,
  Info as InfoIcon,
  EmoCore as EmoCoreIcon,
  Public as PublicIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import MainLayout from '../components/layout/MainLayout';

const teamMembers = [
  {
    name: 'Brandon Cooley',
    role: 'Programmer',
    bio: 'Full-stack developer specializing in React and spatial data visualization.',
    avatar: '/team/brandon.jpg',
    initials: 'BC',
    color: '#2e7d32'
  },
  {
    name: 'Mduduzi Zitha',
    role: 'Project Manager',
    bio: 'Coordinating team efforts and ensuring project milestones are met.',
    avatar: '/team/mduduzi.jpg',
    initials: 'MZ',
    color: '#1976d2'
  },
  {
    name: 'Suzan Muradzikwa',
    role: 'Remote Sensing Analyst',
    bio: 'Expert in satellite imagery analysis and environmental monitoring.',
    avatar: '/team/suzan.jpg',
    initials: 'SM',
    color: '#f57c00'
  },
  {
    name: 'Paige Menezes',
    role: 'GIS Analyst',
    bio: 'Specializing in geographic information systems and spatial analysis.',
    avatar: '/team/paige.jpg',
    initials: 'PM',
    color: '#388e3c'
  },
  {
    name: 'Ntsako Hlaneke',
    role: 'Researcher',
    bio: 'Conducting research on sustainability practices and environmental impact.',
    avatar: '/team/ntsako.jpg',
    initials: 'NH',
    color: '#0288d1'
  }
];

const technologyCategories = [
  {
    category: '3D Visualization & Mapping',
    icon: <ViewInArIcon />,
    packages: [
      { name: 'Three.js', version: '^0.180.0', description: '3D graphics library' },
      { name: '@react-three/fiber', version: '^9.3.0', description: 'React renderer for Three.js' },
      { name: '@react-three/drei', version: '^10.7.6', description: 'Useful helpers for react-three-fiber' },
      { name: 'deck.gl', version: '^9.1.15', description: 'WebGL-powered data visualization' },
      { name: 'react-leaflet', version: '^5.0.0', description: 'React components for Leaflet maps' },
      { name: 'Mapbox GL', version: '^3.15.0', description: 'Interactive vector maps' }
    ]
  },
  {
    category: 'UI Framework & Components',
    icon: <CodeIcon />,
    packages: [
      { name: 'Material-UI (MUI)', version: '^7.0.2', description: 'React component library' },
      { name: 'React', version: '^19.1.0', description: 'JavaScript library for building user interfaces' },
      { name: 'React Router', version: '^7.5.1', description: 'Declarative routing for React' },
      { name: 'Emotion', version: '^11.14.0', description: 'CSS-in-JS library' }
    ]
  },
  {
    category: 'Data Visualization',
    icon: <PublicIcon />,
    packages: [
      { name: 'Chart.js', version: '^4.4.9', description: 'Simple yet flexible JavaScript charting' },
      { name: 'react-chartjs-2', version: '^5.3.0', description: 'React wrapper for Chart.js' },
      { name: 'Leaflet.heat', version: '^0.2.0', description: 'Heatmap plugin for Leaflet' }
    ]
  },
  {
    category: 'Backend & Data Management',
    icon: <StorageIcon />,
    packages: [
      { name: 'Firebase', version: '^11.6.0', description: 'Backend-as-a-Service platform' },
      { name: 'PapaParse', version: '^5.5.3', description: 'CSV parser' },
      { name: 'GeoTIFF', version: '^2.1.3', description: 'Read and write GeoTIFF files' },
      { name: 'Turf.js', version: '^7.2.0', description: 'Geospatial analysis library' }
    ]
  },
  {
    category: 'Forms & Utilities',
    icon: <BuildIcon />,
    packages: [
      { name: 'Formik', version: '^2.4.6', description: 'Form library for React' },
      { name: 'Yup', version: '^1.6.1', description: 'Schema validation' },
      { name: 'date-fns', version: '^4.1.0', description: 'Modern date utility library' },
      { name: 'Howler.js', version: '^2.2.4', description: 'Audio library' }
    ]
  }
];

const projectFeatures = [
  '3D interactive campus visualization',
  '2D geospatial mapping with multiple data layers',
  'Real-time sustainability metrics tracking',
  'Solar energy potential analysis',
  'Rainwater harvesting insights',
  'Green space analysis and monitoring',
  'Blog system for sustainability updates',
  'Admin dashboard for data management'
];

export default function About() {
  const [avatarErrors, setAvatarErrors] = React.useState({});

  const handleImageError = (memberName) => {
    setAvatarErrors(prev => ({ ...prev, [memberName]: true }));
  };

  return (
    <MainLayout title="About Us">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Hero Section */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            variant="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2e7d32 30%, #1976d2 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Campus Sustainability Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph sx={{ fontStyle: 'italic' }}>
            by Something Spatial
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Visualizing Campus Sustainability Through Spatial Technology
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip label="3D Visualization" sx={{ m: 0.5 }} color="primary" />
            <Chip label="GIS Analysis" sx={{ m: 0.5 }} color="secondary" />
            <Chip label="Sustainability" sx={{ m: 0.5 }} color="success" />
          </Box>
        </Box>

        {/* About the Project Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 6,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight={600}>
              About the Project
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            The Campus Sustainability Dashboard is an innovative web application developed by Something Spatial
            that combines cutting-edge 3D visualization, geospatial analysis, and data-driven insights to promote
            campus sustainability. Our platform provides an interactive way to explore and understand environmental
            data, from solar energy potential to rainwater harvesting opportunities and green space distribution.
          </Typography>
          <Typography variant="body1" paragraph>
            Built with modern web technologies, the Campus Sustainability Dashboard makes complex spatial data
            accessible and actionable for students, faculty, and sustainability coordinators. Through intuitive
            3D models and interactive 2D maps, users can visualize sustainability metrics and make informed
            decisions about campus environmental initiatives.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom fontWeight={600}>
            Key Features
          </Typography>
          <Grid container spacing={2}>
            {projectFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      mr: 2
                    }}
                  />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Meet the Team Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom fontWeight={600} textAlign="center" mb={4}>
            Meet the Team
          </Typography>
          <Grid container spacing={3}>
            {teamMembers.map((member, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: (theme) => theme.shadows[8]
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Avatar
                      src={!avatarErrors[member.name] ? member.avatar : undefined}
                      onError={() => handleImageError(member.name)}
                      sx={{
                        width: 120,
                        height: 120,
                        margin: '0 auto 16px',
                        bgcolor: member.color,
                        fontSize: '2.5rem',
                        fontWeight: 600
                      }}
                    >
                      {member.initials}
                    </Avatar>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      {member.name}
                    </Typography>
                    <Chip
                      label={member.role}
                      size="small"
                      sx={{
                        mb: 2,
                        bgcolor: `${member.color}22`,
                        color: member.color,
                        fontWeight: 500
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {member.bio}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Technology Stack Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom fontWeight={600} textAlign="center" mb={4}>
            Technology Stack
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" mb={4}>
            Built with modern, powerful technologies to deliver a seamless user experience
          </Typography>

          {technologyCategories.map((tech, index) => (
            <Accordion
              key={index}
              defaultExpanded={index === 0}
              sx={{
                mb: 2,
                '&:before': { display: 'none' },
                boxShadow: 1
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ color: 'primary.main', mr: 2 }}>
                    {tech.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    {tech.category}
                  </Typography>
                  <Chip
                    label={tech.packages.length}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {tech.packages.map((pkg, pkgIndex) => (
                    <ListItem key={pkgIndex} sx={{ py: 1 }}>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'secondary.main'
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography variant="body1" fontWeight={500} sx={{ mr: 1 }}>
                              {pkg.name}
                            </Typography>
                            <Chip
                              label={pkg.version}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                          </Box>
                        }
                        secondary={pkg.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Footer Note */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Built with passion for sustainability and innovation by Something Spatial
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Version 0.1.0 | 2025
          </Typography>
        </Box>
      </Container>
    </MainLayout>
  );
}
