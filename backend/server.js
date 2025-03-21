// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/bargains', require('./routes/bargainRoutes')); 