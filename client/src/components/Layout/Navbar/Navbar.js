import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Settings, Calendar, Users, BarChart3, PanelLeft, Crown, Mail, Phone, Award, Home, LogIn, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

const Navbar = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { toggleSidebar, sidebarOpen } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const navItems = [
    // { name: 'Home', path: '/', icon: Home },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Admin Registration', path: '/admin/subscription', icon: Crown, highlight: true },
    { name: 'Certification', path: '/certification', icon: Award },
  ];

  const adminNavItems = [
    { name: 'Admin Subscription', path: '/admin/subscription', icon: Crown, highlight: true },
  ];

  const userMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Bookings', path: '/bookings', icon: Calendar },
    { name: 'Attendance', path: '/attendance', icon: CheckCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminMenuItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: BarChart3 },
    { name: 'Manage Events', path: '/admin/events', icon: Calendar },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: CheckCircle },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Subscription', path: '/admin/subscription', icon: Crown },
  ];

  return (
    <nav className="theme-surface sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Left side - Sidebar opener and Logo */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className={`p-4 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 focus:outline-none ${
                sidebarOpen ? 'bg-gray-800 text-white' : ''
              }`}
            >
              {sidebarOpen ? <PanelLeft className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            
            <Link to="/" className="flex items-center space-x-2 ml-2 focus:outline-none">
              <img 
                src="/eventra-logo.svg" 
                alt="Eventra Logo" 
                className="h-20 w-auto focus:outline-none"
              />
            </Link>
          </div>

          {/* Center - Desktop navigation */}
          <div className="hidden md:flex items-center space-x-12">
            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.name}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-5 py-4 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 focus:outline-none ${
                    item.highlight 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.name}</span>
                  {item.highlight && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      New
                    </span>
                  )}
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-5 py-4 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 focus:outline-none ${
                    item.highlight 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.name}</span>
                  {item.highlight && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      New
                    </span>
                  )}
                </Link>
              )
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-md focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Right side - User button and Contact button */}
          <div className="flex items-center space-x-4">
            {/* User menu or Auth buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 text-gray-300 hover:text-white px-5 py-4 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-800/50 border border-gray-700 hover:border-gray-600 focus:outline-none"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-white">{user?.name}</span>
                    <span className="text-xs text-gray-400">{user?.email}</span>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
                    {isAdmin ? (
                      <>
                        {adminMenuItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        ))}
                        <hr className="my-1 border-gray-700" />
                      </>
                    ) : (
                      <>
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        ))}
                        <hr className="my-1 border-gray-700" />
                      </>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-5 py-4 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-800/50 border border-gray-700 hover:border-gray-600 flex items-center space-x-2 focus:outline-none"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-7 py-4 rounded-lg text-sm font-semibold hover:from-cyan-500 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 flex items-center space-x-2 focus:outline-none"
                >
                  <User className="h-4 w-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* Contact Us button */}
            <Link
              to="/contact"
              className="text-gray-300 hover:text-white px-5 py-4 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-800/50 flex items-center space-x-2 focus:outline-none"
            >
              <Phone className="h-4 w-4" />
              <span>Contact Us</span>
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.name}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-2 ${
                      item.highlight 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.name}</span>
                    {item.highlight && (
                      <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        New
                      </span>
                    )}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-2 ${
                      item.highlight 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.name}</span>
                    {item.highlight && (
                      <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        New
                      </span>
                    )}
                  </Link>
                )
              ))}
              
              {/* Contact Us in mobile menu */}
              <Link
                to="/contact"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Phone className="h-5 w-5" />
                <span>Contact Us</span>
              </Link>
              
              {/* Mobile auth section */}
              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex flex-col space-y-2">
                    <Link
                      to="/login"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600 transition-all duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;


