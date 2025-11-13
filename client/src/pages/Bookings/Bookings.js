import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  User,
  CreditCard,
  QrCode,
  Phone,
  Mail,
  X,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';

const Bookings = () => {
  const toast = useCustomToast();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    // Check for filter parameter in URL
    const urlFilter = searchParams.get('filter');
    if (urlFilter) {
      setFilter(urlFilter);
    }
    fetchBookings();
  }, [searchParams]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
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
      link.download = `event-pass-${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Event pass downloaded successfully');
    } catch (error) {
      console.error('Error generating event pass:', error);
      toast.error('Failed to generate event pass');
    }
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
    setCopiedCode(false);
  };

  const copyVerificationCode = async () => {
    if (selectedBooking?.verificationCode) {
      try {
        await navigator.clipboard.writeText(selectedBooking.verificationCode);
        setCopiedCode(true);
        toast.success('Verification code copied to clipboard');
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (error) {
        toast.error('Failed to copy verification code');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'refunded':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = booking.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.event?.venue?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    refunded: bookings.filter(b => b.status === 'refunded').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
          <p className="text-gray-400">Manage and view all your event bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <motion.div
              key={status}
              whileHover={{ scale: 1.05 }}
              className={`p-4 rounded-lg ${
                filter === status 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              } cursor-pointer transition-colors`}
              onClick={() => setFilter(status)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">{status}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                {getStatusIcon(status)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings by event name or venue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={fetchBookings}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'You haven\'t booked any events yet'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredBookings.map((booking) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {booking.event?.image ? (
                        <img
                          src={booking.event.image}
                          alt={booking.event.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                          <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {booking.event?.title || 'Event not found'}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{booking.event?.venue?.name || 'Venue not specified'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {booking.event?.dateTime?.start 
                                ? `${formatDate(booking.event.dateTime.start)} at ${formatTime(booking.event.dateTime.start)}`
                                : 'Date not specified'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(booking.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>Amount: {formatCurrency(booking.totalAmount)}</p>
                        <p>Quantity: {booking.quantity}</p>
                        <p>Booked: {formatDate(booking.createdAt)}</p>
                        {booking.paymentDate && (
                          <p>Paid: {formatDate(booking.paymentDate)}</p>
                        )}
                        {booking.attendanceMarked && (
                          <p className="text-green-400">✓ Attendance marked</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => generateEventPass(booking._id)}
                          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download Pass
                        </button>
                      )}
                      
                      <button
                        onClick={() => viewBookingDetails(booking)}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR Code Info for Confirmed Bookings */}
                {booking.status === 'confirmed' && booking.verificationCode && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        <p>Verification Code: <span className="text-white font-mono">{booking.verificationCode}</span></p>
                        <p>Use this code for event entry</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Booking Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedBooking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closeDetailsModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Booking Details</h2>
                    <p className="text-gray-400">Complete information about your booking</p>
                  </div>
                  <button
                    onClick={closeDetailsModal}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Event Information */}
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-cyan-400" />
                      Event Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400">Event Title</label>
                          <p className="text-white font-medium">{selectedBooking.event?.title || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Venue</label>
                          <p className="text-white flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {selectedBooking.event?.venue?.name || 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Date & Time</label>
                          <p className="text-white flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {selectedBooking.event?.dateTime?.start 
                              ? `${formatDate(selectedBooking.event.dateTime.start)} at ${formatTime(selectedBooking.event.dateTime.start)}`
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400">Event Price</label>
                          <p className="text-white font-medium">
                            {selectedBooking.event?.price ? formatCurrency(selectedBooking.event.price) : 'Free'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Category</label>
                          <p className="text-white">{selectedBooking.event?.category || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Organizer</label>
                          <p className="text-white">{selectedBooking.event?.organizer?.name || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Information */}
                  <div className="bg-gray-700/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-400" />
                      Booking Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400">Booking ID</label>
                          <p className="text-white font-mono text-sm">{selectedBooking._id}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Status</label>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(selectedBooking.status)}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                              {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Quantity</label>
                          <p className="text-white">{selectedBooking.quantity}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-400">Total Amount</label>
                          <p className="text-white font-semibold text-lg">{formatCurrency(selectedBooking.totalAmount)}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-gray-400">Booking Date</label>
                          <p className="text-white">{formatDate(selectedBooking.createdAt)}</p>
                        </div>
                        
                        {selectedBooking.paymentDate && (
                          <div>
                            <label className="text-sm text-gray-400">Payment Date</label>
                            <p className="text-white">{formatDate(selectedBooking.paymentDate)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verification Code */}
                  {selectedBooking.verificationCode && (
                    <div className="bg-gray-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-purple-400" />
                        Verification Code
                      </h3>
                      
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm text-gray-400">Your Verification Code</label>
                            <p className="text-white font-mono text-2xl font-bold mt-2">
                              {selectedBooking.verificationCode}
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                              Show this code at the event entrance
                            </p>
                          </div>
                          <button
                            onClick={copyVerificationCode}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                          >
                            {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copiedCode ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attendance Information */}
                  {selectedBooking.status === 'confirmed' && (
                    <div className="bg-gray-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        Attendance Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm text-gray-400">Attendance Status</label>
                          <p className={`font-medium ${selectedBooking.attendanceMarked ? 'text-green-400' : 'text-yellow-400'}`}>
                            {selectedBooking.attendanceMarked ? '✓ Marked Present' : 'Not Marked Yet'}
                          </p>
                        </div>
                        
                        {selectedBooking.attendanceTime && (
                          <div>
                            <label className="text-sm text-gray-400">Attendance Time</label>
                            <p className="text-white">
                              {formatDate(selectedBooking.attendanceTime)} at {formatTime(selectedBooking.attendanceTime)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Information */}
                  {selectedBooking.razorpayOrderId && (
                    <div className="bg-gray-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-400" />
                        Payment Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm text-gray-400">Order ID</label>
                          <p className="text-white font-mono text-sm">{selectedBooking.razorpayOrderId}</p>
                        </div>
                        
                        {selectedBooking.razorpayPaymentId && (
                          <div>
                            <label className="text-sm text-gray-400">Payment ID</label>
                            <p className="text-white font-mono text-sm">{selectedBooking.razorpayPaymentId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-700">
                  <div className="flex gap-3">
                    {selectedBooking.status === 'confirmed' && (
                      <button
                        onClick={() => generateEventPass(selectedBooking._id)}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Pass
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={closeDetailsModal}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Bookings;