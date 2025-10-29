// Blog Page - Public blog listing with search and filters
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import {
  Container,
  Typography,
  Grid,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import BlogPostCard from '../components/blog/BlogPostCard';
import { getBlogPosts, getCategories } from '../services/blogService';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Load posts and categories
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedPosts, fetchedCategories] = await Promise.all([
        getBlogPosts({ status: 'published' }),
        getCategories()
      ]);
      setPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error loading blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter posts when search/filters change
  useEffect(() => {
    let filtered = [...posts];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(post =>
        post.title?.toLowerCase().includes(searchLower) ||
        post.excerpt?.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(post =>
        post.categories?.includes(selectedCategory)
      );
    }

    setFilteredPosts(filtered);
  }, [searchTerm, selectedCategory, posts]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  return (
    <MainLayout title="Blog">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Campus Sustainability Blog
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Stay updated with the latest news, events, and initiatives
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper'
              }
            }}
          />
        </Box>

        {/* Filters */}
        {categories.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            {/* Categories */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <CategoryIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" color="text.secondary">
                  Categories:
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => handleCategoryClick(category)}
                    color={selectedCategory === category ? 'primary' : 'default'}
                    variant={selectedCategory === category ? 'filled' : 'outlined'}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Clear filters button */}
            {(selectedCategory || searchTerm) && (
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Chip
                  label="Clear all filters"
                  onDelete={clearFilters}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            )}
          </Paper>
        )}

        {/* Results count */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found
          </Typography>
        </Box>

        {/* Posts Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredPosts.length === 0 ? (
          <Alert severity="info" sx={{ mt: 4 }}>
            {posts.length === 0
              ? 'No blog posts available yet. Check back soon!'
              : 'No posts match your search criteria. Try adjusting your filters.'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredPosts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
                <BlogPostCard post={post} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </MainLayout>
  );
}
