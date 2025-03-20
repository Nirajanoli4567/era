import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Divider,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Create a data URL for a simple gray placeholder image
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

// Stat Card Component
const StatCard = ({ title, value, icon, change, changeType, loading }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              borderRadius: '50%', 
              width: 40, 
              height: 40, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            {title}
          </Typography>
        </Box>
        
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            
            {change && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: changeType === 'positive' ? 'success.main' : 
                         changeType === 'negative' ? 'error.main' : 
                         'text.secondary'
                }}
              >
                {changeType === 'positive' ? '+' : changeType === 'negative' ? '-' : ''}{change}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const VendorDashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalBargainRequests: 0,
  });
  const [revenueTab, setRevenueTab] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  
  const lastFetchTime = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchDashboardData();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDashboardData = async () => {
    // Check if we've fetched recently to prevent excessive calls
    const now = Date.now();
    if (now - lastFetchTime.current < 5000) { // 5 seconds throttle
      return;
    }
    
    lastFetchTime.current = now;
    
    try {
      if (!isMounted.current) return;
      
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch dashboard stats
      const dashboardResponse = await axios.get(`${API_URL}/api/vendor/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!isMounted.current) return;
      
      // Update state with dashboard data
      if (dashboardResponse.data) {
        setStats(dashboardResponse.data);
      }
      
      // Fetch recent orders
      const ordersResponse = await axios.get(`${API_URL}/api/vendor/orders?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!isMounted.current) return;
      
      if (ordersResponse.data) {
        setRecentOrders(ordersResponse.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleRevenueTabChange = (event, newValue) => {
    setRevenueTab(newValue);
  };

  // Sample data for charts
  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 7000 },
    { name: 'May', revenue: 5000 },
    { name: 'Jun', revenue: 8000 },
    { name: 'Jul', revenue: 6000 },
  ];

  const orderStatusData = [
    { name: 'Pending', value: stats?.pendingOrders || 0 },
    { name: 'Processing', value: 10 },
    { name: 'Shipped', value: 15 },
    { name: 'Delivered', value: 25 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard Overview
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<FileDownloadIcon />}
            sx={{ mr: 1 }}
          >
            EXPORT
          </Button>
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Paper
        sx={{ 
          p: 3, 
          mb: 4, 
          backgroundColor: '#000', 
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h5" gutterBottom>
          Welcome back, {JSON.parse(localStorage.getItem('user') || '{}')?.name || 'Vendor'}!
        </Typography>
        <Typography variant="body1">
          Here's what's happening with your store today.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Products" 
            value={stats?.totalProducts || 0}
            icon={<InventoryIcon />}
            change="12% from last month"
            changeType="positive"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Orders" 
            value={stats?.totalOrders || 0}
            icon={<ShoppingCartIcon />}
            change="8% from last month"
            changeType="positive"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Revenue" 
            value={`Rs. ${stats?.totalRevenue?.toLocaleString() || 0}`}
            icon={<AttachMoneyIcon />}
            change="100% from last month"
            changeType="positive"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pending Deliveries" 
            value={stats?.pendingDeliveries || 0}
            icon={<LocalShippingIcon />}
            change="5% from last week"
            changeType="negative"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Trends
            </Typography>
            <Tabs 
              value={revenueTab} 
              onChange={handleRevenueTabChange}
              sx={{ mb: 2 }}
            >
              <Tab label="MONTHLY" />
              <Tab label="WEEKLY" />
              <Tab label="DAILY" />
            </Tabs>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : recentOrders.length > 0 ? (
              <List>
                {recentOrders.map((order) => (
                  <React.Fragment key={order._id}>
                    <ListItem 
                      secondaryAction={
                        <Button 
                          variant="outlined" 
                          size="small" 
                          component={Link} 
                          to={`/vendor/orders`}
                        >
                          View
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <ShoppingCartIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`Order #${order.orderNumber || order._id.substring(0, 8)}`}
                        secondary={`Status: ${order.status} - Amount: Rs. ${order.totalAmount?.toLocaleString()}`}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                No recent orders found.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Orders by Status
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack spacing={2}>
              <Button 
                variant="outlined" 
                fullWidth 
                component={Link} 
                to="/vendor/products"
              >
                Manage Products
              </Button>
              <Button 
                variant="outlined" 
                fullWidth 
                component={Link} 
                to="/vendor/orders"
              >
                Process Orders
              </Button>
              <Button 
                variant="outlined" 
                fullWidth 
                component={Link} 
                to="/vendor/reports"
              >
                View Reports
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VendorDashboardHome; 