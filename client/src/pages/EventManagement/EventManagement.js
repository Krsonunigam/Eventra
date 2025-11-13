import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Share2,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Zap,
  Shield,
  Smartphone
} from 'lucide-react';

const EventManagement = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  const features = [
    {
      icon: Calendar,
      title: "Event Creation & Scheduling",
      description: "Create events with detailed information, set schedules, and manage multiple events simultaneously.",
      color: "from-blue-500 to-blue-600",
      features: [
        "Drag-and-drop event builder",
        "Recurring event support",
        "Calendar integration",
        "Event templates"
      ]
    },
    {
      icon: Users,
      title: "Attendee Management",
      description: "Manage registrations, track attendance, and communicate with participants effectively.",
      color: "from-green-500 to-green-600",
      features: [
        "Real-time registration tracking",
        "Bulk attendee management",
        "Communication tools",
        "Attendance verification"
      ]
    },
    {
      icon: BarChart3,
      title: "Analytics & Reporting",
      description: "Get insights into event performance with comprehensive analytics and detailed reports.",
      color: "from-purple-500 to-purple-600",
      features: [
        "Real-time analytics dashboard",
        "Custom report generation",
        "Performance metrics",
        "Export capabilities"
      ]
    },
    {
      icon: Settings,
      title: "Customization & Control",
      description: "Customize your events with branding, settings, and advanced configuration options.",
      color: "from-orange-500 to-orange-600",
      features: [
        "Custom branding options",
        "Advanced settings",
        "Integration capabilities",
        "API access"
      ]
    }
  ];

  const managementTools = [
    {
      title: "Event Dashboard",
      icon: BarChart3,
      description: "Comprehensive overview of all your events with key metrics and quick actions.",
      metrics: ["Total Events", "Active Registrations", "Revenue", "Attendance Rate"]
    },
    {
      title: "Registration Management",
      icon: Users,
      description: "Handle registrations, waitlists, and attendee communications efficiently.",
      metrics: ["New Registrations", "Pending Approvals", "Waitlist", "Confirmed Attendees"]
    },
    {
      title: "Payment Processing",
      icon: DollarSign,
      description: "Secure payment handling with multiple gateways and automated refunds.",
      metrics: ["Total Revenue", "Pending Payments", "Refunds Processed", "Payment Methods"]
    },
    {
      title: "Analytics & Insights",
      icon: TrendingUp,
      description: "Detailed analytics to understand event performance and attendee behavior.",
      metrics: ["Registration Trends", "Attendance Patterns", "Revenue Analysis", "User Engagement"]
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Streamlined Workflow",
      description: "Reduce administrative overhead with automated processes and intuitive tools."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee for your events."
    },
    {
      icon: Target,
      title: "Data-Driven Decisions",
      description: "Make informed decisions with comprehensive analytics and reporting."
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Manage events on-the-go with our responsive mobile interface."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/20 rounded-full mb-6">
              <Calendar className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Event Management
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Comprehensive tools to create, manage, and analyze events with ease. 
              From planning to execution, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gray-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                Get Started
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 hover:text-white transition-colors">
                View Demo
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Powerful Event Management Features</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to create, manage, and analyze successful events
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 * index }}
              className="bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg mb-4`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300 mb-4">{feature.description}</p>
              <ul className="space-y-2">
                {feature.features.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Management Tools */}
      <div className="bg-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Management Tools</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive tools to manage every aspect of your events
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {managementTools.map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg mb-4">
                  <tool.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{tool.title}</h3>
                <p className="text-gray-300 text-sm mb-4">{tool.description}</p>
                <div className="space-y-1">
                  {tool.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} className="text-xs text-gray-500 flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      {metric}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose Our Event Management?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the benefits of our comprehensive event management platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full shadow-lg mb-4">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-300 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Creation Process */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Simple Event Creation Process</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Create professional events in just a few steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              step: "1",
              title: "Event Details",
              description: "Add event information, date, time, and location",
              icon: Calendar
            },
            {
              step: "2",
              title: "Registration Setup",
              description: "Configure registration options and pricing",
              icon: Users
            },
            {
              step: "3",
              title: "Customization",
              description: "Brand your event and set preferences",
              icon: Settings
            },
            {
              step: "4",
              title: "Publish & Manage",
              description: "Launch your event and track registrations",
              icon: BarChart3
            }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-lg font-bold mb-4">
                {step.step}
              </div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mb-4">
                <step.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-gray-300 text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Manage Your Events?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Start creating and managing events with our comprehensive platform today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gray-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                Start Free Trial
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 hover:text-white transition-colors">
                Contact Sales
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;
