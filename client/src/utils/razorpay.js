// Razorpay utility functions
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

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

export const createRazorpayOptions = (orderData, userData = {}) => {
  const { orderId, currency, amount, key } = orderData;
  
  return {
    key: key,
    amount: amount,
    currency: currency,
    name: 'Eventra Admin Subscription',
    description: 'Premium Admin Access',
    order_id: orderId,
    prefill: {
      name: userData.name || 'Admin User',
      email: userData.email || 'admin@eventra.com',
      contact: userData.contact || ''
    },
    theme: {
      color: '#3B82F6'
    },
    modal: {
      ondismiss: () => {
        console.log('Payment modal dismissed');
      }
    },
    notes: {
      address: 'Eventra Admin Subscription'
    }
  };
};

export const openRazorpayModal = (options, onSuccess, onError) => {
  const razorpay = new window.Razorpay({
    ...options,
    handler: async (response) => {
      try {
        await onSuccess(response);
      } catch (error) {
        console.error('Payment handler error:', error);
        onError(error);
      }
    }
  });
  
  razorpay.open();
};
