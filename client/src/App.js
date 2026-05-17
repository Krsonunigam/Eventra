import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminRoute from './components/AdminRoute/AdminRoute';
import ScrollToTop from './components/ScrollToTop';

const Home = lazy(() => import('./pages/Home/Home'));
const Events = lazy(() => import('./pages/Events/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail/EventDetail'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const FaceVerify = lazy(() => import('./pages/Auth/FaceVerify'));
const EmailVerification = lazy(() => import('./components/Auth/EmailVerification'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const ProfileEdit = lazy(() => import('./pages/Profile/ProfileEdit'));
const Bookings = lazy(() => import('./pages/Bookings/Bookings'));
const MyAttendance = lazy(() => import('./pages/Attendance/MyAttendance'));
const AllAttendance = lazy(() => import('./pages/Admin/AllAttendance'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminEvents = lazy(() => import('./pages/Admin/AdminEvents'));
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminReports = lazy(() => import('./pages/Admin/AdminReports'));
const AdminAnalytics = lazy(() => import('./pages/Admin/AdminAnalytics'));
const EventCreate = lazy(() => import('./pages/Admin/EventCreate'));
const EventEdit = lazy(() => import('./pages/Admin/EventEdit'));
const AdminMessages = lazy(() => import('./pages/Admin/AdminMessages'));
const AdminSubscription = lazy(() => import('./components/Admin/AdminSubscription'));
const SubscriptionManager = lazy(() => import('./components/Subscription/SubscriptionManager'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Payment = lazy(() => import('./pages/Payment/Payment'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));
const Blog = lazy(() => import('./pages/Blog/Blog'));
const HelpCenter = lazy(() => import('./pages/HelpCenter/HelpCenter'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService/TermsOfService'));
const FAQ = lazy(() => import('./pages/FAQ/FAQ'));
const EventManagement = lazy(() => import('./pages/EventManagement/EventManagement'));
const FaceRecognition = lazy(() => import('./pages/FaceRecognition/FaceRecognition'));
const PaymentProcessing = lazy(() => import('./pages/PaymentProcessing/PaymentProcessing'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const About = lazy(() => import('./pages/About/About'));
const Contact = lazy(() => import('./pages/Contact/Contact'));
const Careers = lazy(() => import('./pages/Careers/Careers'));
const Certification = lazy(() => import('./pages/Certification/Certification'));
const MyCertificates = lazy(() => import('./pages/Certification/MyCertificates'));
const CertificateVerify = lazy(() => import('./pages/Certification/CertificateVerify'));
const AdminCertificates = lazy(() => import('./pages/Admin/AdminCertificates'));
const FaceTest = lazy(() => import('./pages/FaceTest/FaceTest'));

const PageLoader = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
    <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "385720505686-qr47isp4vu1s1f8n2q9nvvjd15rmem6l.apps.googleusercontent.com"}>
        <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-900">
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="events" element={<Events />} />
              <Route path="events/:id" element={<EventDetail />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
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
              
              <Route path="admin/messages" element={
                <AdminRoute>
                  <AdminMessages />
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
              <Route path="my-certificates" element={<ProtectedRoute><MyCertificates /></ProtectedRoute>} />
              <Route path="verify-certificate/:code" element={<CertificateVerify />} />
              <Route path="verify-certificate" element={<CertificateVerify />} />
              <Route path="admin/certificates" element={<AdminRoute><AdminCertificates /></AdminRoute>} />

              {/* Face Test / Setup page */}
              <Route path="face-test" element={
                <ProtectedRoute>
                  <FaceTest />
                </ProtectedRoute>
              } />

              {/* Legacy redirects for old paths */}
              <Route path="features/analytics" element={<Analytics />} />
              <Route path="features/events" element={<EventManagement />} />
              <Route path="features/face-recognition" element={<FaceRecognition />} />
              <Route path="features/payments" element={<PaymentProcessing />} />
              
              <Route path="*" element={<NotFound />} />
            </Route>
              </Routes>
            </Suspense>
          </div>
        </ToastProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
