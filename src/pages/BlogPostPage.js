// Blog Post Page - Individual blog post view
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import {
  Container,
  Typography,
  Box,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { getBlogPostBySlug, incrementViews } from '../services/blogService';
import { format } from 'date-fns';

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPost = await getBlogPostBySlug(slug);

      if (!fetchedPost) {
        setError('Blog post not found');
        return;
      }

      setPost(fetchedPost);

      // Increment view count (non-blocking)
      incrementViews(fetchedPost.id);
    } catch (err) {
      console.error('Error loading blog post:', err);
      setError('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Loading...">
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </MainLayout>
    );
  }

  if (error || !post) {
    return (
      <MainLayout title="Not Found">
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Blog post not found'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/blog')}
          >
            Back to Blog
          </Button>
        </Container>
      </MainLayout>
    );
  }

  const formattedDate = post.publishedAt
    ? format(new Date(post.publishedAt), 'MMMM dd, yyyy')
    : 'Draft';

  return (
    <MainLayout title={post.title}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/blog')}
          sx={{ mb: 3 }}
        >
          Back to Blog
        </Button>

        {/* Article */}
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, backgroundColor: 'background.paper' }}>
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {post.categories.map((category, index) => (
                <Chip
                  key={index}
                  label={category}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Stack>
          )}

          {/* Title */}
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            fontWeight="bold"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              lineHeight: 1.2
            }}
          >
            {post.title}
          </Typography>

          {/* Metadata */}
          <Stack
            direction="row"
            spacing={3}
            flexWrap="wrap"
            sx={{ mb: 3, color: 'text.secondary' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon fontSize="small" />
              <Typography variant="body2">{post.author}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarIcon fontSize="small" />
              <Typography variant="body2">{formattedDate}</Typography>
            </Box>
            {post.views > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ViewIcon fontSize="small" />
                <Typography variant="body2">{post.views} views</Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Featured Image */}
          {post.featuredImage && (
            <Box
              sx={{
                mb: 4,
                borderRadius: 2,
                overflow: 'hidden',
                '& img': {
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }
              }}
            >
              <img src={post.featuredImage} alt={post.title} />
            </Box>
          )}

          {/* Content */}
          <Box
            className="ql-editor"
            sx={{
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 1,
                my: 2
              },
              '& p': {
                fontSize: '1.1rem',
                lineHeight: 1.8,
                mb: 2
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                fontWeight: 'bold',
                mt: 3,
                mb: 2
              },
              '& ul, & ol': {
                pl: 3,
                mb: 2
              },
              '& blockquote': {
                borderLeft: 4,
                borderColor: 'primary.main',
                pl: 2,
                py: 1,
                my: 2,
                backgroundColor: 'action.hover',
                fontStyle: 'italic'
              },
              '& code': {
                backgroundColor: 'action.hover',
                padding: '2px 6px',
                borderRadius: 1,
                fontSize: '0.9em'
              },
              '& pre': {
                backgroundColor: 'action.hover',
                padding: 2,
                borderRadius: 1,
                overflow: 'auto',
                mb: 2
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'underline'
              }
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </Paper>

        {/* Back Button (Bottom) */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/blog')}
          >
            Back to Blog
          </Button>
        </Box>
      </Container>
    </MainLayout>
  );
}
