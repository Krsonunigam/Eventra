const Event = require('../models/Event');
require('dotenv').config();

const publishAllDraftEvents = async () => {
  try {
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
    
  }
};

// Run the script
publishAllDraftEvents();
