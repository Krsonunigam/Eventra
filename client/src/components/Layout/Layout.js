import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import Sidebar from './Sidebar/Sidebar';
import Footer from './Footer/Footer';
import Chatbot from '../Chatbot/Chatbot';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = () => {
  const { sidebarOpen, closeSidebar } = useTheme();
  const location = useLocation();
  
  // Pages that should have no top padding for proper alignment
  const noTopPaddingPages = ['/events/', '/payment/'];
  const shouldHaveTopPadding = !noTopPaddingPages.some(path => location.pathname.includes(path));

  return (
    <div className="min-h-screen theme-bg theme-text transition-colors duration-300">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}>
          <div className={`w-full ${shouldHaveTopPadding ? 'pt-24 pb-8' : 'pt-20 pb-8'}`}>
            <Outlet />
          </div>
        </main>
      </div>
      
      <Footer />
      <Chatbot />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default Layout;
