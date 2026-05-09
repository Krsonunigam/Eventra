import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';

const ContactForm = () => {
  const toast = useCustomToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/contact', formData);
      if (response.data.success) {
        toast.success(response.data.message || "Message sent successfully! We'll get back to you soon.");
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-white font-medium mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-white font-medium mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
            placeholder="Enter your email"
          />
        </div>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Subject</label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
          placeholder="What's this about?"
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Message</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200 resize-none"
          placeholder="Tell us how we can help you..."
        />
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <Send className="h-5 w-5" />
        <span>{loading ? 'Sending...' : 'Send Message'}</span>
      </motion.button>
    </form>
  );
};

export default ContactForm;
