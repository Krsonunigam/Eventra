import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  User, 
  BookOpen, 
  BarChart3, 
  Users, 
  X,
  Settings,
  Activity,
  FileText,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import ThemeToggle from '../../ThemeToggle/ThemeToggle';

const Sidebar = () => {
  const location = useLocation();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { sidebarOpen, closeSidebar } = useTheme();

  // const handleLogout = () => {
  //   logout();
  //   closeSidebar();
  // };

  const userMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Bookings', path: '/bookings', icon: BookOpen },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminMenuItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: BarChart3 },
    { name: 'Manage Events', path: '/admin/events', icon: Calendar },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Attendance', path: '/admin/attendance', icon: UserCheck },
    { name: 'Analytics', path: '/admin/analytics', icon: Activity },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Messages', path: '/admin/messages', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:pb-0 theme-surface lg:backdrop-blur-sm transition-all duration-300 ease-in-out z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <>
                    {adminMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive(item.path)
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive(item.path)
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    ))}
                  </>
                )}
              </>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/"
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Home className="mr-3 h-5 w-5" />
                  Home
                </Link>
                <Link
                  to="/events"
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/events')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  Events
                </Link>
              </div>
            )}
          </nav>

          {/* Theme Toggle */}
          <div className="flex-shrink-0 border-t border-gray-800 p-4">
            <ThemeToggle />
          </div>

          {isAuthenticated && (
            <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 flex z-50 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={closeSidebar} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full theme-surface backdrop-blur-sm transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              onClick={closeSidebar}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-white">Eventra</span>
            </div>
            
            <nav className="mt-5 px-2 space-y-1">
              {isAuthenticated ? (
                <>
                  {isAdmin ? (
                    <>
                      {adminMenuItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                            isActive(item.path)
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                          onClick={closeSidebar}
                        >
                          <item.icon className="mr-4 h-6 w-6" />
                          {item.name}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <>
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                            isActive(item.path)
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                          onClick={closeSidebar}
                        >
                          <item.icon className="mr-4 h-6 w-6" />
                          {item.name}
                        </Link>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive('/')
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    onClick={closeSidebar}
                  >
                    <Home className="mr-4 h-6 w-6" />
                    Home
                  </Link>
                  <Link
                    to="/events"
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive('/events')
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    onClick={closeSidebar}
                  >
                    <Calendar className="mr-4 h-6 w-6" />
                    Events
                  </Link>
                </>
              )}
            </nav>
            
            {/* Theme Toggle for Mobile */}
            <div className="mt-5 px-2">
              <ThemeToggle />
            </div>
          </div>
          
          {isAuthenticated && (
            <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
