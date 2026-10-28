import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import MovieCard from '../../components/movies/MovieCard';
import { Search, Clapperboard, Sparkles, Filter, AlertCircle, RefreshCw, Star, Play, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const GENRES = ['All', 'Sci-Fi', 'Action', 'Thriller', 'Adventure', 'Fantasy', 'Crime', 'Drama'];

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('now_showing');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: activeTab,
        limit: 16,
      };
      if (selectedGenre !== 'All') {
        params.genre = selectedGenre;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await apiClient.get('/movies', { params });
      setMovies(res.data.movies || []);
    } catch (err) {
      setError(err.message || 'Failed to load movie catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [activeTab, selectedGenre, searchQuery]);

  // Featured Hero movie (top rated now showing)
  const featuredMovie = movies[0];

  const resetFilters = () => {
    setSelectedGenre('All');
    setSearchQuery('');
    setActiveTab('now_showing');
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Cinematic Hero Spotlight Banner */}
      {featuredMovie && !searchQuery && selectedGenre === 'All' && (
        <div className="relative rounded-3xl overflow-hidden border border-cinema-border bg-cinema-card shadow-2xl group">
          {/* Background Poster & Ambient Lighting */}
          <div className="absolute inset-0">
            <img
              src={featuredMovie.bannerUrl || featuredMovie.posterUrl}
              alt={featuredMovie.title}
              className="w-full h-full object-cover object-center filter blur-md brightness-30 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-card via-cinema-card/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-darker via-cinema-darker/90 to-transparent" />
          </div>

          <div className="relative z-10 max-w-3xl p-6 sm:p-12 space-y-5">
            {/* Spotlight Tag */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-violet-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>FEATURED PREMIERE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              {featuredMovie.title}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base line-clamp-3 leading-relaxed max-w-2xl font-normal">
              {featuredMovie.description}
            </p>

            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/60 border border-amber-500/30 text-amber-300 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{featuredMovie.rating.toFixed(1)} / 10</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-white font-bold">
                {featuredMovie.certification}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-slate-300 font-medium">
                {featuredMovie.durationMinutes} mins
              </span>
              <span className="text-cyan-400 font-semibold">
                {featuredMovie.genre.join(' • ')}
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Link
                to={`/movie/${featuredMovie._id}`}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-sm font-black shadow-lg shadow-violet-950/70 hover:shadow-cyan-950/70 transition duration-200 flex items-center space-x-2"
              >
                <span>Reserve Tickets</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              {featuredMovie.trailerUrl && (
                <a
                  href={featuredMovie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-bold border border-slate-700/80 hover:border-slate-600 transition flex items-center space-x-2"
                >
                  <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                  <span>Watch Trailer</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modern Filter & Search Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Sleek Status Toggle */}
          <div className="flex rounded-2xl bg-cinema-card p-1.5 border border-cinema-border max-w-sm">
            <button
              onClick={() => setActiveTab('now_showing')}
              className={`flex-1 text-xs sm:text-sm font-black py-2.5 px-5 rounded-xl transition-all duration-200 ${
                activeTab === 'now_showing'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => setActiveTab('coming_soon')}
              className={`flex-1 text-xs sm:text-sm font-black py-2.5 px-5 rounded-xl transition-all duration-200 ${
                activeTab === 'coming_soon'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Coming Soon
            </button>
          </div>

          {/* High-Tech Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
            <input
              type="text"
              placeholder="Search by title, director, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 text-xs sm:text-sm bg-cinema-card border border-cinema-border rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Genre Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <Filter className="w-4 h-4 text-violet-400/80 flex-shrink-0 mr-1" />
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedGenre === g
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white border-transparent shadow-md shadow-violet-950/40'
                  : 'bg-cinema-card text-slate-400 border-cinema-border hover:border-slate-700 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid / State Handling */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-cinema-card border border-cinema-border aspect-[2/3] animate-pulse relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-cinema-cardHover via-transparent to-transparent" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-10 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-center space-y-4 max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">Catalog Connection Issue</h3>
            <p className="text-xs text-rose-300/80 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchMovies}
            className="inline-flex items-center space-x-2 text-xs font-bold px-5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      ) : movies.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-cinema-card border border-cinema-border space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
            <Clapperboard className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Movies Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              No movies currently match the selected filters or search terms. Try clearing the filters or check another category.
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="inline-flex items-center space-x-2 text-xs font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-950/40 hover:opacity-95 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-300">
              Showing <span className="text-cyan-400 font-extrabold">{movies.length}</span> titles
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
