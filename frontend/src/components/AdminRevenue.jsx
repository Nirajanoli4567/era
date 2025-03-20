import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// Sample data for initial rendering or when API fails
const sampleData = {
  totalRevenue: 0,
  deliveredOrders: 0,
  averageOrderValue: 0,
  revenueGrowth: 0,
  revenueByMonth: [
    { month: "2023-1", revenue: 0 },
    { month: "2023-2", revenue: 0 },
  ],
  revenueByCategory: [
    { category: "Electronics", revenue: 0 },
    { category: "Clothing", revenue: 0 },
  ]
};

const AdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("month");
  const [revenueData, setRevenueData] = useState(sampleData);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError("");
      setDebugInfo("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      console.log(`Fetching revenue data for timeRange: ${timeRange}`);
      
      // Use a single API call for simplicity
      const revenueResponse = await axios.get(
        `${API_URL}/api/admin/revenue?timeRange=${timeRange}`, 
        { headers }
      );
      
      console.log("Revenue API response:", revenueResponse.data);
      
      if (!revenueResponse.data) {
        throw new Error("No data received from revenue API");
      }
      
      // Default empty arrays if data is missing
      const responseData = {
        ...revenueResponse.data,
        revenueByMonth: revenueResponse.data.revenueByMonth || [],
        revenueByCategory: revenueResponse.data.revenueByCategory || []
      };
      
      // Format the data for better visualization
      const formattedData = {
        ...responseData,
        totalRevenue: Number(responseData.totalRevenue || 0),
        deliveredOrders: Number(responseData.deliveredOrders || 0),
        averageOrderValue: Number(responseData.averageOrderValue || 0),
        revenueGrowth: Number(responseData.revenueGrowth || 0),
        revenueByMonth: responseData.revenueByMonth.map(item => ({
          ...item,
          revenue: Number(item.revenue || 0)
        })),
        revenueByCategory: responseData.revenueByCategory.map(item => ({
          ...item,
          revenue: Number(item.revenue || 0)
        }))
      };
      
      setRevenueData(formattedData);
      setDebugInfo(`Successfully loaded revenue data for ${timeRange}`);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      
      // Detailed error information for debugging
      let errorMsg = "Failed to load revenue data";
      let debugMsg = "";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        debugMsg = `Server responded with status: ${error.response.status}`;
        if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        debugMsg = "No response received from server";
      } else {
        // Something happened in setting up the request
        debugMsg = error.message;
      }
      
      setError(errorMsg);
      setDebugInfo(debugMsg);
      
      // Set default empty data
      setRevenueData(sampleData);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtext }) => (
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
        {subtext && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtext}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4">Revenue Analytics (Delivered Orders)</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {debugInfo && <Box sx={{ mt: 1, fontSize: '0.8rem' }}>{debugInfo}</Box>}
        </Alert>
      )}

      {debugInfo && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {debugInfo}
        </Alert>
      )}

      <Button 
        variant="outlined" 
        onClick={fetchRevenueData} 
        sx={{ mb: 2 }}
      >
        Refresh Data
      </Button>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`Rs. ${revenueData.totalRevenue.toLocaleString()}`}
            icon={<MonetizationOnIcon sx={{ color: "#1976d2", fontSize: 30 }} />}
            color="#1976d2"
            subtext="From delivered orders"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Delivered Orders"
            value={revenueData.deliveredOrders}
            icon={<LocalShippingIcon sx={{ color: "#2e7d32", fontSize: 30 }} />}
            color="#2e7d32"
            subtext="Completed deliveries"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Order Value"
            value={`Rs. ${revenueData.averageOrderValue.toLocaleString()}`}
            icon={<MonetizationOnIcon sx={{ color: "#ed6c02", fontSize: 30 }} />}
            color="#ed6c02"
            subtext="Per order revenue"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue Growth"
            value={`${revenueData.revenueGrowth > 0 ? '+' : ''}${revenueData.revenueGrowth}%`}
            icon={<TrendingUpIcon sx={{ color: "#9c27b0", fontSize: 30 }} />}
            color={revenueData.revenueGrowth >= 0 ? "#2e7d32" : "#d32f2f"}
            subtext={`Compared to previous ${timeRange}`}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Trend (Delivered Orders)
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              {revenueData.revenueByMonth && revenueData.revenueByMonth.length > 0 ? (
                <LineChart data={revenueData.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    No revenue trend data available
                  </Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Revenue by Category
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              {revenueData.revenueByCategory && revenueData.revenueByCategory.length > 0 ? (
                <PieChart>
                  <Pie
                    data={revenueData.revenueByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="revenue"
                    nameKey="category"
                    label={({ category, revenue }) => `${category || 'Unknown'}: Rs.${revenue.toLocaleString()}`}
                  >
                    {revenueData.revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    No category data available
                  </Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Revenue by Product Category
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              {revenueData.revenueByCategory && revenueData.revenueByCategory.length > 0 ? (
                <BarChart data={revenueData.revenueByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#8884d8">
                    {revenueData.revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    No category data available
                  </Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminRevenue; 