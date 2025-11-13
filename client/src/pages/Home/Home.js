import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  // Calendar, 
  // Users, 
  Shield, 
  CreditCard, 
  Smartphone, 
  BarChart3,
  ArrowRight,
  // CheckCircle,
  Star,
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  Crown,
  CheckCircle,
  Zap,
  Globe,
  Headphones
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/axiosConfig';
import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../../utils/timezoneUtils';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events/upcoming/events');
      setUpcomingEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (eventId) => {
    if (isAuthenticated) {
      navigate(`/events/${eventId}`);
    } else {
      // Store the event ID for redirect after registration and face verification
      localStorage.setItem('redirectAfterVerification', JSON.stringify({
        type: 'event',
        eventId: eventId
      }));
      navigate('/register');
    }
  };

  const formatDate = (dateString) => {
    return formatDateIST(dateString);
  };

  const formatTime = (dateString) => {
    return formatTimeIST(dateString);
  };

  const features = [
    {
      icon: Shield,
      title: 'Face Recognition',
      description: 'Secure check-in with advanced facial recognition technology',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing with Razorpay integration',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Responsive design that works perfectly on all devices',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Comprehensive analytics and reporting for event insights',
      color: 'from-orange-400 to-red-500'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Events Hosted' },
    { number: '50K+', label: 'Happy Users' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];

  const testimonials = [
    {
      name: 'Kumar Sonu Nigam',
      role: 'Event Organizer',
      content: 'Eventra has revolutionized how we manage our events. The face recognition feature is incredible!',
      rating: 5
    },
    {
      name: 'Aryan Yadav',
      role: 'Admin',
      content: 'The analytics and reporting features give us insights we never had before. Highly recommended!',
      rating: 5
    },
    {
      name: 'Mahesh Pandit',
      role: 'Student',
      content: 'Booking events has never been easier. The interface is intuitive and the check-in process is seamless.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220%200%2060%2060%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Face Recognition
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Event Management
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              Revolutionize your event management with AI-powered face recognition, 
              seamless check-ins, and comprehensive analytics.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => localStorage.removeItem('redirectAfterVerification')}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/events"
                    className="inline-flex items-center px-8 py-4 border-2 border-cyan-400 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-400 hover:text-white transition-all duration-200"
                  >
                    Browse Events
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover amazing events happening soon. Book your spot today!
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gray-900 rounded-xl border border-gray-700 hover:border-cyan-500 transition-all duration-300 overflow-hidden group cursor-pointer"
                  onClick={() => handleEventClick(event._id)}
                >
                  {event.image && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm font-medium rounded-full">
                        {event.category}
                      </span>
                      <span className="text-gray-400 text-sm">
                        ₹{event.price}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                      {event.title}
                    </h3>

                    <div className="text-gray-400 text-sm mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: event.description }}></div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-gray-300 text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-cyan-400" />
                        {formatDate(event.dateTime.start)}
                      </div>
                      <div className="flex items-center text-gray-300 text-sm">
                        <Clock className="h-4 w-4 mr-2 text-cyan-400" />
                        {formatTime(event.dateTime.start)}
                      </div>
                      <div className="flex items-center text-gray-300 text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-cyan-400" />
                        {event.venue.name}
                      </div>
                      <div className="flex items-center text-gray-300 text-sm">
                        <Users className="h-4 w-4 mr-2 text-cyan-400" />
                        {event.capacity} seats available
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform group-hover:scale-105 flex items-center justify-center">
                      <Ticket className="h-4 w-4 mr-2" />
                      {isAuthenticated ? 'Book Now' : 'Register to Book'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Upcoming Events</h3>
              <p className="text-gray-500">Check back later for new events!</p>
            </div>
          )}

          {upcomingEvents.length > 0 && (
            <div className="text-center mt-12">
              <Link
                to="/events"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                View All Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to manage events efficiently with cutting-edge technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-300">
              Simple steps to get started with Eventra
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Register & Verify',
                description: 'Create your account and verify your identity with face recognition'
              },
              {
                step: '02',
                title: 'Browse & Book',
                description: 'Explore events, select your seat, and complete secure payment'
              },
              {
                step: '03',
                title: 'Check-in & Enjoy',
                description: 'Use face recognition for quick check-in and enjoy the event'
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">{step.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-400">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-300">
              Trusted by thousands of users worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-800 p-6 rounded-xl border border-gray-700"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Plans Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Host Your Events with Admin Plans
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get full control over your events with our premium admin subscription. 
              Manage users, track attendance, and access advanced analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300"
            >
              <div className="text-center mb-6">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">₹1,000</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">Perfect for regular event organizers</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Full user management access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Complete event management</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">QR attendance system</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>

              <Link
                to="/admin/subscription"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Crown className="h-5 w-5 mr-2" />
                Choose Monthly Plan
              </Link>
            </motion.div>

            {/* Yearly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-8 border-2 border-yellow-300 hover:border-yellow-400 transition-all duration-300 relative"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>

              <div className="text-center mb-6">
                <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Yearly Plan</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">₹10,000</span>
                  <span className="text-gray-600">/year</span>
                </div>
                <p className="text-gray-600">Best value for frequent organizers</p>
                <div className="mt-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    Save ₹2,000 (2 months free)
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Everything in Monthly Plan</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Custom branding options</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">API access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">2 months free</span>
                </li>
              </ul>

              <Link
                to="/admin/subscription"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 flex items-center justify-center"
              >
                <Crown className="h-5 w-5 mr-2" />
                Choose Yearly Plan
              </Link>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
              Premium Admin Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: 'User Management',
                  description: 'Full control over all users, roles, and permissions'
                },
                {
                  icon: BarChart3,
                  title: 'Advanced Analytics',
                  description: 'Comprehensive reporting and insights dashboard'
                },
                {
                  icon: Ticket,
                  title: 'QR Attendance',
                  description: 'Complete attendance management with QR scanning'
                },
                {
                  icon: Shield,
                  title: 'Event Management',
                  description: 'Create, manage, and monitor all events'
                },
                {
                  icon: Headphones,
                  title: 'Priority Support',
                  description: '24/7 priority support for all your needs'
                },
                {
                  icon: Globe,
                  title: 'API Access',
                  description: 'Full API access for custom integrations'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center p-6"
                >
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyan-500 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already using Eventra to manage their events
          </p>
          {/* Demo Video */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="w-full bg-black rounded-xl overflow-hidden shadow-lg">
              <iframe
                src="https://drive.google.com/file/d/1qc24U4erMZ9RMDj73XBs57M6Nyg5V0tn/preview"
                allow="autoplay"
                className="w-full h-[220px] sm:h-[280px] md:h-[360px] lg:h-[420px]"
                title="Eventra Demo Video"
              />
            </div>
          </div>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                onClick={() => localStorage.removeItem('redirectAfterVerification')}
                className="inline-flex items-center px-8 py-4 bg-white text-cyan-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
              >
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/events"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-cyan-600 transition-all duration-200"
              >
                Browse Events
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
