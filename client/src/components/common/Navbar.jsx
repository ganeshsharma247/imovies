import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Film, Ticket, Shield, LogOut, User as UserIcon, Menu, X, Radio } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-cinema-border/70 bg-cinema-card/75 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cinema-accent to-red-500 flex items-center justify-center shadow-lg shadow-red-950/40 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-extrabold tracking-tight text-white">
              IMOVIES<span className="text-cinema-accent font-black">.</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            to="/"
            className={`transition ${isActive('/') ? 'text-cinema-accent font-semibold' : 'text-slate-300 hover:text-white'}`}
          >
            Movies
          </Link>
          <Link
            to="/theatres"
            className={`transition ${isActive('/theatres') ? 'text-cinema-accent font-semibold' : 'text-slate-300 hover:text-white'}`}
          >
            Theatres
          </Link>
          {isAuthenticated && (
            <Link
              to="/my-bookings"
              className={`flex items-center space-x-1.5 transition ${isActive('/my-bookings') ? 'text-cinema-accent font-semibold' : 'text-slate-300 hover:text-white'}`}
            >
              <Ticket className="w-4 h-4" />
              <span>My Tickets</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Right side controls */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Socket live status indicator */}
          <div
            className="flex items-center space-x-1.5 text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800"
            title={connected ? 'Connected to live seat updates' : 'Connecting to live updates...'}
          >
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{connected ? 'Live Sync' : 'Offline'}</span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-xs text-slate-300 bg-cinema-dark px-3 py-1.5 rounded-lg border border-cinema-border">
                <UserIcon className="w-3.5 h-3.5 text-cinema-accent" />
                <span className="font-medium truncate max-w-[120px]">{user.name}</span>
                {isAdmin && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-bold uppercase">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold text-white bg-cinema-accent hover:bg-cinema-accentHover px-4 py-1.5 rounded-lg shadow-md shadow-red-950/40 transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-cinema-border bg-cinema-card/95 px-4 pt-2 pb-4 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-200 hover:text-white"
          >
            Movies
          </Link>
          <Link
            to="/theatres"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-200 hover:text-white"
          >
            Theatres
          </Link>
          {isAuthenticated && (
            <Link
              to="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 hover:text-white"
            >
              My Tickets
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-amber-400 hover:text-amber-300"
            >
              Admin Panel
            </Link>
          )}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            {isAuthenticated ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-400 truncate">{user.name}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-400 font-semibold"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 w-full">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 text-center text-xs py-2 bg-slate-800 text-white rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 text-center text-xs py-2 bg-cinema-accent text-white rounded-lg font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
