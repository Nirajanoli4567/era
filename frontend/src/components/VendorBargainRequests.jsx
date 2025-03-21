import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Divider,
  Stack
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Placeholder image for fallback
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const getOrderNumber = (bargain) => {
  // If bargain doesn't have order property, use bargain's own id and createdAt
  if (!bargain.order) {
    const dateStr = new Date(bargain.createdAt).toISOString().slice(0, 10).replace(/-/g, "");
    const shortId = bargain._id.slice(-2);
    return `#BRG-${dateStr}-${shortId}`;
  }

  // If it has order object, use that instead
  const dateStr = new Date(bargain.order.createdAt || bargain.createdAt).toISOString().slice(0, 10).replace(/-/g, "");
  const shortId = bargain.order._id ? bargain.order._id.slice(-2) : bargain._id.slice(-2);
  return `#ORD-${dateStr}-${shortId}`;
};

const getStatusColor = (status) => {
  switch (status) {
    case "accepted":
      return "success";
    case "rejected":
      return "error";
    case "countered":
      return "primary";
    case "pending":
    default:
      return "warning";
  }
};

const statusIcons = {
  accepted: <ThumbUpIcon />,
  rejected: <ThumbDownIcon />,
  countered: <PriceChangeIcon />,
  pending: <PendingIcon />,
};

const getBargainRequestStatus = (bargainRequest) => {
  if (!bargainRequest) return "pending";
  return bargainRequest.status || "pending";
};

