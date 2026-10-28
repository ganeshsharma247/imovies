import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { MapPin, Film, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

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
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Cinema Theatres</h1>
          <p className="text-xs text-slate-400 mt-1">
            Explore world-class IMAX, Dolby Atmos, and luxury cinema auditoriums.
          </p>
        </div>

        {/* City Filter */}
        <div className="flex items-center space-x-2">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                selectedCity === city
                  ? 'bg-cinema-accent text-white border-cinema-accent'
                  : 'bg-cinema-card text-slate-400 border-cinema-border hover:text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-cinema-accent mx-auto" />
          <p className="text-sm text-slate-400">Loading theatres...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-900/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : theatres.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-cinema-card border border-cinema-border">
          <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No theatres found in {selectedCity}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {theatres.map((t) => (
            <div
              key={t._id}
              className="rounded-2xl bg-cinema-card border border-cinema-border p-6 space-y-4 hover:border-slate-700 transition"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-cinema-accent uppercase tracking-wider">
                  {t.city}, {t.state}
                </span>
                <h3 className="text-xl font-bold text-white">{t.name}</h3>
                <p className="text-xs text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.address}</span>
                </p>
              </div>

              {/* Screens List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block">Screens & Formats</span>
                <div className="flex flex-wrap gap-2">
                  {t.screens?.map((screen) => (
                    <span
                      key={screen.name}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 text-cyan-300 border border-cyan-900/40"
                    >
                      {screen.name} ({screen.format})
                    </span>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                {t.amenities?.map((amenity) => (
                  <span
                    key={amenity}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
