const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const fixAllUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventra', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all users that don't have gender set or have empty gender
    const usersToFix = await User.find({
      $or: [
        { gender: { $exists: false } },
        { gender: '' },
        { gender: null }
      ]
    });

    console.log(`Found ${usersToFix.length} users that need gender field`);

    if (usersToFix.length === 0) {
      console.log('No users need fixing');
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

    console.log(`Updated ${updateResult.modifiedCount} users with gender and department`);

    // Also fix any users with invalid enum values
    const usersWithInvalidEnums = await User.find({
      $or: [
        { role: { $nin: ['user', 'admin'] } },
        { interests: { $exists: true, $not: { $all: ['Technology', 'Sports', 'Music', 'Art', 'Business', 'Science', 'Literature', 'Gaming', 'Photography', 'Dance'] } } }
      ]
    });

    console.log(`Found ${usersWithInvalidEnums.length} users with invalid enum values`);

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

    console.log('Fixed all enum validation issues');

    // List all users after fix
    const allUsers = await User.find({}, 'name email role gender department');
    console.log('\nAll users in database:');
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}, Gender: ${user.gender}, Department: ${user.department}`);
    });

  } catch (error) {
    console.error('Error fixing users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

fixAllUsers();
