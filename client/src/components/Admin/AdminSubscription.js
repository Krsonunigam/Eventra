import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Star,
  Users,
  BarChart3,
  QrCode,
  Shield,
  Zap,
  Globe,
  Headphones,
  Calendar,
  Ticket
} from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import api from '../../utils/axiosConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadRazorpayScript, createRazorpayOptions, openRazorpayModal } from '../../utils/razorpay';

const AdminSubscription = () => {
  const toast = useCustomToast();
  const { isAdmin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [renewalLoading, setRenewalLoading] = useState(false);

  useEffect(() => {
    // Check for plan parameter in URL
    const planParam = searchParams.get('plan');
    if (planParam && ['basic', 'professional', 'enterprise'].includes(planParam)) {
      setSelectedPlan(planParam);
    }
    
    if (isAuthenticated) {
      fetchSubscriptionStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, searchParams]);

  // Check if subscription needs renewal (within 7 days)
  const needsRenewal = () => {
    if (!subscription || !subscription.daysRemaining) return false;
    return subscription.daysRemaining <= 7 && subscription.daysRemaining > 0;
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/api/admin/subscription/status');
      if (response.data.success) {
        setSubscription(response.data.subscription || response.data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to access subscription features');
      } else if (error.response?.status === 404) {
        // No subscription found - this is normal for new users
        setSubscription(null);
      } else {
        toast.error('Failed to load subscription status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (plan = 'monthly') => {
    setPaymentLoading(true);
    try {
      // Load Razorpay script if not already loaded
      await loadRazorpayScript();
      
      const response = await api.post('/api/admin/subscription/order', { plan: plan });
      const { orderId, currency, amount, key } = response.data;

      const options = createRazorpayOptions(
        { orderId, currency, amount, key },
        { name: 'Admin User', email: 'admin@eventra.com' }
      );

      const onSuccess = async (response) => {
        try {
          await api.post('/api/admin/subscription/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          toast.success('Subscription activated successfully!');
          fetchSubscriptionStatus(); // Refresh status
        } catch (verifyError) {
          console.error('Payment verification failed:', verifyError);
          toast.error('Payment verification failed. Please contact support.');
        }
      };

      const onError = (error) => {
        console.error('Payment error:', error);
        toast.error('Payment failed. Please try again.');
      };

      openRazorpayModal(options, onSuccess, onError);

    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment.');
      setPaymentLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    setPaymentLoading(true);
    try {
      // Load Razorpay script if not already loaded
      await loadRazorpayScript();
      
      const response = await api.post('/api/admin/subscription/order', { plan: selectedPlan });
      const { orderId, currency, amount, key } = response.data;
      
      const options = createRazorpayOptions(
        { orderId, currency, amount, key },
        { name: 'Admin User', email: 'admin@eventra.com' }
      );

      const onSuccess = async (response) => {
        try {
          await api.post('/api/admin/subscription/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          toast.success('Payment successful! Subscription activated.');
          fetchSubscriptionStatus();
        } catch (verifyError) {
          console.error('Payment verification failed:', verifyError);
          toast.error('Payment verification failed. Please contact support.');
        }
      };

      const onError = (error) => {
        console.error('Payment error:', error);
        toast.error('Payment failed. Please try again.');
      };

      openRazorpayModal(options, onSuccess, onError);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to create payment');
      setPaymentLoading(false);
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const response = await api.post('/api/admin/subscription/verify-payment', paymentData);
      if (response.data.success) {
        toast.success('Payment successful! Subscription activated.');
        setSubscription(response.data.subscription);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Payment verification failed');
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const response = await api.post('/api/admin/subscription/cancel', {
        reason: 'User requested cancellation'
      });
      
      if (response.data.success) {
        toast.success('Subscription cancelled successfully');
        // Refresh the page after successful cancellation
        window.location.reload();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async () => {
    if (!window.confirm('Are you sure you want to reactivate your subscription?')) {
      return;
    }

    try {
      const response = await api.post('/api/admin/subscription/reactivate');
      
      if (response.data.success) {
        toast.success('Subscription reactivated successfully');
        // Refresh the page after successful reactivation
        window.location.reload();
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Failed to reactivate subscription');
    }
  };

  const handleRenewalPayment = async () => {
    try {
      setRenewalLoading(true);
      
      // Create renewal order
      const response = await api.post('/api/admin/subscription/renewal', {
        plan: subscription.plan || 'professional'
      });
      
      if (response.data.success) {
        const { orderId, amount, currency } = response.data;
        
        // Check if it's a mock order (development mode)
        if (orderId.startsWith('mock_')) {
          console.log('Mock renewal order detected, simulating successful payment...');
          
          // Simulate successful payment for mock orders
          setTimeout(async () => {
            try {
              // For mock orders, directly call verify-renewal with mock data
              const verifyResponse = await api.post('/api/admin/subscription/verify-renewal', {
                orderId: orderId,
                paymentId: `mock_payment_${Date.now()}`,
                signature: 'mock_signature'
              });
              
              if (verifyResponse.data.success) {
                toast.success('Subscription renewed successfully! (Mock payment)');
                window.location.reload();
              } else {
                toast.error('Mock payment verification failed');
              }
            } catch (error) {
              console.error('Mock payment verification error:', error);
              toast.error('Mock payment verification failed');
            }
          }, 2000); // 2 second delay to simulate payment processing
          
          return;
        }
        
        // Load Razorpay script for real payments
        await loadRazorpayScript();
        
        // Create Razorpay options
        const options = createRazorpayOptions({
          order_id: orderId,
          amount: amount,
          currency: currency,
          name: 'Eventra Admin Subscription Renewal',
          description: `Renew ${subscription.plan} subscription`,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#3B82F6'
          }
        });
        
        // Open Razorpay modal
        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.success', async (response) => {
          try {
            // Verify payment
            const verifyResponse = await api.post('/api/admin/subscription/verify-renewal', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
            
            if (verifyResponse.data.success) {
              toast.success('Subscription renewed successfully!');
              window.location.reload();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        });
        
        razorpay.on('payment.failed', (response) => {
          console.error('Payment failed:', response.error);
          toast.error('Payment failed. Please try again.');
        });
        
        razorpay.open();
      } else {
        toast.error(response.data.message || 'Failed to create renewal order');
      }
    } catch (error) {
      console.error('Renewal payment error:', error);
      toast.error('Error processing renewal payment');
    } finally {
      setRenewalLoading(false);
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 499,
      period: 'month',
      features: [
        'Basic admin access',
        'User management (up to 100 users)',
        'Event management (up to 10 events/month)',
        'Basic analytics',
        'Email support'
      ],
      color: 'blue',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional Plan',
      price: 1499,
      period: 'month',
      features: [
        'Full admin access',
        'Unlimited user management',
        'Unlimited event management',
        'Advanced analytics dashboard',
        'QR attendance system',
        'Priority email support',
        'Custom branding'
      ],
      color: 'purple',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 4999,
      period: 'month',
      features: [
        'Everything in Professional Plan',
        'API access',
        '24/7 phone support',
        'Custom integrations',
        'White-label solution',
        'Dedicated account manager',
        'Advanced security features'
      ],
      color: 'gold',
      popular: false
    }
  ];

  const features = [
    {
      icon: Users,
      title: 'User Management',
      description: 'Full access to manage all users, roles, and permissions'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive analytics and reporting dashboard'
    },
    {
      icon: QrCode,
      title: 'QR Attendance System',
      description: 'Complete attendance management with QR scanning'
    },
    {
      icon: Shield,
      title: 'Event Management',
      description: 'Create, manage, and monitor all events'
    },
    {
      icon: Zap,
      title: 'Priority Support',
      description: '24/7 priority support for all your needs'
    },
    {
      icon: Globe,
      title: 'API Access',
      description: 'Full API access for custom integrations'
    }
  ];

  // Show subscription plans for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Crown className="h-8 w-8 text-yellow-500 mr-3" />
            Become an Admin
          </h1>
          <p className="text-white">
            Get full access to manage all users and events with our premium admin subscription.
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">Admin Access Process:</span>
            </div>
            <p className="text-blue-700 mt-2 text-sm">
              1. Choose your plan → 2. Register/Login → 3. Complete face recognition → 4. Make payment → 5. Get admin access
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`bg-white rounded-xl shadow-lg p-8 border-2 transition-all duration-300 relative ${
                plan.popular 
                  ? 'border-purple-300 hover:border-purple-400' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 ${
                  plan.color === 'blue' ? 'bg-blue-100' :
                  plan.color === 'purple' ? 'bg-purple-100' :
                  'bg-yellow-100'
                }`}>
                  <Crown className={`h-8 w-8 ${
                    plan.color === 'blue' ? 'text-blue-600' :
                    plan.color === 'purple' ? 'text-purple-600' :
                    'text-yellow-600'
                  }`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
                <p className="text-gray-600">
                  {plan.id === 'basic' && 'Perfect for small organizations'}
                  {plan.id === 'professional' && 'Ideal for growing businesses'}
                  {plan.id === 'enterprise' && 'Best for large enterprises'}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

          <button
                onClick={() => {
                  // Store selected plan in localStorage for after registration
                  localStorage.setItem('selectedPlan', plan.id);
                  navigate('/register');
                }}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                    : plan.color === 'blue'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
                }`}
              >
                <Crown className="h-5 w-5 mr-2" />
                Get Started - {plan.name}
          </button>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="bg-gray-50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            What You Get as an Admin
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show different content for non-admins (registration page)
  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Crown className="h-8 w-8 text-yellow-500 mr-3" />
            Become an Admin
          </h1>
          <p className="text-white">
            Get full access to manage all users and events with our premium admin subscription.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
          <motion.div
              key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`bg-white rounded-xl shadow-lg p-8 border-2 transition-all duration-300 relative ${
                plan.popular 
                  ? 'border-purple-300 hover:border-purple-400' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
              )}

            <div className="text-center mb-6">
                <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 ${
                  plan.color === 'blue' ? 'bg-blue-100' :
                  plan.color === 'purple' ? 'bg-purple-100' :
                  'bg-yellow-100'
                }`}>
                  <Crown className={`h-8 w-8 ${
                    plan.color === 'blue' ? 'text-blue-600' :
                    plan.color === 'purple' ? 'text-purple-600' :
                    'text-yellow-600'
                  }`} />
              </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                  <span className="text-gray-600">/{plan.period}</span>
              </div>
                <p className="text-gray-600">
                  {plan.id === 'basic' && 'Perfect for small organizations'}
                  {plan.id === 'professional' && 'Ideal for growing businesses'}
                  {plan.id === 'enterprise' && 'Best for large enterprises'}
                </p>
            </div>

            <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
              </li>
                ))}
            </ul>

            <button
                onClick={() => handlePayment(plan.id)}
              disabled={paymentLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center disabled:opacity-50 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                    : plan.color === 'blue'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
                }`}
            >
              {paymentLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                    Subscribe {plan.name}
                </>
              )}
            </button>
          </motion.div>
          ))}

        </div>

        {/* Features Grid */}
        <div className="bg-gray-50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            What You Get as an Admin
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-4"
              >
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Crown className="h-8 w-8 text-yellow-500 mr-3" />
          Admin Subscription Management
        </h1>
        <p className="text-white">
          Manage your premium admin subscription to access all advanced features.
        </p>
      </div>

      {subscription ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Current Subscription</h2>
              <p className="text-gray-600">Manage your subscription details</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              subscription.subscriptionStatus === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {subscription.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
            </div>
          </div>

          {/* Renewal Warning */}
          {needsRenewal() && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    <strong>Subscription Expiring Soon!</strong> Your subscription will expire in {subscription.daysRemaining} days. 
                    Click "Renew Subscription" to extend your access and avoid service interruption.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CreditCard className="h-5 w-5 text-black mr-2" />
                <span className="font-medium text-black underline">Plan</span>
              </div>
              <p className="text-2xl font-bold text-black">
                ₹{subscription.amount}/{subscription.subscriptionType === 'yearly' ? 'year' : 'month'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-black mr-2" />
                <span className="font-medium text-black underline">Days Remaining</span>
              </div>
              <p className="text-2xl font-bold text-black">
                {subscription.daysRemaining > 999 ? '∞' : `${subscription.daysRemaining} days`}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-black mr-2" />
                <span className="font-medium text-black underline">Next Billing Date</span>
              </div>
              <p className="text-2xl font-bold text-black">
                {new Date(subscription.nextBillingDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            {needsRenewal() ? (
              <>
                <button
                  onClick={handleRenewalPayment}
                  disabled={renewalLoading}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-lg border-2 border-orange-300"
                >
                  {renewalLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing Renewal...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Crown className="h-5 w-5 mr-2" />
                      🔄 Renew Subscription
                    </div>
                  )}
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel Subscription
                </button>
              </>
            ) : subscription.status === 'cancelled' ? (
              <button
                onClick={handleReactivateSubscription}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Reactivate Subscription
              </button>
            ) : (
              <button
                onClick={handleCancelSubscription}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Subscription
              </button>
            )}
            <button
              onClick={fetchSubscriptionStatus}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-gray-600">Get full access to all admin features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.02 }}
                className={`relative bg-white rounded-xl shadow-lg p-6 border-2 ${
                  selectedPlan === plan.id 
                    ? 'border-blue-500' 
                    : 'border-gray-200'
                } ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <button
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      selectedPlan === plan.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </button>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleCreatePayment}
              disabled={paymentLoading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paymentLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Subscribe Now'
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Premium Admin Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-4">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSubscription;
