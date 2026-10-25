import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Header } from './components/Header';
import { WorkerHeader } from './components/WorkerHeader';
import { Footer } from './components/Footer';
import { NotificationToast } from './components/NotificationToast';

import { AuthLandingPage } from './pages/AuthLandingPage';

// Customer Pages
import { HomePage } from './pages/HomePage';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { BookingsListPage } from './pages/BookingsListPage';
import { BookingDetailsPage } from './pages/BookingDetailsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SupportPage } from './pages/SupportPage';

// Worker Pro Pages
import { WorkerDashboardPage } from './pages/worker/WorkerDashboardPage';
import { JobOffersPage } from './pages/worker/JobOffersPage';
import { WorkerBookingsPage } from './pages/worker/WorkerBookingsPage';
import { EarningsPage } from './pages/worker/EarningsPage';
import { AvailabilityPage } from './pages/worker/AvailabilityPage';
import { WorkerProfilePage } from './pages/worker/WorkerProfilePage';
import { WorkerNotificationsPage } from './pages/worker/WorkerNotificationsPage';
import { WorkerSupportPage } from './pages/worker/WorkerSupportPage';

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

  // 1. Unauthenticated Gateway (Landing Page with Login & Registration for Customer & Worker)
  if (!isAuthenticated || !user) {
    return <AuthLandingPage />;
  }

  // 2. Authenticated as WORKER PRO
  if (user.role === 'WORKER') {
    return (
      <Router>
        <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1F2937]">
          <WorkerHeader />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<WorkerDashboardPage />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/offers" element={<JobOffersPage />} />
              <Route path="/bookings" element={<WorkerBookingsPage />} />
              <Route path="/earnings" element={<EarningsPage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/profile" element={<WorkerProfilePage />} />
              <Route path="/notifications" element={<WorkerNotificationsPage />} />
              <Route path="/support" element={<WorkerSupportPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <NotificationToast />
        </div>
      </Router>
    );
  }

  // 3. Authenticated as CUSTOMER
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
