import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Clapperboard, Ticket, Shield, LogOut, User as UserIcon, Menu, X, Sparkles, Activity } from 'lucide-react';

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
    <header className="border-b border-cinema-border/70 bg-cinema-dark/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-[1px] shadow-lg shadow-violet-950/50 group-hover:shadow-violet-600/30 transition-all duration-300">
            <div className="w-full h-full bg-cinema-dark rounded-[11px] flex items-center justify-center group-hover:bg-opacity-80 transition">
              <Clapperboard className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-black tracking-wider text-white">IMOVIES</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse" />
            </div>
            <span className="text-[9px] font-semibold tracking-widest uppercase text-violet-400 -mt-1">
              Cinema Odyssey
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
          <Link
            to="/"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              isActive('/')
                ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30 shadow-sm shadow-violet-950/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Movies
          </Link>
          <Link
            to="/theatres"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              isActive('/theatres')
                ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30 shadow-sm shadow-violet-950/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Theatres
          </Link>
          {isAuthenticated && (
            <Link
              to="/my-bookings"
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                isActive('/my-bookings')
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-cyan-400" />
              <span>My Tickets</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center space-x-1.5 ml-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-violet-900/40 to-cyan-900/40 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 shadow-sm transition`}
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin Console</span>
            </Link>
          )}
        </nav>

        {/* Right side controls */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Socket live status indicator */}
          <div
            className="flex items-center space-x-2 text-[11px] font-medium bg-cinema-card/80 px-3 py-1 rounded-full border border-cinema-border/90 shadow-inner"
            title={connected ? 'Synchronized with live seat booking engine' : 'Connecting to live seat engine...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className={connected ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {connected ? 'Live Sync' : 'Connecting...'}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2.5 text-xs text-slate-200 bg-cinema-card px-3 py-1.5 rounded-xl border border-cinema-border/90 shadow-sm">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold truncate max-w-[120px]">{user.name}</span>
                {isAdmin && (
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl hover:bg-slate-800/60 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 px-4 py-1.5 rounded-xl shadow-lg shadow-violet-950/60 hover:shadow-cyan-950/60 transition duration-200"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-cinema-border bg-cinema-dark/95 backdrop-blur-2xl px-5 pt-3 pb-5 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-200 hover:text-violet-400 py-1"
          >
            Movies
          </Link>
          <Link
            to="/theatres"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-200 hover:text-violet-400 py-1"
          >
            Theatres
          </Link>
          {isAuthenticated && (
            <Link
              to="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-cyan-300 hover:text-cyan-200 py-1"
            >
              My Tickets
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-violet-400 hover:text-violet-300 py-1"
            >
              Admin Console
            </Link>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {isAuthenticated ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-300 font-semibold truncate">{user.name}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-400 font-bold hover:underline"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 w-full">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold text-slate-300 bg-slate-800/80 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl"
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
