const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import User model
const { User } = require('../models');

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit with failure
  }
};

// Seed vendor user
const seedVendor = async () => {
  try {
    // Check if vendor user already exists
    const existingVendor = await User.findOne({ email: 'vendor@example.com' });
    
    if (existingVendor) {
      console.log('Vendor user already exists');
      return existingVendor;
    }
    
    // Create new vendor user
    const vendorData = {
      name: 'Test Vendor',
      email: 'vendor@example.com',
      password: 'vendor123', // will be hashed by pre-save hook
      role: 'vendor',
      contactNo: '9876543210',
      address: {
        street: '123 Vendor Street',
        city: 'Kathmandu',
        state: 'Bagmati',
        zipCode: '44600',
        country: 'Nepal'
      },
      bio: 'Test vendor account for the e-commerce platform'
    };
    
    const vendor = new User(vendorData);
    await vendor.save();
    
    console.log('Vendor user created successfully');
    console.log('Email: vendor@example.com');
    console.log('Password: vendor123');
    
    return vendor;
  } catch (error) {
    console.error('Error seeding vendor:', error);
    throw error;
  }
};

// Run seeding process
const runSeed = async () => {
  try {
    await connectDB();
    await seedVendor();
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeding process
runSeed(); 