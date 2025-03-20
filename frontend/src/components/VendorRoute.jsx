import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const VendorRoute = ({ children }) => {
  const { user, isAuthenticated, isVendor, loading } = useAuth();

  if (loading) {
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

  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (!isVendor()) {
    // Redirect to home if authenticated but not vendor
    return <Navigate to="/" replace />;
  }

  // Return children if authenticated and vendor
  return children;
};

export default VendorRoute; 