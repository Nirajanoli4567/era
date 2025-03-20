import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaymentIcon from "@mui/icons-material/Payment";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import HomeIcon from "@mui/icons-material/Home";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ShareIcon from "@mui/icons-material/Share";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const steps = ['Order Placed', 'Payment Confirmed', 'Processing', 'Shipped', 'Delivered'];

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        console.log('No order ID found');
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found');
          navigate('/login');
          return;
        }

        console.log('Fetching order with ID:', orderId);
        const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Order data received:', response.data);
        setOrder(response.data);
      } catch (error) {
        console.error("Error fetching order:", error);
        setError(error.response?.data?.message || "Failed to retrieve order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  // Determine active step based on order status
  useEffect(() => {
    if (!order) return;
    
    const statusToStep = {
      'pending': 0,
      'payment_confirmed': 1,
      'processing': 2,
      'shipped': 3,
      'delivered': 4,
      'cancelled': -1
    };
    
    setActiveStep(statusToStep[order.status] || 0);
  }, [order]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || "No order information available. Please check your Orders page."}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() => navigate("/orders")}
        >
          Back to Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <LocalShippingIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Track Your Order
          </Typography>
          <Typography>
            Order Number: <strong>{order._id}</strong>
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Tooltip title="Share Order Details">
              <IconButton color="primary" onClick={() => {
                navigator.clipboard.writeText(`Order Number: ${order._id}`);
                alert('Order details copied to clipboard!');
              }}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />
        
        {/* Order Progress Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Details
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <ReceiptIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          label={order.status?.replace(/_/g, " ").toUpperCase() || 'PENDING'}
                          color={
                            order.status === "awaiting_bargain_approval"
                              ? "warning"
                              : order.status === "delivered"
                              ? "success"
                              : order.status === "cancelled"
                              ? "error"
                              : "primary"
                          }
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ShoppingBagIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Order Date"
                      secondary={new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    />
                  </ListItem>
                  {order.paymentMethod && (
                    <ListItem>
                      <ListItemIcon>
                        <PaymentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Payment Method"
                        secondary={order.paymentMethod.toUpperCase()}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Shipping Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <HomeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={order.contactInfo?.fullName || 'N/A'}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {order.shippingAddress?.street || 'N/A'}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'} {order.shippingAddress?.zipCode || 'N/A'}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            {order.shippingAddress?.country || 'N/A'}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            Phone: {order.contactInfo?.phone || 'N/A'}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            Email: {order.contactInfo?.email || 'N/A'}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Items Ordered
          </Typography>
          {order.items?.map((item, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <Typography variant="subtitle1">
                      {item.product?.name || "Product not available"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quantity: {item.quantity}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1">
                      Rs. {(item.product?.price * item.quantity).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Total Amount</Typography>
            <Typography variant="h5" color="primary">
              Rs. {order.totalAmount?.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/orders")}
              startIcon={<ShoppingBagIcon />}
            >
              Back to Orders
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderTracking;
