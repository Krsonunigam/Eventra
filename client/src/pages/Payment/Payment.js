import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  ArrowLeft,
  Download,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  User,
  Mail
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import { useAuth } from '../../contexts/AuthContext';

const Payment = () => {
  const toast = useCustomToast();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    fetchEvent();
    loadRazorpayScript();
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [eventId]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/events/${eventId}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to fetch event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      
      console.log('Creating booking for event:', eventId);
      console.log('User token available:', localStorage.getItem('token') ? 'Yes' : 'No');
      // Create booking first
      const bookingResponse = await api.post('/api/bookings', {
        eventId: eventId,
        quantity: 1
      });
      
      const booking = bookingResponse.data.booking;
      const isFreeEvent = bookingResponse.data.isFreeEvent;
      setBooking(booking);

      // Handle free events
      if (isFreeEvent) {
        setPaymentSuccess(true);
        toast.success('Free event booked successfully! Your event pass is ready.');
        
        // Generate and download PDF
        await generateEventPass(booking._id);
        setPaymentLoading(false);
        return;
      }

      // For paid events, initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_RLZEezKE8Hb6gt',
        amount: event.price * 100, // Convert to paise
        currency: 'INR',
        name: 'Eventra',
        description: `Booking for ${event.title}`,
        order_id: booking.razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await api.post('/api/bookings/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });

            if (verifyResponse.data.success) {
              setPaymentSuccess(true);
              toast.success('Payment successful! Your event pass is ready.');
              
              // Generate and download PDF
              await generateEventPass(booking._id);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phoneNumber || ''
        },
        theme: {
          color: '#06b6d4'
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
      });

      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to process payment';
      toast.error(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const generateEventPass = async (bookingId) => {
    try {
      console.log('Generating event pass for booking:', bookingId);
      const response = await api.get(`/api/bookings/${bookingId}/pass`, {
        responseType: 'blob'
      });
      
      console.log('PDF response received:', response);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-pass-${event.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('PDF download initiated successfully');
    } catch (error) {
      console.error('Error generating event pass:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to generate event pass: ${error.response?.data?.message || error.message}`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
              <p className="text-gray-300 mb-6">
                Your event pass has been generated and downloaded. You can also access it anytime from your bookings.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/bookings')}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
                >
                  View My Bookings
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 border border-gray-600 text-gray-300 hover:border-gray-500 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Event
          </button>
          <h1 className="text-3xl font-bold text-white">Complete Your Booking</h1>
          <p className="text-gray-400">Secure payment powered by Razorpay</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Event Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                <div className="text-gray-400 text-sm" dangerouslySetInnerHTML={{ __html: event.description }}></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm">{formatDate(event.dateTime.start)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 text-gray-300">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm">{formatTime(event.dateTime.start)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium">Venue</p>
                    <p className="text-sm">{event.venue.name}, {event.venue.city}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Payment Details</h2>
            
            {/* User Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Attendee Information</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 text-gray-300">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span>{user?.name}</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Price Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-300">
                  <span>Event Ticket</span>
                  <span>{formatCurrency(event.price)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Processing Fee</span>
                  <span>Free</span>
                </div>
                <hr className="border-gray-600" />
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(event.price)}</span>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={paymentLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {paymentLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay {formatCurrency(event.price)}
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-4 flex items-center text-gray-400 text-sm">
              <Shield className="h-4 w-4 mr-2" />
              <span>Your payment is secured by Razorpay</span>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
            <Download className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Instant Event Pass</h3>
            <p className="text-gray-400 text-sm">Get your personalized event pass immediately after payment</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
            <QrCode className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">QR Code Verification</h3>
            <p className="text-gray-400 text-sm">Secure QR code for easy event entry and verification</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
            <Shield className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Secure Payment</h3>
            <p className="text-gray-400 text-sm">Protected by industry-standard encryption</p>
          </div>
        </motion.div>
    </div>
  );
};

export default Payment;
