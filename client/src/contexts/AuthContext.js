import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../utils/axiosConfig';

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

  const fetchCurrentUser = useCallback(async (authToken = token) => {
    const config = authToken
      ? { headers: { Authorization: `Bearer ${authToken}` } }
      : undefined;

    const meRes = await api.get('/api/auth/me', config);
    const freshUser = meRes.data.user;
    
    // Cache-busting for profile picture to ensure live updates
    if (freshUser && freshUser.profilePicture) {
      const baseUrl = freshUser.profilePicture.split('?')[0];
      freshUser.profilePicture = `${baseUrl}?t=${Date.now()}`;
    }
    
    setUser(freshUser);
    return freshUser;
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      if (token) {
        try {
          const freshUser = await fetchCurrentUser(token);
          if (isMounted) {
            setUser(freshUser);
          }
        } catch (error) {
          localStorage.removeItem('token');
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      } else if (isMounted) {
        setUser(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchCurrentUser, token]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setUser(null);

      const response = await api.post('/api/auth/login', { email, password });
      const { token: newToken } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);

      const freshUser = await fetchCurrentUser(newToken);

      return { success: true, user: freshUser };
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);

      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);

      const res = await api.post('/api/auth/register', userData);

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        await fetchCurrentUser(res.data.token);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = register;

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);

      let dataToSend = profileData;

      if (profileData instanceof FormData) {
        dataToSend = {};
        profileData.forEach((value, key) => {
          dataToSend[key] = value;
        });
      }

      if (
        dataToSend.profilePicture &&
        typeof dataToSend.profilePicture !== 'string'
      ) {
        delete dataToSend.profilePicture;
      }

      await api.put('/api/auth/profile', dataToSend);
      await fetchCurrentUser();

      return { success: true };
    } catch (error) {
      
      return { success: false };
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
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyFace = async (faceData) => {
    try {
      setLoading(true);
      const res = await api.post('/api/face/verify', { faceData });
      await fetchCurrentUser();

      return { success: true, confidence: res.data.confidence };
    } catch (error) {
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      return await fetchCurrentUser();
    } catch (error) {
      return null;
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
    registerUser,
    logout,
    updateProfile,
    changePassword,
    verifyFace,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
