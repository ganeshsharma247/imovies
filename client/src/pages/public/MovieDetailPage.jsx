import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Star, Clock, Calendar, MapPin, Film, AlertCircle, RefreshCw, ChevronRight, Play, Ticket, Sparkles } from 'lucide-react';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Generate next 4 calendar days dynamically
  const dateOptions = [0, 1, 2, 3].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      offset,
      dayName: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isoString: d.toISOString().split('T')[0],
    };
  });

  const selectedDate = dateOptions[selectedDateIndex];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [movieRes, showsRes] = await Promise.all([
          apiClient.get(`/movies/${id}`),
          apiClient.get(`/movies/${id}/shows`, { params: { date: selectedDate.isoString } }),
        ]);
        setMovie(movieRes.data.movie);
        setShows(showsRes.data.shows || []);
      } catch (err) {
        setError(err.message || 'Failed to load movie details');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, selectedDateIndex]);

  // Group shows by Theatre
  const showsByTheatre = shows.reduce((acc, show) => {
    const theatreName = show.theatre?.name || 'Grand Cinema';
    if (!acc[theatreName]) {
      acc[theatreName] = {
        theatre: show.theatre,
        shows: [],
      };
    }
    acc[theatreName].shows.push(show);
    return acc;
  }, {});

  const formatShowTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-400">Loading cinema schedule & movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="p-10 rounded-3xl bg-rose-950/20 border border-rose-900/40 text-center space-y-4 my-12 max-w-md mx-auto">
        <AlertCircle className="w-9 h-9 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-300 font-medium">{error || 'Movie not found'}</p>
        <Link
          to="/"
          className="inline-block text-xs font-bold px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl shadow-md"
        >
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Movie Hero Showcase Card */}
      <div className="relative rounded-3xl overflow-hidden border border-cinema-border bg-cinema-card p-6 sm:p-10 shadow-2xl">
        {/* Ambient Blurred Backdrop */}
        <div className="absolute inset-0 -z-10 opacity-25">
          <img
            src={movie.bannerUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover filter blur-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-card via-cinema-card/90 to-transparent" />
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          {/* Poster */}
          <div className="w-full sm:w-64 flex-shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-cinema-border/80 group">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Details Content */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-violet-950/50 text-violet-300 border border-violet-800/40">
                {movie.certification}
              </span>
              {movie.rating > 0 && (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-black bg-black/60 text-amber-300 border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{movie.rating.toFixed(1)} / 10</span>
                </div>
              )}
              <span className="text-xs text-slate-400 font-medium">
                {movie.language.join(', ')}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {movie.title}
            </h1>

            <div className="flex items-center space-x-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m</span>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span>Released: {new Date(movie.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed max-w-3xl font-normal">
              {movie.description}
            </p>

            {/* Crew & Cast Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs text-slate-400 border-t border-cinema-border/70">
              <div>
                <span className="text-slate-500 font-bold block text-[11px] uppercase tracking-wider">Director</span>
                <span className="text-slate-200 font-semibold">{movie.director || 'Elena Vance'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[11px] uppercase tracking-wider">Starring</span>
                <span className="text-slate-200 font-semibold">{movie.cast?.join(', ') || 'Marcus Kane, Aria Sterling'}</span>
              </div>
            </div>

            {/* Trailer & Quick Booking Scroll */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#schedule-section"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-black shadow-lg shadow-violet-950/70 transition flex items-center space-x-2"
              >
                <Ticket className="w-4 h-4 text-cyan-200" />
                <span>Select Showtime Below</span>
              </a>
              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center space-x-2"
                >
                  <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                  <span>Watch Trailer</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes & Booking Section */}
      <div id="schedule-section" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-border/80 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white">Select Date & Showtime</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Choose your preferred date and auditorium time slot to reserve seats.
            </p>
          </div>

          {/* Date Selector Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {dateOptions.map((opt, idx) => (
              <button
                key={opt.isoString}
                onClick={() => setSelectedDateIndex(idx)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all border flex flex-col items-center min-w-[76px] ${
                  selectedDateIndex === idx
                    ? 'bg-gradient-to-b from-violet-600 to-indigo-700 text-white border-violet-400 shadow-lg shadow-violet-950/50'
                    : 'bg-cinema-card text-slate-400 border-cinema-border hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="uppercase text-[10px] tracking-wider opacity-80">{opt.dayName}</span>
                <span className="text-sm font-extrabold">{opt.dateFormatted}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Shows Grouped by Theatre */}
        {Object.keys(showsByTheatre).length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-cinema-card border border-cinema-border space-y-3 max-w-lg mx-auto">
            <Film className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Scheduled Shows for {selectedDate.dayName}</h3>
            <p className="text-xs text-slate-400">
              There are no available showtimes for this movie on {selectedDate.dateFormatted}. Please select another date above.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(showsByTheatre).map(([theatreName, { theatre, shows: theatreShows }]) => (
              <div
                key={theatreName}
                className="rounded-3xl bg-cinema-card border border-cinema-border p-6 sm:p-7 space-y-4 hover:border-slate-700/80 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-white">{theatreName}</h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{theatre?.address}, {theatre?.city}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-cyan-300 font-bold">
                      M-Ticket & Food Available
                    </span>
                  </div>
                </div>

                {/* Showtimes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                  {theatreShows.map((show) => (
                    <Link
                      key={show._id}
                      to={`/shows/${show._id}/seats`}
                      className="group rounded-2xl bg-cinema-darker/80 border border-cinema-border p-3.5 flex flex-col items-center space-y-1 hover:border-cyan-400/80 hover:bg-violet-950/20 hover:shadow-lg hover:shadow-cyan-950/30 transition-all duration-200"
                    >
                      <span className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                        {formatShowTime(show.startTime)}
                      </span>
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider truncate max-w-full">
                        {show.screenName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        From <strong className="text-slate-200">${show.tierPricing?.silver || 12}</strong>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
