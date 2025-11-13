import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Shield, 
  Zap, 
  CheckCircle, 
  DollarSign,
  Smartphone,
  Globe,
  Lock,
  BarChart3,
  Settings,
  Download,
  Upload,
  AlertCircle,
  Clock,
  Users,
  TrendingUp,
  Award,
  Database
} from 'lucide-react';

const PaymentProcessing = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  const features = [
    {
      icon: CreditCard,
      title: "Multiple Payment Methods",
      description: "Accept payments through credit cards, debit cards, UPI, net banking, and digital wallets.",
      color: "from-blue-500 to-blue-600",
      methods: ["Credit/Debit Cards", "UPI Payments", "Net Banking", "Digital Wallets", "Bank Transfers"]
    },
    {
      icon: Shield,
      title: "Secure Processing",
      description: "Enterprise-grade security with PCI DSS compliance and end-to-end encryption.",
      color: "from-green-500 to-green-600",
      methods: ["PCI DSS Compliant", "SSL Encryption", "Fraud Detection", "Secure Vault", "Tokenization"]
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Real-time payment processing with instant confirmation and receipt generation.",
      color: "from-yellow-500 to-yellow-600",
      methods: ["Real-time Processing", "Instant Confirmation", "Auto Receipts", "Quick Refunds", "Live Updates"]
    },
    {
      icon: Globe,
      title: "Global Support",
      description: "Accept payments from anywhere in the world with multi-currency support.",
      color: "from-purple-500 to-purple-600",
      methods: ["Multi-currency", "International Cards", "Local Payment Methods", "Currency Conversion", "Global Reach"]
    }
  ];

  const paymentGateways = [
    {
      name: "Razorpay",
      description: "India's leading payment gateway with comprehensive features",
      features: ["UPI Integration", "Card Payments", "Net Banking", "Wallets", "EMI Options"],
      logo: "💳"
    },
    {
      name: "Stripe",
      description: "Global payment processing with advanced features",
      features: ["International Cards", "Apple Pay", "Google Pay", "SEPA", "ACH"],
      logo: "🌍"
    },
    {
      name: "PayPal",
      description: "Trusted worldwide payment solution",
      features: ["PayPal Wallet", "Credit Cards", "Buy Now Pay Later", "Mobile Payments", "Global Reach"],
      logo: "🅿️"
    }
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: "Reduced Payment Failures",
      description: "Advanced retry mechanisms and multiple payment options reduce failed transactions."
    },
    {
      icon: Clock,
      title: "Faster Checkout",
      description: "Streamlined payment flow reduces checkout time and improves user experience."
    },
    {
      icon: BarChart3,
      title: "Better Analytics",
      description: "Comprehensive payment analytics help track revenue and optimize pricing."
    },
    {
      icon: Shield,
      title: "Fraud Protection",
      description: "Advanced fraud detection and prevention measures protect both merchants and customers."
    }
  ];

  const pricing = [
    {
      plan: "Basic",
      price: "2.9%",
      description: "Perfect for small events and startups",
      features: [
        "Credit/Debit Cards",
        "UPI Payments",
        "Basic Analytics",
        "Email Support",
        "Standard Security"
      ]
    },
    {
      plan: "Professional",
      price: "2.5%",
      description: "Ideal for growing businesses",
      features: [
        "All Basic Features",
        "Net Banking",
        "Digital Wallets",
        "Advanced Analytics",
        "Priority Support",
        "Fraud Protection"
      ]
    },
    {
      plan: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "All Professional Features",
        "Custom Integration",
        "Dedicated Support",
        "White-label Options",
        "API Access",
        "Custom Reporting"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/20 rounded-full mb-6">
              <CreditCard className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Payment Processing
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto mb-8">
              Secure, fast, and reliable payment processing for all your events. 
              Accept payments from anywhere in the world with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gray-800 text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">
                Get Started
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 hover:text-green-600 transition-colors">
                View Pricing
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
          <h2 className="text-3xl font-bold text-white mb-4">Powerful Payment Features</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to accept payments securely and efficiently
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
                {feature.methods.map((method, methodIndex) => (
                  <li key={methodIndex} className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {method}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Gateways */}
      <div className="bg-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Supported Payment Gateways</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Integrate with leading payment providers for maximum flexibility
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {paymentGateways.map((gateway, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{gateway.logo}</div>
                  <h3 className="text-lg font-semibold text-white">{gateway.name}</h3>
                  <p className="text-gray-300 text-sm">{gateway.description}</p>
                </div>
                <ul className="space-y-1">
                  {gateway.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-gray-50 to-green-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose Our Payment Processing?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the benefits of our comprehensive payment solution
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
                  <benefit.icon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-300 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Transparent Pricing</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, no surprises.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricing.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className={`bg-gray-800 rounded-xl shadow-lg p-8 ${
                plan.plan === 'Professional' ? 'ring-2 ring-green-500 transform scale-105' : ''
              }`}
            >
              {plan.plan === 'Professional' && (
                <div className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.plan}</h3>
              <div className="text-4xl font-bold text-white mb-2">{plan.price}</div>
              <p className="text-gray-300 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                plan.plan === 'Professional'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-700 text-white hover:bg-gray-200'
              }`}>
                Choose Plan
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Security & Compliance</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your payments are protected with industry-leading security measures
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "PCI DSS Compliant",
                description: "Fully compliant with Payment Card Industry Data Security Standards."
              },
              {
                icon: Lock,
                title: "End-to-End Encryption",
                description: "All payment data is encrypted using industry-standard encryption."
              },
              {
                icon: Database,
                title: "Secure Infrastructure",
                description: "Hosted on secure, SOC 2 compliant cloud infrastructure."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="text-center bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg mb-4">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Start Accepting Payments?</h2>
            <p className="text-xl text-green-100 mb-8">
              Join thousands of event organizers who trust our payment processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gray-800 text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">
                Start Free Trial
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 hover:text-green-600 transition-colors">
                Contact Sales
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;
