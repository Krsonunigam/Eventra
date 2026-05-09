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

    

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@eventra.com' },
        { studentId: 'ADMIN001' }
      ]
    });

    if (existingAdmin) {
      
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
    
    
    
    

  } catch (error) {
    
  } finally {
    await mongoose.disconnect();
    
  }
};

createAdminUser();
