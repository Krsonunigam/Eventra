import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  FileText,
  Users,
  Settings,
  CreditCard,
  Shield,
  Smartphone,
  Calendar
} from 'lucide-react';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      articles: [
        'How to create an account',
        'Setting up your profile',
        'Understanding the dashboard',
        'First-time user guide'
      ]
    },
    {
      id: 'events',
      title: 'Events',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      articles: [
        'How to browse events',
        'Creating your first event',
        'Event management basics',
        'Event analytics and insights'
      ]
    },
    {
      id: 'bookings',
      title: 'Bookings',
      icon: CreditCard,
      color: 'from-purple-500 to-purple-600',
      articles: [
        'How to book an event',
        'Managing your bookings',
        'Cancellation and refunds',
        'Booking confirmation and tickets'
      ]
    },
    {
      id: 'payments',
      title: 'Payments',
      icon: CreditCard,
      color: 'from-orange-500 to-orange-600',
      articles: [
        'Payment methods accepted',
        'Payment security',
        'Refund policies',
        'Payment troubleshooting'
      ]
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: Users,
      color: 'from-red-500 to-red-600',
      articles: [
        'Face recognition setup',
        'Check-in process',
        'Attendance tracking',
        'Troubleshooting check-in issues'
      ]
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: Settings,
      color: 'from-indigo-500 to-indigo-600',
      articles: [
        'Profile management',
        'Privacy settings',
        'Account security',
        'Data and preferences'
      ]
    }
  ];

  const faqItems = [
    {
      question: "How do I create an account?",
      answer: "Click the 'Register' button on the homepage, fill in your details (name, email, password, student ID, institute), upload a profile picture, and verify your email. You'll also need to complete face verification for event check-ins."
    },
    {
      question: "How does face recognition work?",
      answer: "During registration, we capture your face data securely. At events, our system matches your face to verify your identity and mark your attendance automatically. This prevents fake attendance and ensures security."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, net banking, UPI, and digital wallets through Razorpay. All payments are secure and encrypted."
    },
    {
      question: "How do I book an event?",
      answer: "Browse events on our Events page, click on the event you want to attend, select your seat (if applicable), choose quantity, and proceed to payment. For free events, booking is instant."
    },
    {
      question: "Can I cancel my booking?",
      answer: "Yes, you can cancel your booking through your Bookings page. Refund amount depends on the event's cancellation policy and timing."
    },
    {
      question: "How do I check in at an event?",
      answer: "Use our face recognition system at the event venue. Make sure your face is clearly visible and well-lit. You can also show your QR code from the event pass."
    }
  ];

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      action: 'Start Chat',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a detailed message',
      action: 'aieventra@icloud.com',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak with our support team',
      action: '+91 72770 86852',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              Help Center
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Find answers to your questions and get the support you need
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Help Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Browse by Category</h2>
          <p className="text-lg text-gray-300">Find help organized by topic</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-700"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg mb-4`}>
                <category.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{category.title}</h3>
              <ul className="space-y-2">
                {category.articles.map((article, articleIndex) => (
                  <li key={articleIndex} className="flex items-center text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{article}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-4 text-white hover:text-blue-700 font-medium flex items-center">
                View all articles <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-300">Quick answers to common questions</p>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 hover:bg-gray-700 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{item.question}</h3>
                <p className="text-gray-300 leading-relaxed">{item.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Still Need Help?</h2>
            <p className="text-xl text-blue-100">Get in touch with our support team</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gray-800/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-gray-800/20 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${method.color} rounded-lg mb-4`}>
                  <method.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{method.title}</h3>
                <p className="text-blue-100 mb-4">{method.description}</p>
                <button className="bg-gray-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                  {method.action}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-700 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-8">Quick Links</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { title: 'Privacy Policy', icon: Shield },
                { title: 'Terms of Service', icon: FileText },
                { title: 'FAQ', icon: HelpCircle },
                { title: 'Contact Us', icon: MessageCircle }
              ].map((link, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center"
                >
                  <link.icon className="h-8 w-8 text-white mb-3" />
                  <span className="font-medium text-white">{link.title}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
