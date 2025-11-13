// Example component showing how to use Razorpay integration
import React, { useState } from 'react';
import { loadRazorpayScript, createRazorpayOptions, openRazorpayModal } from '../../utils/razorpay';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';

const RazorpayExample = () => {
  const toast = useCustomToast();
  const [loading, setLoading] = useState(false);

  const handlePayment = async (amount, plan) => {
    setLoading(true);
    try {
      // 1. Load Razorpay script
      await loadRazorpayScript();
      
      // 2. Create order on your backend
      const response = await api.post('/api/admin/subscription/order', { plan });
      const { orderId, currency, amount: orderAmount, key } = response.data;

      // 3. Create Razorpay options
      const options = createRazorpayOptions(
        { orderId, currency, amount: orderAmount, key },
        { name: 'User Name', email: 'user@example.com' }
      );

      // 4. Define success handler
      const onSuccess = async (response) => {
        try {
          await api.post('/api/admin/subscription/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          toast.success('Payment successful!');
        } catch (error) {
          toast.error('Payment verification failed');
        }
      };

      // 5. Define error handler
      const onError = (error) => {
        console.error('Payment error:', error);
        toast.error('Payment failed');
      };

      // 6. Open Razorpay modal
      openRazorpayModal(options, onSuccess, onError);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Razorpay Integration Example</h2>
      
      <div className="space-y-4">
        <button
          onClick={() => handlePayment(100000, 'monthly')}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay ₹1000 (Monthly)'}
        </button>
        
        <button
          onClick={() => handlePayment(1000000, 'yearly')}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay ₹10000 (Yearly)'}
        </button>
      </div>
    </div>
  );
};

export default RazorpayExample;
