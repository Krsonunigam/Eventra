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

    console.log('Connected to MongoDB');

    // Find all draft events
    const draftEvents = await Event.find({ status: 'draft' });
    console.log(`Found ${draftEvents.length} draft events`);

    if (draftEvents.length === 0) {
      console.log('✅ No draft events found');
      return;
    }

    // Update all draft events to published
    const result = await Event.updateMany(
      { status: 'draft' },
      { status: 'published' }
    );

    console.log(`✅ Updated ${result.modifiedCount} events from draft to published`);

    // Show the updated events
    const updatedEvents = await Event.find({ status: 'published' });
    console.log('\n📋 All published events:');
    updatedEvents.forEach(event => {
      console.log(`- ${event.title} (ID: ${event._id})`);
    });

  } catch (error) {
    console.error('❌ Error updating events:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
publishAllDraftEvents();
