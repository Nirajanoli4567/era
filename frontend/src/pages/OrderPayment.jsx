import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Alert, 
  CircularProgress,
  Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EsewaPayment from '../components/EsewaPayment';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const OrderPayment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, getToken } = useAuth();

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, user]);

  const fetchOrderDetails = async () => {
    try {
      const token = getToken();
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrder(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      
      if (error.response && error.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Could not load order details. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const handlePaymentError = (message) => {
    setError(message);
  };

  const handlePaymentSuccess = () => {
    navigate(`/order-confirmation/${orderId}`, { state: { fromPayment: true } });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Order not found</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Complete Your Payment
        </Typography>
        
        <Box sx={{ my: 3 }}>
          <Typography variant="h6">Order Details</Typography>
          <Typography>Order Number: {order.orderNumber}</Typography>
          <Typography>Total Amount: ${order.totalAmount.toFixed(2)}</Typography>
          <Typography>Payment Method: {order.paymentMethod.toUpperCase()}</Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {order.paymentMethod === 'esewa' && (
          <EsewaPayment 
            order={order} 
            onSuccess={handlePaymentSuccess} 
            onError={handlePaymentError}
          />
        )}
        
        {order.paymentMethod !== 'esewa' && (
          <Alert severity="info">
            Payment processing for {order.paymentMethod.toUpperCase()} is not implemented yet.
          </Alert>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={() => navigate('/orders')}>
            Back to Orders
          </Button>
          
          {order.paymentMethod === 'cod' && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate(`/order-confirmation/${orderId}`)}
            >
              Confirm Cash on Delivery
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderPayment; 