import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton
} from '@mui/material';
import axios from 'axios';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import RefreshIcon from '@mui/icons-material/Refresh';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Placeholder image for fallback
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const VendorNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMounted = useRef(true);
  const lastFetchTime = useRef(0);

  const fetchNotifications = async () => {
    const now = Date.now();
    if (now - lastFetchTime.current < 2000) {
      return; // Prevent fetching if less than 2 seconds since last fetch
    }
    
    lastFetchTime.current = now;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/vendor/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (isMounted.current) {
        setNotifications(response.data);
        setLoading(false);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (isMounted.current) {
        setError('Failed to load notifications');
        setLoading(false);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/vendor/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state to mark all as read
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true
      })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError('Failed to mark notifications as read');
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const formatNotificationTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffTime = Math.abs(now - notificationDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'just now';
    }
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'order':
        return 'primary';
      case 'bargain':
        return 'secondary';
      case 'system':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Notifications
        </Typography>
        <Box>
          <IconButton onClick={fetchNotifications} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button 
            variant="outlined" 
            startIcon={<DoneAllIcon />} 
            onClick={markAllAsRead}
            disabled={notifications.every(n => n.read)}
          >
            Mark All Read
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {notifications.length === 0 ? (
        <Alert severity="info">You have no notifications</Alert>
      ) : (
        <Paper elevation={2}>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    py: 2,
                    px: 3,
                    bgcolor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.08)'
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                        >
                          {notification.message}
                        </Typography>
                        <Chip
                          label={notification.type || 'notification'}
                          size="small"
                          color={getNotificationTypeColor(notification.type)}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {formatNotificationTime(notification.createdAt)}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default VendorNotifications; 