// Blog Manager - Admin interface for managing blog posts
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Chip,
  Stack,
  Grid,
  InputAdornment,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Visibility as ViewIcon,
  Image as ImageIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadImage,
  generateUniqueSlug
} from '../../services/blogService';
import RichTextEditor from '../../components/blog/RichTextEditor';
import { format } from 'date-fns';

export default function BlogManager() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    categories: '',
    tags: '',
    author: ''
  });

  // Load blog posts
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await getBlogPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      showSnackbar('Error loading blog posts: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (post = null) => {
    if (post) {
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || '',
        featuredImage: post.featuredImage || '',
        categories: post.categories?.join(', ') || '',
        tags: post.tags?.join(', ') || '',
        author: post.author || currentUser?.email || 'Admin'
      });
      setSelectedPost(post);
      setEditMode(true);
    } else {
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featuredImage: '',
        categories: '',
        tags: '',
        author: currentUser?.email || 'Admin'
      });
      setSelectedPost(null);
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPost(null);
    setEditMode(false);
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featuredImage: '',
      categories: '',
      tags: '',
      author: ''
    });
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from title
    if (field === 'title' && !editMode) {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setUploading(true);
        const imageUrl = await uploadImage(file, 'blog/featured');
        setFormData(prev => ({ ...prev, featuredImage: imageUrl }));
        showSnackbar('Image uploaded successfully', 'success');
      } catch (error) {
        showSnackbar('Error uploading image: ' + error.message, 'error');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.content) {
        showSnackbar('Title and content are required', 'warning');
        return;
      }

      // Parse categories and tags
      const categories = formData.categories
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const postData = {
        title: formData.title,
        slug: formData.slug || await generateUniqueSlug(formData.title, selectedPost?.id),
        content: formData.content,
        excerpt: formData.excerpt,
        featuredImage: formData.featuredImage,
        categories,
        tags,
        author: formData.author || currentUser?.email || 'Admin'
      };

      if (editMode && selectedPost) {
        await updateBlogPost(selectedPost.id, postData, currentUser.uid);
        showSnackbar('Blog post updated successfully', 'success');
      } else {
        await createBlogPost(postData, currentUser.uid);
        showSnackbar('Blog post created successfully', 'success');
      }

      handleCloseDialog();
      loadPosts();
    } catch (error) {
      showSnackbar('Error saving blog post: ' + error.message, 'error');
    }
  };

  const handleDelete = async (postId, postTitle) => {
    if (window.confirm(`Are you sure you want to delete "${postTitle}"?`)) {
      try {
        await deleteBlogPost(postId, currentUser.uid);
        showSnackbar('Blog post deleted successfully', 'success');
        loadPosts();
      } catch (error) {
        showSnackbar('Error deleting blog post: ' + error.message, 'error');
      }
    }
  };

  // Filter posts by search term
  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.categories?.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())) ||
    post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center" justifyContent="space-between">
            <Typography variant="h5" component="h2" fontWeight="bold">
              Blog Management
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              New Post
            </Button>
          </Stack>

          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search posts by title, categories, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />

          {/* Posts Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredPosts.length === 0 ? (
            <Alert severity="info">
              {searchTerm ? 'No posts found matching your search.' : 'No blog posts yet. Create your first post!'}
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>Author</strong></TableCell>
                    <TableCell><strong>Categories</strong></TableCell>
                    <TableCell><strong>Tags</strong></TableCell>
                    <TableCell><strong>Published</strong></TableCell>
                    <TableCell><strong>Views</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {post.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {post.categories?.slice(0, 2).map((cat, idx) => (
                            <Chip key={idx} label={cat} size="small" color="primary" variant="outlined" />
                          ))}
                          {post.categories?.length > 2 && (
                            <Chip label={`+${post.categories.length - 2}`} size="small" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {post.tags?.slice(0, 2).map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" />
                          ))}
                          {post.tags?.length > 2 && (
                            <Chip label={`+${post.tags.length - 2}`} size="small" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {post.publishedAt ? format(new Date(post.publishedAt), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>{post.views || 0}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(post)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(post.id, post.title)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Blog Post' : 'Create New Blog Post'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                required
              />
            </Grid>

            {/* Slug */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slug (URL)"
                value={formData.slug}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                helperText="URL-friendly version of the title"
              />
            </Grid>

            {/* Author */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Author"
                value={formData.author}
                onChange={(e) => handleFieldChange('author', e.target.value)}
              />
            </Grid>

            {/* Excerpt */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Excerpt"
                value={formData.excerpt}
                onChange={(e) => handleFieldChange('excerpt', e.target.value)}
                multiline
                rows={2}
                helperText="Short description shown in post listings"
              />
            </Grid>

            {/* Categories */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Categories"
                value={formData.categories}
                onChange={(e) => handleFieldChange('categories', e.target.value)}
                helperText="Comma-separated (e.g., News, Events)"
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tags"
                value={formData.tags}
                onChange={(e) => handleFieldChange('tags', e.target.value)}
                helperText="Comma-separated (e.g., sustainability, campus)"
              />
            </Grid>

            {/* Featured Image */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={uploading ? <CircularProgress size={20} /> : <ImageIcon />}
                disabled={uploading}
                fullWidth
              >
                {uploading ? 'Uploading...' : 'Upload Featured Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              {formData.featuredImage && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={formData.featuredImage}
                    alt="Featured"
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                  />
                </Box>
              )}
            </Grid>

            {/* Content */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Content *
              </Typography>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => handleFieldChange('content', value)}
                placeholder="Write your blog post content here..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
