import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
  CardActions,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Stack,
  LinearProgress,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import InventoryIcon from "@mui/icons-material/Inventory";
import BargainIcon from "@mui/icons-material/LocalOffer";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DownloadIcon from "@mui/icons-material/Download";
import SettingsIcon from "@mui/icons-material/Settings";
import SecurityIcon from "@mui/icons-material/Security";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const AdminDashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingDeliveries: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [ordersByPaymentMethod, setOrdersByPaymentMethod] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [salesPerformance, setSalesPerformance] = useState({
    thisMonth: 0,
    lastMonth: 0,
    percentageChange: 0,
  });
  const [productCategoriesData, setProductCategoriesData] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [
        statsResponse,
        ordersResponse,
        orderStatusResponse,
        revenueResponse,
        paymentMethodResponse,
        usersResponse,
        salesPerformanceResponse,
        productCategoriesResponse,
      ] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, { headers }),
        axios.get(`${API_URL}/api/admin/recent-orders`, { headers }),
        axios.get(`${API_URL}/api/admin/orders-by-status`, { headers }),
        axios.get(`${API_URL}/api/admin/revenue-by-month`, { headers }),
        axios.get(`${API_URL}/api/admin/orders-by-payment`, { headers }),
        axios.get(`${API_URL}/api/admin/recent-users`, { headers }),
        axios.get(`${API_URL}/api/admin/sales-performance`, { headers }),
        axios.get(`${API_URL}/api/admin/product-categories`, { headers }),
      ]);

      // Format the data for better visualization
      const formattedRevenueData = revenueResponse.data.map(item => ({
        ...item,
        revenue: Number(item.revenue.toFixed(2))
      }));

      setStats(statsResponse.data);
      setRecentOrders(ordersResponse.data);
      setOrdersByStatus(orderStatusResponse.data);
      setRevenueByMonth(formattedRevenueData);
      setOrdersByPaymentMethod(paymentMethodResponse.data);
      setRecentUsers(usersResponse.data);
      setSalesPerformance(salesPerformanceResponse.data);
      setProductCategoriesData(productCategoriesResponse.data);
      
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.response?.data?.message || "Failed to load dashboard data");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const StatCard = ({ title, value, icon, color, secondaryValue, secondaryIcon, secondaryText }) => (
    <Card sx={{ height: "100%", position: "relative", overflow: "visible" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}15`, color: color }}>
            {icon}
          </Avatar>
          <Typography variant="h6" component="div" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ color, mb: 1 }}>
          {value}
        </Typography>
        
        {secondaryValue && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {secondaryIcon}
            <Typography variant="body2" color={secondaryValue > 0 ? "success.main" : "error.main"} sx={{ ml: 0.5 }}>
              {secondaryValue > 0 ? "+" : ""}{secondaryValue}% 
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              {secondaryText}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const menuItems = [
    {
      title: "Products",
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      description: "Manage your product inventory",
      path: "/admin/products",
      count: stats.totalProducts,
      color: "#2196f3",
    },
    {
      title: "Orders",
      icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
      description: "View and manage customer orders",
      path: "/admin/orders",
      count: stats.totalOrders,
      color: "#4caf50",
    },
    {
      title: "Customers",
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      description: "View customer information",
      path: "/admin/customers",
      count: stats.totalUsers,
      color: "#ff9800",
    },
    {
      title: "Bargains",
      icon: <BargainIcon sx={{ fontSize: 40 }} />,
      description: "Manage price bargaining requests",
      path: "/admin/bargains",
      count: stats.pendingBargains || 0,
      color: "#9c27b0",
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchDashboardData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">
          Dashboard Overview
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Welcome Card */}
      <Card sx={{ mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ mb: 1 }}>
                Welcome back, Admin!
              </Typography>
              <Typography variant="body1">
                Here's what's happening with your store today.
              </Typography>
            </Box>
            <Box>
              <Button 
                variant="contained" 
                color="secondary"
                startIcon={<CalendarTodayIcon />}
                onClick={() => navigate('/admin/reports')}
              >
                View Reports
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon />}
            color="#1976d2"
            secondaryValue={12}
            secondaryIcon={<TrendingUpIcon fontSize="small" color="success" />}
            secondaryText="from last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCartIcon />}
            color="#2e7d32"
            secondaryValue={8}
            secondaryIcon={<TrendingUpIcon fontSize="small" color="success" />}
            secondaryText="from last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
            icon={<MonetizationOnIcon />}
            color="#ed6c02"
            secondaryValue={salesPerformance.percentageChange}
            secondaryIcon={
              salesPerformance.percentageChange >= 0 
                ? <TrendingUpIcon fontSize="small" color="success" /> 
                : <TrendingDownIcon fontSize="small" color="error" />
            }
            secondaryText="from last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Deliveries"
            value={stats.pendingDeliveries}
            icon={<LocalShippingIcon />}
            color="#9c27b0"
            secondaryValue={-5}
            secondaryIcon={<TrendingDownIcon fontSize="small" color="error" />}
            secondaryText="from last week"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Revenue Trends
              </Typography>
              <IconButton size="small">
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="Monthly" />
              <Tab label="Weekly" />
              <Tab label="Daily" />
            </Tabs>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`Rs. ${value}`, 'Revenue']} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={theme.palette.primary.main}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Orders by Status
              </Typography>
              <IconButton size="small">
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100% - 40px)' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={60}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name) => [`${value} orders`, name]} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Second Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Orders
              </Typography>
              <Button 
                size="small"
                variant="outlined" 
                onClick={() => navigate('/admin/orders')}
              >
                View All
              </Button>
            </Box>
            <TableContainer sx={{ maxHeight: 350 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <TableRow key={order._id} hover>
                        <TableCell>{order._id.slice(-6).toUpperCase()}</TableCell>
                        <TableCell>{order.contactInfo?.fullName || 'N/A'}</TableCell>
                        <TableCell>Rs. {order.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status?.replace(/_/g, " ").toUpperCase()}
                            color={
                              order.status === "delivered"
                                ? "success"
                                : order.status === "cancelled"
                                ? "error"
                                : "primary"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/admin/orders/${order._id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No recent orders found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Customers
              </Typography>
              <Button 
                size="small"
                variant="outlined" 
                onClick={() => navigate('/admin/customers')}
              >
                View All
              </Button>
            </Box>
            <List sx={{ maxHeight: 350, overflow: 'auto' }}>
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <ListItem
                    key={user._id}
                    secondaryAction={
                      <Button size="small" variant="outlined">
                        Profile
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {user.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.primary">
                            {user.email}
                          </Typography>
                          {" — Joined " + new Date(user.createdAt).toLocaleDateString()}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No recent customers found"
                    sx={{ textAlign: 'center' }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Methods Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Orders by Payment Method
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersByPaymentMethod}>
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" fill={theme.palette.success.main} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Product Categories
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={productCategoriesData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" fill={theme.palette.secondary.main} name="Products" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Access Menu */}
      <Typography variant="h6" gutterBottom>
        Quick Access
      </Typography>
      <Grid container spacing={3}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
              onClick={() => navigate(item.path)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                <Badge badgeContent={item.count} color="primary" max={999} sx={{ "& .MuiBadge-badge": { fontSize: "0.7rem" } }}>
                  <Box sx={{ color: item.color, mb: 2 }}>{item.icon}</Box>
                </Badge>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button size="small" variant="outlined" color="primary">
                  Manage
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminDashboardHome;
