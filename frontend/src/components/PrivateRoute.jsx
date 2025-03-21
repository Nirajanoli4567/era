import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [localChecked, setLocalChecked] = useState(false);
  const [localIsAuthenticated, setLocalIsAuthenticated] = useState(false);

  // Quick check from localStorage on mount to prevent flicker
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        setLocalIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking local auth status:', error);
    } finally {
      setLocalChecked(true);
    }
  }, []);

  // Show loading only if both local check not done and auth context still loading
  if (!localChecked && loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // If auth context is done, use its value, otherwise use local check
  const isAuthorized = !loading ? isAuthenticated() : localIsAuthenticated;

  if (!isAuthorized) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Return children if authenticated
  return children;
};

export default PrivateRoute; 