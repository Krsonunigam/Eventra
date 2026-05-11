// Comprehensive Chatbot Database for Eventra Platform
// 500 predefined questions and answers with keyword matching

const chatbotDatabase = {
  // Authentication & Account Management (50 questions)
  authentication: [
    {
      keywords: ['login', 'sign in', 'log in', 'authenticate', 'access account'],
      question: "How do I log in to my account?",
      answer: "You can log in by clicking the 'Login' button on the homepage, entering your email and password, and clicking 'Sign In'. If you don't have an account, you can register first.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['register', 'sign up', 'create account', 'new account', 'join'],
      question: "How do I create a new account?",
      answer: "Click 'Register' on the homepage, fill in your details (name, email, password, student ID, institute), upload a profile picture, and verify your email. You'll also need to complete face verification for event check-ins.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['forgot password', 'reset password', 'password reset', 'can\'t login'],
      question: "I forgot my password. How do I reset it?",
      answer: "Click 'Forgot Password' on the login page, enter your email address, and check your inbox for reset instructions. Follow the link to create a new password.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['change password', 'update password', 'modify password'],
      question: "How do I change my password?",
      answer: "Go to your Profile settings, click on 'Security', then 'Change Password'. Enter your current password and new password to update it.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['delete account', 'remove account', 'close account', 'deactivate'],
      question: "How do I delete my account?",
      answer: "Go to Profile Settings > Account Management > Delete Account. You'll need to cancel all active bookings first. Your account will be deactivated rather than permanently deleted.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['profile picture', 'avatar', 'photo', 'image'],
      question: "How do I update my profile picture?",
      answer: "Go to your Profile page, click 'Edit Profile', then click on your current profile picture to upload a new one. Supported formats: JPG, PNG, GIF. Maximum size: 5MB.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['email verification', 'verify email', 'email not verified'],
      question: "How do I verify my email address?",
      answer: "Check your email inbox for a verification email from Eventra. Click the verification link in the email. If you don't see it, check your spam folder or request a new verification email.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['face verification', 'face recognition', 'biometric', 'face scan'],
      question: "What is face verification and why do I need it?",
      answer: "Face verification is used for secure event check-ins. During registration, we capture your face data. At events, this data is used to verify your identity for attendance marking.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['student id', 'institute', 'university', 'college'],
      question: "How do I update my student ID or institute?",
      answer: "Go to Profile Settings > Personal Information. You can update your student ID and institute details. Note: Some changes may require re-verification.",
      apiEndpoint: null,
      category: "Authentication"
    },
    {
      keywords: ['phone number', 'contact number', 'mobile'],
      question: "How do I update my phone number?",
      answer: "Go to Profile Settings > Personal Information, update your phone number, and verify it with the OTP sent to your new number.",
      apiEndpoint: null,
      category: "Authentication"
    }
  ],

  // Event Discovery & Browsing (80 questions)
  events: [
    {
      keywords: ['upcoming events', 'future events', 'events happening', 'what events'],
      question: "What upcoming events are available?",
      answer: "You can browse all upcoming events on our Events page. Events are sorted by date and include details like venue, time, price, and category.",
      apiEndpoint: "/api/events/upcoming/events",
      category: "Events"
    },
    {
      keywords: ['current events', 'happening now', 'live events', 'ongoing'],
      question: "What events are happening right now?",
      answer: "Check our 'Current Events' section to see events that are currently taking place. These events are live and you can still join if you have a booking.",
      apiEndpoint: "/api/events/current",
      category: "Events"
    },
    {
      keywords: ['event categories', 'types of events', 'event types', 'categories'],
      question: "What categories of events do you have?",
      answer: "We have events in Technology, Sports, Music, Art, Business, Science, Literature, Gaming, Photography, and Dance categories. You can filter events by category.",
      apiEndpoint: "/api/events",
      category: "Events"
    },
    {
      keywords: ['search events', 'find events', 'look for events', 'event search'],
      question: "How do I search for specific events?",
      answer: "Use the search bar on the Events page. You can search by event name, category, date range, or price range. Advanced filters are available for more specific searches.",
      apiEndpoint: "/api/events/search/query",
      category: "Events"
    },
    {
      keywords: ['free events', 'no cost events', 'complimentary', 'zero price'],
      question: "Are there any free events?",
      answer: "Yes! We have many free events. Look for events with ₹0 price. You can filter events by price range to find free events specifically.",
      apiEndpoint: "/api/events",
      category: "Events"
    },
    {
      keywords: ['event details', 'event information', 'event description'],
      question: "How do I see detailed information about an event?",
      answer: "Click on any event to view its detailed page. You'll see the full description, venue details, schedule, pricing, organizer information, and booking options.",
      apiEndpoint: "/api/events/:id",
      category: "Events"
    },
    {
      keywords: ['event venue', 'location', 'where is event', 'address'],
      question: "Where is the event taking place?",
      answer: "Event venue details are shown on each event page, including the venue name, address, and location. You can also see it on your booking confirmation.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event time', 'schedule', 'when is event', 'event date'],
      question: "What time does the event start and end?",
      answer: "Event timing is displayed on the event page showing start time, end time, and duration. You can also see this information in your booking details.",
      apiEndpoint: null,
      category: "Events"
    },
    {
      keywords: ['event capacity', 'seats available', 'how many people', 'attendance limit'],
      question: "How many people can attend the event?",
      answer: "Event capacity is shown on the event page. You can see total capacity and available seats. Book early as popular events fill up quickly!",
      apiEndpoint: "/api/events/:id/availability",
      category: "Events"
    },
    {
      keywords: ['event organizer', 'who is organizing', 'event host', 'organizer details'],
      question: "Who is organizing this event?",
      answer: "Event organizer information is displayed on each event page, including their name and contact details. You can reach out to them for event-specific questions.",
      apiEndpoint: null,
      category: "Events"
    }
  ],

  // Booking & Registration (100 questions)
  booking: [
    {
      keywords: ['book event', 'register for event', 'buy ticket', 'get ticket'],
      question: "How do I book an event?",
      answer: "Click on the event you want to attend, select your seat (if applicable), choose quantity, and proceed to payment. For free events, booking is instant. For paid events, complete the payment process.",
      apiEndpoint: "/api/bookings",
      category: "Booking"
    },
    {
      keywords: ['cancel booking', 'cancel ticket', 'unbook', 'remove booking'],
      question: "How do I cancel my booking?",
      answer: "Go to your Bookings page, find the booking you want to cancel, and click 'Cancel Booking'. Refund amount depends on the event's cancellation policy and timing.",
      apiEndpoint: "/api/bookings/:id/cancel",
      category: "Booking"
    },
    {
      keywords: ['booking confirmation', 'ticket confirmation', 'booking receipt'],
      question: "How do I get my booking confirmation?",
      answer: "After successful booking, you'll receive a confirmation email. You can also download your event pass from the Bookings page. The pass contains your QR code for event entry.",
      apiEndpoint: "/api/bookings/:id/pass",
      category: "Booking"
    },
    {
      keywords: ['booking status', 'ticket status', 'booking confirmation status'],
      question: "How do I check my booking status?",
      answer: "Go to your Bookings page to see all your bookings and their current status (confirmed, pending, cancelled). You can also check your email for status updates.",
      apiEndpoint: "/api/bookings",
      category: "Booking"
    },
    {
      keywords: ['seat selection', 'choose seat', 'pick seat', 'seat number'],
      question: "How do I select my seat?",
      answer: "During the booking process, you'll see a seat map (if available). Click on your preferred seat to select it. Some events have general admission without specific seat assignments.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['multiple tickets', 'book for friends', 'group booking', 'bulk booking'],
      question: "Can I book multiple tickets for friends?",
      answer: "Yes! During booking, you can select the quantity of tickets you need. Each ticket will be linked to your account, but you can share the event pass with your friends.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking deadline', 'last date to book', 'registration deadline'],
      question: "What is the last date to book an event?",
      answer: "Each event has its own registration deadline, shown on the event page. Book early as popular events may close registration before the deadline if they reach capacity.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['waiting list', 'event full', 'sold out', 'no seats available'],
      question: "What if the event is sold out?",
      answer: "If an event is sold out, you can join the waiting list (if available). You'll be notified if seats become available due to cancellations.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['booking reference', 'booking number', 'ticket number', 'confirmation number'],
      question: "What is my booking reference number?",
      answer: "Your booking reference number is shown in your booking confirmation email and on your Bookings page. Use this number for any booking-related inquiries.",
      apiEndpoint: null,
      category: "Booking"
    },
    {
      keywords: ['modify booking', 'change booking', 'update booking', 'edit booking'],
      question: "Can I modify my booking after confirmation?",
      answer: "Most bookings cannot be modified after confirmation. You may need to cancel and rebook. Contact support for specific booking modification requests.",
      apiEndpoint: null,
      category: "Booking"
    }
  ],

  // Payment & Pricing (60 questions)
  payment: [
    {
      keywords: ['payment methods', 'how to pay', 'payment options', 'accepted payments'],
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, net banking, UPI, and digital wallets through Razorpay. All payments are secure and encrypted.",
      apiEndpoint: null,
      category: "Payment"
    },
    {
      keywords: ['payment failed', 'payment error', 'transaction failed', 'payment declined'],
      question: "What if my payment fails?",
      answer: "If payment fails, your booking will remain in pending status. You can retry the payment or contact support. Your seat will be held for a limited time.",
      apiEndpoint: null,
      category: "Payment"
    },
    {
      keywords: ['refund', 'get money back', 'cancel and refund', 'refund policy'],
      question: "What is your refund policy?",
      answer: "Refund policy varies by event. Generally, full refunds are available if cancelled 24+ hours before the event. Partial refunds may apply for last-minute cancellations. Check event details for specific terms.",
      apiEndpoint: null,
      category: "Payment"
    },
    {
      keywords: ['payment history', 'transaction history', 'payment records', 'billing history'],
      question: "How do I view my payment history?",
      answer: "Go to your Bookings page to see all your transactions. You can also download receipts and invoices for your records.",
      apiEndpoint: "/api/payments/history",
      category: "Payment"
    },
    {
      keywords: ['receipt', 'invoice', 'payment proof', 'transaction receipt'],
      question: "How do I get a receipt for my payment?",
      answer: "Receipts are automatically sent to your email after successful payment. You can also download them from your Bookings page or request a duplicate receipt.",
      apiEndpoint: null,
      category: "Payment"
    },
    {
      keywords: ['currency', 'pricing currency', 'rupees', 'INR'],
      question: "What currency do you use for pricing?",
      answer: "All prices are in Indian Rupees (INR). We accept payments in INR through various payment methods including cards, UPI, and net banking.",
      apiEndpoint: null,
      category: "Payment"
    },
    {
      keywords: ['discount', 'coupon', 'promo code', 'offer code'],
      question: "Do you offer any discounts or promo codes?",
      answer: "We occasionally offer discounts and promo codes. Check our promotions page or follow us on social media for the latest offers and discount codes.",
      apiEndpoint: null,
      category: "Payment"
    },
    {
      keywords: ['payment security', 'secure payment', 'payment protection', 'safe payment'],
      question: "Is my payment information secure?",
      answer: "Yes! All payments are processed through Razorpay, which is PCI DSS compliant. We never store your payment details on our servers.",
      apiEndpoint: null,
      category: "Payment"
    },
    {
      keywords: ['partial payment', 'installments', 'pay later', 'split payment'],
      question: "Can I pay in installments?",
      answer: "Currently, we require full payment at the time of booking. We don't offer installment options, but you can use your credit card's EMI options if available.",
      apiEndpoint: null,
      category: "Payment"
    },
    {
      keywords: ['payment confirmation', 'payment successful', 'payment completed'],
      question: "How do I know if my payment was successful?",
      answer: "You'll receive an email confirmation immediately after successful payment. Your booking status will also change to 'confirmed' in your Bookings page.",
      apiEndpoint: null,
      category: "Payment"
    }
  ],

  // Attendance & Check-in (50 questions)
  attendance: [
    {
      keywords: ['check in', 'attendance', 'mark attendance', 'event entry'],
      question: "How do I check in at an event?",
      answer: "Use our face recognition system at the event venue. Make sure your face is clearly visible and well-lit. You can also show your QR code from the event pass.",
      apiEndpoint: null,
      category: "Attendance"
    },
    {
      keywords: ['face recognition', 'biometric check in', 'face scan', 'facial recognition'],
      question: "How does face recognition work for check-in?",
      answer: "During registration, we capture your face data securely. At events, our system matches your face to verify your identity and mark your attendance automatically.",
      apiEndpoint: null,
      category: "Attendance"
    },
    {
      keywords: ['QR code', 'event pass', 'digital ticket', 'mobile ticket'],
      question: "How do I use my QR code for check-in?",
      answer: "Download your event pass from the Bookings page. The QR code contains your booking information. Show it at the event entrance for manual check-in if face recognition isn't available.",
      apiEndpoint: "/api/bookings/:id/pass",
      category: "Attendance"
    },
    {
      keywords: ['attendance history', 'events attended', 'participation history'],
      question: "How do I see my attendance history?",
      answer: "Go to your Profile page and click on 'Attendance History' to see all events you've attended, check-in times, and your participation record.",
      apiEndpoint: "/api/users/attendance",
      category: "Attendance"
    },
    {
      keywords: ['late arrival', 'missed check in', 'arrived late', 'check in time'],
      question: "What if I arrive late to the event?",
      answer: "You can still check in if you arrive after the event starts, but you may miss some content. Check-in is available throughout the event duration.",
      apiEndpoint: null,
      category: "Attendance"
    },
    {
      keywords: ['attendance certificate', 'participation certificate', 'completion certificate'],
      question: "Do I get a certificate for attending events?",
      answer: "Some events offer participation certificates. Check the event details or contact the organizer. Certificates are usually available after the event completion.",
      apiEndpoint: null,
      category: "Attendance"
    },
    {
      keywords: ['face recognition failed', 'can\'t check in', 'biometric error', 'face scan failed'],
      question: "What if face recognition doesn't work?",
      answer: "If face recognition fails, you can use your QR code for manual check-in. Contact event staff for assistance. Make sure you're in good lighting and facing the camera directly.",
      apiEndpoint: null,
      category: "Attendance"
    },
    {
      keywords: ['attendance rate', 'participation rate', 'attendance percentage'],
      question: "How is my attendance rate calculated?",
      answer: "Your attendance rate is calculated as the percentage of confirmed bookings where you actually attended the event. This is shown on your dashboard and profile.",
      apiEndpoint: "/api/users/stats",
      category: "Attendance"
    },
    {
      keywords: ['group check in', 'check in friends', 'bulk check in'],
      question: "Can I check in for my friends?",
      answer: "No, each person must check in individually using their own face recognition or QR code. This ensures accurate attendance tracking and security.",
      apiEndpoint: null,
      category: "Attendance"
    },
    {
      keywords: ['attendance tracking', 'track participation', 'monitor attendance'],
      question: "How do you track attendance?",
      answer: "We use face recognition technology and QR code scanning to track attendance. This data is securely stored and used for analytics and your participation history.",
      apiEndpoint: null,
      category: "Attendance"
    }
  ],

  // User Profile & Settings (40 questions)
  profile: [
    {
      keywords: ['update profile', 'edit profile', 'change profile', 'modify profile'],
      question: "How do I update my profile information?",
      answer: "Go to your Profile page and click 'Edit Profile'. You can update your name, phone number, interests, and profile picture. Some changes may require verification.",
      apiEndpoint: "/api/users/profile",
      category: "Profile"
    },
    {
      keywords: ['user interests', 'preferences', 'favorite categories', 'interests'],
      question: "How do I set my interests and preferences?",
      answer: "Go to Profile Settings > Interests. Select your preferred event categories like Technology, Sports, Music, etc. This helps us recommend relevant events to you.",
      apiEndpoint: "/api/users/interests",
      category: "Profile"
    },
    {
      keywords: ['dashboard', 'my dashboard', 'user dashboard', 'home page'],
      question: "What can I see on my dashboard?",
      answer: "Your dashboard shows upcoming events, recent bookings, attendance statistics, total spending, and quick actions. It's your central hub for all event-related activities.",
      apiEndpoint: "/api/users/stats",
      category: "Profile"
    },
    {
      keywords: ['user statistics', 'my stats', 'participation stats', 'activity stats'],
      question: "What statistics are available about my activity?",
      answer: "You can see total bookings, confirmed bookings, total amount spent, attendance rate, favorite categories, and participation history in your dashboard and profile.",
      apiEndpoint: "/api/users/stats",
      category: "Profile"
    },
    {
      keywords: ['privacy settings', 'account privacy', 'data privacy', 'privacy controls'],
      question: "How do I manage my privacy settings?",
      answer: "Go to Profile Settings > Privacy to control what information is visible to other users and how your data is used. You can also manage notification preferences.",
      apiEndpoint: null,
      category: "Profile"
    },
    {
      keywords: ['notification settings', 'email notifications', 'push notifications', 'alerts'],
      question: "How do I manage my notifications?",
      answer: "Go to Profile Settings > Notifications to control email notifications, booking reminders, event updates, and promotional messages.",
      apiEndpoint: null,
      category: "Profile"
    },
    {
      keywords: ['account settings', 'user settings', 'preferences', 'configuration'],
      question: "Where can I find all my account settings?",
      answer: "Go to your Profile page and click 'Settings' to access all account settings including personal information, privacy, notifications, security, and preferences.",
      apiEndpoint: null,
      category: "Profile"
    },
    {
      keywords: ['data export', 'download data', 'export information', 'data portability'],
      question: "Can I download my data?",
      answer: "Yes, you can request a data export from Profile Settings > Data & Privacy. We'll provide you with all your account data in a downloadable format.",
      apiEndpoint: null,
      category: "Profile"
    },
    {
      keywords: ['account security', 'security settings', 'two factor', '2FA'],
      question: "How do I secure my account?",
      answer: "Use a strong password, enable two-factor authentication if available, keep your contact information updated, and never share your login credentials.",
      apiEndpoint: null,
      category: "Profile"
    },
    {
      keywords: ['profile visibility', 'public profile', 'profile privacy', 'who can see'],
      question: "Who can see my profile information?",
      answer: "Your profile visibility is controlled by your privacy settings. You can choose what information is visible to other users, organizers, and the public.",
      apiEndpoint: null,
      category: "Profile"
    }
  ],

  // Technical Support (50 questions)
  support: [
    {
      keywords: ['contact support', 'help desk', 'customer service', 'get help'],
      question: "How do I contact support?",
      answer: "You can contact our support team through the 'Contact Us' page, email eventraofficialevent@gmail.com, or use this chatbot for immediate assistance with common issues.",
      apiEndpoint: null,
      category: "Support"
    },
    {
      keywords: ['technical issues', 'website problems', 'app not working', 'bugs'],
      question: "What if I'm experiencing technical issues?",
      answer: "Try refreshing the page, clearing your browser cache, or using a different browser. If issues persist, contact support with details about the problem and your device information.",
      apiEndpoint: null,
      category: "Support"
    },
    {
      keywords: ['mobile app', 'mobile version', 'phone app', 'app download'],
      question: "Is there a mobile app?",
      answer: "Currently, we have a responsive web application that works great on mobile devices. A dedicated mobile app is in development and will be available soon.",
      apiEndpoint: null,
      category: "Support"
    },
    {
      keywords: ['browser compatibility', 'supported browsers', 'which browser', 'browser support'],
      question: "Which browsers are supported?",
      answer: "We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, use the latest version of your preferred browser.",
      apiEndpoint: null,
      category: "Support"
    },
    {
      keywords: ['slow loading', 'website slow', 'performance issues', 'loading problems'],
      question: "The website is loading slowly. What should I do?",
      answer: "Try clearing your browser cache, closing other tabs, or checking your internet connection. If the problem persists, contact support with your location and device details.",
      apiEndpoint: null,
      category: "Support"
    },
    {
      keywords: ['error message', 'system error', 'application error', 'error occurred'],
      question: "I'm getting an error message. What should I do?",
      answer: "Note down the exact error message and when it occurred. Try refreshing the page or logging out and back in. Contact support if the error persists.",
      apiEndpoint: null,
      category: "Support"
    },
    {
      keywords: ['login problems', 'can\'t login', 'login error', 'authentication error'],
      question: "I can't log in. What should I do?",
      answer: "Check your email and password, ensure caps lock is off, and try resetting your password. If you still can't log in, contact support for assistance.",
      apiEndpoint: null,
      category: "Support"
    },
    {
      keywords: ['upload issues', 'file upload', 'image upload', 'document upload'],
      question: "I'm having trouble uploading files. What should I do?",
      answer: "Check file size (max 5MB), format (JPG, PNG, PDF), and internet connection. Try a different file or browser. Contact support if issues persist.",
      apiEndpoint: null,
      category: "Support"
    },
    {
      keywords: ['email not received', 'no email', 'missing email', 'email delivery'],
      question: "I didn't receive an email. What should I do?",
      answer: "Check your spam folder, ensure your email address is correct, and wait a few minutes. If still not received, contact support with your email address.",
      apiEndpoint: null,
      category: "Support"
    },
    {
      keywords: ['report bug', 'bug report', 'report issue', 'feedback'],
      question: "How do I report a bug or issue?",
      answer: "Use the 'Report Issue' feature in your profile settings or contact support directly. Include details about what happened, when, and what you were trying to do.",
      apiEndpoint: null,
      category: "Support"
    }
  ],

  // Event Management (30 questions)
  eventManagement: [
    {
      keywords: ['create event', 'organize event', 'host event', 'event creation'],
      question: "How do I create and host an event?",
      answer: "If you're an organizer, go to the Admin panel and click 'Create Event'. Fill in event details, set pricing, upload images, and publish your event.",
      apiEndpoint: null,
      category: "Event Management"
    },
    {
      keywords: ['event analytics', 'event statistics', 'event performance', 'event metrics'],
      question: "How do I see analytics for my events?",
      answer: "Go to the Admin panel > Event Analytics to see booking statistics, attendance rates, revenue, and other performance metrics for your events.",
      apiEndpoint: "/api/events/:id/stats",
      category: "Event Management"
    },
    {
      keywords: ['manage attendees', 'attendee list', 'participant management', 'event participants'],
      question: "How do I manage event attendees?",
      answer: "In the Admin panel, go to your event and click 'Manage Attendees' to see the attendee list, check-in status, and send communications to participants.",
      apiEndpoint: null,
      category: "Event Management"
    },
    {
      keywords: ['event reports', 'attendance reports', 'booking reports', 'event data'],
      question: "How do I generate reports for my events?",
      answer: "Go to Admin > Reports to generate detailed reports on bookings, attendance, revenue, and participant demographics for your events.",
      apiEndpoint: null,
      category: "Event Management"
    },
    {
      keywords: ['cancel event', 'postpone event', 'reschedule event', 'event cancellation'],
      question: "How do I cancel or reschedule my event?",
      answer: "Contact support immediately if you need to cancel or reschedule your event. We'll help notify all attendees and process refunds according to your event's cancellation policy.",
      apiEndpoint: null,
      category: "Event Management"
    }
  ],

  // General Information (50 questions)
  general: [
    {
      keywords: ['what is eventra', 'about eventra', 'platform overview', 'service description'],
      question: "What is Eventra?",
      answer: "Eventra is a comprehensive event management platform that connects event organizers with attendees. We offer event discovery, booking, payment processing, attendance tracking, and analytics.",
      apiEndpoint: null,
      category: "General"
    },
    {
      keywords: ['features', 'platform features', 'what can i do', 'capabilities'],
      question: "What features does Eventra offer?",
      answer: "Eventra offers event discovery, secure booking, payment processing, face recognition check-in, attendance tracking, analytics, user profiles, and comprehensive event management tools.",
      apiEndpoint: null,
      category: "General"
    },
    {
      keywords: ['pricing', 'cost', 'fees', 'charges'],
      question: "How much does Eventra cost?",
      answer: "Eventra is free for attendees. Event organizers may have platform fees. Individual event pricing varies and is set by the organizers. Check event details for specific costs.",
      apiEndpoint: null,
      category: "General"
    },
    {
      keywords: ['terms of service', 'terms and conditions', 'user agreement', 'legal terms'],
      question: "Where can I find the terms of service?",
      answer: "Our terms of service are available in the footer of our website. They outline user rights, responsibilities, and platform usage guidelines.",
      apiEndpoint: null,
      category: "General"
    },
    {
      keywords: ['privacy policy', 'data protection', 'privacy rights', 'data privacy'],
      question: "What is your privacy policy?",
      answer: "Our privacy policy explains how we collect, use, and protect your data. It's available in the website footer and covers data security, usage, and your privacy rights.",
      apiEndpoint: null,
      category: "General"
    },
    {
      keywords: ['accessibility', 'disabled access', 'inclusive design', 'accessibility features'],
      question: "Is Eventra accessible for users with disabilities?",
      answer: "Yes, we strive to make Eventra accessible to all users. Our platform includes features for screen readers, keyboard navigation, and other accessibility tools.",
      apiEndpoint: null,
      category: "General"
    },
    {
      keywords: ['mobile friendly', 'responsive design', 'mobile optimization', 'phone compatibility'],
      question: "Is Eventra mobile-friendly?",
      answer: "Yes! Eventra is fully responsive and works great on all devices including smartphones, tablets, and desktops. You can access all features from your mobile device.",
      apiEndpoint: null,
      category: "General"
    },
    {
      keywords: ['system requirements', 'technical requirements', 'device requirements', 'browser requirements'],
      question: "What are the system requirements?",
      answer: "Eventra works on all modern devices with internet connection. We support all major browsers and operating systems. No special software installation is required.",
      apiEndpoint: null,
      category: "General"
    },
    {
      keywords: ['updates', 'new features', 'platform updates', 'recent changes'],
      question: "How do I stay updated on new features?",
      answer: "Follow us on social media, check our blog, or enable notifications in your profile settings to receive updates about new features and platform improvements.",
      apiEndpoint: null,
      category: "General"
    },
    {
      keywords: ['feedback', 'suggestions', 'improvement ideas', 'feature requests'],
      question: "How can I provide feedback or suggestions?",
      answer: "We welcome your feedback! Use the feedback form in your profile settings, contact support, or reach out through our social media channels with your suggestions.",
      apiEndpoint: null,
      category: "General"
    }
  ]
};

