import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Ticket, Sparkles } from 'lucide-react';

export default function MovieCard({ movie }) {
  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="group relative rounded-2xl bg-cinema-card border border-cinema-border overflow-hidden hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-950/40 transition-all duration-300 flex flex-col transform hover:-translate-y-1">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Ambient Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-sm">
            {movie.certification}
          </span>
          {movie.status === 'coming_soon' && (
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-gradient-to-r from-cyan-500 to-blue-500 text-black uppercase tracking-wider shadow-sm">
              Upcoming
            </span>
          )}
        </div>

        {/* Rating Badge */}
        {movie.rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/30 shadow-sm z-10">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom Ambient Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-darker via-cinema-darker/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

        {/* Hover Action Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <Link
            to={`/movie/${movie._id}`}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-950/80 transition-all"
          >
            <Ticket className="w-4 h-4 text-cyan-200" />
            <span>{movie.status === 'now_showing' ? 'Book Tickets' : 'View Schedule'}</span>
          </Link>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-gradient-to-b from-cinema-card to-cinema-darker/60">
        <div>
          <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-cyan-300 transition-colors">
            {movie.title}
          </h3>

          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1.5 font-medium">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-cyan-400/80" />
              <span>{formatDuration(movie.durationMinutes)}</span>
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="truncate text-slate-400">{movie.language.join(', ')}</span>
          </div>
        </div>

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {movie.genre.slice(0, 3).map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-950/30 text-violet-300 border border-violet-800/30"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
