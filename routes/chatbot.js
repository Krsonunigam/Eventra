const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  findBestMatch, 
  getRandomSuggestions, 
  getCategoryQuestions,
  getAllQuestionsByCategory,
  searchQuestions 
} = require('../utils/chatbotDatabase500');

const router = express.Router();

// Enhanced AI chatbot responses with comprehensive database
const getChatbotResponse = async (message, userInterests = [], userId = null) => {
  const lowerMessage = message.toLowerCase();
  
  // First, try to find a match in our comprehensive database
  const { match, score } = findBestMatch(message);
  
  if (match && score > 0) {
    let response = match.answer;
    let suggestions = getRandomSuggestions(match.category, 4);
    
    // If there's an API endpoint, try to fetch live data
    if (match.apiEndpoint && userId) {
      try {
        const liveData = await fetchLiveData(match.apiEndpoint, userId);
        if (liveData) {
          response += `\n\nHere's your current information:\n${liveData}`;
        }
      } catch (error) {
        
        // Continue with static response if API fails
      }
    }
    
    return {
      response,
      suggestions,
      category: match.category,
      confidence: score
    };
  }
  
  // Fallback to basic keyword matching for edge cases
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      response: "Hello! I'm Eventra's AI assistant. How can I help you today?",
      suggestions: getRandomSuggestions(null, 4),
      category: "Greeting"
    };
  }
  
  // Interest-based recommendations
  if (userInterests.length > 0) {
    const interestEvents = {
      'Technology': 'We have exciting tech talks, coding workshops, and AI conferences coming up!',
      'Sports': 'Check out our sports events, tournaments, and fitness workshops!',
      'Music': 'Don\'t miss our music concerts, open mics, and music workshops!',
      'Art': 'Explore our art exhibitions, painting workshops, and creative sessions!',
      'Business': 'Join our business networking events, startup pitches, and entrepreneurship workshops!'
    };
    
    const matchedInterests = userInterests.filter(interest => 
      Object.keys(interestEvents).includes(interest)
    );
    
    if (matchedInterests.length > 0) {
      const recommendations = matchedInterests.map(interest => interestEvents[interest]).join(' ');
      return {
        response: `Based on your interests in ${matchedInterests.join(', ')}, ${recommendations}`,
        suggestions: getRandomSuggestions('events', 4),
        category: "Recommendations"
      };
    }
  }
  
  // Default response with helpful suggestions
  return {
    response: "I understand you're looking for help. Could you please be more specific about what you need assistance with?",
    suggestions: getRandomSuggestions(null, 4),
    category: "General"
  };
};

// Function to fetch live data from API endpoints
const fetchLiveData = async (endpoint, userId) => {
  try {
    // Import required models
    const Event = require('../models/Event');
    const Booking = require('../models/Booking');
    const User = require('../models/User');
    
    // Handle different endpoints
    switch (endpoint) {
      case '/api/events/upcoming/events':
        const upcomingEvents = await Event.find({
          status: 'published',
          isActive: true,
          'dateTime.start': { $gt: new Date() }
        })
        .populate('organizer', 'name email')
        .sort({ 'dateTime.start': 1 })
        .limit(3);
        
        if (upcomingEvents.length > 0) {
          return upcomingEvents.map(event => 
            `• ${event.title} - ${new Date(event.dateTime.start).toLocaleDateString()} (₹${event.price})`
          ).join('\n');
        }
        return "No upcoming events found.";
        
      case '/api/events/current':
        const currentEvents = await Event.find({
          status: 'published',
          isActive: true,
          'dateTime.start': { $lte: new Date() },
          'dateTime.end': { $gte: new Date() }
        })
        .populate('organizer', 'name email')
        .sort({ 'dateTime.start': 1 });
        
        if (currentEvents.length > 0) {
          return currentEvents.map(event => 
            `• ${event.title} - Happening now until ${new Date(event.dateTime.end).toLocaleTimeString()}`
          ).join('\n');
        }
        return "No events are currently happening.";
        
      case '/api/bookings':
        const bookings = await Booking.find({ user: userId })
          .populate('event', 'title dateTime venue')
          .sort({ createdAt: -1 })
          .limit(3);
        
        if (bookings.length > 0) {
          return bookings.map(booking => 
            `• ${booking.event.title} - ${booking.status} (₹${booking.totalAmount})`
          ).join('\n');
        }
        return "You have no bookings yet.";
        
      case '/api/users/stats':
        const userStats = await getUserStats(userId);
        return `Total Bookings: ${userStats.totalBookings}\nConfirmed: ${userStats.confirmedBookings}\nTotal Spent: ₹${userStats.totalSpent}\nAttendance Rate: ${userStats.attendanceRate}%`;
        
      case '/api/events/:id/availability':
        // This would need an event ID, so we'll skip for now
        return null;
        
      default:
        return null;
    }
  } catch (error) {
    
    return null;
  }
};

