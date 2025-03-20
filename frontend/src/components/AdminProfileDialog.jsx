import React, { useState, useEffect, useRef } from "react";
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
  Alert,
  IconButton,
  Link,
} from "@mui/material";
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const AdminProfileDialog = ({ open, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      
      // Set profile picture preview if it exists
      if (user.profilePic) {
        // Handle both full URLs and relative paths
        const pictureUrl = user.profilePic.startsWith('http') 
          ? user.profilePic 
          : `${API_URL}/uploads/${user.profilePic}`;
        
        console.log("User profile pic data:", {
          original: user.profilePic,
          computed: pictureUrl
        });
        
        setPreviewUrl(pictureUrl);
      } else {
        console.log("No profile picture found in user data");
        setPreviewUrl("");
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type and size
      const fileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!fileTypes.includes(file.type)) {
        setError("Please select a valid image file (JPEG, JPG, PNG)");
        return;
      }
      
      if (file.size > maxSize) {
        setError("File size must be less than 5MB");
        return;
      }
      
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  const handlePictureClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const token = localStorage.getItem("token");
      
      // Create FormData object for multipart/form-data upload
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("email", formData.email);
      formDataObj.append("phone", formData.phone);
      
      // If a new profile picture was selected, append it
      if (profilePic) {
        formDataObj.append("profilePic", profilePic);
      }

      const response = await fetch(`${API_URL}/api/admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataObj,
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSuccess("Profile updated successfully!");
        setTimeout(() => {
          onClose();
          window.location.reload(); // Refresh the page to reflect changes
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("An error occurred while updating your profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Profile Settings</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
            position: "relative",
          }}
        >
          <input
            type="file"
            accept="image/jpeg, image/jpg, image/png"
            onChange={handleFileSelect}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          
          {/* Profile Picture with Upload Button */}
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={previewUrl}
              sx={{ 
                width: 100, 
                height: 100, 
                mb: 2, 
                bgcolor: "primary.main",
                fontSize: 40
              }}
              onError={(e) => {
                console.error("Failed to load profile image:", previewUrl);
                e.target.src = ""; // Clear the src to show the fallback
              }}
            >
              {formData.name.charAt(0)}
            </Avatar>
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="span"
              onClick={handlePictureClick}
              sx={{
                position: "absolute",
                bottom: 10,
                right: -10,
                bgcolor: "background.paper",
                boxShadow: 1,
                "&:hover": {
                  bgcolor: "grey.200",
                },
              }}
            >
              <PhotoCameraIcon />
            </IconButton>
          </Box>
          
          <Typography variant="h6">{formData.name}</Typography>
          <Typography color="textSecondary">Administrator</Typography>
          
          {previewUrl && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="caption">Profile Image URL:</Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  wordBreak: 'break-all',
                  bgcolor: '#f5f5f5',
                  p: 1,
                  borderRadius: 1,
                  maxWidth: '100%',
                  overflow: 'auto'
                }}
              >
                {previewUrl}
              </Typography>
              <Button 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => window.open(previewUrl, '_blank')}
              >
                Test Image URL
              </Button>
            </Box>
          )}
        </Box>
        
        <TextField
          fullWidth
          margin="dense"
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          margin="dense"
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          margin="dense"
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminProfileDialog;
