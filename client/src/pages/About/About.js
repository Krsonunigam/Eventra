import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  Award, 
  Heart,
  Lightbulb,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: Users,
      title: 'Community First',
      description: 'We believe in building strong communities through meaningful events and connections.'
    },
    {
      icon: Shield,
      title: 'Security & Privacy',
      description: 'Your data and privacy are our top priority with enterprise-grade security.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'We continuously innovate to make event management seamless and efficient.'
    },
    {
      icon: Heart,
      title: 'User-Centric',
      description: 'Every feature is designed with our users\' needs and feedback in mind.'
    }
  ];

  const team = [
    {
      name: 'Team HackFinity',
      role: 'Development Team',
      description: 'Passionate developers dedicated to revolutionizing event management',
      image: '/eventra-logo.svg'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Events Created' },
    { number: '50,000+', label: 'Users Registered' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              About <span className="text-cyan-400">Eventra</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              We're revolutionizing event management with cutting-edge technology, 
              making every event experience seamless, secure, and unforgettable.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              To transform the way events are organized, managed, and experienced by leveraging 
              advanced technologies like face recognition, real-time analytics, and seamless 
              payment processing.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center bg-gray-700 rounded-xl p-6"
              >
                <div className="text-3xl font-bold text-cyan-400 mb-2">{stat.number}</div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">Our Values</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              These core values guide everything we do and shape our vision for the future.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-gray-800 rounded-xl p-6 text-center hover:bg-gray-700 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500 rounded-full mb-4">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-gray-300">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">Our Technology</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We use cutting-edge technology to deliver exceptional event experiences.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-gray-700 rounded-xl p-8"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mr-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Face Recognition</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Advanced AI-powered face recognition for seamless check-ins and enhanced security.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-cyan-400 mr-2" />
                  Instant identification
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-cyan-400 mr-2" />
                  Fraud prevention
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-cyan-400 mr-2" />
                  Contactless entry
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-gray-700 rounded-xl p-8"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Real-time Analytics</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Comprehensive insights and analytics to optimize your events and understand your audience.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Live attendance tracking
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Performance metrics
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Data visualization
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-gray-700 rounded-xl p-8"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Secure Payments</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Enterprise-grade payment processing with multiple payment options and fraud protection.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-purple-400 mr-2" />
                  Multiple payment methods
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-purple-400 mr-2" />
                  PCI DSS compliant
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-4 w-4 text-purple-400 mr-2" />
                  Instant refunds
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">Our Team</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Meet the passionate people behind Eventra who are dedicated to transforming event management.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-gray-800 rounded-xl p-8 text-center"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{member.name}</h3>
                <p className="text-cyan-400 mb-4">{member.role}</p>
                <p className="text-gray-300">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-cyan-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Events?
            </h2>
            <p className="text-xl text-cyan-100 mb-8 max-w-3xl mx-auto">
              Join thousands of event organizers who trust Eventra to deliver exceptional experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-4 bg-white text-cyan-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-cyan-600 transition-colors">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;
