import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Eye,
  Download,
  Filter,
  RefreshCw,
  Share2,
  Target,
  Award,
  Clock,
  MapPin,
  Smartphone,
  Globe,
  Zap,
  CheckCircle
} from 'lucide-react';

const Analytics = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  const analyticsFeatures = [
    {
      icon: BarChart3,
      title: "Real-time Dashboard",
      description: "Monitor your events with live data and instant insights into performance metrics.",
      color: "from-blue-500 to-blue-600",
      metrics: ["Live Registrations", "Revenue Tracking", "Attendance Rate", "User Engagement"]
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Track event success with comprehensive analytics and detailed reporting.",
      color: "from-green-500 to-green-600",
      metrics: ["Registration Trends", "Revenue Growth", "User Retention", "Event Popularity"]
    },
    {
      icon: Users,
      title: "Attendee Insights",
      description: "Understand your audience with demographic data and behavior analytics.",
      color: "from-purple-500 to-purple-600",
      metrics: ["Demographics", "Geographic Data", "Engagement Patterns", "Feedback Analysis"]
    },
    {
      icon: DollarSign,
      title: "Revenue Analytics",
      description: "Track financial performance with detailed revenue reports and profit analysis.",
      color: "from-orange-500 to-orange-600",
      metrics: ["Revenue by Event", "Payment Analytics", "Refund Tracking", "Profit Margins"]
    }
  ];

  const dashboardWidgets = [
    {
      title: "Event Overview",
      icon: Calendar,
      data: [
        { label: "Total Events", value: "24", change: "+12%" },
        { label: "Active Events", value: "8", change: "+3%" },
        { label: "Completed Events", value: "16", change: "+8%" }
      ]
    },
    {
      title: "Registration Stats",
      icon: Users,
      data: [
        { label: "Total Registrations", value: "1,247", change: "+23%" },
        { label: "Confirmed Attendees", value: "1,156", change: "+18%" },
        { label: "No-shows", value: "91", change: "-5%" }
      ]
    },
    {
      title: "Revenue Metrics",
      icon: DollarSign,
      data: [
        { label: "Total Revenue", value: "₹2,45,680", change: "+31%" },
        { label: "Average per Event", value: "₹10,237", change: "+7%" },
        { label: "Refund Rate", value: "3.2%", change: "-1.1%" }
      ]
    },
    {
      title: "User Engagement",
      icon: Eye,
      data: [
        { label: "Page Views", value: "45,678", change: "+15%" },
        { label: "Unique Visitors", value: "12,345", change: "+22%" },
        { label: "Conversion Rate", value: "8.7%", change: "+2.3%" }
      ]
    }
  ];

  const reportTypes = [
    {
      title: "Event Performance Report",
      description: "Comprehensive analysis of individual event success metrics",
      icon: Target,
      features: ["Registration Analytics", "Attendance Tracking", "Revenue Analysis", "User Feedback"]
    },
    {
      title: "Financial Summary",
      description: "Detailed financial reports with revenue and expense breakdown",
      icon: DollarSign,
      features: ["Revenue Trends", "Payment Analytics", "Refund Analysis", "Profit Margins"]
    },
    {
      title: "User Analytics",
      description: "Insights into user behavior and engagement patterns",
      icon: Users,
      features: ["Demographics", "Geographic Data", "Engagement Metrics", "Retention Analysis"]
    },
    {
      title: "Marketing Insights",
      description: "Track marketing campaign effectiveness and ROI",
      icon: TrendingUp,
      features: ["Campaign Performance", "Traffic Sources", "Conversion Funnels", "ROI Analysis"]
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Data-Driven Decisions",
      description: "Make informed decisions with comprehensive analytics and insights."
    },
    {
      icon: Target,
      title: "Performance Optimization",
      description: "Identify areas for improvement and optimize event performance."
    },
    {
      icon: Award,
      title: "Success Tracking",
      description: "Monitor key metrics and track progress towards your goals."
    },
    {
      icon: Globe,
      title: "Global Insights",
      description: "Understand your audience across different regions and demographics."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/20 rounded-full mb-6">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Analytics & Insights
            </h1>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto mb-8">
              Transform your event data into actionable insights. Track performance, 
              understand your audience, and optimize your events with comprehensive analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gray-800 text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors">
                View Dashboard
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 hover:text-purple-600 transition-colors">
                Generate Report
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
          <h2 className="text-3xl font-bold text-white mb-4">Comprehensive Analytics Features</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to understand and optimize your event performance
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {analyticsFeatures.map((feature, index) => (
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
                {feature.metrics.map((metric, metricIndex) => (
                  <li key={metricIndex} className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {metric}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="bg-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Real-time Dashboard</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Monitor your events with live data and instant insights
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardWidgets.map((widget, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-3">
                    <widget.icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
                </div>
                <div className="space-y-3">
                  {widget.data.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{item.label}</span>
                      <div className="text-right">
                        <div className="font-semibold text-white">{item.value}</div>
                        <div className={`text-xs ${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {item.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="bg-gradient-to-r from-gray-50 to-purple-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Detailed Reports</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Generate comprehensive reports to understand your event performance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {reportTypes.map((report, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-3">
                    <report.icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                </div>
                <p className="text-gray-300 mb-4">{report.description}</p>
                <ul className="space-y-2">
                  {report.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="mt-4 text-purple-600 hover:text-purple-700 font-medium flex items-center">
                  Generate Report <Download className="h-4 w-4 ml-1" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Why Analytics Matter</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transform your event data into actionable insights for better decision making
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
                <benefit.icon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
              <p className="text-gray-300 text-sm">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Export & Integration */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Export & Integration</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Export your data and integrate with your favorite tools
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Download,
                title: "Export Data",
                description: "Export analytics data in CSV, Excel, or PDF formats for further analysis."
              },
              {
                icon: Share2,
                title: "Share Reports",
                description: "Share reports with stakeholders via email or secure links."
              },
              {
                icon: Globe,
                title: "API Integration",
                description: "Integrate with third-party tools using our comprehensive API."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="text-center bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                  <item.icon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Unlock Your Event Insights?</h2>
            <p className="text-xl text-purple-100 mb-8">
              Start analyzing your event data and make data-driven decisions today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gray-800 text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors">
                Access Analytics
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 hover:text-purple-600 transition-colors">
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
