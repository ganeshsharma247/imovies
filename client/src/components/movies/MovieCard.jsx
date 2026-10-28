import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Tag } from 'lucide-react';

export default function MovieCard({ movie }) {
  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="group relative rounded-xl bg-cinema-card border border-cinema-border overflow-hidden hover:border-cinema-accent/50 hover:shadow-xl hover:shadow-red-950/20 transition-all duration-300 flex flex-col">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Status / Certification Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/20">
            {movie.certification}
          </span>
          {movie.status === 'coming_soon' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/90 text-black uppercase tracking-wider">
              Upcoming
            </span>
          )}
        </div>

        {/* Rating Badge */}
        {movie.rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-bold bg-black/80 backdrop-blur-md text-cinema-gold border border-amber-500/30">
            <Star className="w-3.5 h-3.5 fill-cinema-gold" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-dark via-cinema-dark/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <Link
            to={`/movie/${movie._id}`}
            className="w-full text-center py-2.5 rounded-lg bg-cinema-accent hover:bg-cinema-accentHover text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-950/50 transition-colors"
          >
            {movie.status === 'now_showing' ? 'Book Tickets' : 'View Details'}
          </Link>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-cinema-accent transition-colors">
            {movie.title}
          </h3>

          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1.5">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDuration(movie.durationMinutes)}</span>
            </span>
            <span>&bull;</span>
            <span className="truncate">{movie.language.join(', ')}</span>
          </div>
        </div>

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {movie.genre.slice(0, 3).map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
