import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Scale, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  CreditCard,
  Ban,
  Eye,
  Lock
} from 'lucide-react';

const TermsOfService = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  const sections = [
    {
      title: "Acceptance of Terms",
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      content: [
        "By accessing and using Eventra, you accept and agree to be bound by these Terms of Service",
        "If you do not agree to these terms, you may not use our platform",
        "We reserve the right to modify these terms at any time with notice",
        "Continued use of the platform constitutes acceptance of modified terms"
      ]
    },
    {
      title: "User Responsibilities",
      icon: User,
      color: "from-blue-500 to-blue-600",
      content: [
        "Provide accurate and complete information during registration",
        "Maintain the security of your account credentials",
        "Use the platform in compliance with all applicable laws",
        "Respect other users and maintain appropriate conduct",
        "Report any security vulnerabilities or suspicious activity"
      ]
    },
    {
      title: "Prohibited Activities",
      icon: Ban,
      color: "from-red-500 to-red-600",
      content: [
        "Creating fake accounts or impersonating others",
        "Attempting to circumvent security measures",
        "Using the platform for illegal activities",
        "Harassment, abuse, or threatening behavior",
        "Sharing inappropriate or offensive content",
        "Attempting to hack or compromise the platform"
      ]
    },
    {
      title: "Payment Terms",
      icon: CreditCard,
      color: "from-purple-500 to-purple-600",
      content: [
        "All payments are processed securely through Razorpay",
        "Event fees are non-refundable unless otherwise specified",
        "Refunds are subject to event cancellation policies",
        "Payment disputes must be reported within 30 days",
        "We reserve the right to suspend accounts for payment issues"
      ]
    },
    {
      title: "Privacy and Data",
      icon: Lock,
      color: "from-indigo-500 to-indigo-600",
      content: [
        "Your data is protected according to our Privacy Policy",
        "Face recognition data is used solely for attendance verification",
        "We do not sell or share your personal information",
        "You have the right to request data deletion",
        "Data retention follows applicable legal requirements"
      ]
    },
    {
      title: "Intellectual Property",
      icon: Shield,
      color: "from-orange-500 to-orange-600",
      content: [
        "Eventra and its content are protected by copyright and trademark laws",
        "Users retain ownership of their uploaded content",
        "You grant us a license to use your content for platform functionality",
        "Unauthorized use of our intellectual property is prohibited",
        "Respect the intellectual property rights of others"
      ]
    }
  ];

  const refundPolicies = [
    {
      scenario: "Event Cancelled by Organizer",
      refund: "Full refund within 5-7 business days",
      timeframe: "Automatic processing"
    },
    {
      scenario: "User Cancellation (24+ hours before event)",
      refund: "Full refund minus processing fees",
      timeframe: "Within 3-5 business days"
    },
    {
      scenario: "User Cancellation (Less than 24 hours)",
      refund: "50% refund or credit for future events",
      timeframe: "Within 5-7 business days"
    },
    {
      scenario: "No-show at Event",
      refund: "No refund (attendance was marked)",
      timeframe: "N/A"
    },
    {
      scenario: "Technical Issues (Platform fault)",
      refund: "Full refund or rescheduled event",
      timeframe: "Immediate processing"
    }
  ];

  const liabilityLimitations = [
    "Eventra is provided 'as is' without warranties of any kind",
    "We are not liable for events organized by third parties",
    "Maximum liability is limited to the amount paid for the specific event",
    "We are not responsible for travel, accommodation, or other expenses",
    "Force majeure events may affect event availability",
    "Users attend events at their own risk"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mb-6">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Please read these terms carefully before using our platform. By using Eventra, you agree to these terms.
            </p>
            <div className="mt-6 text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-gray-800 rounded-xl shadow-lg p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Agreement Overview</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            These Terms of Service ("Terms") govern your use of the Eventra platform and services. 
            By creating an account or using our services, you agree to be bound by these terms.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium">Important Notice</p>
                <p className="text-yellow-700 text-sm mt-1">
                  These terms include important information about your rights and obligations. 
                  Please read them carefully and contact us if you have any questions.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 * index }}
              className="bg-gray-800 rounded-xl shadow-lg p-8"
            >
              <div className="flex items-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${section.color} rounded-lg mr-4`}>
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Refund Policies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gray-800 rounded-xl shadow-lg p-8 mt-12"
        >
          <div className="flex items-center mb-6">
            <DollarSign className="h-8 w-8 text-green-600 mr-4" />
            <h2 className="text-2xl font-bold text-white">Refund Policies</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-white">Scenario</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Refund Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Processing Time</th>
                </tr>
              </thead>
              <tbody>
                {refundPolicies.map((policy, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium text-white">{policy.scenario}</td>
                    <td className="py-4 px-4 text-gray-300">{policy.refund}</td>
                    <td className="py-4 px-4 text-gray-300">{policy.timeframe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Liability Limitations */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-8 mt-12"
        >
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-white">Liability Limitations</h2>
          </div>
          <p className="text-gray-300 mb-4">
            Please understand the limitations of our liability and your responsibilities as a user.
          </p>
          <ul className="space-y-2">
            {liabilityLimitations.map((limitation, index) => (
              <li key={index} className="flex items-start">
                <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{limitation}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Dispute Resolution */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="bg-gray-800 rounded-xl shadow-lg p-8 mt-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Dispute Resolution</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-3">Contact Us First</h3>
              <p className="text-gray-300 text-sm mb-4">
                We encourage users to contact our support team first to resolve any disputes or issues.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Support:</strong>eventraofficialevent@gmail.com<br />
                  <strong>Response Time:</strong> Within 48 hours
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Legal Process</h3>
              <p className="text-gray-300 text-sm mb-4">
                If disputes cannot be resolved through support, they will be subject to binding arbitration.
              </p>
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 rounded-lg">
                <p className="text-gray-300 text-sm">
                  <strong>Jurisdiction:</strong> [Your State/Country]<br />
                  <strong>Governing Law:</strong> [Applicable Law]
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mt-12 text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Questions About These Terms?</h2>
          <p className="text-blue-100 mb-6">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="font-semibold mb-1">Email</div>
              <div className="text-blue-100">eventraofficialevent@gmail.com</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Phone</div>
              <div className="text-blue-100">+91 72770 86852</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Address</div>
              <div className="text-blue-100">Dehradun UK India</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
