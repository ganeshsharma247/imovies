import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clapperboard, Lock, Mail, AlertCircle, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="rounded-3xl bg-cinema-card border border-cinema-border p-8 sm:p-10 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-violet-600/20 to-transparent blur-xl pointer-events-none" />

        <div className="text-center space-y-2 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-violet-950/60">
            <Clapperboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Sign In to IMovies</h1>
          <p className="text-xs text-slate-400">
            Access your reserved tickets, instant seat holds, and booking history.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-cinema-darker border border-cinema-border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-cinema-darker border border-cinema-border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-violet-950/80 hover:shadow-cyan-950/80 flex items-center justify-center space-x-2 transition duration-200"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-200" />
              </>
            )}
          </button>
        </form>

        {/* Instant Demo Fill Buttons */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2.5 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block text-center">
            One-Click Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemo('admin@imovies.com', 'AdminPassword123!')}
              className="py-2 px-3 rounded-xl bg-violet-950/40 border border-violet-800/40 text-violet-300 text-xs font-bold hover:bg-violet-900/40 transition text-center"
            >
              Demo Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user@imovies.com', 'UserPassword123!')}
              className="py-2 px-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs font-bold hover:bg-cyan-900/40 transition text-center"
            >
              Demo Customer
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 relative z-10">
          New to IMovies?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