// Helper function to get user statistics
const getUserStats = async (userId) => {
  try {
    const Booking = require('../models/Booking');
    
    const [totalBookings, confirmedBookings, totalSpent, attendedBookings] = await Promise.all([
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({ user: userId, status: 'confirmed' }),
      Booking.aggregate([
        { $match: { user: userId, status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Booking.countDocuments({ user: userId, attendanceMarked: true })
    ]);
    
    const totalSpentAmount = totalSpent.length > 0 ? totalSpent[0].total : 0;
    const attendanceRate = confirmedBookings > 0 ? Math.round((attendedBookings / confirmedBookings) * 100) : 0;
    
    return {
      totalBookings,
      confirmedBookings,
      totalSpent: totalSpentAmount,
      attendanceRate
    };
  } catch (error) {
    
    return { totalBookings: 0, confirmedBookings: 0, totalSpent: 0, attendanceRate: 0 };
  }
};

// Chat with AI assistant
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    // Get user interests for personalized responses
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    const userInterests = user.interests || [];
    
    const chatbotResponse = await getChatbotResponse(message, userInterests, req.user.userId);
    
    res.json({
      message: chatbotResponse.response,
      suggestions: chatbotResponse.suggestions,
      category: chatbotResponse.category,
      confidence: chatbotResponse.confidence,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Sorry, I encountered an error. Please try again.',
      error: error.message 
    });
  }
});

// Get quick suggestions (public endpoint)
router.get('/suggestions', async (req, res) => {
  try {
    // Get general suggestions without authentication
    const suggestions = getRandomSuggestions(null, 8);
    
    res.json({
      suggestions: suggestions.slice(0, 8) // Limit to 8 suggestions
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to get suggestions',
      error: error.message 
    });
  }
});

// Get questions by category
router.get('/questions/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const questions = getAllQuestionsByCategory(category);
    
    res.json({
      category,
      questions,
      count: questions.length
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to get questions',
      error: error.message 
    });
  }
});

// Search questions
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const results = searchQuestions(q);
    
    res.json({
      query: q,
      results,
      count: results.length
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to search questions',
      error: error.message 
    });
  }
});

// Get all categories
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = [
      { name: 'Authentication', count: 10 },
      { name: 'Events', count: 80 },
      { name: 'Booking', count: 100 },
      { name: 'Payment', count: 60 },
      { name: 'Attendance', count: 50 },
      { name: 'Profile', count: 40 },
      { name: 'Support', count: 50 },
      { name: 'Event Management', count: 30 },
      { name: 'General', count: 50 }
    ];
    
    res.json({
      categories,
      total: categories.reduce((sum, cat) => sum + cat.count, 0)
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to get categories',
      error: error.message 
    });
  }
});

// Get FAQ responses
router.get('/faq', async (req, res) => {
  try {
    // Get a sample of questions from each category for FAQ
    const faq = [];
    
    // Add sample questions from each category
    Object.values(require('../utils/chatbotDatabase').chatbotDatabase).forEach(category => {
      if (Array.isArray(category)) {
        // Take first 2 questions from each category
        const sampleQuestions = category.slice(0, 2).map(item => ({
          question: item.question,
          answer: item.answer,
          category: item.category
        }));
        faq.push(...sampleQuestions);
      }
    });
    
    res.json({ 
      faq,
      total: faq.length,
      categories: ['Authentication', 'Events', 'Booking', 'Payment', 'Attendance', 'Profile', 'Support', 'Event Management', 'General']
    });
    
  } catch (error) {
    
    res.status(500).json({ 
      message: 'Failed to get FAQ',
      error: error.message 
    });
  }
});

module.exports = router;
