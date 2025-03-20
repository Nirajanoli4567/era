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
} from "@mui/material";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import InventoryIcon from "@mui/icons-material/Inventory";
import BargainIcon from "@mui/icons-material/LocalOffer";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const AdminDashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingDeliveries: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [ordersByPaymentMethod, setOrdersByPaymentMethod] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [
        statsResponse,
        ordersResponse,
        orderStatusResponse,
        revenueResponse,
        paymentMethodResponse,
      ] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, { headers }),
        axios.get(`${API_URL}/api/admin/recent-orders`, { headers }),
        axios.get(`${API_URL}/api/admin/orders-by-status`, { headers }),
        axios.get(`${API_URL}/api/admin/revenue-by-month`, { headers }),
        axios.get(`${API_URL}/api/admin/orders-by-payment`, { headers }),
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
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.response?.data?.message || "Failed to load dashboard data");
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          {icon}
          <Typography variant="h6" component="div" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  const menuItems = [
    {
      title: "Products",
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      description: "Manage your product inventory",
      path: "/admin/products",
    },
    {
      title: "Orders",
      icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
      description: "View and manage customer orders",
      path: "/admin/orders",
    },
    {
      title: "Customers",
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      description: "View customer information",
      path: "/admin/customers",
    },
    {
      title: "Bargains",
      icon: <BargainIcon sx={{ fontSize: 40 }} />,
      description: "Manage price bargaining requests",
      path: "/admin/bargains",
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
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon sx={{ color: "#1976d2" }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCartIcon sx={{ color: "#2e7d32" }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
            icon={<MonetizationOnIcon sx={{ color: "#ed6c02" }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Deliveries"
            value={stats.pendingDeliveries}
            icon={<LocalShippingIcon sx={{ color: "#9c27b0" }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Orders by Status
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Revenue by Month
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByMonth}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Methods Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Orders by Payment Method
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByPaymentMethod}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Orders Table */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Recent Orders
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/admin/orders')}
            startIcon={<ShoppingCartIcon />}
          >
            View All Orders
          </Button>
        </Box>
        <TableContainer>
          <Table>
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
              {recentOrders.map((order) => (
                <TableRow key={order._id}>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
              onClick={() => navigate(item.path)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                <Box sx={{ color: "primary.main", mb: 2 }}>{item.icon}</Box>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button size="small" color="primary">
                  View
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
