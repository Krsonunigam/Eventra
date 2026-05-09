import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar,
  DollarSign,
  Shield,
  Zap
} from 'lucide-react';
import useCustomToast from '../../utils/customToast';
import api from '../../utils/axiosConfig';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { loadRazorpayScript, createRazorpayOptions, openRazorpayModal } from '../../utils/razorpay';

const SubscriptionManager = () => {
  const toast = useCustomToast();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptionStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/api/admin/subscription/status');
      if (response.data.success) {
        setSubscription(response.data.subscription || response.data);
        
        // Check if subscription is expiring soon (within 7 days)
        if (response.data.subscription) {
          const daysUntilExpiry = response.data.subscription.daysRemaining;
          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            setShowRenewalModal(true);
          }
        }
      }
    } catch (error) {
      
      if (error.response?.status === 401) {
        toast.error('Please login to access subscription features');
      } else if (error.response?.status === 404) {
        setSubscription(null);
      } else {
        toast.error('Failed to load subscription status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRenewal = async (planId) => {
    setPaymentLoading(true);
    try {
      await loadRazorpayScript();
      
      const response = await api.post('/api/admin/subscription/order', { plan: planId });
      const { orderId, currency, amount, key } = response.data;
      
      const options = createRazorpayOptions(
        { orderId, currency, amount, key },
        { name: user?.name, email: user?.email }
      );

      const onSuccess = async (response) => {
        try {
          await api.post('/api/admin/subscription/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          toast.success('Subscription renewed successfully!');
          fetchSubscriptionStatus();
          setShowRenewalModal(false);
        } catch (verifyError) {
          
          toast.error('Payment verification failed. Please contact support.');
        }
      };

      const onError = (error) => {
        
        toast.error('Payment failed. Please try again.');
      };

      openRazorpayModal(options, onSuccess, onError);
    } catch (error) {
      
      toast.error(error.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getSubscriptionStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSubscriptionStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <Crown className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-blue-800 mb-4">No Active Subscription</h2>
          <p className="text-blue-600 mb-6">
            You need an active subscription to access admin features.
          </p>
          <button
            onClick={() => navigate('/admin/subscription')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Crown className="h-8 w-8 text-yellow-500 mr-3" />
          Subscription Management
        </h1>
        <p className="text-gray-600">
          Manage your admin subscription and billing
        </p>
      </div>

      {/* Subscription Status Card */}
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
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${getSubscriptionStatusColor(subscription.status)}`}>
            {getSubscriptionStatusText(subscription.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Crown className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="font-semibold text-gray-900">Plan</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 capitalize">{subscription.plan}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-semibold text-gray-900">Amount</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{subscription.amount}</p>
            <p className="text-sm text-gray-600">per month</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-semibold text-gray-900">Next Billing</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {new Date(subscription.nextBillingDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              {subscription.daysRemaining} days remaining
            </p>
          </div>
        </div>

        {/* Warning for expiring subscription */}
        {subscription.daysRemaining <= 7 && subscription.status === 'active' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="font-semibold text-yellow-800">
                Subscription expires in {subscription.daysRemaining} days
              </span>
            </div>
            <p className="text-yellow-700 mt-2">
              Renew your subscription to continue accessing admin features.
            </p>
            <button
              onClick={() => setShowRenewalModal(true)}
              className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
            >
              Renew Now
            </button>
          </div>
        )}

        {/* Expired subscription warning */}
        {subscription.status === 'expired' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-semibold text-red-800">
                Subscription Expired
              </span>
            </div>
            <p className="text-red-700 mt-2">
              Your admin access has been suspended. Renew to restore access.
            </p>
            <button
              onClick={() => navigate('/admin/subscription')}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Renew Subscription
            </button>
          </div>
        )}
      </motion.div>

      {/* Renewal Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Renew Subscription</h3>
            <p className="text-gray-600 mb-6">
              Your subscription expires in {subscription.daysRemaining} days. Choose a plan to renew:
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleRenewal('basic')}
                disabled={paymentLoading}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Basic Plan - ₹499/month</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </button>
              
              <button
                onClick={() => handleRenewal('professional')}
                disabled={paymentLoading}
                className="w-full text-left p-3 border border-purple-300 rounded-lg hover:border-purple-400 transition-colors bg-purple-50"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Professional Plan - ₹1,499/month</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </button>
              
              <button
                onClick={() => handleRenewal('enterprise')}
                disabled={paymentLoading}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-yellow-300 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Enterprise Plan - ₹4,999/month</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRenewalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;

