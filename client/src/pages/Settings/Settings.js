import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Palette, 
  Shield, 
  Link, 
  Lock, 
  Moon, 
  Sun,
  Smartphone,
  Mail,
  MessageSquare,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import useCustomToast from '../../utils/customToast';

const Settings = () => {
  const toast = useCustomToast();
  const { user, updateProfile, changePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'social', label: 'Social', icon: Link },
    { id: 'security', label: 'Security', icon: Lock }
  ];

  const notificationSettings = [
    {
      id: 'email',
      label: 'Email Notifications',
      description: 'Receive updates via email',
      icon: Mail,
      enabled: user?.notificationPreferences?.email ?? true
    },
    {
      id: 'push',
      label: 'Push Notifications',
      description: 'Receive browser notifications',
      icon: Bell,
      enabled: user?.notificationPreferences?.push ?? true
    },
    {
      id: 'sms',
      label: 'SMS Notifications',
      description: 'Receive updates via SMS',
      icon: Smartphone,
      enabled: user?.notificationPreferences?.sms ?? false
    },
    {
      id: 'chat',
      label: 'Chat Messages',
      description: 'Get notified about new messages',
      icon: MessageSquare,
      enabled: user?.notificationPreferences?.chat ?? true
    }
  ];

  const privacySettings = [
    {
      id: 'profileVisibility',
      label: 'Profile Visibility',
      description: 'Who can see your profile',
      options: [
        { value: 'public', label: 'Public' },
        { value: 'friends', label: 'Friends Only' },
        { value: 'private', label: 'Private' }
      ],
      current: user?.privacySettings?.profileVisibility || 'public'
    },
    {
      id: 'showEmail',
      label: 'Show Email Address',
      description: 'Make your email visible to other users',
      type: 'boolean',
      current: user?.privacySettings?.showEmail ?? false
    },
    {
      id: 'showPhone',
      label: 'Show Phone Number',
      description: 'Make your phone number visible to other users',
      type: 'boolean',
      current: user?.privacySettings?.showPhone ?? false
    }
  ];

  const socialAccounts = [
    {
      id: 'google',
      name: 'Google',
      connected: false,
      email: null
    },
    {
      id: 'github',
      name: 'GitHub',
      connected: false,
      email: null
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      connected: false,
      email: null
    },
    {
      id: 'twitter',
      name: 'Twitter',
      connected: false,
      email: null
    }
  ];

  const handleNotificationToggle = async (settingId, enabled) => {
    try {
      setLoading(true);
      const updatedPreferences = {
        ...user.notificationPreferences,
        [settingId]: enabled
      };
      await updateProfile({ notificationPreferences: updatedPreferences });
      toast.success('Notification preferences updated');
    } catch (error) {
      
      toast.error('Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async (settingId, value) => {
    try {
      setLoading(true);
      const updatedSettings = {
        ...user.privacySettings,
        [settingId]: value
      };
      await updateProfile({ privacySettings: updatedSettings });
      toast.success('Privacy settings updated');
    } catch (error) {
      
      toast.error('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialConnect = (provider) => {
    // Implement social account connection
    
  };

  const handleSocialDisconnect = (provider) => {
    // Implement social account disconnection
    
  };

  const renderNotifications = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {notificationSettings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <setting.icon className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-white font-medium">{setting.label}</p>
                  <p className="text-gray-400 text-sm">{setting.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationToggle(setting.id, !setting.enabled)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  setting.enabled ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    setting.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Theme Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-cyan-400" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-400" />
              )}
              <div>
                <p className="text-white font-medium">Dark Mode</p>
                <p className="text-gray-400 text-sm">
                  {theme === 'dark' ? 'Currently using dark theme' : 'Switch to dark theme'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-cyan-500"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Privacy Controls</h3>
        <div className="space-y-4">
          {privacySettings.map((setting) => (
            <div key={setting.id} className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-medium">{setting.label}</p>
                  <p className="text-gray-400 text-sm">{setting.description}</p>
                </div>
              </div>
              {setting.type === 'boolean' ? (
                <button
                  onClick={() => handlePrivacyUpdate(setting.id, !setting.current)}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    setting.current ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      setting.current ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              ) : (
                <select
                  value={setting.current}
                  onChange={(e) => handlePrivacyUpdate(setting.id, e.target.value)}
                  disabled={loading}
                  className="px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {setting.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSocial = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Connected Accounts</h3>
        <div className="space-y-4">
          {socialAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {account.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{account.name}</p>
                  <p className="text-gray-400 text-sm">
                    {account.connected ? account.email : 'Not connected'}
                  </p>
                </div>
              </div>
              {account.connected ? (
                <button
                  onClick={() => handleSocialDisconnect(account.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleSocialConnect(account.id)}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Enter current password"
                required
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
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Enter new password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'notifications':
        return renderNotifications();
      case 'appearance':
        return renderAppearance();
      case 'privacy':
        return renderPrivacy();
      case 'social':
        return renderSocial();
      case 'security':
        return renderSecurity();
      default:
        return renderNotifications();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account preferences and privacy settings</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-cyan-500 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6"
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
