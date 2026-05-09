import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import Events from './pages/Events/Events';
import EventDetail from './pages/EventDetail/EventDetail';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import FaceVerify from './pages/Auth/FaceVerify';
import EmailVerification from './components/Auth/EmailVerification';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import ProfileEdit from './pages/Profile/ProfileEdit';
import Bookings from './pages/Bookings/Bookings';
import MyAttendance from './pages/Attendance/MyAttendance';
import AllAttendance from './pages/Admin/AllAttendance';

import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminEvents from './pages/Admin/AdminEvents';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminReports from './pages/Admin/AdminReports';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import EventCreate from './pages/Admin/EventCreate';
import EventEdit from './pages/Admin/EventEdit';
import AdminSubscription from './components/Admin/AdminSubscription';
import SubscriptionManager from './components/Subscription/SubscriptionManager';
import Settings from './pages/Settings/Settings';
import Payment from './pages/Payment/Payment';
// import UserProfileForm from './components/Forms/UserProfileForm';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute';
import NotFound from './pages/NotFound/NotFound';

// New pages
import Blog from './pages/Blog/Blog';
import HelpCenter from './pages/HelpCenter/HelpCenter';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService/TermsOfService';
import FAQ from './pages/FAQ/FAQ';
import EventManagement from './pages/EventManagement/EventManagement';
import FaceRecognition from './pages/FaceRecognition/FaceRecognition';
import PaymentProcessing from './pages/PaymentProcessing/PaymentProcessing';
import Analytics from './pages/Analytics/Analytics';
import About from './pages/About/About';
import Contact from './pages/Contact/Contact';
import Careers from './pages/Careers/Careers';
import Certification from './pages/Certification/Certification';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <div className="App">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="events" element={<Events />} />
              <Route path="events/:id" element={<EventDetail />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="verify-face" element={<ProtectedRoute><FaceVerify /></ProtectedRoute>} />
              <Route path="verify-email/:token" element={<EmailVerification />} />
              <Route path="verify-email" element={<EmailVerification />} />
              
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="bookings" element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              } />
              
              <Route path="attendance" element={
                <ProtectedRoute>
                  <MyAttendance />
                </ProtectedRoute>
              } />
              

              <Route path="settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              
              <Route path="admin/events" element={
                <AdminRoute>
                  <AdminEvents />
                </AdminRoute>
              } />
              
              <Route path="admin/users" element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              } />
              
              <Route path="admin/attendance" element={
                <AdminRoute>
                  <AllAttendance />
                </AdminRoute>
              } />
              
              <Route path="admin/reports" element={
                <AdminRoute>
                  <AdminReports />
                </AdminRoute>
              } />
              
              <Route path="admin/analytics" element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              } />
              
              <Route path="admin/events/create" element={
                <AdminRoute>
                  <EventCreate />
                </AdminRoute>
              } />
              
              <Route path="admin/events/:id/edit" element={
                <AdminRoute>
                  <EventEdit />
                </AdminRoute>
              } />
              
              <Route path="admin/subscription" element={<AdminSubscription />} />
              <Route path="admin/subscription/manage" element={
                <ProtectedRoute>
                  <SubscriptionManager />
                </ProtectedRoute>
              } />
              
              <Route path="profile/edit" element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              } />
              
              <Route path="payment/:eventId" element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } />
              
              {/* New public pages */}
              <Route path="blog" element={<Blog />} />
              <Route path="help" element={<HelpCenter />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<TermsOfService />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="event-management" element={<EventManagement />} />
              <Route path="face-recognition" element={<FaceRecognition />} />
              <Route path="payment-processing" element={<PaymentProcessing />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="careers" element={<Careers />} />
              <Route path="certification" element={<Certification />} />
              
              {/* Legacy redirects for old paths */}
              <Route path="features/analytics" element={<Analytics />} />
              <Route path="features/events" element={<EventManagement />} />
              <Route path="features/face-recognition" element={<FaceRecognition />} />
              <Route path="features/payments" element={<PaymentProcessing />} />
              
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
