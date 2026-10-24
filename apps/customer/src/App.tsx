import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NotificationToast } from './components/NotificationToast';

import { AuthLandingPage } from './pages/AuthLandingPage';
import { HomePage } from './pages/HomePage';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { BookingsListPage } from './pages/BookingsListPage';
import { BookingDetailsPage } from './pages/BookingDetailsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SupportPage } from './pages/SupportPage';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Connecting to Kaam Setu...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the clean Landing Page with full Login & Registration Gateway
  if (!isAuthenticated || !user) {
    return <AuthLandingPage />;
  }

  // Once authenticated as Customer (or Worker previewing), render the authenticated app
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1F2937]">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/request" element={<CreateRequestPage />} />
            <Route path="/jobs/:id" element={<JobDetailsPage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
            <Route path="/bookings" element={<BookingsListPage />} />
            <Route path="/bookings/:id" element={<BookingDetailsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <NotificationToast />
      </div>
    </Router>
  );
}

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
