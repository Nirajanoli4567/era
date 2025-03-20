const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { User } = require('../models');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Vendor data to seed
const vendorData = [
  {
    name: 'Vendor User',
    email: 'vendor@example.com',
    password: 'vendor123',
    role: 'vendor',
    contactNo: '9801234567',
    address: {
      street: 'Vendor Street',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
    },
    bio: 'Experienced vendor with quality products',
  },
  {
    name: 'Another Vendor',
    email: 'vendor2@example.com',
    password: 'vendor123',
    role: 'vendor',
    contactNo: '9807654321',
    address: {
      street: 'Commerce Road',
      city: 'Pokhara',
      state: 'Gandaki',
      zipCode: '33700',
      country: 'Nepal',
    },
    bio: 'Specializing in handmade products',
  }
];

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

// Seed vendors
const seedVendors = async () => {
  try {
    await connectDB();
    
    // Clear existing vendors (optional)
    await User.deleteMany({ role: 'vendor' });
    console.log('Deleted existing vendors');
    
    // Insert new vendors
    const createdVendors = await User.insertMany(vendorData);
    console.log(`${createdVendors.length} vendors created:`);
    createdVendors.forEach(vendor => {
      console.log(`- ${vendor.name} (${vendor.email})`);
    });
    
    console.log('Vendor seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding vendors:', error);
    process.exit(1);
  }
};

// Run the seed function
seedVendors(); 