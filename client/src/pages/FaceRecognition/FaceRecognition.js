import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Shield, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Smartphone,
  Camera,
  Lock,
  Users,
  Clock,
  BarChart3,
  Settings,
  Download,
  Upload,
  Scan,
  Fingerprint,
  Database,
  Globe,
  Award
} from 'lucide-react';

const FaceRecognition = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  const features = [
    {
      icon: Eye,
      title: "Advanced AI Recognition",
      description: "State-of-the-art facial recognition technology with 99.9% accuracy for secure attendance verification.",
      color: "from-blue-500 to-blue-600",
      benefits: [
        "99.9% accuracy rate",
        "Real-time processing",
        "Works in various lighting conditions",
        "Anti-spoofing protection"
      ]
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Your biometric data is encrypted and stored securely, never shared with third parties.",
      color: "from-green-500 to-green-600",
      benefits: [
        "End-to-end encryption",
        "GDPR compliant",
        "Local processing option",
        "Data retention controls"
      ]
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Check-in process takes less than 2 seconds, ensuring smooth event flow and minimal waiting.",
      color: "from-yellow-500 to-yellow-600",
      benefits: [
        "Sub-2 second recognition",
        "Batch processing support",
        "Offline capability",
        "Mobile optimized"
      ]
    },
    {
      icon: Users,
      title: "Scalable Solution",
      description: "Handle events of any size, from small workshops to large conferences with thousands of attendees.",
      color: "from-purple-500 to-purple-600",
      benefits: [
        "Unlimited attendees",
        "Concurrent processing",
        "Cloud infrastructure",
        "Auto-scaling"
      ]
    }
  ];

  const processSteps = [
    {
      step: "1",
      title: "Registration",
      description: "During account creation, users capture their face data securely for future verification.",
      icon: Camera,
      details: "High-quality face capture with multiple angle verification"
    },
    {
      step: "2",
      title: "Data Processing",
      description: "AI algorithms analyze facial features and create a secure biometric template.",
      icon: Database,
      details: "Advanced machine learning models process facial geometry"
    },
    {
      step: "3",
      title: "Secure Storage",
      description: "Biometric templates are encrypted and stored in secure, compliant infrastructure.",
      icon: Lock,
      details: "AES-256 encryption with zero-knowledge architecture"
    },
    {
      step: "4",
      title: "Event Check-in",
      description: "At events, facial recognition matches attendees against stored templates instantly.",
      icon: Scan,
      details: "Real-time verification with anti-spoofing measures"
    }
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: "Eliminates Proxy Attendance",
      description: "Prevents fake attendance and ensures only registered attendees are marked present."
    },
    {
      icon: Clock,
      title: "Saves Time",
      description: "Reduces check-in time from minutes to seconds, improving event flow."
    },
    {
      icon: BarChart3,
      title: "Accurate Analytics",
      description: "Provides precise attendance data for better event insights and reporting."
    },
    {
      icon: Shield,
      title: "Enhanced Security",
      description: "Adds an extra layer of security to prevent unauthorized access to events."
    }
  ];

  const technicalSpecs = [
    {
      category: "Recognition Accuracy",
      specs: ["99.9% accuracy rate", "Works in low light", "Handles various angles", "Anti-spoofing protection"]
    },
    {
      category: "Processing Speed",
      specs: ["<2 seconds per check-in", "Batch processing", "Real-time verification", "Offline capability"]
    },
    {
      category: "Security Features",
      specs: ["AES-256 encryption", "GDPR compliant", "Zero-knowledge architecture", "Secure data transmission"]
    },
    {
      category: "Compatibility",
      specs: ["Mobile devices", "Tablets", "Web browsers", "API integration"]
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
              <Eye className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Face Recognition Technology
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Revolutionary AI-powered facial recognition for secure, fast, and accurate event attendance verification.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gray-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                Learn More
              </button>
              <a
                href="https://drive.google.com/file/d/1qc24U4erMZ9RMDj73XBs57M6Nyg5V0tn/view?usp=sharing"
                target="_blank"
                rel="noreferrer"
                className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 hover:text-white transition-colors text-center"
              >
                See Demo
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Demo Video Embed */}
        <div className="mb-12">
          <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://drive.google.com/file/d/1qc24U4erMZ9RMDj73XBs57M6Nyg5V0tn/preview"
              allow="autoplay"
              className="w-full h-[360px] md:h-[450px] bg-black rounded-xl"
              title="Face Recognition Demo Video"
            />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Advanced Face Recognition Features</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Cutting-edge technology that ensures secure, fast, and accurate attendance verification
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
                {feature.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">How Face Recognition Works</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              A simple, secure process that ensures accurate attendance verification
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
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
                <p className="text-gray-300 text-sm mb-2">{step.description}</p>
                <p className="text-gray-500 text-xs">{step.details}</p>
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
            <h2 className="text-3xl font-bold text-white mb-4">Benefits of Face Recognition</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Transform your event management with secure, efficient attendance verification
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

      {/* Technical Specifications */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Technical Specifications</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Advanced technology specifications for reliable face recognition
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {technicalSpecs.map((spec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">{spec.category}</h3>
              <ul className="space-y-2">
                {spec.specs.map((item, itemIndex) => (
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

      {/* Privacy & Security */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Privacy & Security</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your biometric data is protected with enterprise-grade security
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: "Data Encryption",
                description: "All biometric data is encrypted using AES-256 encryption standards."
              },
              {
                icon: Shield,
                title: "GDPR Compliant",
                description: "Fully compliant with GDPR and other privacy regulations worldwide."
              },
              {
                icon: Database,
                title: "Secure Storage",
                description: "Data stored in secure, SOC 2 compliant cloud infrastructure."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="text-center bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                  <item.icon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Implement Face Recognition?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Experience the future of secure event attendance verification.
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

export default FaceRecognition;
