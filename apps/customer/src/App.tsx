import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NotificationToast } from './components/NotificationToast';

import { HomePage } from './pages/HomePage';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { BookingsListPage } from './pages/BookingsListPage';
import { BookingDetailsPage } from './pages/BookingDetailsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SupportPage } from './pages/SupportPage';

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1F2937]">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/request" element={<CreateRequestPage />} />
                <Route path="/jobs/:id" element={<JobDetailsPage />} />
                <Route path="/my-requests" element={<MyRequestsPage />} />
                <Route path="/bookings" element={<BookingsListPage />} />
                <Route path="/bookings/:id" element={<BookingDetailsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/support" element={<SupportPage />} />
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
