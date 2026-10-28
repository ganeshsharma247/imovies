import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import MovieCard from '../../components/movies/MovieCard';
import { Search, Film, Sparkles, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const GENRES = ['All', 'Sci-Fi', 'Action', 'Thriller', 'Adventure', 'Fantasy', 'Drama'];

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
        limit: 12,
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

  // Featured Hero movie (first movie with high rating)
  const featuredMovie = movies[0];

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Showcase Banner */}
      {featuredMovie && !searchQuery && selectedGenre === 'All' && (
        <div className="relative rounded-2xl overflow-hidden border border-cinema-border bg-cinema-card shadow-2xl">
          <div className="absolute inset-0">
            <img
              src={featuredMovie.bannerUrl || featuredMovie.posterUrl}
              alt={featuredMovie.title}
              className="w-full h-full object-cover object-center filter blur-sm brightness-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-card via-cinema-card/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-dark via-cinema-dark/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-3xl p-6 sm:p-10 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-cinema-accent/20 text-red-400 border border-cinema-accent/30">
              <Sparkles className="w-3.5 h-3.5 text-cinema-accent" />
              <span>Trending Spotlight</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {featuredMovie.title}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base line-clamp-3 leading-relaxed max-w-2xl">
              {featuredMovie.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={`/movie/${featuredMovie._id}`}
                className="px-6 py-2.5 rounded-lg bg-cinema-accent hover:bg-cinema-accentHover text-white text-sm font-bold shadow-lg shadow-red-950/50 transition"
              >
                Book Tickets Now
              </Link>
              <div className="text-xs text-slate-400 flex items-center space-x-2">
                <span>Certification: <strong className="text-white">{featuredMovie.certification}</strong></span>
                <span>&bull;</span>
                <span>Duration: <strong className="text-white">{featuredMovie.durationMinutes} mins</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex rounded-xl bg-cinema-card p-1 border border-cinema-border max-w-md">
            <button
              onClick={() => setActiveTab('now_showing')}
              className={`flex-1 text-xs sm:text-sm font-bold py-2 px-4 rounded-lg transition ${
                activeTab === 'now_showing'
                  ? 'bg-cinema-accent text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => setActiveTab('coming_soon')}
              className={`flex-1 text-xs sm:text-sm font-bold py-2 px-4 rounded-lg transition ${
                activeTab === 'coming_soon'
                  ? 'bg-cinema-accent text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Coming Soon
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by movie title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-cinema-card border border-cinema-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cinema-accent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                selectedGenre === g
                  ? 'bg-white text-black border-white'
                  : 'bg-cinema-card text-slate-300 border-cinema-border hover:border-slate-600'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl bg-cinema-card border border-cinema-border aspect-[2/3] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-900/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={fetchMovies}
            className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : movies.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-cinema-card border border-cinema-border space-y-3">
          <Film className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Movies Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No movies match your selected criteria. Try selecting another genre or clearing the search bar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