// Row component for the expandable table
const BargainRow = ({ bargain, onAction }) => {
  const [open, setOpen] = useState(false);
  const [counterDialog, setCounterDialog] = useState(false);
  const [counterOffer, setCounterOffer] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const status = bargain.status || "pending";
  const percentDiscount = Math.round(((bargain.originalPrice - bargain.proposedPrice) / bargain.originalPrice) * 100);
  
  const handleAccept = async () => {
    try {
      setLoading(true);
      await onAction("accept", bargain);
      setLoading(false);
    } catch (error) {
      console.error("Error accepting bargain:", error);
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await onAction("reject", bargain);
      setLoading(false);
    } catch (error) {
      console.error("Error rejecting bargain:", error);
      setLoading(false);
    }
  };

  const handleCounter = async () => {
    try {
      setLoading(true);
      await onAction("counter", bargain, {
        counterOffer: parseFloat(counterOffer),
        message: counterMessage
      });
      setLoading(false);
      setCounterDialog(false);
    } catch (error) {
      console.error("Error submitting counter offer:", error);
      setLoading(false);
    }
  };

  // Get product data safely
  const getProductData = () => {
    if (bargain.product) {
      return bargain.product;
    } else if (bargain.order && bargain.order.product) {
      return bargain.order.product;
    } else {
      return { name: "Unknown Product", images: [] };
    }
  };

  const product = getProductData();

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{getOrderNumber(bargain)}</TableCell>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {product.images && product.images.length > 0 ? (
              <Box
                component="img"
                src={product.images[0]}
                alt={product.name}
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
                  bgcolor: "grey.300",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                No img
              </Box>
            )}
            {product.name}
          </Box>
        </TableCell>
        <TableCell>{bargain.user?.name || "Unknown User"}</TableCell>
        <TableCell>{formatDate(bargain.createdAt)}</TableCell>
        <TableCell>
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: "line-through" }}
            >
              Rs. {bargain.originalPrice?.toLocaleString() || 0}
            </Typography>
            <Typography
              variant="body1"
              color={percentDiscount > 30 ? "error.main" : "primary.main"}
            >
              Rs. {bargain.proposedPrice?.toLocaleString() || 0} ({percentDiscount}% off)
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={getStatusColor(status)}
            size="small"
            icon={statusIcons[status] || <PendingIcon />}
          />
        </TableCell>
        <TableCell>
          {status === "pending" && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<ThumbUpIcon />}
                onClick={handleAccept}
                disabled={loading}
              >
                Accept
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<PriceChangeIcon />}
                onClick={() => setCounterDialog(true)}
                disabled={loading}
              >
                Counter
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<ThumbDownIcon />}
                onClick={handleReject}
                disabled={loading}
              >
                Reject
              </Button>
            </Box>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom component="div">
                    Bargain Details
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th">Original Price</TableCell>
                          <TableCell>Rs. {bargain.originalPrice?.toLocaleString() || 0}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th">Customer's Offer</TableCell>
                          <TableCell>
                            <Typography color={percentDiscount > 30 ? "error.main" : "primary.main"}>
                              Rs. {bargain.proposedPrice?.toLocaleString() || 0} ({percentDiscount}% off)
                            </Typography>
                          </TableCell>
                        </TableRow>
                        {bargain.counterOffer && (
                          <TableRow>
                            <TableCell component="th">Your Counter Offer</TableCell>
                            <TableCell>Rs. {bargain.counterOffer?.toLocaleString() || 0}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell component="th">Status</TableCell>
                          <TableCell>
                            <Chip
                              label={status.charAt(0).toUpperCase() + status.slice(1)}
                              color={getStatusColor(status)}
                              size="small"
                              icon={statusIcons[status] || <PendingIcon />}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th">Created At</TableCell>
                          <TableCell>{formatDate(bargain.createdAt)}</TableCell>
                        </TableRow>
                        {bargain.updatedAt && bargain.updatedAt !== bargain.createdAt && (
                          <TableRow>
                            <TableCell component="th">Updated At</TableCell>
                            <TableCell>{formatDate(bargain.updatedAt)}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom component="div">
                    Customer Information
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th">Name</TableCell>
                          <TableCell>{bargain.user?.name || "Unknown"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th">Email</TableCell>
                          <TableCell>{bargain.user?.email || "Not available"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th">Message from Customer</TableCell>
                          <TableCell>{bargain.message || "No message provided"}</TableCell>
                        </TableRow>
                        {bargain.message && (
                          <TableRow>
                            <TableCell component="th">Your Response</TableCell>
                            <TableCell>{bargain.vendorResponse || "No response yet"}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom component="div">
                    Product Information
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th">Product Name</TableCell>
                          <TableCell>{product.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th">Description</TableCell>
                          <TableCell>{product.description || "No description available"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th">Category</TableCell>
                          <TableCell>{product.category || "Uncategorized"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th">Stock</TableCell>
                          <TableCell>{product.countInStock || 0} units available</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                {status === "pending" && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ThumbUpIcon />}
                        onClick={handleAccept}
                        disabled={loading}
                      >
                        Accept Offer
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PriceChangeIcon />}
                        onClick={() => setCounterDialog(true)}
                        disabled={loading}
                      >
                        Make Counter Offer
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<ThumbDownIcon />}
                        onClick={handleReject}
                        disabled={loading}
                      >
                        Reject Offer
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      {/* Counter Offer Dialog */}
      <Dialog open={counterDialog} onClose={() => setCounterDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Make Counter Offer</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body1" gutterBottom>
              Original Price: Rs. {bargain.originalPrice?.toLocaleString() || 0}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Customer's Offer: Rs. {bargain.proposedPrice?.toLocaleString() || 0} ({percentDiscount}% off)
            </Typography>
            <TextField
              label="Your Counter Offer"
              type="number"
              fullWidth
              margin="normal"
              value={counterOffer}
              onChange={(e) => setCounterOffer(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
              }}
            />
            <TextField
              label="Message to Customer (Optional)"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              placeholder="Explain your counter offer to the customer..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCounterDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCounter} 
            variant="contained" 
            color="primary"
            disabled={!counterOffer || loading || parseFloat(counterOffer) <= 0}
          >
            Submit Counter Offer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const VendorBargainRequests = () => {
  const [bargains, setBargains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchBargains = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Try to get all bargain requests from vendor/all-bargains endpoint
      try {
        const { data } = await axios.get(`${API_URL}/api/vendor/all-bargains`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Debug log the structure of the first bargain
        if (data && data.length > 0) {
          console.log("Bargain data structure from API:", data[0]);
        }
        
        setBargains(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (allBargainsError) {
        console.log("Falling back to vendor bargains endpoint");
        // Fallback to vendor-specific bargains endpoint
        const { data } = await axios.get(`${API_URL}/api/vendor/bargains`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Debug log the structure of the first bargain from fallback endpoint
        if (data && data.length > 0) {
          console.log("Bargain data structure from fallback API:", data[0]);
        }
        
        setBargains(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
      
      setLoading(false);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to fetch bargain requests"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBargains();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleBargainAction = async (action, bargain, data = {}) => {
    try {
      const token = localStorage.getItem("token");
      
      // Endpoints for different actions
      const endpoint = `${API_URL}/api/vendor/bargains/${bargain._id}/${action}`;
      
      console.log(`Sending ${action} request to ${endpoint}`, action === "counter" ? data : {});
      
      // Use POST method for all actions
      const response = await axios.post(
        endpoint, 
        action === "counter" ? data : {}, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log(`${action} response:`, response.data);
      
      // Refresh bargains list
      fetchBargains();
    } catch (err) {
      console.error(`Error during ${action} action:`, err);
      setError(
        err.response?.data?.message || 
        err.message || 
        `Failed to ${action} bargain`
      );
    }
  };

  const getFilteredBargains = () => {
    if (activeTab === "all") {
      return bargains;
    }
    return bargains.filter((bargain) => bargain.status === activeTab);
  };

  const filteredBargains = useMemo(() => getFilteredBargains(), [bargains, activeTab]);

  const bargainCounts = useMemo(() => {
    const counts = {
      all: bargains.length,
      pending: 0,
      accepted: 0,
      rejected: 0,
      countered: 0,
    };

    bargains.forEach((bargain) => {
      const status = bargain.status || "pending";
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  }, [bargains]);

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
        Bargain Requests
      </Typography>

      {/* Bargain Status Cards */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        sx={{ mb: 3, flexWrap: 'wrap' }}
      >
        <Card sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Total Requests
            </Typography>
            <Typography variant="h3">{bargainCounts.all}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Pending
            </Typography>
            <Typography variant="h3">{bargainCounts.pending}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Accepted
            </Typography>
            <Typography variant="h3">{bargainCounts.accepted}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 160, flex: 1 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Rejected
            </Typography>
            <Typography variant="h3">{bargainCounts.rejected}</Typography>
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
                <span>All Bargains</span>
                <Chip 
                  label={bargainCounts.all} 
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
                  label={bargainCounts.pending} 
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
                <span>Accepted</span>
                <Chip 
                  label={bargainCounts.accepted} 
                  size="small" 
                  color="success" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
            value="accepted" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Countered</span>
                <Chip 
                  label={bargainCounts.countered} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
            value="countered" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Rejected</span>
                <Chip 
                  label={bargainCounts.rejected} 
                  size="small" 
                  color="error" 
                  sx={{ ml: 1 }} 
                />
              </Box>
            } 
            value="rejected" 
          />
        </Tabs>
      </Box>

      {filteredBargains.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No {activeTab !== "all" ? activeTab : ""} bargain requests found.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ minHeight: 400 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Order ID</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Request Date</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBargains.map((bargain) => (
                <BargainRow
                  key={bargain._id}
                  bargain={bargain}
                  onAction={handleBargainAction}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button 
          variant="outlined"
          onClick={fetchBargains}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Bargains"}
        </Button>
      </Box>
    </Box>
  );
};

export default VendorBargainRequests; 