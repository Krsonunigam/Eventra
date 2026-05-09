const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const fixAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventra', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    

    // Find and update the existing admin user
    const adminUser = await User.findOne({ email: 'adminyadav@eventra.com' });
    
    if (adminUser) {
      // Update the admin user with required fields
      adminUser.gender = 'Male';
      adminUser.department = 'Administration';
      await adminUser.save();
      
    } else {
      
    }

  } catch (error) {
    
  } finally {
    await mongoose.disconnect();
    
  }
};

fixAdminUser();
