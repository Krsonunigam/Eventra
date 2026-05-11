import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  UserCheck, 
  FileText,
  CheckCircle,
  AlertTriangle,
  Globe,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

const PrivacyPolicy = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      color: "from-blue-500 to-blue-600",
      content: [
        "Personal Information: Name, email address, phone number, student ID, institute details",
        "Biometric Data: Face recognition data for secure attendance verification",
        "Payment Information: Transaction details processed securely through Razorpay",
        "Usage Data: Event attendance, booking history, platform interactions",
        "Device Information: Browser type, IP address, device specifications for security"
      ]
    },
    {
      title: "How We Use Your Information",
      icon: Eye,
      color: "from-green-500 to-green-600",
      content: [
        "Event Management: Processing bookings, managing attendance, sending confirmations",
        "Security: Face recognition for fraud prevention and secure check-ins",
        "Communication: Sending event updates, notifications, and important announcements",
        "Analytics: Improving platform performance and user experience",
        "Legal Compliance: Meeting regulatory requirements and preventing fraud"
      ]
    },
    {
      title: "Data Security",
      icon: Lock,
      color: "from-purple-500 to-purple-600",
      content: [
        "Encryption: All data is encrypted using industry-standard AES-256 encryption",
        "Secure Storage: Data stored in secure, SOC 2 compliant cloud infrastructure",
        "Access Control: Strict access controls with multi-factor authentication",
        "Regular Audits: Regular security assessments and penetration testing",
        "Data Minimization: We collect only necessary data for platform functionality"
      ]
    },
    {
      title: "Your Rights",
      icon: UserCheck,
      color: "from-orange-500 to-orange-600",
      content: [
        "Access: Request a copy of all personal data we hold about you",
        "Correction: Update or correct any inaccurate personal information",
        "Deletion: Request deletion of your personal data (subject to legal requirements)",
        "Portability: Export your data in a machine-readable format",
        "Objection: Object to processing of your data for specific purposes"
      ]
    }
  ];

  const dataTypes = [
    {
      category: "Personal Data",
      items: ["Name", "Email", "Phone", "Student ID", "Institute"],
      retention: "Until account deletion"
    },
    {
      category: "Biometric Data",
      items: ["Face recognition data", "Facial features", "Verification records"],
      retention: "Until account deletion or 7 years (whichever is longer)"
    },
    {
      category: "Transaction Data",
      items: ["Payment records", "Booking history", "Refund information"],
      retention: "7 years for tax and legal compliance"
    },
    {
      category: "Usage Data",
      items: ["Event attendance", "Platform interactions", "Device information"],
      retention: "2 years for analytics and improvement"
    }
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
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
          <h2 className="text-2xl font-bold text-white mb-4">Our Commitment to Privacy</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            At Eventra, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-blue-800">
              <strong>Key Principle:</strong> We only collect the information necessary to provide our services and never sell your personal data to third parties.
            </p>
          </div>
        </motion.div>

        {/* Privacy Sections */}
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

        {/* Data Types Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-gray-800 rounded-xl shadow-lg p-8 mt-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Data Types and Retention</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-white">Data Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Items</th>
                  <th className="text-left py-3 px-4 font-semibold text-white">Retention Period</th>
                </tr>
              </thead>
              <tbody>
                {dataTypes.map((data, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium text-white">{data.category}</td>
                    <td className="py-4 px-4 text-gray-300">
                      <ul className="list-disc list-inside space-y-1">
                        {data.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{data.retention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* GDPR Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-8 mt-12"
        >
          <div className="flex items-center mb-4">
            <Globe className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-white">GDPR Compliance</h2>
          </div>
          <p className="text-gray-300 mb-4">
            We are fully compliant with the General Data Protection Regulation (GDPR) and other applicable privacy laws.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-2">Your Rights Under GDPR:</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Right to access your personal data</li>
                <li>• Right to rectification of inaccurate data</li>
                <li>• Right to erasure ("right to be forgotten")</li>
                <li>• Right to data portability</li>
                <li>• Right to object to processing</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Our Commitments:</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Lawful basis for all data processing</li>
                <li>• Data minimization and purpose limitation</li>
                <li>• Regular privacy impact assessments</li>
                <li>• Data protection by design and default</li>
                <li>• Transparent privacy practices</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="bg-gray-800 rounded-xl shadow-lg p-8 mt-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
          <p className="text-gray-300 mb-6">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-white mr-3" />
              <div>
                <div className="font-medium text-white">Email</div>
                <div className="text-gray-300">eventraofficialevent@gmail.com</div>
              </div>
            </div>
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-white mr-3" />
              <div>
                <div className="font-medium text-white">Phone</div>
                <div className="text-gray-300">+91 72770 86852</div>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-white mr-3" />
              <div>
                <div className="font-medium text-white">Response Time</div>
                <div className="text-gray-300">Within 48 hours</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
