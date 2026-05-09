const mongoose = require('mongoose');
const Event = require('../models/Event');
require('dotenv').config();

const publishAllDraftEvents = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventra', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    

    // Find all draft events
    const draftEvents = await Event.find({ status: 'draft' });
    

    if (draftEvents.length === 0) {
      
      return;
    }

    // Update all draft events to published
    const result = await Event.updateMany(
      { status: 'draft' },
      { status: 'published' }
    );

    

    // Show the updated events
    const updatedEvents = await Event.find({ status: 'published' });
    
    updatedEvents.forEach(event => {
      
    });

  } catch (error) {
    
  } finally {
    await mongoose.disconnect();
    
  }
};

// Run the script
publishAllDraftEvents();
