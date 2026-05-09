const mongoose = require('mongoose');
const Event = require('../models/Event');
require('dotenv').config();

const createPublishedEvent = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventra', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    

    // Create a new published event
    const newEvent = new Event({
      title: 'Sample Published Event',
      description: '<p>This is a sample published event created via script.</p>',
      price: 100,
      capacity: 50,
      availableSeats: 50,
      category: 'Technology',
      status: 'published', // ✅ IMPORTANT: Set to 'published'
      isActive: true,
      venue: {
        name: 'Sample Venue',
        address: '123 Main Street',
        city: 'Sample City',
        coordinates: {
          latitude: null,
          longitude: null
        }
      },
      dateTime: {
        start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) // 2 hours later
      },
      organizer: '68d3bfcd4bab68d458381cdf', // Admin user ID
      organizerContact: {
        email: 'adminyadav@eventra.com',
        phone: '+91 98765 43210'
      },
      registrationDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      cancellationPolicy: {
        allowCancellation: true,
        cancellationDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        refundPercentage: 100
      },
      requirements: {
        minAge: 18,
        maxAge: null,
        dressCode: 'Casual',
        itemsToBring: 'Laptop, Notebook'
      },
      tags: ['technology', 'workshop', 'learning'],
      sponsors: ['TechCorp'],
      detailedSchedule: [
        {
          time: '10:00 AM',
          activity: 'Registration',
          duration: '30 minutes'
        },
        {
          time: '10:30 AM',
          activity: 'Welcome & Introduction',
          duration: '30 minutes'
        }
      ]
    });

    await newEvent.save();
    
    
    
    

  } catch (error) {
    
  } finally {
    await mongoose.disconnect();
    
  }
};

// Run the script
createPublishedEvent();
