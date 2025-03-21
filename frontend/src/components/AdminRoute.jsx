import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const [localChecked, setLocalChecked] = useState(false);
  const [localIsAdmin, setLocalIsAdmin] = useState(false);

  // Quick check from localStorage on mount to prevent flicker
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.role === 'admin') {
          setLocalIsAdmin(true);
        }
      }
    } catch (error) {
      console.error('Error checking local admin status:', error);
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
  const isAuthorized = !loading ? isAuthenticated() && isAdmin() : localIsAdmin;

  if (!isAuthorized) {
    // Redirect to login if not authenticated or not admin
    return <Navigate to="/login" replace />;
  }

  // Return children if authenticated and admin
  return children;
};

export default AdminRoute; 