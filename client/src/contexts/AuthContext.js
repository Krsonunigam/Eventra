import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../utils/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // ─── Fetch fresh user from /api/auth/me ─────────────────────────────────
  const fetchCurrentUser = useCallback(async (authToken) => {
    const currentToken = authToken || localStorage.getItem('token');
    if (!currentToken) return null;

    try {
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      const meRes = await api.get('/api/auth/me', config);
      const freshUser = meRes.data.user;

      // Cache-bust profile picture
      if (freshUser?.profilePicture) {
        const baseUrl = freshUser.profilePicture.split('?')[0];
        freshUser.profilePicture = `${baseUrl}?t=${Date.now()}`;
      }

      setUser(freshUser);
      return freshUser;
    } catch (err) {
      console.error('fetchCurrentUser error:', err.message);
      throw err;
    }
  }, []);

  // ─── On mount: restore session from localStorage ─────────────────────────
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const freshUser = await fetchCurrentUser(savedToken);
          if (isMounted) setUser(freshUser);
        } catch {
          localStorage.removeItem('token');
          if (isMounted) { setUser(null); setToken(null); }
        }
      } else if (isMounted) {
        setUser(null);
      }
      if (isMounted) setLoading(false);
    };
    checkAuth();
    return () => { isMounted = false; };
  }, [fetchCurrentUser]);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      setLoading(true);
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
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Login ─────────────────────────────────────────────────────────
  const googleLogin = async (googleToken) => {
    try {
      setLoading(true);
      const response = await api.post('/api/auth/google', { token: googleToken });
      const { token: newToken } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);

      const freshUser = await fetchCurrentUser(newToken);
      return { success: true, user: freshUser };
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return { success: false, error: error.response?.data?.message || 'Google login failed' };
    } finally {
      setLoading(false);
    }
  };

  // ─── Register ─────────────────────────────────────────────────────────────
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
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = register;

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // ─── Immediately update user state from a partial payload ─────────────────
  // Used by FaceTraining after upload so dashboard reflects changes instantly
  // without an extra round-trip to /api/auth/me
  const updateUserState = useCallback((partialUser) => {
    setUser(prev => prev ? { ...prev, ...partialUser } : partialUser);
  }, []);

  // ─── Refresh full user from server ───────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      return await fetchCurrentUser();
    } catch {
      return null;
    }
  }, [fetchCurrentUser]);

  // ─── Update profile ───────────────────────────────────────────────────────
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      let dataToSend = profileData instanceof FormData
        ? Object.fromEntries(profileData.entries())
        : profileData;

      if (dataToSend.profilePicture && typeof dataToSend.profilePicture !== 'string') {
        delete dataToSend.profilePicture;
      }

      await api.put('/api/auth/profile', dataToSend);
      await fetchCurrentUser();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Profile update failed' };
    } finally {
      setLoading(false);
    }
  };

  // ─── Change password ──────────────────────────────────────────────────────
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      await api.put('/api/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // ─── Face Verify ─────────────────────────────────────────────────────────
  const verifyFace = async (faceData) => {
    try {
      const res = await api.post('/api/face/verify', { faceData });
      await fetchCurrentUser();
      return { success: true, confidence: res.data.confidence };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    googleLogin,
    register,
    registerUser,
    logout,
    updateProfile,
    changePassword,
    verifyFace,
    refreshUser,
    updateUserState  // ← new: lets components patch user state instantly
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
