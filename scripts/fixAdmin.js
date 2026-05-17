const User = require('../models/User');
require('dotenv').config();

const fixAdminUser = async () => {
  try {
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
    
  }
};

fixAdminUser();
