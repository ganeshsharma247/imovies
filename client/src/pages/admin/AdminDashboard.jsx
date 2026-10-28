import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { DollarSign, Ticket, Film, Calendar, Plus, RefreshCw, AlertCircle, Shield, Check, Trash2, Edit } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [movies, setMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Movie Form Modal State
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [newMovie, setNewMovie] = useState({
    title: '',
    description: '',
    posterUrl: '',
    genre: 'Action, Sci-Fi',
    language: 'English',
    durationMinutes: 120,
    certification: 'PG-13',
    status: 'now_showing',
    rating: 8.0,
  });

  // New Show Form Modal State
  const [showShowModal, setShowShowModal] = useState(false);
  const [newShow, setNewShow] = useState({
    movieId: '',
    theatreId: '',
    screenName: '',
    startTime: '',
    endTime: '',
    silverPrice: 12,
    goldPrice: 18,
    platinumPrice: 25,
  });

  const [formMsg, setFormMsg] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, moviesRes, bookingsRes, theatresRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/movies?limit=20'),
        apiClient.get('/admin/bookings?limit=20'),
        apiClient.get('/theatres'),
      ]);
      setStats(statsRes.data.stats);
      setMovies(moviesRes.data.movies || []);
      setBookings(bookingsRes.data.bookings || []);
      setTheatres(theatresRes.data.theatres || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateMovie = async (e) => {
    e.preventDefault();
    setFormMsg(null);
    try {
      await apiClient.post('/admin/movies', {
        ...newMovie,
        genre: newMovie.genre.split(',').map((g) => g.trim()),
        language: newMovie.language.split(',').map((l) => l.trim()),
        releaseDate: new Date(),
      });
      setFormMsg({ type: 'success', text: 'Movie created successfully!' });
      setTimeout(() => {
        setShowMovieModal(false);
        setFormMsg(null);
        fetchAdminData();
      }, 1000);
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to create movie' });
    }
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    setFormMsg(null);
    try {
      await apiClient.post('/admin/shows', {
        movie: newShow.movieId,
        theatre: newShow.theatreId,
        screenName: newShow.screenName,
        startTime: new Date(newShow.startTime),
        endTime: new Date(newShow.endTime),
        tierPricing: {
          silver: Number(newShow.silverPrice),
          gold: Number(newShow.goldPrice),
          platinum: Number(newShow.platinumPrice),
        },
      });
      setFormMsg({ type: 'success', text: 'Show scheduled successfully with seat layout generated!' });
      setTimeout(() => {
        setShowShowModal(false);
        setFormMsg(null);
        fetchAdminData();
      }, 1000);
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to schedule show' });
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-cinema-accent mx-auto" />
        <p className="text-sm text-slate-400">Loading admin operations dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Cinema Administration</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage movies, auditorium schedules, pricing tiers, and audit platform bookings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowMovieModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cinema-accent hover:bg-cinema-accentHover text-white text-xs font-bold transition shadow-md shadow-red-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Movie</span>
          </button>

          <button
            onClick={() => setShowShowModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Show</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Gross Revenue</span>
            </span>
            <div className="text-2xl font-black text-white">${stats.totalRevenue.toFixed(2)}</div>
            <span className="text-[11px] text-emerald-400/80">Confirmed Transactions</span>
          </div>

          <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1.5">
              <Ticket className="w-4 h-4 text-cinema-accent" />
              <span>Tickets Issued</span>
            </span>
            <div className="text-2xl font-black text-white">{stats.totalTicketsSold}</div>
            <span className="text-[11px] text-slate-500">{stats.confirmedBookings} confirmed bookings</span>
          </div>

          <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1.5">
              <Film className="w-4 h-4 text-cinema-platinum" />
              <span>Active Movies</span>
            </span>
            <div className="text-2xl font-black text-white">{stats.activeMovies}</div>
            <span className="text-[11px] text-slate-500">Across {stats.activeTheatres} Theatres</span>
          </div>

          <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Scheduled Shows</span>
            </span>
            <div className="text-2xl font-black text-white">{stats.activeShows}</div>
            <span className="text-[11px] text-slate-500">Multi-screen inventory</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-cinema-border space-x-6 text-sm font-semibold">
        {['overview', 'movies', 'bookings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize transition border-b-2 ${
              activeTab === tab
                ? 'border-cinema-accent text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Movies Management */}
      {(activeTab === 'overview' || activeTab === 'movies') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Movie Catalog ({movies.length})</h2>
          </div>

          <div className="rounded-xl bg-cinema-card border border-cinema-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-cinema-dark/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-cinema-border">
                <tr>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Genre</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Cert</th>
                  <th className="p-3.5">Rating</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-border/50 text-slate-300">
                {movies.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-white flex items-center space-x-2">
                      <img src={m.posterUrl} alt={m.title} className="w-7 h-9 object-cover rounded bg-slate-800 flex-shrink-0" />
                      <span>{m.title}</span>
                    </td>
                    <td className="p-3.5">{m.genre.join(', ')}</td>
                    <td className="p-3.5">{m.durationMinutes}m</td>
                    <td className="p-3.5"><span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold">{m.certification}</span></td>
                    <td className="p-3.5 font-bold text-cinema-gold">{m.rating?.toFixed(1)}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === 'now_showing' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Bookings Audit */}
      {(activeTab === 'overview' || activeTab === 'bookings') && (
        <div className="space-y-4 pt-4">
          <h2 className="text-base font-bold text-white">Recent Platform Bookings Audit</h2>

          <div className="rounded-xl bg-cinema-card border border-cinema-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-cinema-dark/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-cinema-border">
                <tr>
                  <th className="p-3.5">Ref</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Movie</th>
                  <th className="p-3.5">Seats</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-border/50 text-slate-300">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono font-bold text-cinema-accent">{b.bookingReference}</td>
                    <td className="p-3.5">{b.user?.name || b.user?.email || 'Customer'}</td>
                    <td className="p-3.5 font-medium text-white">{b.movie?.title}</td>
                    <td className="p-3.5 font-mono">{b.seats?.map((s) => s.seatId).join(', ')}</td>
                    <td className="p-3.5 font-bold text-white">${b.pricing?.totalAmount?.toFixed(2)}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Movie */}
      {showMovieModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl bg-cinema-card border border-cinema-border p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New Movie</h3>

            <form onSubmit={handleCreateMovie} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={newMovie.title}
                  onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={newMovie.description}
                  onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Poster Image URL</label>
                  <input
                    type="url"
                    required
                    value={newMovie.posterUrl}
                    onChange={(e) => setNewMovie({ ...newMovie, posterUrl: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newMovie.durationMinutes}
                    onChange={(e) => setNewMovie({ ...newMovie, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Certification</label>
                  <select
                    value={newMovie.certification}
                    onChange={(e) => setNewMovie({ ...newMovie, certification: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                  >
                    {['U', 'UA', 'A', 'R', 'PG-13', 'PG', 'G'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Release Status</label>
                  <select
                    value={newMovie.status}
                    onChange={(e) => setNewMovie({ ...newMovie, status: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Initial Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={newMovie.rating}
                    onChange={(e) => setNewMovie({ ...newMovie, rating: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                  />
                </div>
              </div>

              {formMsg && (
                <div className={`p-2.5 rounded text-xs ${formMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {formMsg.text}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovieModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cinema-accent text-white font-bold text-xs rounded-lg"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Show */}
      {showShowModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl bg-cinema-card border border-cinema-border p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Schedule New Show</h3>

            <form onSubmit={handleCreateShow} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Movie</label>
                <select
                  required
                  value={newShow.movieId}
                  onChange={(e) => setNewShow({ ...newShow, movieId: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                >
                  <option value="">-- Choose Movie --</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Theatre</label>
                <select
                  required
                  value={newShow.theatreId}
                  onChange={(e) => {
                    const t = theatres.find((th) => th._id === e.target.value);
                    setNewShow({
                      ...newShow,
                      theatreId: e.target.value,
                      screenName: t?.screens?.[0]?.name || '',
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                >
                  <option value="">-- Choose Theatre --</option>
                  {theatres.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} ({t.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Auditorium / Screen Name</label>
                <input
                  type="text"
                  required
                  value={newShow.screenName}
                  onChange={(e) => setNewShow({ ...newShow, screenName: e.target.value })}
                  placeholder="e.g. Screen 1 - IMAX Laser 3D"
                  className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newShow.startTime}
                    onChange={(e) => setNewShow({ ...newShow, startTime: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newShow.endTime}
                    onChange={(e) => setNewShow({ ...newShow, endTime: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Silver ($)</label>
                  <input
                    type="number"
                    value={newShow.silverPrice}
                    onChange={(e) => setNewShow({ ...newShow, silverPrice: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Gold ($)</label>
                  <input
                    type="number"
                    value={newShow.goldPrice}
                    onChange={(e) => setNewShow({ ...newShow, goldPrice: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Platinum ($)</label>
                  <input
                    type="number"
                    value={newShow.platinumPrice}
                    onChange={(e) => setNewShow({ ...newShow, platinumPrice: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-cinema-dark border border-cinema-border rounded-lg text-white"
                  />
                </div>
              </div>

              {formMsg && (
                <div className={`p-2.5 rounded text-xs ${formMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {formMsg.text}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShowModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cinema-accent text-white font-bold text-xs rounded-lg"
                >
                  Schedule Show
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
