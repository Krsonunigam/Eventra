import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import api from '../../utils/axiosConfig';
import EventForm from '../../components/Forms/EventForm';

const EventCreate = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // Handle image upload if present
      let imageUrl = '';
      if (formData.bannerImage && formData.bannerImage instanceof File) {
        const uploadFormData = new FormData();
        uploadFormData.append('eventImage', formData.bannerImage);
        
        const uploadResponse = await api.post('/api/upload/event', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadResponse.data.url;
      }

      // Prepare the event data
      const eventData = {
        title: formData.title,
        description: formData.description,
        venue: {
          name: formData.venue.name,
          address: formData.venue.address || 'Not specified',
          city: formData.venue.city,
          coordinates: formData.venue.coordinates || {}
        },
        dateTime: {
          start: new Date(formData.dateTime.start),
          end: new Date(formData.dateTime.end)
        },
        price: parseFloat(formData.price) || 0,
        capacity: parseInt(formData.capacity) || 1,
        availableSeats: parseInt(formData.capacity) || 1,
        category: formData.category,
        registrationDeadline: new Date(formData.registrationDeadline),
        cancellationPolicy: {
          allowCancellation: formData.allowCancellation !== false,
          cancellationDeadline: formData.cancellationDeadline ? new Date(formData.cancellationDeadline) : new Date(formData.registrationDeadline),
          refundPercentage: parseInt(formData.refundPercentage) || 100
        },
        requirements: {
          minAge: parseInt(formData.minAge) || 18,
          maxAge: formData.maxAge ? parseInt(formData.maxAge) : null,
          dressCode: formData.dressCode || '',
          itemsToBring: formData.itemsToBring || []
        },
        tags: formData.tags || [],
        detailedSchedule: formData.detailedSchedule || [],
        sponsors: formData.sponsors || [],
        organizerContact: formData.organizerContact || {},
        status: 'draft',
        isActive: true,
        image: imageUrl
      };

      console.log('Creating event with data:', JSON.stringify(eventData, null, 2));
      console.log('Date types:', {
        start: typeof eventData.dateTime.start,
        end: typeof eventData.dateTime.end,
        registrationDeadline: typeof eventData.registrationDeadline
      });

      const response = await api.post('/api/admin/events', eventData);

      console.log('Event created successfully:', response.data);
      navigate('/admin/events', { 
        state: { message: 'Event created successfully!' }
      });
    } catch (error) {
      console.error('Error creating event:', error);
      alert(`Error creating event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold theme-text">Create New Event</h1>
              <p className="text-theme-text-secondary mt-1">
                Fill in the details to create a new event
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
            onSubmit={handleSubmit}
            loading={loading}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default EventCreate;
