import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
// import useCustomToast from '../utils/customToast'; // Moved to individual components

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Token is now handled by axiosConfig interceptor

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const meRes = await api.get('/api/auth/me');
          setUser(meRes.data.user);
        } catch (error) {
          // Only log error if it's not a 401 (unauthorized) or 404 (not found)
          if (error.response?.status !== 401 && error.response?.status !== 404) {
            console.error('Auth check failed:', error);
          }
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      const { token: newToken, user: userData, warnings } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      // Toast notifications will be handled by individual components
      
      // Show warnings if any
      if (warnings && warnings.length > 0) {
        console.warn('Login warnings:', warnings);
      }
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      console.error('Login error:', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      await api.post('/api/auth/register', userData);
      
      // Registration success - toast will be handled by component
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      console.error('Registration error:', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // Token removal is handled by axiosConfig interceptor
    // Logout success - toast will be handled by component
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      console.log('Profile update request data:', profileData);
      const res = await api.put('/api/auth/profile', profileData);
      console.log('Profile update response:', res.data);
      console.log('Updated user data:', res.data.user);
      console.log('Profile picture URL:', res.data.user?.profilePicture);

      setUser(res.data.user);
      // Profile update success - toast will be handled by component
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || 'Profile update failed';
      const details = error.response?.data?.details || error.response?.data?.errors;
      console.error('Error details:', details);
      console.error('Error details array:', Array.isArray(details) ? details : 'Not an array');
      if (Array.isArray(details) && details.length > 0) {
        console.error('First validation error:', details[0]);
        console.error('Validation error field:', details[0]?.field);
        console.error('Validation error message:', details[0]?.message);
        console.error('Validation error value:', details[0]?.value);
      }
      console.error('Profile update error:', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      await api.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      // Password change success - toast will be handled by component
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      console.error('Password change error:', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const verifyFace = async (faceData) => {
    try {
      setLoading(true);
      const response = await api.post('/api/auth/verify-face', { faceData });
      
      // Update user data
      const userResponse = await api.get('/api/auth/me');
      setUser(userResponse.data.user);
      
      // Face verification success - toast will be handled by component
      return { success: true, confidence: response.data.confidence };
    } catch (error) {
      const message = error.response?.data?.message || 'Face verification failed';
      console.error('Face verification error:', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const updateFaceData = async (faceData) => {
    try {
      setLoading(true);
      await api.post('/api/auth/update-face', { faceData });
      
      // Face data update success - toast will be handled by component
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Face data update failed';
      console.error('Face data update error:', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    verifyFace,
    updateFaceData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
