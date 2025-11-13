import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Search,
  BookOpen,
  CreditCard,
  Shield,
  Users,
  Calendar,
  Smartphone,
  Mail,
  Phone
} from 'lucide-react';

const FAQ = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openItems, setOpenItems] = useState(new Set());

  const categories = [
    { id: 'all', name: 'All Questions', icon: HelpCircle },
    { id: 'getting-started', name: 'Getting Started', icon: BookOpen },
    { id: 'events', name: 'Events', icon: Calendar },
    { id: 'bookings', name: 'Bookings', icon: CreditCard },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'attendance', name: 'Attendance', icon: Users }
  ];

  const faqData = [
    {
      id: 1,
      category: 'getting-started',
      question: "How do I create an account on Eventra?",
      answer: "Click the 'Register' button on the homepage, fill in your details (name, email, password, student ID, institute), upload a profile picture, and verify your email. You'll also need to complete face verification for event check-ins."
    },
    {
      id: 2,
      category: 'getting-started',
      question: "What information do I need to provide during registration?",
      answer: "You'll need to provide your full name, email address, password, student ID, institute name, phone number, and a profile picture. We also require face verification for secure attendance tracking."
    },
    {
      id: 3,
      category: 'events',
      question: "How do I find events that interest me?",
      answer: "Browse our Events page to see all available events. You can filter by category, date, price, or location. Set your interests in your profile to receive personalized event recommendations."
    },
    {
      id: 4,
      category: 'events',
      question: "Can I create my own events?",
      answer: "Yes! If you're an organizer, you can create events through the Admin panel. Fill in event details, set pricing, upload images, and publish your event. Contact support to become an organizer."
    },
    {
      id: 5,
      category: 'bookings',
      question: "How do I book an event?",
      answer: "Click on the event you want to attend, select your seat (if applicable), choose quantity, and proceed to payment. For free events, booking is instant. For paid events, complete the payment process."
    },
    {
      id: 6,
      category: 'bookings',
      question: "Can I cancel my booking?",
      answer: "Yes, you can cancel your booking through your Bookings page. Refund amount depends on the event's cancellation policy and timing. Check the event details for specific refund terms."
    },
    {
      id: 7,
      category: 'bookings',
      question: "What if an event is sold out?",
      answer: "If an event is sold out, you can join the waitlist (if available). You'll be notified if seats become available due to cancellations. Book early as popular events fill up quickly!"
    },
    {
      id: 8,
      category: 'payments',
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, net banking, UPI, and digital wallets through Razorpay. All payments are secure and encrypted."
    },
    {
      id: 9,
      category: 'payments',
      question: "What is your refund policy?",
      answer: "Refund policy varies by event. Generally, full refunds are available if cancelled 24+ hours before the event. Partial refunds may apply for last-minute cancellations. Check event details for specific terms."
    },
    {
      id: 10,
      category: 'payments',
      question: "Is my payment information secure?",
      answer: "Yes! All payments are processed through Razorpay, which is PCI DSS compliant. We never store your payment details on our servers. Your financial information is always protected."
    },
    {
      id: 11,
      category: 'security',
      question: "How does face recognition work for check-in?",
      answer: "During registration, we capture your face data securely. At events, our system matches your face to verify your identity and mark your attendance automatically. This prevents fake attendance and ensures security."
    },
    {
      id: 12,
      category: 'security',
      question: "Is my biometric data safe?",
      answer: "Absolutely. Your face recognition data is encrypted and stored securely. We use it only for attendance verification and never share it with third parties. You can request data deletion at any time."
    },
    {
      id: 13,
      category: 'attendance',
      question: "How do I check in at an event?",
      answer: "Use our face recognition system at the event venue. Make sure your face is clearly visible and well-lit. You can also show your QR code from the event pass for manual check-in."
    },
    {
      id: 14,
      category: 'attendance',
      question: "What if face recognition doesn't work?",
      answer: "If face recognition fails, you can use your QR code for manual check-in. Contact event staff for assistance. Make sure you're in good lighting and facing the camera directly."
    },
    {
      id: 15,
      category: 'attendance',
      question: "How do I see my attendance history?",
      answer: "Go to your Profile page and click on 'Attendance History' to see all events you've attended, check-in times, and your participation record."
    },
    {
      id: 16,
      category: 'getting-started',
      question: "How do I update my profile information?",
      answer: "Go to your Profile page and click 'Edit Profile'. You can update your name, phone number, interests, and profile picture. Some changes may require verification."
    },
    {
      id: 17,
      category: 'events',
      question: "How do I get notified about new events?",
      answer: "Enable event notifications in your profile settings. You'll receive email alerts for new events in your preferred categories. You can also follow specific organizers."
    },
    {
      id: 18,
      category: 'bookings',
      question: "Can I transfer my booking to someone else?",
      answer: "Yes, you can transfer your booking to another person. Contact support with the new attendee's details to process the transfer. Some events may have transfer restrictions."
    },
    {
      id: 19,
      category: 'security',
      question: "How do I secure my account?",
      answer: "Use a strong password, enable two-factor authentication if available, keep your contact information updated, and never share your login credentials. Log out from shared devices."
    },
    {
      id: 20,
      category: 'payments',
      question: "How do I get a receipt for my payment?",
      answer: "Receipts are automatically sent to your email after successful payment. You can also download them from your Bookings page or request a duplicate receipt from support."
    }
  ];

  const toggleItem = (id) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mb-6">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Find answers to common questions about Eventra. Can't find what you're looking for? Contact our support team.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Browse by Category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-4"
        >
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                  {openItems.has(faq.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openItems.has(faq.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 text-gray-300 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No results found</h3>
              <p className="text-gray-300">Try adjusting your search or browse different categories.</p>
            </div>
          )}
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mt-16 text-white"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center">
                <Mail className="h-6 w-6 mr-3" />
                <div>
                  <div className="font-semibold">Email Support</div>
                  <div className="text-blue-100 text-sm">support@eventra.com</div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Phone className="h-6 w-6 mr-3" />
                <div>
                  <div className="font-semibold">Phone Support</div>
                  <div className="text-blue-100 text-sm">+91 72770 86852</div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Smartphone className="h-6 w-6 mr-3" />
                <div>
                  <div className="font-semibold">Live Chat</div>
                  <div className="text-blue-100 text-sm">Available 24/7</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
