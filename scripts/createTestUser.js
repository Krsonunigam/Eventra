const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventra', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });

    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123',
      studentId: 'STU001',
      institute: 'Test Institute',
      dateOfBirth: new Date('2000-01-01'),
      phoneNumber: '9876543210',
      isEmailVerified: false, // Test with unverified email
      isFaceVerified: false,
      role: 'user', // Use 'user' instead of 'student'
      interests: ['Technology', 'Science'], // Use valid enum values
      gender: 'Male',
      department: 'Computer Science'
    });

    await testUser.save();
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: test123');
    console.log('Role: student');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createTestUser();
