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

      // 🔥 STEP 1: HANDLE IMAGE UPLOAD
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
          

          // ✅ FIX: Ensure string URL
          const imageUrl =
            uploadResult.secure_url ||
            uploadResult.url ||
            uploadResult.imageUrl;

          formData.profilePicture = String(imageUrl);

          
        } else {
          const errorText = await uploadResponse.text();
          
          toast.error('Failed to upload profile picture');
          return;
        }
      }

      // ❌ Remove file object
      delete formData.profileImage;

      // 🔥 STEP 2: CONVERT TO NORMAL OBJECT (MAIN FIX)
      const dataToSend = { ...formData };

      

      // 🔥 STEP 3: UPDATE PROFILE
      const result = await updateProfile(dataToSend);

      if (result.success) {
        toast.success('Profile updated successfully!');
        navigate('/profile');
      }
    } catch (error) {
      
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