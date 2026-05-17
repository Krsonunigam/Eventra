const User = require('../models/User');
require('dotenv').config();

const fixAllUsers = async () => {
  try {
    // Find all users that don't have gender set or have empty gender
    const usersToFix = await User.find({
      $or: [
        { gender: { $exists: false } },
        { gender: '' },
        { gender: null }
      ]
    });

    

    if (usersToFix.length === 0) {
      
      return;
    }

    // Update all users with default gender
    const updateResult = await User.updateMany(
      {
        $or: [
          { gender: { $exists: false } },
          { gender: '' },
          { gender: null }
        ]
      },
      {
        $set: {
          gender: 'Male', // Default gender
          department: 'General' // Also set department if missing
        }
      }
    );

    

    // Also fix any users with invalid enum values
    const usersWithInvalidEnums = await User.find({
      $or: [
        { role: { $nin: ['user', 'admin'] } },
        { interests: { $exists: true, $not: { $all: ['Technology', 'Sports', 'Music', 'Art', 'Business', 'Science', 'Literature', 'Gaming', 'Photography', 'Dance'] } } }
      ]
    });

    

    // Fix role enum issues
    await User.updateMany(
      { role: { $nin: ['user', 'admin'] } },
      { $set: { role: 'user' } }
    );

    // Fix interests enum issues
    await User.updateMany(
      { interests: { $exists: true, $not: { $all: ['Technology', 'Sports', 'Music', 'Art', 'Business', 'Science', 'Literature', 'Gaming', 'Photography', 'Dance'] } } },
      { $set: { interests: ['Technology'] } }
    );

    

    // List all users after fix
    const allUsers = await User.find({}, 'name email role gender department');
    
    allUsers.forEach(user => {
      
    });

  } catch (error) {
    
  }
};

fixAllUsers();
