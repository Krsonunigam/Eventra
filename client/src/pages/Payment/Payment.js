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
const { user, isAuthenticated } = useAuth();
const [isCheckingBooking, setIsCheckingBooking] = useState(false);

const [event, setEvent] = useState(null);
const [loading, setLoading] = useState(true);
const [paymentLoading, setPaymentLoading] = useState(false);
const [paymentSuccess, setPaymentSuccess] = useState(false);
const [booking, setBooking] = useState(null);

useEffect(() => {
if (isAuthenticated) {
checkExistingBooking();
}
fetchEvent();
loadRazorpayScript();
window.scrollTo(0, 0);
}, [eventId, isAuthenticated]);

const checkExistingBooking = async () => {
try {
setIsCheckingBooking(true);
const response = await api.get('/api/bookings');
const bookings = response.data.bookings || [];
const alreadyBooked = bookings.some(b => 
b.event?._id === eventId && b.status === 'confirmed'
);

if (alreadyBooked) {
  toast.warning('You have already booked this event', { duration: 4000 });
  setTimeout(() => {
    navigate('/dashboard');
  }, 4000);
}
} catch (error) {

} finally {
setIsCheckingBooking(false);
}
};

const loadRazorpayScript = () => {
return new Promise((resolve) => {
const script = document.createElement('script');
script.src = 'https://checkout.razorpay.com/v1/checkout.js';
script.onload = () => resolve(true);
script.onerror = () => resolve(false);
document.body.appendChild(script);
});
};

const fetchEvent = async () => {
try {
setLoading(true);
const response = await api.get(`/api/events/${eventId}`);
setEvent(response.data);
} catch (error) {
toast.error('Failed to fetch event details');
navigate('/events');
} finally {
setLoading(false);
}
};

const handlePayment = async () => {
try {
setPaymentLoading(true);


  if (event.price === 0) {
    const res = await api.post('/api/bookings', {
      eventId,
      quantity: 1
    });

    const bookingData = res.data.booking;
    setBooking(bookingData);
    setPaymentSuccess(true);
    toast.success('Free event booked successfully');

    await generateEventPass(bookingData._id);
    setPaymentLoading(false);
    return;
  }

  const isLocalMock = !process.env.REACT_APP_RAZORPAY_KEY_ID || !window.Razorpay;

    const { data } = await api.post('/api/payments/create-order', {
      eventId,
      quantity: 1
    });

    if (isLocalMock) {
      toast.info("Simulating payment on local server...");
      
      const mockPaymentId = "pay_mock_" + Math.random().toString(36).substring(2, 9);
      const res = await api.post("/api/payments/verify", {
        razorpay_order_id: data.order.id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: "signature_mock",
        bookingId: data.bookingId
      });

      setBooking(res.data.booking);
      setPaymentSuccess(true);
      toast.success("Simulated local payment successful!");
      await generateEventPass(res.data.booking._id);
      setPaymentLoading(false);
      return;
    }

  const options = {
  key: process.env.REACT_APP_RAZORPAY_KEY_ID,
  amount: data.order.amount,
  currency: "INR",
  name: "Eventra",
  description: "Event Booking",
  order_id: data.order.id,

  handler: async function (response) {
    try {
      const res = await api.post("/api/payments/verify", {
        ...response,
        bookingId: data.bookingId
      });

      setBooking(res.data.booking);
      setPaymentSuccess(true);

      toast.success("Payment successful");

      await generateEventPass(res.data.booking._id);

    } catch (err) {
      toast.error("Payment verification failed");
    } finally {
      setPaymentLoading(false);
    }
  },

  modal: {
    ondismiss: function () {
      setPaymentLoading(false);
    }
  },

  prefill: {
    name: user?.name,
    email: user?.email
  },

  theme: {
    color: "#06b6d4"
  }
};

  const rzp = new window.Razorpay(options);

  rzp.on('payment.failed', function (response) {
    toast.error(response.error.description);
    setPaymentLoading(false);
  });

  rzp.open();

} catch (error) {
  toast.error(error.response?.data?.message || 'Payment failed');
  setPaymentLoading(false);
}


};

const generateEventPass = async (bookingId) => {
try {
const response = await api.get(`/api/bookings/${bookingId}/pass`, {
responseType: 'blob'
});

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `event-pass-${event.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

} catch (error) {
  toast.error('Failed to generate event pass');
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

if (loading || isCheckingBooking) {
return ( <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]"> 
<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mb-4"></div>
<p className="text-gray-400 font-medium animate-pulse">
{isCheckingBooking ? 'Checking your bookings...' : 'Loading event details...'}
</p>
</div>
);
}

if (paymentSuccess) {
return ( <div className="max-w-4xl mx-auto">
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center"> <div className="bg-gray-800 rounded-xl border border-gray-700 p-8"> <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" /> <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1> <p className="text-gray-300 mb-6">
Your event pass has been generated and downloaded. You can also access it anytime from your bookings. </p> <div className="flex flex-col sm:flex-row gap-4 justify-center">
<button onClick={() => navigate('/bookings')} className="px-6 py-3 bg-cyan-500 text-white rounded-lg">
View My Bookings </button>
<button onClick={() => navigate('/dashboard')} className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg">
Go to Dashboard </button> </div> </div>
</motion.div> </div>
);
}

return ( <div className="max-w-4xl mx-auto">
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
<button onClick={() => navigate(-1)} className="flex items-center text-gray-400 mb-4"> <ArrowLeft className="h-5 w-5 mr-2" />
Back to Event </button> <h1 className="text-3xl font-bold text-white">Complete Your Booking</h1> <p className="text-gray-400">Secure payment powered by Razorpay</p>
</motion.div>


  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Event Details</h2>

      <div>
        <h3 className="text-lg font-semibold text-white">{event.title}</h3>
        <div className="text-gray-400 text-sm" dangerouslySetInnerHTML={{ __html: event.description }}></div>
      </div>

      <div className="space-y-3 mt-4">
        <div className="flex items-center space-x-3 text-gray-300">
          <Calendar className="h-5 w-5 text-cyan-400" />
          <p>{formatDate(event.dateTime.start)}</p>
        </div>
        <div className="flex items-center space-x-3 text-gray-300">
          <Clock className="h-5 w-5 text-cyan-400" />
          <p>{formatTime(event.dateTime.start)}</p>
        </div>
        <div className="flex items-center space-x-3 text-gray-300">
          <MapPin className="h-5 w-5 text-cyan-400" />
          <p>{event.venue.name}, {event.venue.city}</p>
        </div>
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Payment Details</h2>

      <button
        onClick={handlePayment}
        disabled={paymentLoading}
        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-lg"
      >
        {paymentLoading ? "Processing..." : `Pay ${formatCurrency(event.price)}`}
      </button>

      <div className="mt-4 flex items-center text-gray-400 text-sm">
        <Shield className="h-4 w-4 mr-2" />
        <span>Your payment is secured by Razorpay</span>
      </div>
    </motion.div>
  </div>
</div>


);
};

export default Payment;
