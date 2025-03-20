const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files with proper URL path
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add a route to serve images with proper URL path
app.get("/images/:filename", (req, res) => {
  res.sendFile(path.join(__dirname, "uploads", req.params.filename));
});

// Test route for eSewa integration
app.get("/test-esewa", (req, res) => {
  res.sendFile(path.join(__dirname, "test_esewa.html"));
});

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit with failure
  }
};

connectDB();

// Import routes
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const bargainRoutes = require("./routes/bargainRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Use routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bargains", bargainRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
