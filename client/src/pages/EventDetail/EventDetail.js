import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  ArrowLeft,
  Share2,
  Heart,
  Bookmark,
  User,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import { useAuth } from '../../contexts/AuthContext';
import useCustomToast from '../../utils/customToast';
import { CATEGORY_IMAGES } from '../../utils/imageConstants';

const EventDetail = () => {
  const toast = useCustomToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isAlreadyBooked, setIsAlreadyBooked] = useState(false);
  const [checkingBooking, setCheckingBooking] = useState(false);

  useEffect(() => {
    fetchEvent();
    if (isAuthenticated) {
      checkBookingStatus();
    }
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [id, isAuthenticated]);

  const checkBookingStatus = async () => {
    try {
      setCheckingBooking(true);
      const response = await api.get('/api/bookings');
      const bookings = response.data.bookings || [];
      const booked = bookings.some(b => b.event?._id === id && b.status === 'confirmed');
      setIsAlreadyBooked(booked);
    } catch (error) {
      
    } finally {
      setCheckingBooking(false);
    }
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      // Try public route first
      const response = await api.get(`/api/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      
      // If public route fails, try admin route (for draft events)
      try {
        const adminResponse = await api.get(`/api/admin/events/${id}`);
        setEvent(adminResponse.data);
      } catch (adminError) {
        
        toast.error('Failed to fetch event details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed like' : 'Liked event');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href
        });
      } catch (error) {
        
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'text-green-400 bg-green-400/20';
      case 'draft': return 'text-yellow-400 bg-yellow-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/20';
      case 'completed': return 'text-blue-400 bg-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-64 mb-8"></div>
          <div className="bg-gray-800 p-8 rounded-xl">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Event Not Found</h2>
          <p className="text-gray-400 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/events"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/events"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </Link>
        </motion.div>

        {/* Event Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-8"
        >
          {/* Event Image */}
          {true && (
            <div className="h-64 bg-gray-700 flex items-center justify-center">
              <img
                src={event.image || CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES.Default}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{event.title}</h1>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-gray-400 text-lg">{event.category}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-lg transition-colors ${
                    isLiked ? 'text-red-400 bg-red-400/20' : 'text-gray-400 hover:text-red-400'
                  }`}
                  title="Like Event"
                >
                  <Heart className="h-5 w-5" />
                </button>
                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-lg transition-colors ${
                    isBookmarked ? 'text-yellow-400 bg-yellow-400/20' : 'text-gray-400 hover:text-yellow-400'
                  }`}
                  title="Bookmark Event"
                >
                  <Bookmark className="h-5 w-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors"
                  title="Share Event"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium">Start Date</p>
                    <p className="text-sm">{formatDate(event.dateTime.start)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium">End Date</p>
                    <p className="text-sm">{formatDate(event.dateTime.end)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium">Venue</p>
                    <p className="text-sm">{event.venue.name}, {event.venue.city}</p>
                    {event.venue.address && (
                      <p className="text-xs text-gray-400">{event.venue.address}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Users className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className="text-sm">{event.availableSeats}/{event.capacity} seats available</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <DollarSign className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium">Price</p>
                    <p className="text-sm font-bold text-green-400">
                      {event.price === 0 ? 'Free' : formatCurrency(event.price)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium">Registration Deadline</p>
                    <p className="text-sm">{formatDate(event.registrationDeadline)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Button */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  if (isAlreadyBooked) {
                    toast.warning('You have already booked this event', { duration: 4000 });
                    setTimeout(() => {
                      navigate('/dashboard');
                    }, 4000);
                  } else {
                    navigate(`/payment/${id}`);
                  }
                }}
                disabled={checkingBooking}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isAlreadyBooked 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                }`}
              >
                {checkingBooking ? 'Checking...' : isAlreadyBooked ? 'Already Booked' : 'Book Now'}
              </button>
              <button className="px-6 py-3 border border-gray-600 text-gray-300 hover:border-gray-500 rounded-lg transition-colors">
                Add to Calendar
              </button>
            </div>
          </div>
        </motion.div>

        {/* Event Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">About This Event</h2>
          <div 
            className="text-gray-300 prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        </motion.div>

        {/* Organizer Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Organizer</h2>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{event.organizer?.name || 'Event Organizer'}</h3>
              <p className="text-gray-400">{event.organizer?.email || 'organizer@eventra.com'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-cyan-400 transition-colors" title="Call">
                <Phone className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-cyan-400 transition-colors" title="Email">
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Event Requirements */}
        {event.requirements && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-xl border border-gray-700 p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Requirements</h2>
            <div className="space-y-4">
              {event.requirements.minAge && (
                <div className="flex items-center space-x-3 text-gray-300">
                  <Users className="h-5 w-5 text-cyan-400" />
                  <span>Minimum age: {event.requirements.minAge} years</span>
                </div>
              )}
              {event.requirements.dressCode && (
                <div className="flex items-center space-x-3 text-gray-300">
                  <User className="h-5 w-5 text-cyan-400" />
                  <span>Dress code: {event.requirements.dressCode}</span>
                </div>
              )}
              {event.requirements.itemsToBring && event.requirements.itemsToBring.length > 0 && (
                <div className="flex items-start space-x-3 text-gray-300">
                  <ExternalLink className="h-5 w-5 text-cyan-400 mt-1" />
                  <div>
                    <span className="block mb-2">Items to bring:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {event.requirements.itemsToBring.map((item, index) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
    </div>
  );
};

export default EventDetail;