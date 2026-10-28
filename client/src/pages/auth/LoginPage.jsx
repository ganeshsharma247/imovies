import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Film, Lock, Mail, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

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
      <div className="rounded-2xl bg-cinema-card border border-cinema-border p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cinema-accent to-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-950/40">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Sign In to IMovies</h1>
          <p className="text-xs text-slate-400">
            Access your tickets, fast checkout, and movie watchlist.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-900/40 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-cinema-dark border border-cinema-border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cinema-accent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-cinema-dark border border-cinema-border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cinema-accent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-cinema-accent hover:bg-cinema-accentHover disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-950/50 flex items-center justify-center space-x-2 transition"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Fast Fill Buttons */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 block text-center">
            Instant Demo Logins
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin@imovies.com', 'AdminPassword123!')}
              className="py-1.5 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold hover:bg-amber-500/20 transition text-center"
            >
              Demo Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user@imovies.com', 'UserPassword123!')}
              className="py-1.5 px-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold hover:bg-blue-500/20 transition text-center"
            >
              Demo User
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Do not have an account?{' '}
          <Link to="/register" className="text-cinema-accent hover:underline font-bold">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
