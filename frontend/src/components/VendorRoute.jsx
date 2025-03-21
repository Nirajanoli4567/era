import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const VendorRoute = ({ children }) => {
  const { user, isAuthenticated, isVendor, loading } = useAuth();
  const [localChecked, setLocalChecked] = useState(false);
  const [localIsVendor, setLocalIsVendor] = useState(false);

  // Quick check from localStorage on mount to prevent flicker
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.role === 'vendor') {
          setLocalIsVendor(true);
        }
      }
    } catch (error) {
      console.error('Error checking local vendor status:', error);
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
  const isAuthorized = !loading ? isAuthenticated() && isVendor() : localIsVendor;

  if (!isAuthorized) {
    // Redirect to login if not authenticated or not vendor
    return <Navigate to="/login" replace />;
  }

  // Return children if authenticated and vendor
  return children;
};

export default VendorRoute; 