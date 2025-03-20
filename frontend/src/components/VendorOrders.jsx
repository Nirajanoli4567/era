import React, { useState, useEffect } from "react";
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
  Divider
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingInfo, setTrackingInfo] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/vendor/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. " + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status || "");
    setTrackingInfo(order.trackingInfo || "");
    setStatusMessage("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = (event) => {
    setNewStatus(event.target.value);
  };

  const handleTrackingInfoChange = (event) => {
    setTrackingInfo(event.target.value);
  };

  const handleStatusMessageChange = (event) => {
    setStatusMessage(event.target.value);
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
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setStatusUpdateLoading(true);
      const token = localStorage.getItem("token");
      const data = {
        status: newStatus,
        trackingInfo: trackingInfo,
        statusMessage: statusMessage
      };

      await axios.put(`${API_URL}/api/vendor/orders/${selectedOrder._id}/status`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Update local state
      setOrders(orders.map(order => 
        order._id === selectedOrder._id 
          ? { ...order, status: newStatus, trackingInfo, statusMessage } 
          : order
      ));

      setStatusUpdateLoading(false);
      handleCloseDialog();
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Failed to update order status. " + (err.response?.data?.message || err.message));
      setStatusUpdateLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" component="div" sx={{ mb: 3 }}>
        Manage Orders
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: "100%", mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      {order._id.substring(order._id.length - 8)}
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{order.userId?.name || "Unknown"}</TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell>Rs. {calculateTotal(order.items)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(order)}
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Order Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>
              Order Details
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Order Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Order ID:</strong> {selectedOrder._id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong>{" "}
                    <Chip
                      label={selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      color={getStatusColor(selectedOrder.status)}
                      size="small"
                    />
                  </Typography>
                  {selectedOrder.trackingInfo && (
                    <Typography variant="body2">
                      <strong>Tracking Info:</strong> {selectedOrder.trackingInfo}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Customer Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedOrder.userId?.name || "Unknown"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedOrder.userId?.email || "Unknown"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Shipping Address:</strong> {selectedOrder.shippingAddress || "Not provided"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Order Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                {item.product?.images && item.product.images.length > 0 && (
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product?.name}
                                    style={{ width: 40, height: 40, objectFit: "cover", marginRight: 10 }}
                                    onError={(e) => {
                                      e.target.src = "https://via.placeholder.com/40";
                                    }}
                                  />
                                )}
                                {item.product?.name || "Unknown Product"}
                              </Box>
                            </TableCell>
                            <TableCell>Rs. {item.price}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>Rs. {item.price * item.quantity}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <strong>Total:</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Rs. {calculateTotal(selectedOrder.items)}</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Update Order Status
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="status-select-label">Status</InputLabel>
                        <Select
                          labelId="status-select-label"
                          value={newStatus}
                          onChange={handleStatusChange}
                          label="Status"
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="processing">Processing</MenuItem>
                          <MenuItem value="shipped">Shipped</MenuItem>
                          <MenuItem value="delivered">Delivered</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Tracking Information"
                        value={trackingInfo}
                        onChange={handleTrackingInfoChange}
                        margin="normal"
                        helperText="Enter tracking number or courier information"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Status Message (Optional)"
                        value={statusMessage}
                        onChange={handleStatusMessageChange}
                        margin="normal"
                        multiline
                        rows={2}
                        helperText="Add a message to the customer about this status update"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} disabled={statusUpdateLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                variant="contained"
                color="primary"
                disabled={statusUpdateLoading || newStatus === selectedOrder.status}
                startIcon={statusUpdateLoading ? <CircularProgress size={20} /> : null}
              >
                {statusUpdateLoading ? "Updating..." : "Update Status"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default VendorOrders; 