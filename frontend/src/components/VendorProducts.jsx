import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Stack
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CancelIcon from "@mui/icons-material/Cancel";
import ImageIcon from "@mui/icons-material/Image";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const categories = [
  "Electronics",
  "Clothing",
  "Books",
  "Home & Kitchen",
  "Toys & Games",
  "Sports & Outdoors",
  "Beauty & Personal Care",
  "Health & Household",
  "Other"
];

// Create a data URL for a simple gray placeholder image (1x1 pixel)
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

// Memoized Product Row component to prevent unnecessary re-renders
const ProductRow = memo(({ product, onEdit, onDelete }) => {
  return (
    <TableRow key={product._id}>
      <TableCell sx={{ width: 70 }}>
        {product.images && product.images.length > 0 ? (
          <>
            <Box
              component="img"
              src={product.images[0]}
              alt={product.name}
              sx={{ 
                width: 50, 
                height: 50, 
                objectFit: "cover",
                borderRadius: '4px',
                bgcolor: 'rgba(0,0,0,0.05)'
              }}
              onError={(e) => {
                // Use local data URL instead of external placeholder
                e.target.src = PLACEHOLDER_IMAGE;
                e.target.style.display = 'none'; // Hide the img
                e.target.nextSibling.style.display = 'flex'; // Show the icon
              }}
            />
            <Box 
              sx={{ 
                width: 50, 
                height: 50, 
                display: 'none', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.05)',
                borderRadius: '4px'
              }}
            >
              <ImageIcon color="disabled" />
            </Box>
          </>
        ) : (
          <Box
            sx={{ 
              width: 50, 
              height: 50,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.05)',
              borderRadius: '4px'
            }}
          >
            <ImageIcon color="disabled" />
          </Box>
        )}
      </TableCell>
      <TableCell>{product.name}</TableCell>
      <TableCell>Rs. {product.price}</TableCell>
      <TableCell>{product.category}</TableCell>
      <TableCell>{product.stock}</TableCell>
      <TableCell>
        <IconButton
          color="primary"
          onClick={() => onEdit(product)}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          color="error"
          onClick={() => onDelete(product._id)}
        >
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
});

// Add display name for debugging
ProductRow.displayName = 'ProductRow';

