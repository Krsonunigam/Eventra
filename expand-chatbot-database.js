// Script to expand chatbot database to 500 questions
const fs = require('fs');
const path = require('path');

// Read current database
const currentDb = require('./utils/chatbotDatabase.js');

// Additional questions for each category to reach 500 total
const additionalQuestions = {
  authentication: [
    {
      keywords: ['two factor authentication', '2fa', 'two step verification', 'security code'],
      question: "How do I enable two-factor authentication?",
      answer: "Go to Profile Settings > Security > Two-Factor Authentication. Follow the setup process to add an extra layer of security to your account.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['account locked', 'locked out', 'suspended account', 'account suspension'],
      question: "Why is my account locked?",
      answer: "Your account may be locked due to multiple failed login attempts, suspicious activity, or policy violations. Contact support to resolve the issue.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['login attempts', 'failed login', 'too many attempts', 'login blocked'],
      question: "What if I have too many failed login attempts?",
      answer: "After multiple failed attempts, your account is temporarily locked for security. Wait 15 minutes or contact support to unlock your account.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['remember me', 'stay logged in', 'auto login', 'persistent login'],
      question: "How do I stay logged in?",
      answer: "Check the 'Remember Me' option when logging in. This keeps you logged in for 30 days on trusted devices.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['logout', 'sign out', 'log out', 'end session'],
      question: "How do I log out?",
      answer: "Click on your profile picture in the top right corner and select 'Logout' from the dropdown menu.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['session timeout', 'auto logout', 'session expired', 'logged out automatically'],
      question: "Why was I automatically logged out?",
      answer: "For security, sessions expire after 24 hours of inactivity. Simply log in again to continue using the platform.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['account recovery', 'recover account', 'lost account', 'account access'],
      question: "How do I recover my account?",
      answer: "Use the 'Forgot Password' feature or contact support with your registered email address. We'll help you regain access to your account.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['email change', 'change email', 'update email', 'new email'],
      question: "How do I change my email address?",
      answer: "Go to Profile Settings > Personal Information > Email. Enter your new email and verify it with the confirmation link sent to your new address.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['username', 'display name', 'public name', 'profile name'],
      question: "How do I change my username?",
      answer: "Go to Profile Settings > Personal Information. Update your display name which will be visible to other users and event organizers.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['account verification', 'verify account', 'account status', 'verification status'],
      question: "How do I verify my account?",
      answer: "Complete email verification and face recognition setup. Your account status will show as 'Verified' once all steps are completed.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['login history', 'access history', 'login records', 'account activity'],
      question: "How do I see my login history?",
      answer: "Go to Profile Settings > Security > Login History to view recent login attempts and device information.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['device management', 'trusted devices', 'device list', 'remove device'],
      question: "How do I manage my devices?",
      answer: "Go to Profile Settings > Security > Device Management to view and remove trusted devices from your account.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['account settings', 'user settings', 'preferences', 'configuration'],
      question: "Where are my account settings?",
      answer: "Click on your profile picture and select 'Settings' to access all account preferences, privacy settings, and security options.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['privacy settings', 'data privacy', 'privacy controls', 'information sharing'],
      question: "How do I control my privacy settings?",
      answer: "Go to Profile Settings > Privacy to control what information is visible to other users and how your data is used.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['account deletion', 'permanent deletion', 'delete data', 'remove all data'],
      question: "How do I permanently delete my account?",
      answer: "Contact support to request permanent account deletion. This action is irreversible and will remove all your data from our systems.",
      apiEndpoint: null,
      category: "Authentication"
    }
  ],

  events: [
    {
      keywords: ['event filters', 'filter events', 'search filters', 'advanced search'],
      question: "How do I filter events?",
      answer: "Use the filter options on the Events page to search by category, date, price range, location, or keywords. Advanced filters are available for detailed searches.",
      apiEndpoint: "/api/events/search/query",
      category: "Events"
    },
    {
      keywords: ['event notifications', 'event alerts', 'event updates', 'notify me'],
      question: "How do I get notified about new events?",
      answer: "Enable event notifications in your profile settings. You'll receive email alerts for new events in your preferred categories.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event calendar', 'calendar view', 'monthly view', 'schedule view'],
      question: "Is there a calendar view for events?",
      answer: "Yes! Use the calendar view on the Events page to see events organized by date. You can switch between list and calendar views.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event recommendations', 'suggested events', 'recommended for you', 'personalized events'],
      question: "How do I get personalized event recommendations?",
      answer: "Set your interests in your profile settings. Our system will recommend events based on your preferences and booking history.",
      apiEndpoint: "/api/chatbot/analytics/user/recommendations",
      category: "Events"
    },
    {
      keywords: ['event reviews', 'event ratings', 'feedback', 'event comments'],
      question: "Can I review events?",
      answer: "Yes! After attending an event, you can rate and review it. Your feedback helps other users and improves our event recommendations.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event sharing', 'share event', 'social sharing', 'invite friends'],
      question: "How do I share events with friends?",
      answer: "Use the share button on any event page to share via social media, email, or direct link. You can also invite friends to specific events.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event favorites', 'favorite events', 'save events', 'bookmark events'],
      question: "How do I save events for later?",
      answer: "Click the heart icon on any event to add it to your favorites. Access your saved events from your profile page.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event waitlist', 'waiting list', 'join waitlist', 'notify when available'],
      question: "What if an event is sold out?",
      answer: "Join the waitlist for sold-out events. You'll be notified if seats become available due to cancellations.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event updates', 'event changes', 'event modifications', 'schedule changes'],
      question: "How do I know if an event is updated?",
      answer: "You'll receive email notifications for any changes to events you've booked. Check your email and the event page for updates.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event cancellation', 'cancelled event', 'event cancelled', 'refund for cancellation'],
      question: "What happens if an event is cancelled?",
      answer: "You'll receive a full refund if an event is cancelled by the organizer. Check your email for cancellation details and refund information.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event location', 'venue details', 'directions', 'how to reach'],
      question: "How do I find the event location?",
      answer: "Event location details are shown on the event page, including address, directions, and parking information. Use the map feature for navigation.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event parking', 'parking information', 'parking available', 'parking fees'],
      question: "Is parking available at events?",
      answer: "Parking information is provided on each event page. Some venues offer free parking, while others may charge a fee.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event accessibility', 'wheelchair access', 'disabled access', 'accessibility features'],
      question: "Are events accessible for people with disabilities?",
      answer: "Most venues are wheelchair accessible. Check the event details for specific accessibility information or contact the organizer.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event age restrictions', 'age limit', 'minimum age', 'adult only events'],
      question: "Are there age restrictions for events?",
      answer: "Age restrictions vary by event. Check the event details for specific age requirements. Some events may be 18+ or have other restrictions.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event dress code', 'dress requirements', 'attire', 'what to wear'],
      question: "Is there a dress code for events?",
      answer: "Dress codes vary by event type. Check the event details for specific requirements. Most events are casual unless otherwise specified.",
      apiEndpoint: null,
      category: "Events"
    }
  ],

  booking: [
    {
      keywords: ['booking confirmation', 'booking receipt', 'ticket confirmation', 'booking proof'],
      question: "How do I get my booking confirmation?",
      answer: "Your booking confirmation is sent to your email immediately after booking. You can also download it from your Bookings page.",
      apiEndpoint: "/api/bookings/:id/pass",
      category: "Booking"
    },
    {
      keywords: ['booking modification', 'change booking', 'modify booking', 'update booking'],
      question: "Can I modify my booking?",
      answer: "Most bookings cannot be modified after confirmation. You may need to cancel and rebook. Contact support for specific requests.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking transfer', 'transfer ticket', 'give ticket to friend', 'change attendee'],
      question: "Can I transfer my booking to someone else?",
      answer: "Yes, you can transfer your booking to another person. Contact support with the new attendee's details to process the transfer.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['group booking', 'bulk booking', 'multiple tickets', 'corporate booking'],
      question: "How do I make a group booking?",
      answer: "Select the number of tickets you need during booking. For large groups (10+ people), contact support for special rates and arrangements.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking deadline', 'last booking date', 'registration deadline', 'booking cutoff'],
      question: "What is the last date to book an event?",
      answer: "Each event has its own booking deadline, shown on the event page. Book early as popular events may close before the deadline.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking waitlist', 'join waitlist', 'waiting list', 'notify when available'],
      question: "How do I join a waitlist?",
      answer: "If an event is sold out, you can join the waitlist. You'll be notified if seats become available due to cancellations.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking reference', 'booking number', 'confirmation number', 'ticket number'],
      question: "What is my booking reference?",
      answer: "Your booking reference number is shown in your confirmation email and on your Bookings page. Use this for any booking-related inquiries.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking status', 'ticket status', 'booking confirmation status', 'payment status'],
      question: "How do I check my booking status?",
      answer: "Go to your Bookings page to see all your bookings and their current status (confirmed, pending, cancelled).",
      apiEndpoint: "/api/bookings",
      category: "Booking"
    },
    {
      keywords: ['booking reminder', 'event reminder', 'booking notification', 'remind me'],
      question: "How do I set booking reminders?",
      answer: "Enable notifications in your profile settings to receive booking reminders and event updates via email and push notifications.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking history', 'past bookings', 'booking records', 'attendance history'],
      question: "How do I see my booking history?",
      answer: "Go to your Bookings page to view all your past and current bookings, including event details and attendance status.",
      apiEndpoint: "/api/bookings",
      category: "Booking"
    },
    {
      keywords: ['booking analytics', 'booking statistics', 'attendance rate', 'participation stats'],
      question: "How do I see my booking statistics?",
      answer: "Your dashboard shows booking statistics including total bookings, attendance rate, and spending patterns.",
      apiEndpoint: "/api/users/stats",
      category: "Booking"
    },
    {
      keywords: ['booking preferences', 'booking settings', 'default booking options', 'booking defaults'],
      question: "How do I set booking preferences?",
      answer: "Go to Profile Settings > Booking Preferences to set default options like seat preferences, notification settings, and payment methods.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking support', 'booking help', 'booking assistance', 'booking issues'],
      question: "How do I get help with booking?",
      answer: "Contact our support team through the chatbot, email, or phone. We're available 24/7 to help with any booking-related questions.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking terms', 'booking conditions', 'booking policy', 'terms and conditions'],
      question: "What are the booking terms and conditions?",
      answer: "Booking terms vary by event. Check the event details for specific terms, cancellation policies, and refund conditions.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking verification', 'verify booking', 'booking validation', 'ticket verification'],
      question: "How do I verify my booking?",
      answer: "Your booking is verified through email confirmation and the booking reference number. You can also verify it on your Bookings page.",
      apiEndpoint: null,
      category: "Booking"
    }
  ]
};

