import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Star, Clock, Calendar, MapPin, Film, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Generate next 3 days
  const dateOptions = [0, 1, 2].map((offset) => {
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

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-cinema-accent mx-auto" />
        <p className="text-sm text-slate-400">Loading cinema schedule & movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="p-8 rounded-xl bg-red-950/20 border border-red-900/30 text-center space-y-3 my-10">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-sm text-red-300">{error || 'Movie not found'}</p>
        <Link to="/" className="inline-block text-xs font-semibold px-4 py-2 bg-slate-800 text-white rounded-lg">
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Movie Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border border-cinema-border bg-cinema-card p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Poster */}
        <div className="w-full sm:w-64 flex-shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 shadow-2xl border border-cinema-border">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Details Content */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-cinema-accent text-white uppercase">
              {movie.certification}
            </span>
            {movie.rating > 0 && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-cinema-gold border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-cinema-gold" />
                <span>{movie.rating.toFixed(1)} / 10</span>
              </span>
            )}
            <span className="text-xs text-slate-400">
              {movie.language.join(', ')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {movie.title}
          </h1>

          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m</span>
            </span>
            <span>&bull;</span>
            <span>Released: {new Date(movie.releaseDate).toLocaleDateString()}</span>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
            {movie.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-400 border-t border-cinema-border/60">
            <div>
              <strong className="text-slate-300">Director:</strong> {movie.director || 'Elena Vance'}
            </div>
            <div>
              <strong className="text-slate-300">Cast:</strong> {movie.cast?.join(', ') || 'Ensemble Cast'}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {movie.genre.map((g) => (
              <span key={g} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Showtimes & Booking Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-border pb-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-cinema-accent" />
            <span>Select Showtime</span>
          </h2>

          {/* Date Picker Chips */}
          <div className="flex items-center space-x-2">
            {dateOptions.map((opt, idx) => (
              <button
                key={opt.offset}
                onClick={() => setSelectedDateIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex flex-col items-center border ${
                  selectedDateIndex === idx
                    ? 'bg-cinema-accent text-white border-cinema-accent shadow-md shadow-red-950/40'
                    : 'bg-cinema-card text-slate-300 border-cinema-border hover:border-slate-600'
                }`}
              >
                <span>{opt.dayName}</span>
                <span className="text-[11px] opacity-80">{opt.dateFormatted}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theatres & Shows List */}
        {Object.keys(showsByTheatre).length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-cinema-card border border-cinema-border space-y-3">
            <Film className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Shows Scheduled for {selectedDate.dayName}</h3>
            <p className="text-xs text-slate-400">
              Please choose another date or check back later for newly scheduled screenings.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(showsByTheatre).map(([theatreName, { theatre, shows: tShows }]) => (
              <div
                key={theatreName}
                className="rounded-xl bg-cinema-card border border-cinema-border p-6 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cinema-border/50 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{theatreName}</h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{theatre?.address || theatre?.city}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {theatre?.amenities?.slice(0, 3).map((a) => (
                      <span key={a} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Showtimes Grid */}
                <div className="flex flex-wrap gap-3">
                  {tShows.map((show) => {
                    const timeString = new Date(show.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <Link
                        key={show._id}
                        to={`/shows/${show._id}/seats`}
                        className="group p-3 rounded-xl bg-cinema-dark border border-cinema-border hover:border-cinema-accent hover:bg-slate-900 transition flex flex-col space-y-1 min-w-[130px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white group-hover:text-cinema-accent transition-colors">
                            {timeString}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cinema-accent transition-colors" />
                        </div>
                        <span className="text-[11px] text-slate-400 truncate">
                          {show.screenName}
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                          <span>From ${show.tierPricing?.silver || 12}</span>
                          <span className="text-emerald-400 font-semibold">{show.availableSeats} left</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
