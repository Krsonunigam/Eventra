import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, Search, Filter, CalendarDays, X } from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import { formatDateIST, formatTimeIST, formatDateTimeIST, getTimeDifferenceIST } from '../../utils/timezoneUtils';

const Events = () => {
  const toast = useCustomToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [tempDate, setTempDate] = useState(''); // Temporary date for date picker input
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'price', 'title'
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const categories = [
    'Technology', 'Sports', 'Music', 'Art', 'Business', 
    'Science', 'Literature', 'Gaming', 'Photography', 'Dance'
  ];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchEvents();
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm, selectedCategory, selectedDate]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDatePicker && !event.target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedDate && { date: selectedDate })
      };

      const response = await api.get('/api/events', { params });
      let fetchedEvents = response.data.events;
      
      // Sort events by date (upcoming first)
      fetchedEvents = fetchedEvents.sort((a, b) => {
        const dateA = new Date(a.dateTime.start);
        const dateB = new Date(b.dateTime.start);
        return dateA - dateB;
      });
      
      setEvents(fetchedEvents);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return formatDateIST(dateString);
  };

  const formatTime = (dateString) => {
    return formatTimeIST(dateString);
  };

  // Get dynamic background based on event category
  const getCategoryBackground = (category) => {
    const backgrounds = {
      'Technology': 'bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900',
      'Sports': 'bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900',
      'Music': 'bg-gradient-to-br from-pink-900 via-rose-900 to-red-900',
      'Art': 'bg-gradient-to-br from-yellow-900 via-orange-900 to-amber-900',
      'Business': 'bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900',
      'Science': 'bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900',
      'Literature': 'bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900',
      'Gaming': 'bg-gradient-to-br from-purple-900 via-violet-900 to-fuchsia-900',
      'Photography': 'bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900',
      'Dance': 'bg-gradient-to-br from-pink-900 via-purple-900 to-violet-900',
      'Conference': 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900',
      'Workshop': 'bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900',
      'Seminar': 'bg-gradient-to-br from-orange-900 via-amber-900 to-yellow-900'
    };
    return backgrounds[category] || 'bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900';
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'Technology': '💻',
      'Sports': '⚽',
      'Music': '🎵',
      'Art': '🎨',
      'Business': '💼',
      'Science': '🔬',
      'Literature': '📚',
      'Gaming': '🎮',
      'Photography': '📸',
      'Dance': '💃',
      'Conference': '🎤',
      'Workshop': '🔧',
      'Seminar': '📊'
    };
    return icons[category] || '📅';
  };

  const formatDateForInput = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const clearDateFilter = () => {
    setSelectedDate('');
    setShowDatePicker(false);
  };

  const handleDateSelect = (date) => {
    setTempDate(date);
    // Don't trigger API call here - wait for apply
  };

  const applyDateFilter = () => {
    setSelectedDate(tempDate); // Apply the temporary date
    setCurrentPage(1); // Reset to first page when applying filter
    setShowDatePicker(false);
  };

  const cancelDateFilter = () => {
    setTempDate(selectedDate); // Reset to current selected date
    setShowDatePicker(false);
  };

  const handleDateKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyDateFilter();
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-4 w-3/4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Discover Events</h1>
          <p className="text-xl text-gray-400">Find and book amazing events near you</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by event name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none min-w-[180px]"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative date-picker-container">
                <button
                  onClick={() => {
                    setTempDate(selectedDate); // Initialize temp date with current selection
                    setShowDatePicker(!showDatePicker);
                  }}
                  className={`px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                    selectedDate ? 'ring-2 ring-cyan-500' : ''
                  }`}
                >
                  <CalendarDays className="h-5 w-5" />
                  {selectedDate ? formatDate(selectedDate) : 'Select Date'}
                  {selectedDate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearDateFilter();
                      }}
                      className="ml-2 hover:bg-gray-600 rounded p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </button>

                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-4 min-w-[320px]"
                  >
                    <div className="space-y-4">
                      <h4 className="text-white font-medium mb-2">Filter by Date</h4>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Select Date</label>
                        <input
                          type="date"
                          min={getTodayDate()}
                          value={tempDate}
                          onChange={(e) => handleDateSelect(e.target.value)}
                          onKeyPress={handleDateKeyPress}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Press Enter to apply filter</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDateSelect(getTodayDate())}
                          className="px-3 py-1 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-700 transition-colors"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => handleDateSelect('')}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500 transition-colors"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Apply/Cancel Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-gray-700">
                        <button
                          onClick={applyDateFilter}
                          className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                        >
                          Apply Filter
                        </button>
                        <button
                          onClick={cancelDateFilter}
                          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory || selectedDate || debouncedSearchTerm) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {debouncedSearchTerm && (
                <span className="px-3 py-1 bg-cyan-600 text-white rounded-full text-sm flex items-center gap-2">
                  Search: "{debouncedSearchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:bg-cyan-700 rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm flex items-center gap-2">
                  Category: {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="hover:bg-blue-700 rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedDate && (
                <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm flex items-center gap-2">
                  Date: {formatDate(selectedDate)}
                  <button
                    onClick={clearDateFilter}
                    className="hover:bg-green-700 rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Group events by date */}
            {(() => {
              const groupedEvents = events.reduce((groups, event) => {
                const eventDate = new Date(event.dateTime.start).toDateString();
                if (!groups[eventDate]) {
                  groups[eventDate] = [];
                }
                groups[eventDate].push(event);
                return groups;
              }, {});

              return Object.entries(groupedEvents)
                .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                .map(([date, eventsForDate]) => (
                  <div key={date} className="space-y-4">
                    {/* Date Header */}
                    <div className="flex items-center gap-4">
                      <div className="h-px bg-gray-700 flex-1"></div>
                      <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                      </div>
                      <div className="h-px bg-gray-700 flex-1"></div>
                    </div>

                    {/* Events for this date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {eventsForDate.map((event, index) => (
                        <motion.div
                          key={event._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="bg-gray-800 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-105"
                        >
                          {/* Event Image with Dynamic Background */}
                          <div className="relative h-48 overflow-hidden">
                            {event.image ? (
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                            ) : null}
                            
                            {/* Dynamic Background based on category */}
                            <div 
                              className={`absolute inset-0 ${getCategoryBackground(event.category)} ${
                                event.image ? 'opacity-0' : 'opacity-100'
                              } transition-opacity duration-300`}
                              style={{
                                backgroundImage: event.image ? 'none' : `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))`
                              }}
                            >
                              {/* Category Icon Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-6xl opacity-20">
                                  {getCategoryIcon(event.category)}
                                </div>
                              </div>
                              
                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                              
                              {/* Event Title Overlay */}
                              <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-white text-lg font-bold mb-1 overflow-hidden" style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}>
                                  {event.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-white/80 text-sm">
                                    {getCategoryIcon(event.category)} {event.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-cyan-500 text-white text-xs font-semibold rounded-full">
                                  {event.category}
                                </span>
                                <span className="text-white/60 text-sm">
                                  {getCategoryIcon(event.category)}
                                </span>
                              </div>
                              <span className="text-2xl font-bold text-white">
                                ₹{event.price}
                              </span>
                            </div>
                            
                            <div className="text-gray-400 text-sm mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: event.description }}></div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-gray-300">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span className="text-sm">
                                  {formatDate(event.dateTime.start)}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-300">
                                <Clock className="h-4 w-4 mr-2" />
                                <span className="text-sm">
                                  {formatTime(event.dateTime.start)} - {formatTime(event.dateTime.end)}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-300">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span className="text-sm">{event.venue.name}</span>
                              </div>
                              <div className="flex items-center text-gray-300">
                                <Users className="h-4 w-4 mr-2" />
                                <span className="text-sm">
                                  {event.availableSeats} seats available
                                </span>
                              </div>
                            </div>
                            
                            <Link
                              to={`/events/${event._id}`}
                              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 text-center block"
                            >
                              View Details
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
            })()}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === index + 1
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
