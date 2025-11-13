import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Edit,
  Settings,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Linkedin,
  Github,
  Twitter,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  CreditCard,
  Smartphone,
  Fingerprint,
  Wifi,
  WifiOff,
  Clock,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../../utils/timezoneUtils';

const Profile = () => {
  const { user } = useAuth();
  
  console.log('Profile component - user data:', user);
  console.log('Profile component - profilePicture:', user?.profilePicture);


  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return formatDateIST(dateString);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
            <h1 className="text-3xl font-bold text-white">Profile</h1>
            <div className="flex space-x-4">
              <Link
                to="/profile/edit"
                className="flex items-center space-x-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-600 mx-auto"
                      onLoad={() => console.log('Profile image loaded successfully:', user.profilePicture)}
                      onError={(e) => console.error('Profile image failed to load:', user.profilePicture, e)}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center mx-auto border-4 border-gray-600">
                      <span className="text-4xl font-bold text-white">
                        {getInitials(user?.name)}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-800">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-white mt-4">{user?.name || 'No name'}</h2>
                <p className="text-gray-400">{user?.email}</p>
                <p className="text-sm text-cyan-400 mt-1">{user?.role || 'Student'}</p>
                
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    {user?.isEmailVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-sm ${user?.isEmailVerified ? 'text-green-400' : 'text-red-400'}`}>
                      Email {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    {user?.isFaceVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-sm ${user?.isFaceVerified ? 'text-green-400' : 'text-red-400'}`}>
                      Face {user?.isFaceVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>

                  <div className="flex items-center justify-center space-x-2">
                    {user?.fingerprintData?.isRegistered ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-sm ${user?.fingerprintData?.isRegistered ? 'text-green-400' : 'text-red-400'}`}>
                      Fingerprint {user?.fingerprintData?.isRegistered ? 'Registered' : 'Not Registered'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>


          {/* Profile Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Basic Information */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white">{user?.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="text-white">{user?.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-400">Student ID</p>
                    <p className="text-white">{user?.studentId || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-400">Institute</p>
                    <p className="text-white">{user?.institute || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-400">Date of Birth</p>
                    <p className="text-white">{formatDate(user?.dateOfBirth)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-400">Role</p>
                    <p className="text-white capitalize">{user?.role || 'Student'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Authentication Methods */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Authentication Methods</h3>
              
              {/* NFC Cards */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Smartphone className="h-5 w-5 text-cyan-400" />
                  <h4 className="text-lg font-medium text-white">NFC Cards</h4>
                  <span className="text-sm text-gray-400">({user?.nfcCards?.length || 0} cards)</span>
                </div>
                
                {user?.nfcCards && user.nfcCards.length > 0 ? (
                  <div className="space-y-3">
                    {user.nfcCards.map((card, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-5 w-5 text-blue-400" />
                            <div>
                              <p className="text-white font-medium">{card.cardName}</p>
                              <p className="text-sm text-gray-400">ID: {card.cardId}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              card.cardStatus === 'active' ? 'bg-green-100 text-green-800' :
                              card.cardStatus === 'blocked' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {card.cardStatus}
                            </span>
                            {card.cardStatus === 'active' ? (
                              <Wifi className="h-4 w-4 text-green-400" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Type:</span>
                            <span className="text-white ml-2 capitalize">{card.cardType}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Usage:</span>
                            <span className="text-white ml-2">{card.usageCount || 0} times</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Issued:</span>
                            <span className="text-white ml-2">{formatDate(card.issuedAt)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Expires:</span>
                            <span className="text-white ml-2">{formatDate(card.expiryDate)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <p className="text-gray-400 text-center">No NFC cards registered</p>
                  </div>
                )}
              </div>

              {/* RFID Cards */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="h-5 w-5 text-cyan-400" />
                  <h4 className="text-lg font-medium text-white">RFID Cards</h4>
                  <span className="text-sm text-gray-400">({user?.rfidCards?.length || 0} cards)</span>
                </div>
                
                {user?.rfidCards && user.rfidCards.length > 0 ? (
                  <div className="space-y-3">
                    {user.rfidCards.map((card, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Activity className="h-5 w-5 text-purple-400" />
                            <div>
                              <p className="text-white font-medium">RFID Card</p>
                              <p className="text-sm text-gray-400">ID: {card.cardId}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              card.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {card.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {card.isActive ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Type:</span>
                            <span className="text-white ml-2 capitalize">{card.cardType}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Issued:</span>
                            <span className="text-white ml-2">{formatDate(card.issuedAt)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Last Used:</span>
                            <span className="text-white ml-2">{formatDate(card.lastUsed) || 'Never'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <p className="text-gray-400 text-center">No RFID cards registered</p>
                  </div>
                )}
              </div>

              {/* Fingerprint */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Fingerprint className="h-5 w-5 text-cyan-400" />
                  <h4 className="text-lg font-medium text-white">Fingerprint Authentication</h4>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  {user?.fingerprintData?.isRegistered ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <span className="text-white font-medium">Fingerprint Registered</span>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Quality:</span>
                          <span className="text-white ml-2 capitalize">{user.fingerprintData.fingerprintQuality}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Verifications:</span>
                          <span className="text-white ml-2">{user.fingerprintData.verificationCount || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Registered:</span>
                          <span className="text-white ml-2">{formatDate(user.fingerprintData.registeredAt)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Last Used:</span>
                          <span className="text-white ml-2">{formatDate(user.fingerprintData.lastVerified) || 'Never'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <XCircle className="h-5 w-5 text-red-400" />
                      <span className="text-gray-400">No fingerprint registered</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {user?.bio && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">About Me</h3>
                <p className="text-gray-300 leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Social Links */}
            {(user?.socialLinks?.linkedin || user?.socialLinks?.github || user?.socialLinks?.twitter || user?.socialLinks?.website) && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user?.socialLinks?.linkedin && (
                    <a
                      href={user.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Linkedin className="h-5 w-5 text-blue-400" />
                      <span className="text-white">LinkedIn</span>
                    </a>
                  )}
                  
                  {user?.socialLinks?.github && (
                    <a
                      href={user.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Github className="h-5 w-5 text-gray-400" />
                      <span className="text-white">GitHub</span>
                    </a>
                  )}
                  
                  {user?.socialLinks?.twitter && (
                    <a
                      href={user.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Twitter className="h-5 w-5 text-blue-400" />
                      <span className="text-white">Twitter</span>
                    </a>
                  )}
                  
                  {user?.socialLinks?.website && (
                    <a
                      href={user.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Globe className="h-5 w-5 text-green-400" />
                      <span className="text-white">Website</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Interests */}
            {user?.interests && user.interests.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default Profile;
