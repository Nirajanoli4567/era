import React, { useState } from "react";
import {
  Box,
  Typography,
  TableRow,
  TableCell,
  IconButton,
  Collapse,
  Table,
  TableHead,
  TableBody,
  Chip,
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Grid,
  Paper
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import axios from "axios";

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

const OrderRow = ({ order, onStatusUpdate, isVendorView = true }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [trackingInfo, setTrackingInfo] = useState(order.trackingInfo || "");
  const [statusMessage, setStatusMessage] = useState("");

  const handleStatusChange = (event) => {
    setNewStatus(event.target.value);
  };

  const handleUpdateStatus = async () => {
    if (newStatus === order.status && trackingInfo === order.trackingInfo) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const data = {
        status: newStatus,
        trackingInfo: trackingInfo,
        statusMessage: statusMessage
      };

      const endpoint = isVendorView 
        ? `${API_URL}/api/vendor/orders/${order._id}/status`
        : `${API_URL}/api/orders/${order._id}/status`;

      await axios.put(endpoint, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setLoading(false);
      
      // Refresh the orders list
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      setLoading(false);
    }
  };

  // Check if there's a bargain request
  const hasBargain = order.bargainRequest && order.bargainRequest.status;
  const isBargainAccepted = hasBargain && order.bargainRequest.status === 'accepted';
  const isBargainRejected = hasBargain && order.bargainRequest.status === 'rejected';
  const showBargainInfo = hasBargain && (isBargainAccepted || isBargainRejected);

  const getOrderNumber = () => {
    // Format to match admin page order IDs with #ORD prefix
    const timestamp = new Date(order.createdAt).getTime();
    const dateStr = new Date(order.createdAt).toISOString().slice(0, 10).replace(/-/g, "");
    const shortId = order._id.slice(-2);
    return `#ORD-${dateStr}-${shortId}`;
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{getOrderNumber()}</TableCell>
        <TableCell>{order.userId?.name || order.user?.name || "Unknown"}</TableCell>
        <TableCell>{formatDate(order.createdAt)}</TableCell>
        <TableCell>
          {isBargainAccepted ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                Rs. {order.totalAmount?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body1" color="success.main">
                Rs. {order.proposedTotal?.toLocaleString() || 0} (Approved)
              </Typography>
            </Box>
          ) : (
            `Rs. ${order.totalAmount?.toLocaleString() || 0}`
          )}
        </TableCell>
        <TableCell>
          <Chip
            label={statusLabels[order.status] || order.status}
            color={getStatusColor(order.status)}
            size="small"
            icon={statusIcons[order.status]}
          />
        </TableCell>
        <TableCell>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={newStatus}
              onChange={handleStatusChange}
              size="small"
              sx={{
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                },
              }}
            >
              {Object.keys(statusIcons).map((status) => (
                <MenuItem
                  key={status}
                  value={status}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  {statusIcons[status]}
                  {statusLabels[status]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            size="small"
            color="primary"
            sx={{ ml: 1 }}
            disabled={newStatus === order.status && trackingInfo === order.trackingInfo || loading}
            onClick={handleUpdateStatus}
          >
            {loading ? "Updating..." : "Update"}
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Grid container spacing={2}>
                {/* Order Details Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom component="div">
                    Order Details
                  </Typography>
                  
                  {/* Bargain Information if applicable */}
                  {showBargainInfo && (
                    <Paper variant="outlined" sx={{ 
                      p: 2, 
                      mb: 3, 
                      bgcolor: isBargainAccepted ? 'success.light' : 'error.light',
                      color: isBargainAccepted ? 'success.contrastText' : 'error.contrastText'
                    }}>
                      <Typography variant="h6">
                        Bargain {isBargainAccepted ? 'Accepted' : 'Rejected'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1">Original Price: Rs. {order.totalAmount?.toLocaleString() || 0}</Typography>
                        <Typography variant="body1">Customer's Offer: Rs. {order.proposedTotal?.toLocaleString() || 0}</Typography>
                      </Box>
                      {order.bargainRequest?.vendorResponse && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Your Response: {order.bargainRequest.vendorResponse}
                        </Typography>
                      )}
                    </Paper>
                  )}
                </Grid>
                
                {/* Order Items List */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Items</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Vendor</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            <Box
                              sx={{ display: "flex", alignItems: "center", gap: 2 }}
                            >
                              {item.product && (
                                <>
                                  {item.product.images && item.product.images.length > 0 ? (
                                    <Box
                                      component="img"
                                      src={item.product.images[0]}
                                      alt={item.product.name}
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        objectFit: "cover",
                                        borderRadius: 1,
                                      }}
                                      onError={(e) => {
                                        e.target.src = PLACEHOLDER_IMAGE;
                                      }}
                                    />
                                  ) : (
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: 'grey.300',
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      No img
                                    </Box>
                                  )}
                                  {item.product.name}
                                </>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {item.product?.vendorName || (item.product?.vendorId && 'Vendor ID: ' + item.product.vendorId) || 'Unknown'}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell align="right">
                            Rs. {item.price?.toLocaleString() || 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            Rs. {((item.price || 0) * item.quantity).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right">
                          <strong>Subtotal:</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>Rs. {order.totalAmount?.toLocaleString() || 0}</strong>
                        </TableCell>
                      </TableRow>
                      {isBargainAccepted && (
                        <TableRow>
                          <TableCell colSpan={4} align="right">
                            <strong>Final Price (After Bargain):</strong>
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'success.main' }}>
                            <strong>Rs. {order.proposedTotal?.toLocaleString() || 0}</strong>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Grid>

                {/* Customer Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ ml: 2 }}>
                    <Typography>
                      <strong>Name:</strong> {order.contactInfo?.fullName || order.userId?.name || order.user?.name || 'N/A'}
                    </Typography>
                    <Typography>
                      <strong>Email:</strong> {order.contactInfo?.email || order.userId?.email || order.user?.email || 'N/A'}
                    </Typography>
                    <Typography>
                      <strong>Phone:</strong> {order.contactInfo?.phone || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Shipping Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    Shipping Information
                  </Typography>
                  <Box sx={{ ml: 2 }}>
                    <Typography>
                      <strong>Address:</strong> {order.shippingAddress?.street || 'N/A'}
                    </Typography>
                    <Typography>
                      <strong>City:</strong> {order.shippingAddress?.city || 'N/A'}
                    </Typography>
                    <Typography>
                      <strong>State/Province:</strong> {order.shippingAddress?.state || 'N/A'}
                    </Typography>
                    <Typography>
                      <strong>Postal Code:</strong> {order.shippingAddress?.zipCode || 'N/A'}
                    </Typography>
                    <Typography>
                      <strong>Country:</strong> {order.shippingAddress?.country || 'Nepal'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Tracking Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    Shipping & Tracking
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Tracking Number / Info"
                        value={trackingInfo}
                        onChange={(e) => setTrackingInfo(e.target.value)}
                        variant="outlined"
                        size="small"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Status Update Message"
                        value={statusMessage}
                        onChange={(e) => setStatusMessage(e.target.value)}
                        variant="outlined"
                        size="small"
                        margin="normal"
                        placeholder="Message to customer about status update"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={loading || (newStatus === order.status && trackingInfo === order.trackingInfo)}
                        onClick={handleUpdateStatus}
                      >
                        {loading ? "Updating..." : "Update Shipping Info"}
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Notes */}
                {order.notes && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                      Order Notes
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{order.notes}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default OrderRow; 