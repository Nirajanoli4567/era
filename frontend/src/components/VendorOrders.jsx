import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Collapse,
  Card,
  CardContent,
  Tabs,
  Tab,
  Stack
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InventoryIcon from "@mui/icons-material/Inventory";
import PendingIcon from "@mui/icons-material/Pending";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import axios from "axios";
import OrderRow from "./Row";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Placeholder image for fallback
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const statusIcons = {
  pending: <PendingIcon />,
  processing: <InventoryIcon />,
  shipped: <LocalShippingIcon />,
  delivered: <CheckCircleIcon />,
  cancelled: <CancelIcon />,
  awaiting_bargain_approval: <PriceChangeIcon />,
};

const statusLabels = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  awaiting_bargain_approval: "Awaiting Bargain Approval",
};

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "warning";
    case "processing":
      return "info";
    case "shipped":
      return "primary";
    case "delivered":
      return "success";
    case "cancelled":
      return "error";
    case "awaiting_bargain_approval":
      return "secondary";
    default:
      return "default";
  }
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Try to get all orders from vendor/all-orders endpoint
      try {
        const { data } = await axios.get(`${API_URL}/api/vendor/all-orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (allOrdersError) {
        console.log("Falling back to vendor orders endpoint");
        // Fallback to vendor-specific orders endpoint
        const { data } = await axios.get(`${API_URL}/api/vendor/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
      
      setLoading(false);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to fetch orders"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getFilteredOrders = () => {
    if (activeTab === "all") {
      return orders;
    }
    return orders.filter((order) => order.status === activeTab);
  };

  const filteredOrders = useMemo(() => getFilteredOrders(), [orders, activeTab]);

  const orderCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      awaiting_bargain_approval: 0,
    };

    orders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });

    return counts;
  }, [orders]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Order Management
      </Typography>

      {/* Order Status Cards */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        sx={{ mb: 3, flexWrap: 'wrap' }}
      >
        <Card sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Total Orders
            </Typography>
            <Typography variant="h3">{orderCounts.all}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Pending
            </Typography>
            <Typography variant="h3">{orderCounts.pending}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Processing
            </Typography>
            <Typography variant="h3">{orderCounts.processing}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Shipped
            </Typography>
            <Typography variant="h3">{orderCounts.shipped}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Filter by Status Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>All Orders</span>
                <Chip 
                  label={orderCounts.all} 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
            value="all" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Pending</span>
                <Chip 
                  label={orderCounts.pending} 
                  size="small" 
                  color="warning" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
            value="pending" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Processing</span>
                <Chip 
                  label={orderCounts.processing} 
                  size="small" 
                  color="info" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
            value="processing" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Shipped</span>
                <Chip 
                  label={orderCounts.shipped} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
            value="shipped" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Delivered</span>
                <Chip 
                  label={orderCounts.delivered} 
                  size="small" 
                  color="success" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
            value="delivered" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Cancelled</span>
                <Chip 
                  label={orderCounts.cancelled} 
                  size="small" 
                  color="error" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
            value="cancelled" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Bargain Requests</span>
                <Chip 
                  label={orderCounts.awaiting_bargain_approval} 
                  size="small" 
                  color="secondary" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
            value="awaiting_bargain_approval" 
          />
        </Tabs>
      </Box>

      {filteredOrders.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No {activeTab !== "all" ? activeTab : ""} orders found.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ minHeight: 400 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <OrderRow 
                  key={order._id} 
                  order={{
                    ...order,
                    userId: order.user
                  }} 
                  onStatusUpdate={fetchOrders} 
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button 
          variant="outlined"
          onClick={fetchOrders}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Orders"}
        </Button>
      </Box>
    </Box>
  );
};

export default VendorOrders; 