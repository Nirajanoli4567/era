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
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Tooltip
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const VendorBargainRequests = () => {
  const [bargains, setBargains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBargain, setSelectedBargain] = useState(null);
  const [counterOffer, setCounterOffer] = useState("");
  const [message, setMessage] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const fetchBargainRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/vendor/bargains`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBargains(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bargain requests:", error);
      setError("Failed to load bargain requests");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBargainRequests();
  }, []);

  const handleOpenDialog = (bargain) => {
    setSelectedBargain(bargain);
    setCounterOffer(bargain.counterOffer || bargain.offeredPrice || "");
    setMessage("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBargain(null);
    setCounterOffer("");
    setMessage("");
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedBargain) return;

    try {
      setStatusUpdateLoading(true);
      
      const data = { status, message };
      if (status === "countered") {
        if (!counterOffer || isNaN(counterOffer) || Number(counterOffer) <= 0) {
          setError("Please enter a valid counter offer amount");
          setStatusUpdateLoading(false);
          return;
        }
        data.counterOffer = counterOffer;
      }

      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/vendor/bargains/${selectedBargain._id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the local state
      setBargains(bargains.map(b => 
        b._id === selectedBargain._id 
          ? { ...b, status, counterOffer: data.counterOffer } 
          : b
      ));

      handleCloseDialog();
      setStatusUpdateLoading(false);
    } catch (error) {
      console.error("Error updating bargain status:", error);
      setError("Failed to update bargain status");
      setStatusUpdateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "accepted":
        return "success";
      case "rejected":
        return "error";
      case "countered":
        return "info";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Typography variant="h5" component="div" sx={{ mb: 3 }}>
        Bargain Requests
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Original Price</TableCell>
              <TableCell>Offered Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bargains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No bargain requests found.
                </TableCell>
              </TableRow>
            ) : (
              bargains.map((bargain) => (
                <TableRow key={bargain._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {bargain.productId?.images && bargain.productId.images.length > 0 && (
                        <img
                          src={bargain.productId.images[0]}
                          alt={bargain.productId?.name}
                          style={{ width: 40, height: 40, objectFit: "cover", marginRight: 10 }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40';
                          }}
                        />
                      )}
                      {bargain.productId?.name || "Unknown Product"}
                    </Box>
                  </TableCell>
                  <TableCell>{bargain.userId?.name || "Unknown User"}</TableCell>
                  <TableCell>Rs. {bargain.originalPrice}</TableCell>
                  <TableCell>Rs. {bargain.offeredPrice}</TableCell>
                  <TableCell>
                    <Chip
                      label={bargain.status.charAt(0).toUpperCase() + bargain.status.slice(1)}
                      color={getStatusColor(bargain.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(bargain.createdAt)}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(bargain)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    {bargain.status === 'pending' && (
                      <>
                        <Tooltip title="Accept">
                          <IconButton
                            color="success"
                            onClick={() => {
                              setSelectedBargain(bargain);
                              setMessage("Your offer has been accepted!");
                              handleUpdateStatus("accepted");
                            }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            color="error"
                            onClick={() => {
                              setSelectedBargain(bargain);
                              setMessage("Sorry, we cannot accept this offer.");
                              handleUpdateStatus("rejected");
                            }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bargain details dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedBargain && (
          <>
            <DialogTitle>Bargain Request Details</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Product Details</Typography>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {selectedBargain.productId?.images && selectedBargain.productId.images.length > 0 && (
                      <img
                        src={selectedBargain.productId.images[0]}
                        alt={selectedBargain.productId?.name}
                        style={{ width: 100, height: 100, objectFit: "cover", marginRight: 16 }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100';
                        }}
                      />
                    )}
                    <Box>
                      <Typography variant="h6">{selectedBargain.productId?.name}</Typography>
                      <Typography variant="body1">Original Price: Rs. {selectedBargain.originalPrice}</Typography>
                      <Typography variant="body1">Offered Price: Rs. {selectedBargain.offeredPrice}</Typography>
                      <Typography variant="body1">
                        Discount: {((selectedBargain.originalPrice - selectedBargain.offeredPrice) / selectedBargain.originalPrice * 100).toFixed(2)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Customer Information</Typography>
                  <Typography variant="body1">Name: {selectedBargain.userId?.name}</Typography>
                  <Typography variant="body1">Email: {selectedBargain.userId?.email}</Typography>
                  <Typography variant="body1">Date: {formatDate(selectedBargain.createdAt)}</Typography>
                  <Typography variant="body1">
                    Status: 
                    <Chip
                      label={selectedBargain.status.charAt(0).toUpperCase() + selectedBargain.status.slice(1)}
                      color={getStatusColor(selectedBargain.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>

                {selectedBargain.messages && selectedBargain.messages.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>Messages</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, maxHeight: 200, overflow: 'auto' }}>
                      <List>
                        {selectedBargain.messages.map((msg, index) => (
                          <React.Fragment key={index}>
                            <ListItem alignItems="flex-start">
                              <ListItemText
                                primary={
                                  <Typography
                                    component="span"
                                    variant="body1"
                                    color="text.primary"
                                  >
                                    {msg.senderId === selectedBargain.userId?._id ? 'Customer: ' : 'You: '}
                                  </Typography>
                                }
                                secondary={
                                  <>
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      color="text.primary"
                                    >
                                      {msg.message}
                                    </Typography>
                                    <Typography
                                      component="div"
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {formatDate(msg.timestamp)}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                            {index < selectedBargain.messages.length - 1 && <Divider component="li" />}
                          </React.Fragment>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                )}

                {selectedBargain.status === 'pending' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>Response</Typography>
                    <TextField
                      fullWidth
                      label="Message to Customer"
                      multiline
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>Counter Offer (Optional)</Typography>
                    <TextField
                      fullWidth
                      label="Counter Offer Amount"
                      type="number"
                      value={counterOffer}
                      onChange={(e) => setCounterOffer(e.target.value)}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>Rs.</Typography>,
                      }}
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              {selectedBargain.status === 'pending' && (
                <>
                  <Button
                    onClick={() => handleUpdateStatus("rejected")}
                    color="error"
                    disabled={statusUpdateLoading}
                  >
                    {statusUpdateLoading ? <CircularProgress size={24} /> : "Reject"}
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus("countered")}
                    color="primary"
                    disabled={statusUpdateLoading || !counterOffer}
                  >
                    {statusUpdateLoading ? <CircularProgress size={24} /> : "Counter Offer"}
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus("accepted")}
                    color="success"
                    variant="contained"
                    disabled={statusUpdateLoading}
                  >
                    {statusUpdateLoading ? <CircularProgress size={24} /> : "Accept"}
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default VendorBargainRequests; 