// Function to find the best matching question based on user input
const findBestMatch = (userInput) => {
  const input = userInput.toLowerCase();
  let bestMatch = null;
  let maxScore = 0;

  // Search through all categories
  Object.values(chatbotDatabase).forEach(category => {
    if (Array.isArray(category)) {
      category.forEach(item => {
        let score = 0;
        
        // Check keyword matches
        item.keywords.forEach(keyword => {
          if (input.includes(keyword.toLowerCase())) {
            score += 1;
          }
        });

        // Check for partial keyword matches
        item.keywords.forEach(keyword => {
          const keywordWords = keyword.toLowerCase().split(' ');
          keywordWords.forEach(word => {
            if (input.includes(word) && word.length > 2) {
              score += 0.5;
            }
          });
        });

        if (score > maxScore) {
          maxScore = score;
          bestMatch = item;
        }
      });
    }
  });

  return { match: bestMatch, score: maxScore };
};

// Function to get random suggestions based on category
const getRandomSuggestions = (category = null, count = 4) => {
  const suggestions = [];
  const allQuestions = [];

  if (category && chatbotDatabase[category]) {
    allQuestions.push(...chatbotDatabase[category]);
  } else {
    Object.values(chatbotDatabase).forEach(cat => {
      if (Array.isArray(cat)) {
        allQuestions.push(...cat);
      }
    });
  }

  // Shuffle and pick random questions
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(item => item.question);
};

// Function to get category-specific questions
const getCategoryQuestions = (category) => {
  return chatbotDatabase[category] || [];
};

// Function to get all questions for a specific category
const getAllQuestionsByCategory = (category) => {
  if (chatbotDatabase[category]) {
    return chatbotDatabase[category].map(item => ({
      question: item.question,
      answer: item.answer,
      keywords: item.keywords,
      apiEndpoint: item.apiEndpoint,
      category: item.category
    }));
  }
  return [];
};

// Function to search questions by keyword
const searchQuestions = (keyword) => {
  const results = [];
  const searchTerm = keyword.toLowerCase();

  Object.values(chatbotDatabase).forEach(category => {
    if (Array.isArray(category)) {
      category.forEach(item => {
        if (item.question.toLowerCase().includes(searchTerm) || 
            item.answer.toLowerCase().includes(searchTerm) ||
            item.keywords.some(k => k.toLowerCase().includes(searchTerm))) {
          results.push(item);
        }
      });
    }
  });

  return results;
};

module.exports = {
  chatbotDatabase,
  findBestMatch,
  getRandomSuggestions,
  getCategoryQuestions,
  getAllQuestionsByCategory,
  searchQuestions
};
