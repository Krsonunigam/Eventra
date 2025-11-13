const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventra', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@eventra.com' },
        { studentId: 'ADMIN001' }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user with specific credentials
    const adminUser = new User({
      name: 'Admin - Eventra',
      email: 'adminyadav@eventra.com',
      password: 'raosahab0001',
      studentId: 'ADMIN001',
      institute: 'Eventra Administration',
      dateOfBirth: new Date('1990-01-01'),
      phoneNumber: '9999999999',
      isEmailVerified: true,
      isFaceVerified: true,
      role: 'admin',
      interests: ['Technology', 'Business'],
      gender: 'Male',
      department: 'Administration'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: adminyadav@eventra.com');
    console.log('Password: raosahab0001');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdminUser();