// Function to expand the database
function expandDatabase() {
  const expandedDb = { ...currentDb.chatbotDatabase };
  
  // Add additional questions to each category
  Object.keys(additionalQuestions).forEach(category => {
    if (expandedDb[category]) {
      expandedDb[category] = [...expandedDb[category], ...additionalQuestions[category]];
    }
  });
  
  // Add more questions to reach 500 total
  const currentTotal = Object.values(expandedDb).reduce((sum, cat) => sum + cat.length, 0);
  console.log(`Current total: ${currentTotal} questions`);
  
  // Add more questions to reach 500
  const remaining = 500 - currentTotal;
  console.log(`Need to add ${remaining} more questions`);
  
  return expandedDb;
}

// Run the expansion
const expandedDatabase = expandDatabase();
const totalQuestions = Object.values(expandedDatabase).reduce((sum, cat) => sum + cat.length, 0);

console.log('Expanded database statistics:');
Object.entries(expandedDatabase).forEach(([category, questions]) => {
  console.log(`${category}: ${questions.length} questions`);
});
console.log(`Total: ${totalQuestions} questions`);

// Export the expanded database
module.exports = {
  chatbotDatabase: expandedDatabase,
  findBestMatch: currentDb.findBestMatch,
  getRandomSuggestions: currentDb.getRandomSuggestions,
  getCategoryQuestions: currentDb.getCategoryQuestions,
  getAllQuestionsByCategory: currentDb.getAllQuestionsByCategory,
  searchQuestions: currentDb.searchQuestions
};
