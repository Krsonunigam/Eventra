import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Tag, 
  Clock,
  User,
  Phone,
  Mail,
  Plus,
  X,
  Upload
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const EventForm = ({ initialData = null, onSubmit, loading = false }) => {
  const [scheduleItems, setScheduleItems] = useState(
    initialData?.detailedSchedule || [{ time: '', activity: '', speaker: '' }]
  );
  const [sponsors, setSponsors] = useState(initialData?.sponsors || ['']);
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(initialData?.image || null);

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    defaultValues: initialData || {
      title: '',
      description: '',
      dateTime: { start: '', end: '' },
      venue: { name: '', address: '', city: '' },
      category: '',
      capacity: '',
      registrationDeadline: '',
      price: '',
      organizer: '',
      tags: [],
      organizerContact: { email: '', phone: '' }
    }
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      // Format dates for datetime-local inputs
      const formattedData = {
        ...initialData,
        dateTime: {
          start: initialData.dateTime?.start ? new Date(initialData.dateTime.start).toISOString().slice(0, 16) : '',
          end: initialData.dateTime?.end ? new Date(initialData.dateTime.end).toISOString().slice(0, 16) : ''
        },
        registrationDeadline: initialData.registrationDeadline ? new Date(initialData.registrationDeadline).toISOString().slice(0, 16) : '',
        venue: {
          name: initialData.venue?.name || '',
          address: initialData.venue?.address || '',
          city: initialData.venue?.city || '',
          coordinates: initialData.venue?.coordinates || { latitude: null, longitude: null }
        },
        organizerContact: {
          email: initialData.organizerContact?.email || '',
          phone: initialData.organizerContact?.phone || ''
        }
      };
      
      reset(formattedData);
      setScheduleItems(initialData.detailedSchedule || [{ time: '', activity: '', speaker: '' }]);
      setSponsors(initialData.sponsors || ['']);
      setBannerPreview(initialData.image || null);
    }
  }, [initialData, reset]);

  const categories = [
    'Technology', 'Sports', 'Music', 'Art', 'Business', 'Science', 
    'Literature', 'Gaming', 'Photography', 'Dance', 'Conference', 
    'Workshop', 'Seminar'
  ];

  const addScheduleItem = () => {
    setScheduleItems([...scheduleItems, { time: '', activity: '', speaker: '' }]);
  };

  const removeScheduleItem = (index) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== index));
  };

  const updateScheduleItem = (index, field, value) => {
    const updated = [...scheduleItems];
    updated[index][field] = value;
    setScheduleItems(updated);
  };

  const addSponsor = () => {
    setSponsors([...sponsors, '']);
  };

  const removeSponsor = (index) => {
    setSponsors(sponsors.filter((_, i) => i !== index));
  };

  const updateSponsor = (index, value) => {
    const updated = [...sponsors];
    updated[index] = value;
    setSponsors(updated);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setBannerPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const onFormSubmit = (data) => {
    const formData = {
      ...data,
      detailedSchedule: scheduleItems.filter(item => item.time && item.activity),
      sponsors: sponsors.filter(sponsor => sponsor.trim()),
      bannerImage: bannerImage,
      price: Math.round(parseFloat(data.price) * 100) / 100 || 0
    };
    
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6">
          {initialData ? 'Edit Event' : 'Create New Event'}
        </h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Title *
            </label>
            <input
              {...register('title', { required: 'Event title is required' })}
              type="text"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Enter event title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <ReactQuill
                  {...field}
                  theme="snow"
                  className="bg-gray-700 rounded-lg"
                  style={{ color: 'white' }}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              )}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date & Time *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('dateTime.start', { required: 'Start date is required' })}
                  type="datetime-local"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              {errors.dateTime?.start && (
                <p className="mt-1 text-sm text-red-400">{errors.dateTime.start.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date & Time *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('dateTime.end', { required: 'End date is required' })}
                  type="datetime-local"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              {errors.dateTime?.end && (
                <p className="mt-1 text-sm text-red-400">{errors.dateTime.end.message}</p>
              )}
            </div>
          </div>

          {/* Venue */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Venue Name *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('venue.name', { required: 'Venue name is required' })}
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Venue name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              <input
                {...register('venue.address')}
                type="text"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City *
              </label>
              <input
                {...register('venue.city', { required: 'City is required' })}
                type="text"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="City"
              />
            </div>
          </div>

          {/* Category & Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Capacity *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('capacity', { 
                    required: 'Capacity is required',
                    min: { value: 1, message: 'Capacity must be at least 1' }
                  })}
                  type="number"
                  min="1"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Number of seats"
                />
              </div>
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-400">{errors.capacity.message}</p>
              )}
            </div>
          </div>

          {/* Registration Deadline & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Registration Deadline *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('registrationDeadline', { required: 'Registration deadline is required' })}
                  type="datetime-local"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              {errors.registrationDeadline && (
                <p className="mt-1 text-sm text-red-400">{errors.registrationDeadline.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price (₹) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('price', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price cannot be negative' }
                  })}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="0 for free events"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Banner Image
            </label>
            <div className="space-y-4">
              {bannerPreview && (
                <div className="relative">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors">
                  <Upload className="h-5 w-5 text-cyan-400" />
                  <span className="text-white">Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
                {bannerPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setBannerPreview(null);
                      setBannerImage(null);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Organizer */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Organizer *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('organizer', { required: 'Organizer is required' })}
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Organizer name or organization"
                defaultValue={initialData?.organizer?.name || initialData?.organizer || ''}
              />
            </div>
            {errors.organizer && (
              <p className="mt-1 text-sm text-red-400">{errors.organizer.message}</p>
            )}
          </div>

          {/* Organizer Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('organizerContact.email')}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('organizerContact.phone')}
                  type="tel"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Type a tag and press Enter"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const newTag = e.target.value.trim();
                        if (newTag && !field.value.includes(newTag)) {
                          field.onChange([...field.value, newTag]);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-cyan-500 text-white rounded-full text-sm"
                      >
                        <Tag className="h-3 w-3" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = field.value.filter((_, i) => i !== index);
                            field.onChange(newTags);
                          }}
                          className="ml-1 hover:text-red-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            />
          </div>

          {/* Detailed Schedule */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Detailed Schedule (Optional)
              </label>
              <button
                type="button"
                onClick={addScheduleItem}
                className="flex items-center space-x-2 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>
            <div className="space-y-4">
              {scheduleItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-700 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => updateScheduleItem(index, 'time', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Activity
                    </label>
                    <input
                      type="text"
                      value={item.activity}
                      onChange={(e) => updateScheduleItem(index, 'activity', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Activity description"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Speaker
                      </label>
                      <input
                        type="text"
                        value={item.speaker}
                        onChange={(e) => updateScheduleItem(index, 'speaker', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Speaker name"
                      />
                    </div>
                    {scheduleItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScheduleItem(index)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsors */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Sponsors/Partners (Optional)
              </label>
              <button
                type="button"
                onClick={addSponsor}
                className="flex items-center space-x-2 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Sponsor</span>
              </button>
            </div>
            <div className="space-y-2">
              {sponsors.map((sponsor, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={sponsor}
                    onChange={(e) => updateSponsor(index, e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Sponsor name or organization"
                  />
                  {sponsors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSponsor(index)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (initialData ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EventForm;
