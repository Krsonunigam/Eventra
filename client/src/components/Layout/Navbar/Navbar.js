import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, Calendar, Users, BarChart3, PanelLeft, Crown, Phone, Award, LogIn, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

const Navbar = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { toggleSidebar, sidebarOpen } = useTheme();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const navItems = useMemo(() => [
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Admin Registration', path: '/admin/subscription', icon: Crown, highlight: true },
  ], []);

  const userMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Bookings', path: '/bookings', icon: Calendar },
    { name: 'Attendance', path: '/attendance', icon: CheckCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ], []);

  const adminMenuItems = useMemo(() => [
    { name: 'Admin Dashboard', path: '/admin', icon: BarChart3 },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Manage Events', path: '/admin/events', icon: Calendar },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Attendance', path: '/admin/attendance', icon: CheckCircle },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Subscription', path: '/admin/subscription', icon: Crown },
    { name: 'Settings', path: '/settings', icon: Settings },
  ], []);

  return (
    <>
    <nav className="fixed w-full top-0 z-40 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Left side - Sidebar opener and Logo */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSidebar}
              className={`lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 focus:outline-none ${
                sidebarOpen ? 'bg-white/10 text-white shadow-inner' : ''
              }`}
            >
              <PanelLeft className="h-6 w-6" />
            </button>
            
            <Link to="/" className="flex items-center space-x-2 focus:outline-none group">
              <img 
                src="/eventra-logo.svg" 
                alt="Eventra Logo" 
                className="h-16 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Center - Desktop navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.name}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 focus:outline-none ${
                    item.highlight 
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.name}</span>
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 focus:outline-none ${
                    item.highlight 
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.name}</span>
                </Link>
              )
            ))}

            {/* Certificate Verification Quick Link */}
            <div className="flex items-center ml-4 pl-4 border-l border-white/10">
              <div className="flex items-center">
                <input
                  type="text"
                  id="nav-cert-id"
                  placeholder="Verify Certificate ID"
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-l-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-40 placeholder:text-gray-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const id = e.target.value.trim();
                      if (id) navigate(`/verify-certificate?id=${id}`);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const id = document.getElementById('nav-cert-id').value.trim();
                    if (id) navigate(`/verify-certificate?id=${id}`);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-xs rounded-r-lg hover:from-cyan-500 hover:to-blue-600 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>

          {/* Right side - Desktop actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/contact"
              className="text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/5 flex items-center space-x-2 focus:outline-none"
            >
              <Phone className="h-4 w-4" />
              <span>Contact</span>
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10 border border-transparent hover:border-white/10 focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex flex-col items-start hidden lg:flex">
                    <span className="font-semibold text-white">{user?.name}</span>
                    <span className="text-xs text-gray-400 capitalize">{user?.role || 'User'}</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in origin-top-right">
                    <div className="px-4 py-3 border-b border-white/10 mb-2">
                      <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    
                    <div className="px-2">
                      {(isAdmin ? adminMenuItems : userMenuItems).map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </div>
                    
                    <div className="px-2 mt-2 pt-2 border-t border-white/10">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-red-400 rounded-xl hover:bg-red-500/10 transition-all duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/5 flex items-center space-x-2 focus:outline-none"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 flex items-center space-x-2 focus:outline-none"
                >
                  <User className="h-4 w-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-300 focus:outline-none relative w-10 h-10 flex items-center justify-center"
            >
              <div className="absolute transition-transform duration-300">
                {mobileMenuOpen ? <X className="h-6 w-6 rotate-90 scale-110" /> : <Menu className="h-6 w-6 rotate-0 scale-100" />}
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      <div 
        className={`md:hidden fixed top-0 right-0 h-full w-4/5 max-w-sm bg-[#0a0a0a]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full px-6 py-8">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-2 mb-8">
            {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 flex items-center space-x-3 ${
                item.highlight 
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.icon && <item.icon className="h-5 w-5" />}
              <span>{item.name}</span>
            </Link>
          ))}
          
            <Link
              to="/contact"
              className="block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Phone className="h-5 w-5" />
              <span>Contact Us</span>
            </Link>
          </div>

          {/* Certificate Verification Mobile */}
          <div className="px-4 py-4 mb-6 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 pl-1">Certificate Verification</p>
            <div className="flex items-center">
              <input
                type="text"
                id="mobile-nav-cert-id"
                placeholder="Enter ID"
                className="flex-1 px-3 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-l-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-gray-600"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const id = e.target.value.trim();
                    if (id) {
                      navigate(`/verify-certificate?id=${id}`);
                      setMobileMenuOpen(false);
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const id = document.getElementById('mobile-nav-cert-id').value.trim();
                  if (id) {
                    navigate(`/verify-certificate?id=${id}`);
                    setMobileMenuOpen(false);
                  }
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-sm rounded-r-xl shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                Verify
              </button>
            </div>
          </div>
          
          {isAuthenticated ? (
            <div className="mt-auto pt-6 border-t border-white/10">
              <div className="flex items-center space-x-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/50">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-full w-full p-2 text-gray-400 bg-gray-800" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-1 mb-6">
                {(isAdmin ? adminMenuItems : userMenuItems).map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3.5 text-base font-medium text-red-400 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="mt-auto pt-6 border-t border-white/10 space-y-3">
              <Link
                to="/login"
                className="block px-4 py-3.5 rounded-xl text-base font-medium text-center text-white border border-white/20 hover:bg-white/10 transition-all shadow-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block px-4 py-3.5 rounded-xl text-base font-medium text-center bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
