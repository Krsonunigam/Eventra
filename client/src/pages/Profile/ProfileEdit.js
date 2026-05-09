import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
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

      // 🔥 STEP 1: HANDLE IMAGE UPLOAD (IF NEW IMAGE SELECTED)
      if (formData.profileImage) {
        const imageFormData = new FormData();
        imageFormData.append('profilePicture', formData.profileImage);

        const uploadResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/upload/profile`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: imageFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          // ✅ Cloudinary returns the URL in 'url' field per routes/upload.js
          formData.profilePicture = uploadResult.url || uploadResult.secure_url;
        } else {
          toast.error('Failed to upload profile picture');
          return;
        }
      }

      // Cleanup
      delete formData.profileImage;

      // 🔥 STEP 2: ENSURE profilePicture IS CLEAN
      // If profilePicture is a data URL (and upload failed or didn't happen), remove it
      if (formData.profilePicture && formData.profilePicture.startsWith('data:')) {
        delete formData.profilePicture;
      }

      // 🔥 STEP 3: UPDATE PROFILE
      const result = await updateProfile(formData);

      if (result.success) {
        toast.success('Profile updated successfully!');
        navigate('/profile');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
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
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profile</span>
            </button>

            <h1 className="text-3xl font-bold text-white">
              Edit Profile
            </h1>
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