import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar';
import HomePage from './pages/public/HomePage';
import MovieDetailPage from './pages/public/MovieDetailPage';
import TheatresPage from './pages/public/TheatresPage';
import SeatSelectionPage from './pages/user/SeatSelectionPage';
import CheckoutPage from './pages/user/CheckoutPage';
import BookingConfirmationPage from './pages/user/BookingConfirmationPage';
import BookingHistoryPage from './pages/user/BookingHistoryPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { Film, Shield, RefreshCw, Sparkles, Clapperboard } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-cinema-accent mx-auto" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-cinema-accent mx-auto" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-cinema-darker text-slate-100 flex flex-col justify-between selection:bg-cinema-accent selection:text-white relative overflow-hidden">
      {/* Subtle top ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(139,92,246,0.12),rgba(6,182,212,0.05),transparent)] blur-3xl -z-10" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full relative z-10">
        {children}
      </main>

      <footer className="border-t border-cinema-border/80 bg-cinema-dark/80 backdrop-blur-md py-8 relative z-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center">
              <Clapperboard className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold tracking-wide text-white">IMOVIES</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">Cinematic Experience & Live Booking Engine</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-500 text-[11px]">
            <span>100% Mock Safe Simulation</span>
            <span>&bull;</span>
            <span>&copy; {new Date().getFullYear()} IMovies Cinema Systems</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/movie/:id" element={<MovieDetailPage />} />
              <Route path="/theatres" element={<TheatresPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected User Routes */}
              <Route
                path="/shows/:id/seats"
                element={
                  <ProtectedRoute>
                    <SeatSelectionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-success/:id"
                element={
                  <ProtectedRoute>
                    <BookingConfirmationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <BookingHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Route */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
