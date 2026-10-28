import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { MapPin, Film, Sparkles, AlertCircle, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TheatresPage() {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState('All');

  const fetchTheatres = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedCity !== 'All') {
        params.city = selectedCity;
      }
      const res = await apiClient.get('/theatres', { params });
      setTheatres(res.data.theatres || []);
    } catch (err) {
      setError(err.message || 'Failed to load theatres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, [selectedCity]);

  const cities = ['All', 'Metropolis', 'San Francisco', 'Chicago'];

  return (
    <div className="space-y-10 pb-20">
      {/* Page Title & City Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-cinema-border/80 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white">Cinema Auditoriums</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explore premium IMAX, Dolby Atmos sound stages, and luxury VIP lounges.
          </p>
        </div>

        {/* City Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                selectedCity === city
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white border-transparent shadow-md shadow-violet-950/40'
                  : 'bg-cinema-card text-slate-400 border-cinema-border hover:border-slate-700 hover:text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <RefreshCw className="w-9 h-9 animate-spin text-cyan-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Loading cinema complexes...</p>
        </div>
      ) : error ? (
        <div className="p-10 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-center space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-300 font-medium">{error}</p>
          <button
            onClick={fetchTheatres}
            className="text-xs font-bold px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      ) : theatres.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-cinema-card border border-cinema-border max-w-md mx-auto space-y-3">
          <Film className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Theatres Found</h3>
          <p className="text-xs text-slate-400">No auditoriums located in {selectedCity}. Try selecting All cities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {theatres.map((t) => (
            <div
              key={t._id}
              className="rounded-3xl bg-cinema-card border border-cinema-border p-7 space-y-5 hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-950/30 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-800/40">
                    {t.city}, {t.state}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {t.screens?.length || 1} {t.screens?.length === 1 ? 'Screen' : 'Screens'}
                  </span>
                </div>

                <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                  {t.name}
                </h3>

                <p className="text-xs text-slate-400 flex items-start space-x-1.5">
                  <MapPin className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{t.address}</span>
                </p>

                {/* Amenities Badges */}
                {t.amenities && t.amenities.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      Premium Features
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {t.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-violet-950/30 text-violet-300 border border-violet-800/30"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Screens List & Action */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Screen Layouts</span>
                  <span className="text-slate-500 font-semibold">{t.totalCapacity || 'Multi-tier'} Seats</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {t.screens?.map((screen) => (
                    <div
                      key={screen.screenNumber}
                      className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] flex items-center justify-between text-slate-300"
                    >
                      <span className="font-semibold truncate">{screen.name}</span>
                      <span className="text-cyan-400 font-bold ml-1">{screen.format}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/"
                  className="w-full text-center py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-cyan-300 text-white text-xs font-bold transition flex items-center justify-center space-x-2 border border-slate-700/60"
                >
                  <span>Explore Movies at This Theatre</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
