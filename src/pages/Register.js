import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Box,
  Paper,
  Alert,
  Avatar
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const validationSchema = Yup.object({
  displayName: Yup.string()
    .required('Name is required'),
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password should be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

export default function Register() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      setLoading(true);
      await signup(values.email, values.password, values.displayName);
      navigate('/');
    } catch (error) {
      setError('Failed to create an account. ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        
        <Formik
          initialValues={{
            displayName: '',
            email: '',
            password: '',
            confirmPassword: ''
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
            <Form noValidate style={{ width: '100%', marginTop: '1rem' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="displayName"
                label="Full Name"
                name="displayName"
                autoComplete="name"
                autoFocus
                value={values.displayName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.displayName && Boolean(errors.displayName)}
                helperText={touched.displayName && errors.displayName}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                helperText={touched.confirmPassword && errors.confirmPassword}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="secondary"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || isSubmitting}
              >
                Sign Up
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link component={RouterLink} to="/login" variant="body2">
                    Already have an account? Sign in
                  </Link>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Paper>
      <Box mt={2} display="flex" justifyContent="center">
        <Typography variant="body2" color="text.secondary" align="center">
          Something Spatial Dashboard System
        </Typography>
      </Box>
    </Container>
  );
}