const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Add a ref to track if the component is mounted
  const isMounted = useRef(true);
  // Add a ref to track the last fetch time to prevent too frequent API calls
  const lastFetchTime = useRef(0);
  // Track if initial fetch is complete to prevent extra renders
  const initialFetchComplete = useRef(false);

  const onDrop = useCallback((acceptedFiles) => {
    // Update files state
    setImages(acceptedFiles);

    // Create preview URLs
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 5
  });

  const fetchProducts = async () => {
    // Check if we've fetched recently to prevent excessive calls
    const now = Date.now();
    if (now - lastFetchTime.current < 2000) {
      return; // Skip fetching if it's been less than 2 seconds since last fetch
    }
    
    lastFetchTime.current = now;
    
    try {
      if (!isMounted.current) return; // Don't fetch if component is unmounting
      
      // Only show loading indicator on initial fetch
      if (!initialFetchComplete.current) {
        setLoading(true);
      }
      
      setError("");
      const token = localStorage.getItem("token");
      
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Only update state if the component is still mounted
      if (isMounted.current) {
        // Sort products to maintain consistent order and prevent layout shifts
        const sortedProducts = response.data.sort((a, b) => {
          // Sort by created date (newest first) or by name if dates are equal
          if (a.createdAt !== b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return a.name.localeCompare(b.name);
        });
        
        setProducts(sortedProducts);
        setLoading(false);
        initialFetchComplete.current = true;
      }
    } catch (err) {
      if (isMounted.current) {
        console.error("Error fetching products:", err);
        setError(`Failed to load products: ${err.response?.data?.message || err.message}`);
        setProducts([]);
        setLoading(false);
        initialFetchComplete.current = true;
      }
    }
  };

  useEffect(() => {
    // Set up the mounted ref
    isMounted.current = true;
    
    // Fetch products initially
    fetchProducts();
    
    // Clean up function to prevent memory leaks and state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, []); // Only run on mount and unmount

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
      });
      setPreviews(product.images || []);
    } else {
      setEditProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "",
      });
      setImages([]);
      setPreviews([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const removePreview = (index) => {
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);

    if (!editProduct) {
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
    }
  };

  const handleSubmit = async () => {
    try {
      // Use separate submitting state for form operations to keep table visible
      setSubmitting(true);
      setError("");
      const token = localStorage.getItem("token");
      
      // Form validation
      if (!formData.name || !formData.price || !formData.category) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      // Prepare form data for API
      const productData = new FormData();
      productData.append("name", formData.name);
      productData.append("description", formData.description);
      productData.append("price", formData.price);
      productData.append("category", formData.category);
      productData.append("stock", formData.stock);

      // Append images if there are any new ones
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          productData.append("images", images[i]);
        }
      }

      // If editing, also send existing image URLs to keep
      if (editProduct) {
        // Only send the existing images that are still in previews
        const existingImages = previews.filter(url => 
          editProduct.images && editProduct.images.includes(url)
        );
        
        if (existingImages.length > 0) {
          productData.append("existingImages", JSON.stringify(existingImages));
        }
      }

      let response;
      if (editProduct) {
        // Update product using admin endpoint
        response = await axios.put(
          `${API_URL}/api/products/${editProduct._id}`,
          productData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        // Create new product using admin endpoint
        response = await axios.post(
          `${API_URL}/api/products`,
          productData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      // Update products state without triggering a full refetch
      // This prevents unnecessary loading state
      if (editProduct) {
        setProducts(prevProducts => 
          prevProducts.map(p => p._id === editProduct._id ? response.data : p)
        );
      } else {
        setProducts(prevProducts => [response.data, ...prevProducts]);
      }

      handleCloseDialog();
      
      // Clean up previews
      previews.forEach(url => {
        // Only clean up local blob URLs
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      
    } catch (err) {
      console.error("Error saving product:", err);
      setError("Failed to save product. " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        // Don't set loading true for the whole table during delete
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/api/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Update state directly instead of refetching
        setProducts(prevProducts => prevProducts.filter(p => p._id !== id));
      } catch (err) {
        console.error("Error deleting product:", err);
        setError("Failed to delete product. " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="div">
          Manage Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Fixed height container to prevent layout shifts */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          minHeight: 400, // Provide minimum height to prevent layout shifts
          position: 'relative' 
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  No products found. Add your first product!
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <ProductRow 
                  key={product._id}
                  product={product}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editProduct ? "Edit Product" : "Add New Product"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
                margin="dense"
                InputProps={{
                  startAdornment: "Rs. ",
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  label="Category"
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleInputChange}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Product Images
              </Typography>
              <Box
                {...getRootProps()}
                sx={{
                  border: "2px dashed #cccccc",
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: isDragActive ? "rgba(0, 0, 0, 0.05)" : "transparent",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                <Typography>
                  {isDragActive
                    ? "Drop the files here..."
                    : "Drag and drop images here, or click to select files"}
                </Typography>
                <Typography variant="caption" display="block" color="textSecondary">
                  Maximum 5 images allowed
                </Typography>
              </Box>
              {previews.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                  {previews.map((preview, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: "relative",
                        width: 100,
                        height: 100,
                        mb: 1,
                      }}
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                        onError={(e) => {
                          // Use local data URL instead of external placeholder
                          e.target.src = PLACEHOLDER_IMAGE;
                          // Show an icon overlay when image fails to load
                          const iconOverlay = document.createElement('div');
                          iconOverlay.style.position = 'absolute';
                          iconOverlay.style.top = '0';
                          iconOverlay.style.left = '0';
                          iconOverlay.style.width = '100%';
                          iconOverlay.style.height = '100%';
                          iconOverlay.style.display = 'flex';
                          iconOverlay.style.alignItems = 'center';
                          iconOverlay.style.justifyContent = 'center';
                          iconOverlay.style.backgroundColor = 'rgba(0,0,0,0.05)';
                          iconOverlay.style.borderRadius = '4px';
                          
                          // Create an icon element
                          const icon = document.createElement('span');
                          icon.innerHTML = '📷'; // Simple fallback using emoji
                          iconOverlay.appendChild(icon);
                          
                          // Add the overlay to the parent element
                          e.target.parentNode.appendChild(iconOverlay);
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: "absolute",
                          top: -10,
                          right: -10,
                          bgcolor: "background.paper",
                          boxShadow: 1,
                          "&:hover": { bgcolor: "error.lighter" },
                          zIndex: 1, // Ensure button is above image and fallback
                        }}
                        onClick={() => removePreview(index)}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default memo(VendorProducts); 