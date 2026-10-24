import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NotificationToast } from './components/NotificationToast';

import { DashboardPage } from './pages/DashboardPage';
import { JobOffersPage } from './pages/JobOffersPage';
import { WorkerBookingsPage } from './pages/WorkerBookingsPage';
import { EarningsPage } from './pages/EarningsPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { WorkerProfilePage } from './pages/WorkerProfilePage';
import { WorkerNotificationsPage } from './pages/WorkerNotificationsPage';
import { WorkerSupportPage } from './pages/WorkerSupportPage';

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1F2937]">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/offers" element={<JobOffersPage />} />
                <Route path="/bookings" element={<WorkerBookingsPage />} />
                <Route path="/earnings" element={<EarningsPage />} />
                <Route path="/availability" element={<AvailabilityPage />} />
                <Route path="/profile" element={<WorkerProfilePage />} />
                <Route path="/notifications" element={<WorkerNotificationsPage />} />
                <Route path="/support" element={<WorkerSupportPage />} />
              </Routes>
            </main>
            <Footer />
            <NotificationToast />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
export default App;
