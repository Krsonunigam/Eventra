import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Heart, 
  Lightbulb, 
  Users, 
  Shield, 
  Zap,
  Target,
  Globe,
  Award,
  Quote
} from 'lucide-react';

const Blog = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-500/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center mb-8">
              <img 
                src="/eventra-logo.svg" 
                alt="Eventra Logo" 
                className="w-auto"
                style={{ height: '120px' }}
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              The Story of Eventra
            </h1>
            <p className="text-xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed">
              A journey from vision to reality, transforming event management through innovation and passion
            </p>
          </motion.div>
        </div>
      </div>

      {/* Founder's Story Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-700/50"
        >
          {/* Quote Section */}
          <div className="text-center mb-12">
            <Quote className="h-12 w-12 text-cyan-400 mx-auto mb-6" />
            <blockquote className="text-2xl md:text-3xl font-bold text-white leading-relaxed italic">
              "Eventra was born out of a passion to revolutionize event management at educational institutes by combining cutting-edge AI with seamless user experience."
            </blockquote>
          </div>

          {/* Story Content */}
          <div className="prose prose-lg max-w-none">
            <div className="space-y-8 text-gray-300 leading-relaxed">
              <p className="text-lg">
                Our founder, inspired by the challenges of fake attendance, proxy registrations, and manual check-ins faced during college events, envisioned a secure, transparent, and smart platform that empowers organizers, engages attendees, and restores trust.
              </p>
              
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-6 rounded-2xl border-l-4 border-cyan-400">
                <p className="text-lg font-medium text-white">
                  With innovative face recognition technology, real-time analytics, and effortless payment mechanisms, Eventra is the future of college event management — making every event smarter, safer, and unforgettable.
                </p>
              </div>

              <p className="text-lg">
                Our mission is driven by a desire to enhance participation and experience, while streamlining admin overhead at scale. We believe that technology should serve education, not complicate it.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Vision & Values Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Our Vision & Values</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Building the future of event management through innovation, trust, and excellence
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Target,
              title: "Our Mission",
              description: "To revolutionize event management by combining cutting-edge AI with seamless user experience, making every event smarter and more secure.",
              color: "from-blue-500 to-blue-600"
            },
            {
              icon: Heart,
              title: "Our Passion",
              description: "Driven by a deep love for education and technology, we're committed to solving real-world problems in event management.",
              color: "from-red-500 to-red-600"
            },
            {
              icon: Lightbulb,
              title: "Innovation",
              description: "We continuously push the boundaries of what's possible, using AI and modern technology to create better solutions.",
              color: "from-yellow-500 to-yellow-600"
            },
            {
              icon: Shield,
              title: "Security & Trust",
              description: "Building a platform where security and privacy are paramount, ensuring every interaction is safe and transparent.",
              color: "from-green-500 to-green-600"
            },
            {
              icon: Users,
              title: "Community",
              description: "Fostering a community where organizers and attendees can connect, collaborate, and create memorable experiences.",
              color: "from-purple-500 to-purple-600"
            },
            {
              icon: Zap,
              title: "Excellence",
              description: "Committed to delivering exceptional experiences through continuous improvement and attention to detail.",
              color: "from-orange-500 to-orange-600"
            }
          ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl mb-4`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 leading-relaxed">{item.description}</p>
              </motion.div>
          ))}
        </div>
      </div>

      {/* Technology Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Core Technologies</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built with modern technology stack for reliability, security, and performance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "AI Face Verification",
                description: "Advanced facial recognition technology ensures secure attendance and prevents fraud.",
                icon: "🤖"
              },
              {
                title: "MERN Stack",
                description: "Modern web technologies for robust, scalable, and maintainable applications.",
                icon: "⚡"
              },
              {
                title: "Real-time Analytics",
                description: "Comprehensive insights and reporting for better event management decisions.",
                icon: "📊"
              }
            ].map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg border border-gray-700/50"
              >
                <div className="text-4xl mb-4">{tech.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{tech.title}</h3>
                <p className="text-gray-300 leading-relaxed">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl p-12 text-white"
        >
          <Globe className="h-16 w-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Join the Revolution</h2>
          <p className="text-xl mb-8 opacity-90">
            Be part of the future of event management. Experience the difference that technology and innovation can make.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-cyan-600 px-8 py-3 rounded-full font-semibold hover:bg-cyan-50 transition-colors">
              Get Started
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-cyan-600 transition-colors">
              Learn More
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Blog;
