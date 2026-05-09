import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Upload, 
  Eye, 
  EyeOff,
  Linkedin,
  Github,
  Twitter,
  Globe,
  Lock
} from 'lucide-react';

const UserProfileForm = ({ user, onSubmit, onPasswordChange, loading = false, isAdmin = false }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(user?.profilePicture || null);

  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      role: user?.role || 'user',
      institute: user?.institute || '',
      bio: user?.bio || '',
      gender: user?.gender || 'Prefer not to say',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      socialLinks: {
        linkedin: user?.socialLinks?.linkedin || '',
        github: user?.socialLinks?.github || '',
        twitter: user?.socialLinks?.twitter || '',
        website: user?.socialLinks?.website || ''
      },
      notificationPreferences: {
        email: user?.notificationPreferences?.email ?? true,
        push: user?.notificationPreferences?.push ?? true,
        sms: user?.notificationPreferences?.sms ?? false
      },
      privacySettings: {
        profileVisibility: user?.privacySettings?.profileVisibility || 'public',
        showEmail: user?.privacySettings?.showEmail ?? false,
        showPhone: user?.privacySettings?.showPhone ?? false
      }
    }
  });

  const roles = ['user', 'admin'];
  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const visibilityOptions = ['public', 'friends', 'private'];

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfilePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };
// ONLY showing FIXED onFormSubmit part (rest same as your file)

const onFormSubmit = async (data) => {
  // 🔥 HANDLE PASSWORD
  if (data.currentPassword && data.newPassword && onPasswordChange) {
    try {
      await onPasswordChange(data.currentPassword, data.newPassword);
    } catch (error) {
      return;
    }
  }

  // ❌ REMOVE PASSWORD FIELDS
  const { currentPassword, newPassword, confirmPassword, ...profileData } = data;

  // 🔥 CLEAN OBJECT
  const cleanData = {
    ...profileData,
    profileImage: profileImage, // The file object for upload
    profilePicture: profilePreview // The current URL (or null if removed)
  };

  // 🚀 SEND CLEAN OBJECT
  onSubmit(cleanData);
};

  const newPassword = watch('newPassword');

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('phoneNumber', user.phoneNumber || '');
      setValue('role', user.role || 'user');
      setValue('institute', user.institute || '');
      setValue('bio', user.bio || '');
      setValue('gender', user.gender || 'Prefer not to say');
      setValue('dateOfBirth', user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '');
      setValue('socialLinks.linkedin', user.socialLinks?.linkedin || '');
      setValue('socialLinks.github', user.socialLinks?.github || '');
      setValue('socialLinks.twitter', user.socialLinks?.twitter || '');
      setValue('socialLinks.website', user.socialLinks?.website || '');
      setValue('notificationPreferences.email', user.notificationPreferences?.email ?? true);
      setValue('notificationPreferences.push', user.notificationPreferences?.push ?? true);
      setValue('notificationPreferences.sms', user.notificationPreferences?.sms ?? false);
      setValue('privacySettings.profileVisibility', user.privacySettings?.profileVisibility || 'public');
      setValue('privacySettings.showEmail', user.privacySettings?.showEmail ?? false);
      setValue('privacySettings.showPhone', user.privacySettings?.showPhone ?? false);
      
      // Set profile picture preview
      if (user.profilePicture) {
        setProfilePreview(user.profilePicture);
      } else {
        setProfilePreview(null);
      }
    }
  }, [user, setValue]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl border border-gray-700 p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
          {/* Profile Image */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors">
                <Upload className="h-5 w-5 text-cyan-400" />
                <span className="text-white">Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                />
              </label>
              {profilePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setProfilePreview(null);
                    setProfileImage(null);
                  }}
                  className="mt-2 text-red-400 hover:text-red-300 text-sm"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    value={user?.name || ''}
                    type="text"
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-gray-600 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    placeholder="Full name"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Name cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    value={user?.email || ''}
                    type="email"
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-gray-600 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    placeholder="Email address"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('phoneNumber', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Please enter a valid 10-digit phone number'
                      }
                    })}
                    type="tel"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="9876543210"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-400">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  {...register('role')}
                  disabled={!isAdmin}
                  className={`w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                    !isAdmin ? 'cursor-not-allowed bg-gray-600' : ''
                  }`}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {!isAdmin && (
                  <p className="mt-1 text-xs text-gray-500">Role can only be changed by admin</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Institute/College *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />                                               
                  <input
                    {...register('institute', { required: 'Institute/College is required' })}                                                                 
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"                               
                    placeholder="Institute or college name"
                  />
                </div>
                {errors.institute && (
                  <p className="mt-1 text-sm text-red-400">{errors.institute.message}</p>                                                                      
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gender
                </label>
                <select
                  {...register('gender')}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {genders.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio/About Me
              </label>
              <textarea
                {...register('bio')}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Social Links
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  LinkedIn
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('socialLinks.linkedin')}
                    type="url"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/username"
                    key={`linkedin-${user?.id || 'new'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GitHub
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('socialLinks.github')}
                    type="url"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="https://github.com/username"
                    key={`github-${user?.id || 'new'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Twitter
                </label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('socialLinks.twitter')}
                    type="url"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="https://twitter.com/username"
                    key={`twitter-${user?.id || 'new'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('socialLinks.website')}
                    type="url"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="https://yourwebsite.com"
                    key={`website-${user?.id || 'new'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Change Password
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('currentPassword')}
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('newPassword', {
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type={showNewPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('confirmPassword', {
                      validate: (value) => value === newPassword || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Notification Preferences
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Email Notifications</label>
                  <p className="text-xs text-gray-400">Receive updates via email</p>
                </div>
                <Controller
                  name="notificationPreferences.email"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Push Notifications</label>
                  <p className="text-xs text-gray-400">Receive browser notifications</p>
                </div>
                <Controller
                  name="notificationPreferences.push"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">SMS Notifications</label>
                  <p className="text-xs text-gray-400">Receive updates via SMS</p>
                </div>
                <Controller
                  name="notificationPreferences.sms"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Privacy Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Visibility
                </label>
                <select
                  {...register('privacySettings.profileVisibility')}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {visibilityOptions.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">Show Email</label>
                    <p className="text-xs text-gray-400">Make email visible to other users</p>
                  </div>
                  <Controller
                    name="privacySettings.showEmail"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-white">Show Phone</label>
                    <p className="text-xs text-gray-400">Make phone number visible to other users</p>
                  </div>
                  <Controller
                    name="privacySettings.showPhone"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-700"
                      />
                    )}
                  />
                </div>
              </div>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UserProfileForm;
