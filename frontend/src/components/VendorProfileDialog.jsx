import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Avatar,
  Typography,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const VendorProfileDialog = ({ open, onClose, user, setUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setImagePreview(user.profilePicture || '');
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      
      if (profileImage) {
        formDataToSend.append('profilePicture', profileImage);
      }
      
      const response = await axios.put(
        `${API_URL}/api/vendor/profile`, 
        formDataToSend,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update user in local storage
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update user in state
      if (setUser) {
        setUser(updatedUser);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Vendor Profile</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar 
                src={imagePreview} 
                sx={{ width: 100, height: 100, mb: 2 }}
              />
              <Button
                variant="outlined"
                component="label"
                size="small"
              >
                Change Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
            </Box>
            
            <TextField
              margin="dense"
              label="Name"
              name="name"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              label="Email"
              name="email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              label="Phone"
              name="phone"
              fullWidth
              value={formData.phone}
              onChange={handleChange}
            />
            
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default VendorProfileDialog; 