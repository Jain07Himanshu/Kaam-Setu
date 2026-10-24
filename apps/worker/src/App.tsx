import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NotificationToast } from './components/NotificationToast';

import { WorkerAuthLandingPage } from './pages/WorkerAuthLandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { JobOffersPage } from './pages/JobOffersPage';
import { WorkerBookingsPage } from './pages/WorkerBookingsPage';
import { EarningsPage } from './pages/EarningsPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { WorkerProfilePage } from './pages/WorkerProfilePage';
import { WorkerNotificationsPage } from './pages/WorkerNotificationsPage';
import { WorkerSupportPage } from './pages/WorkerSupportPage';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Connecting to Kaam Setu Pro...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the Pro Landing Page with Worker Sign In & Registration Gateway
  if (!isAuthenticated || !user) {
    return <WorkerAuthLandingPage />;
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1F2937]">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
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
