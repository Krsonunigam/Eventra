import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import UserProfileForm from '../../components/Forms/UserProfileForm';
import useCustomToast from '../../utils/customToast';

const ProfileEdit = () => {
  const toast = useCustomToast();
  const { user, updateProfile, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      
      // Handle profile image upload
      if (formData.profileImage) {
        console.log('Profile image upload started:', formData.profileImage);
        const imageFormData = new FormData();
        imageFormData.append('profilePicture', formData.profileImage);
        console.log('FormData created:', imageFormData);
        
        // Upload image first
        const uploadResponse = await fetch('/api/upload/profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: imageFormData
        });
        
        console.log('Upload response status:', uploadResponse.status);
        console.log('Upload response ok:', uploadResponse.ok);
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          console.log('Upload result:', uploadResult);
          formData.profilePicture = uploadResult.url;
        } else {
          const errorText = await uploadResponse.text();
          console.error('Image upload failed:', errorText);
          toast.error('Failed to upload profile picture');
          return;
        }
      }
      
      // Remove the file object from formData
      delete formData.profileImage;
      
      // Update profile
      const result = await updateProfile(formData);
      
      if (result.success) {
        toast.success('Profile updated successfully!');
        navigate('/profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Profile</span>
              </button>
              <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
            </div>
          </div>
        </motion.div>

        <UserProfileForm
          user={user}
          onSubmit={handleSubmit}
          onPasswordChange={handlePasswordChange}
          loading={loading}
          isAdmin={user?.role === 'admin'}
        />
      </div>
    </div>
  );
};

export default ProfileEdit;
