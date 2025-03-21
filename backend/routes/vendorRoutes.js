const express = require('express');
const router = express.Router();
const { protect, vendor } = require('../middleware/authMiddleware');
const { User, Product, Order, Bargain, Notification } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/products';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// @desc    Get vendor profile
// @route   GET /api/vendor/profile
// @access  Private/Vendor
router.get('/profile', protect, vendor, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update vendor profile
// @route   PUT /api/vendor/profile
// @access  Private/Vendor
router.put('/profile', protect, vendor, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields if provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.phone) user.phone = req.body.phone;

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if it exists
      if (user.profilePicture) {
        const oldPicPath = path.join(__dirname, '..', 'uploads', user.profilePicture);
        if (fs.existsSync(oldPicPath)) {
          fs.unlinkSync(oldPicPath);
        }
      }
      // Set new profile picture
      user.profilePicture = req.file.path.replace('uploads/', '');
    }

    const updatedUser = await user.save();

    // Return user without password
    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      profilePicture: updatedUser.profilePicture,
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get vendor dashboard data
// @route   GET /api/vendor/dashboard
// @access  Private/Vendor
router.get('/dashboard', protect, vendor, async (req, res) => {
  try {
    // Get vendor ID
    const vendorId = req.user._id;

    // Count total products by this vendor
    const totalProducts = await Product.countDocuments({ vendorId });

    // Count total orders for this vendor's products
    const orders = await Order.find({
      'items.product': { $in: await Product.find({ vendorId }).distinct('_id') }
    });
    
    const totalOrders = orders.length;
    
    // Calculate total revenue
    const totalRevenue = orders.reduce((total, order) => {
      // For each order, sum up only the items from this vendor
      const vendorItems = order.items.filter(async (item) => {
        const product = await Product.findById(item.product);
        return product && product.vendorId.toString() === vendorId.toString();
      });
      
      return total + vendorItems.reduce((itemTotal, item) => itemTotal + (item.price * item.quantity), 0);
    }, 0);

    // Count bargain requests
    const totalBargainRequests = await Bargain.countDocuments({ 
      productId: { $in: await Product.find({ vendorId }).distinct('_id') } 
    });

    // Get recent orders
    const recentOrders = await Order.find({
      'items.product': { $in: await Product.find({ vendorId }).distinct('_id') }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email')
      .populate('items.product', 'name price images');

    // Get order status distribution
    const orderStatusCounts = {
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      if (orderStatusCounts[order.status]) {
        orderStatusCounts[order.status]++;
      }
    });

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      totalBargainRequests,
      recentOrders,
      orderStatusCounts
    });
  } catch (error) {
    console.error('Error fetching vendor dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get vendor products
// @route   GET /api/vendor/products
// @access  Private/Vendor
router.get('/products', protect, vendor, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.user._id });
    res.json(products);
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add a product
// @route   POST /api/vendor/products
// @access  Private/Vendor
router.post('/products', protect, vendor, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      // Delete uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(400).json({ message: 'Please provide name, price, and category' });
    }

    // Create new product
    const product = new Product({
      name,
      description,
      price,
      category,
      stock: stock || 0,
      vendorId: req.user._id,
      images: req.files ? req.files.map(file => `/${file.path.replace(/\\/g, '/')}`) : []
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    // Delete uploaded files if saving fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update a product
// @route   PUT /api/vendor/products/:id
// @access  Private/Vendor
router.put('/products/:id', protect, vendor, upload.array('images', 5), async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, category, stock, existingImages } = req.body;

    // Find product and check ownership
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this product' });
    }

    // Update product fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (stock) product.stock = stock;

    // Handle images
    let updatedImages = [];
    
    // Keep existing images if they were sent back
    if (existingImages) {
      const existingImagesList = JSON.parse(existingImages);
      updatedImages = [...existingImagesList];
    }
    
    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/${file.path.replace(/\\/g, '/')}`);
      updatedImages = [...updatedImages, ...newImages];
    }
    
    // Delete images that are no longer needed
    if (product.images && product.images.length > 0) {
      product.images.forEach(oldImage => {
        if (!updatedImages.includes(oldImage)) {
          // Remove the leading slash if present
          const imagePath = oldImage.startsWith('/') 
            ? path.join(__dirname, '..', oldImage.substring(1)) 
            : path.join(__dirname, '..', oldImage);
            
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
    }
    
    // Update product with new images
    product.images = updatedImages;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    // Delete uploaded files if saving fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a product
// @route   DELETE /api/vendor/products/:id
// @access  Private/Vendor
router.delete('/products/:id', protect, vendor, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this product' });
    }

    // Delete product images from storage
    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        // Remove the leading slash if present
        const imagePath = image.startsWith('/') 
          ? path.join(__dirname, '..', image.substring(1)) 
          : path.join(__dirname, '..', image);
          
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await product.remove();
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all bargain requests for vendor's products
// @route   GET /api/vendor/bargains
// @access  Private/Vendor
router.get('/bargains', protect, vendor, async (req, res) => {
  try {
    // Get all products by this vendor
    const vendorProducts = await Product.find({ vendorId: req.user._id });
    const productIds = vendorProducts.map(product => product._id);

    // Find all bargains for these products
    const bargains = await Bargain.find({ 
      product: { $in: productIds } 
    })
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate({
      path: 'product',
      select: 'name price images description category countInStock vendorId'
    });

    res.json(bargains);
  } catch (error) {
    console.error('Error fetching bargain requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get vendor orders
// @route   GET /api/vendor/orders
// @access  Private/Vendor
router.get('/orders', protect, vendor, async (req, res) => {
  try {
    const vendorId = req.user._id;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    
    // Find products by this vendor
    const vendorProducts = await Product.find({ vendorId }).distinct('_id');
    
    // Find orders containing these products
    let ordersQuery = Order.find({
      'items.product': { $in: vendorProducts }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('items.product', 'name price images vendorId');
    
    // Apply limit if provided
    if (limit) {
      ordersQuery = ordersQuery.limit(limit);
    }
    
    const orders = await ordersQuery;
    
    // Filter items in each order to only include this vendor's items
    const vendorOrders = orders.map(order => {
      const vendorItems = order.items.filter(item => 
        item.product && item.product.vendorId && 
        item.product.vendorId.toString() === vendorId.toString()
      );
      
      return {
        ...order.toObject(),
        items: vendorItems
      };
    });
    
    res.json(vendorOrders);
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get vendor notifications
// @route   GET /api/vendor/notifications
// @access  Private/Vendor
router.get('/notifications', protect, vendor, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user._id 
    })
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/vendor/notifications/mark-all-read
// @access  Private/Vendor
router.put('/notifications/mark-all-read', protect, vendor, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update order status
// @route   PUT /api/vendor/orders/:id/status
// @access  Private/Vendor
router.put('/orders/:id/status', protect, vendor, async (req, res) => {
  try {
    const { status, trackingInfo, statusMessage } = req.body;
    const orderId = req.params.id;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify the order contains products from this vendor
    const vendorProducts = await Product.find({ vendorId: req.user._id }).distinct('_id');
    const hasVendorItems = order.items.some(item => 
      vendorProducts.some(productId => productId.toString() === item.product.toString())
    );
    
    if (!hasVendorItems) {
      return res.status(403).json({ message: 'You are not authorized to update this order' });
    }
    
    // Update order status
    order.status = status;
    
    // Update tracking info if provided
    if (trackingInfo) {
      order.trackingInfo = trackingInfo;
    }
    
    // Save the updated order
    const updatedOrder = await order.save();
    
    // Create a notification for the user
    if (statusMessage || status !== order.status) {
      const notificationMsg = statusMessage || 
        `Your order #${order._id.toString().substring(order._id.toString().length - 8)} has been updated to ${status}`;
      
      const notification = new Notification({
        userId: order.userId,
        message: notificationMsg,
        type: 'order',
        link: `/orders/${order._id}`
      });
      
      await notification.save();
    }
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update a bargain request (accept, reject, counter offer)
// @route   PUT /api/vendor/bargains/:id
// @access  Private/Vendor
router.put('/bargains/:id', protect, vendor, async (req, res) => {
  try {
    const { status, counterOffer, message } = req.body;
    
    // Validate status
    if (!['accepted', 'rejected', 'countered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If countering, validate counter offer
    if (status === 'countered' && (!counterOffer || isNaN(counterOffer) || Number(counterOffer) <= 0)) {
      return res.status(400).json({ message: 'Valid counter offer amount required' });
    }

    // Find the bargain
    const bargain = await Bargain.findById(req.params.id);
    
    if (!bargain) {
      return res.status(404).json({ message: 'Bargain request not found' });
    }

    // Verify the product belongs to this vendor
    const product = await Product.findById(bargain.productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to handle this bargain request' });
    }

    // Update bargain status
    bargain.status = status;
    
    // Set counter offer amount if provided
    if (status === 'countered' && counterOffer) {
      bargain.counterOffer = Number(counterOffer);
    }

    // Add message to the conversation if provided
    if (message) {
      bargain.messages.push({
        senderId: req.user._id,
        message,
        timestamp: new Date()
      });
    }

    // Save the updated bargain
    const updatedBargain = await bargain.save();

    // Create a notification for the user
    let notificationMessage = '';
    
    switch (status) {
      case 'accepted':
        notificationMessage = `Your offer of Rs. ${bargain.offeredPrice} for ${product.name} has been accepted!`;
        break;
      case 'rejected':
        notificationMessage = `Your offer of Rs. ${bargain.offeredPrice} for ${product.name} has been rejected.`;
        break;
      case 'countered':
        notificationMessage = `The vendor has countered your offer for ${product.name} with Rs. ${counterOffer}.`;
        break;
    }

    if (notificationMessage) {
      const notification = new Notification({
        user: bargain.user,
        message: notificationMessage,
        type: 'bargain',
        link: `/bargain/${bargain._id}`
      });

      await notification.save();
    }

    res.json(updatedBargain);
  } catch (error) {
    console.error('Error updating bargain request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all orders (similar to admin route but for vendors)
// @route   GET /api/vendor/all-orders
// @access  Private/Vendor
router.get('/all-orders', protect, vendor, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price images vendorId")
      .populate("items.bargain", "proposedPrice status")
      .populate("bargainRequest", "proposedPrice status adminResponse")
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all bargain requests (similar to admin route but for vendors)
// @route   GET /api/vendor/all-bargains
// @access  Private/Vendor
router.get('/all-bargains', protect, vendor, async (req, res) => {
  try {
    const bargains = await Bargain.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate({
        path: 'product',
        select: 'name price images description category countInStock vendorId'
      });
    
    // Debug log to see bargain structure
    if (bargains.length > 0) {
      console.log('Example bargain structure:', JSON.stringify({
        _id: bargains[0]._id,
        user: bargains[0].user,
        product: bargains[0].product,
        originalPrice: bargains[0].originalPrice,
        proposedPrice: bargains[0].proposedPrice,
        status: bargains[0].status,
        createdAt: bargains[0].createdAt
      }, null, 2));
    }
    
    res.json(bargains);
  } catch (error) {
    console.error('Error fetching all bargain requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Accept a bargain request
// @route   POST /api/vendor/bargains/:id/accept
// @access  Private/Vendor
router.post('/bargains/:id/accept', protect, vendor, async (req, res) => {
  try {
    const bargainId = req.params.id;
    
    // Find the bargain
    const bargain = await Bargain.findById(bargainId);
    
    if (!bargain) {
      return res.status(404).json({ message: 'Bargain request not found' });
    }

    // Update bargain status
    bargain.status = 'accepted';
    
    // Save the updated bargain
    const updatedBargain = await bargain.save();
    
    // Create a notification for the user
    const notification = new Notification({
      user: bargain.user,
      message: `Your offer of Rs. ${bargain.proposedPrice} has been accepted!`,
      type: 'bargain',
      link: `/bargain/${bargain._id}`
    });

    await notification.save();
    
    res.status(200).json(updatedBargain);
  } catch (error) {
    console.error('Error accepting bargain request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Reject a bargain request
// @route   POST /api/vendor/bargains/:id/reject
// @access  Private/Vendor
router.post('/bargains/:id/reject', protect, vendor, async (req, res) => {
  try {
    const bargainId = req.params.id;
    
    // Find the bargain
    const bargain = await Bargain.findById(bargainId);
    
    if (!bargain) {
      return res.status(404).json({ message: 'Bargain request not found' });
    }

    // Update bargain status
    bargain.status = 'rejected';
    
    // Save the updated bargain
    const updatedBargain = await bargain.save();
    
    // Create a notification for the user
    const notification = new Notification({
      user: bargain.user,
      message: `Your offer of Rs. ${bargain.proposedPrice} has been rejected.`,
      type: 'bargain',
      link: `/bargain/${bargain._id}`
    });

    await notification.save();
    
    res.status(200).json(updatedBargain);
  } catch (error) {
    console.error('Error rejecting bargain request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Counter a bargain request
// @route   POST /api/vendor/bargains/:id/counter
// @access  Private/Vendor
router.post('/bargains/:id/counter', protect, vendor, async (req, res) => {
  try {
    const bargainId = req.params.id;
    const { counterOffer, message } = req.body;
    
    // Validate counter offer
    if (!counterOffer || isNaN(counterOffer) || Number(counterOffer) <= 0) {
      return res.status(400).json({ message: 'Valid counter offer amount required' });
    }
    
    // Find the bargain
    const bargain = await Bargain.findById(bargainId);
    
    if (!bargain) {
      return res.status(404).json({ message: 'Bargain request not found' });
    }

    // Update bargain status and counter offer
    bargain.status = 'countered';
    bargain.counterOffer = Number(counterOffer);
    
    // Add vendor response if provided
    if (message) {
      bargain.vendorResponse = message;
    }
    
    // Save the updated bargain
    const updatedBargain = await bargain.save();
    
    // Create a notification for the user
    const notification = new Notification({
      user: bargain.user,
      message: `The vendor has countered your offer with Rs. ${counterOffer}.`,
      type: 'bargain',
      link: `/bargain/${bargain._id}`
    });

    await notification.save();
    
    res.status(200).json(updatedBargain);
  } catch (error) {
    console.error('Error countering bargain request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 