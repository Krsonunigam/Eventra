import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit } from 'lucide-react';
import api from '../../utils/axiosConfig';
import EventForm from '../../components/Forms/EventForm';

const EventEdit = () => {
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/api/admin/events/${id}`);
        console.log('Fetched event data:', response.data);
        setEventData(response.data);
      } catch (error) {
        console.error('Error fetching event:', error);
        navigate('/admin/events');
      } finally {
        setLoadingEvent(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // Handle image upload if present
      let imageUrl = eventData?.image || '';
      if (formData.bannerImage && formData.bannerImage instanceof File) {
        console.log('Uploading new image...');
        const uploadFormData = new FormData();
        uploadFormData.append('eventImage', formData.bannerImage);
        
        const uploadResponse = await api.post('/api/upload/event', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadResponse.data.url;
        console.log('Image uploaded successfully:', imageUrl);
      } else if (formData.bannerImage === null) {
        // If banner was removed, set to empty string
        imageUrl = '';
        console.log('Image removed');
      } else {
        // Keep existing image
        console.log('Keeping existing image:', imageUrl);
      }

      // Prepare the event data
      const updatedEventData = {
        title: formData.title,
        description: formData.description,
        venue: {
          name: formData.venue.name,
          address: formData.venue.address || '',
          city: formData.venue.city,
          coordinates: formData.venue.coordinates || { latitude: null, longitude: null }
        },
        dateTime: {
          start: new Date(formData.dateTime.start),
          end: new Date(formData.dateTime.end)
        },
        price: Math.round(parseFloat(formData.price) * 100) / 100 || 0,
        capacity: parseInt(formData.capacity) || 1,
        availableSeats: parseInt(formData.capacity) || 1,
        category: formData.category,
        registrationDeadline: new Date(formData.registrationDeadline),
        cancellationPolicy: {
          allowCancellation: formData.allowCancellation || true,
          cancellationDeadline: formData.cancellationDeadline ? new Date(formData.cancellationDeadline) : null,
          refundPercentage: parseInt(formData.refundPercentage) || 100
        },
        requirements: {
          minAge: parseInt(formData.minAge) || 18
        },
        tags: formData.tags || [],
        detailedSchedule: formData.detailedSchedule || [],
        sponsors: formData.sponsors || [],
        organizerContact: formData.organizerContact || {},
        organizer: eventData.organizer._id || eventData.organizer, // Extract ObjectId from organizer object
        image: imageUrl
      };

      console.log('Updating event with data:', JSON.stringify(updatedEventData, null, 2));

      const response = await api.put(`/api/admin/events/${id}`, updatedEventData);

      console.log('Event updated successfully:', response.data);
      navigate('/admin/events', { 
        state: { message: 'Event updated successfully!' }
      });
    } catch (error) {
      console.error('Error updating event:', error);
      alert(`Error updating event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="min-h-screen theme-bg theme-text flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-theme-text-secondary">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen theme-bg theme-text flex items-center justify-center">
        <div className="text-center">
          <p className="text-theme-text-secondary">Event not found</p>
          <button
            onClick={() => navigate('/admin/events')}
            className="mt-4 px-4 py-2 bg-cyan-400 text-black rounded-lg hover:bg-cyan-500 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg theme-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/admin/events')}
              className="flex items-center space-x-2 text-theme-text-secondary hover:text-theme-text transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Events</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg">
              <Edit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold theme-text">Edit Event</h1>
              <p className="text-theme-text-secondary mt-1">
                Update the details for "{eventData.title}"
              </p>
            </div>
          </div>
        </div>

        {/* Event Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="theme-card rounded-xl border theme-border shadow-elevated"
        >
          <EventForm 
            initialData={eventData}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default EventEdit;
