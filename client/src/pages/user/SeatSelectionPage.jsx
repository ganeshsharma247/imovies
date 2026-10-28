import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Clock, ShieldAlert, ArrowRight, Clapperboard, RefreshCw, AlertCircle, Check, Sparkles, MapPin } from 'lucide-react';

export default function SeatSelectionPage() {
  const { id: showId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // 1. Fetch Show and Seats
  const loadShowSeats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [showRes, seatsRes] = await Promise.all([
        apiClient.get(`/shows/${showId}`),
        apiClient.get(`/shows/${showId}/seats`),
      ]);
      setShow(showRes.data.show);
      setSeats(seatsRes.data.seats);
    } catch (err) {
      setError(err.message || 'Failed to load seat layout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShowSeats();
  }, [showId]);

  // 2. Real-time Socket.IO room subscriptions
  useEffect(() => {
    if (!socket || !showId) return;

    socket.emit('join_show', showId);

    const handleSeatsLocked = (data) => {
      if (data.showId === showId) {
        setSeats((prev) =>
          prev.map((s) =>
            data.seatIds.includes(s.seatId) ? { ...s, status: 'locked' } : s
          )
        );
      }
    };

    const handleSeatsReleased = (data) => {
      if (data.showId === showId) {
        setSeats((prev) =>
          prev.map((s) =>
            data.seatIds.includes(s.seatId) ? { ...s, status: 'available' } : s
          )
        );
      }
    };

    const handleSeatsBooked = (data) => {
      if (data.showId === showId) {
        setSeats((prev) =>
          prev.map((s) =>
            data.seatIds.includes(s.seatId) ? { ...s, status: 'booked' } : s
          )
        );
      }
    };

    socket.on('seats_locked', handleSeatsLocked);
    socket.on('seats_released', handleSeatsReleased);
    socket.on('seats_booked', handleSeatsBooked);

    return () => {
      socket.emit('leave_show', showId);
      socket.off('seats_locked', handleSeatsLocked);
      socket.off('seats_released', handleSeatsReleased);
      socket.off('seats_booked', handleSeatsBooked);
    };
  }, [socket, showId]);

  // 3. Countdown timer when lock is active
  useEffect(() => {
    if (!lockExpiresAt) return;

    const interval = setInterval(() => {
      const remainingMs = new Date(lockExpiresAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        setTimeLeft('00:00');
        clearInterval(interval);
        setError('Your 10-minute seat hold has expired. Please select your seats again.');
        setSelectedSeatIds([]);
        setLockExpiresAt(null);
        loadShowSeats();
      } else {
        const totalSecs = Math.floor(remainingMs / 1000);
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        setTimeLeft(`${mins}:${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt]);

  // Handle seat click
  const toggleSeat = (seat) => {
    if (seat.status === 'booked') return;
    if (seat.status === 'locked' && !selectedSeatIds.includes(seat.seatId)) return;

    setError(null);
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.seatId)) {
        return prev.filter((id) => id !== seat.seatId);
      } else {
        if (prev.length >= 8) {
          setError('You can select a maximum of 8 seats per booking transaction.');
          return prev;
        }
        return [...prev, seat.seatId];
      }
    });
  };

  // Group seats by row
  const rowsMap = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  // Pricing calculations
  const selectedSeatObjects = seats.filter((s) => selectedSeatIds.includes(s.seatId));
  const subTotal = selectedSeatObjects.reduce((sum, s) => sum + s.price, 0);

  // Proceed to Checkout: Lock seats on server first
  const handleProceedToCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/shows/${showId}/seats` } });
      return;
    }

    if (selectedSeatIds.length === 0) {
      setError('Please select at least one seat from the auditorium map.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post('/bookings/lock-seats', {
        showId,
        seatIds: selectedSeatIds,
      });

      setLockExpiresAt(res.data.expiresAt);

      // Navigate to checkout with show details and locked seats in state
      navigate('/checkout', {
        state: {
          showId,
          show,
          selectedSeats: selectedSeatObjects,
          expiresAt: res.data.expiresAt,
        },
      });
    } catch (err) {
      setError(err.message || 'One or more selected seats were just taken. Please make another selection.');
      loadShowSeats();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-400">Loading interactive auditorium seat layout...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Show Header & Hold Timer Bar */}
      <div className="rounded-3xl bg-cinema-card border border-cinema-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded-md border border-cyan-800/40">
              {show?.screenName || 'Main Screen'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {show?.startTime ? new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white">
            {show?.movie?.title}
          </h1>

          <p className="text-xs text-slate-400 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-violet-400" />
            <span>{show?.theatre?.name} &bull; {show?.theatre?.city}</span>
          </p>
        </div>

        {timeLeft && (
          <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 px-4 py-2 rounded-2xl text-amber-300 text-xs font-black shadow-md">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Hold Active: {timeLeft}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-center space-x-2.5 shadow-md">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Curved Screen Banner */}
      <div className="relative max-w-2xl mx-auto pt-6 text-center space-y-3">
        <div className="curved-screen w-full mx-auto" />
        <div className="flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest text-cyan-400/80">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>PROJECTION SCREEN</span>
          <Sparkles className="w-3 h-3 text-cyan-400" />
        </div>
      </div>

      {/* Interactive Seat Map */}
      <div className="max-w-3xl mx-auto p-6 sm:p-10 rounded-3xl bg-cinema-card/90 border border-cinema-border overflow-x-auto shadow-2xl">
        <div className="space-y-3 min-w-[520px]">
          {Object.entries(rowsMap).map(([rowLabel, rowSeats]) => (
            <div key={rowLabel} className="flex items-center justify-center space-x-3">
              <span className="w-6 text-xs font-black text-slate-500 text-center">
                {rowLabel}
              </span>

              <div className="flex items-center space-x-2 sm:space-x-2.5">
                {rowSeats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.seatId);
                  const isBooked = seat.status === 'booked';
                  const isLocked = seat.status === 'locked' && !isSelected;

                  let seatStyle = 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700 cursor-pointer';

                  if (isBooked) {
                    seatStyle = 'bg-slate-900/60 text-slate-600 border-slate-900 cursor-not-allowed opacity-30';
                  } else if (isLocked) {
                    seatStyle = 'bg-amber-500/20 text-amber-400 border-amber-500/40 cursor-not-allowed animate-pulse';
                  } else if (isSelected) {
                    seatStyle = 'bg-gradient-to-t from-violet-600 to-cyan-500 text-white border-cyan-400 shadow-glow-cyan font-black scale-110 ring-2 ring-cyan-400/50';
                  } else if (seat.tier === 'platinum') {
                    seatStyle = 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/60 hover:border-cyan-500 cursor-pointer';
                  } else if (seat.tier === 'gold') {
                    seatStyle = 'bg-violet-950/40 text-violet-300 border-violet-800/50 hover:bg-violet-900/50 hover:border-violet-500 cursor-pointer';
                  }

                  return (
                    <button
                      key={seat.seatId}
                      disabled={isBooked || isLocked}
                      onClick={() => toggleSeat(seat)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-xl rounded-b-sm border text-[11px] font-bold transition-all duration-150 flex items-center justify-center ${seatStyle}`}
                      title={`${seat.seatId} • ${seat.tier.toUpperCase()} • $${seat.price}`}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>

              <span className="w-6 text-xs font-black text-slate-500 text-center">
                {rowLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Comprehensive Seat Legend */}
      <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-cinema-card/60 border border-cinema-border/70 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-t-md rounded-b-xs bg-slate-800 border border-slate-700" />
          <span className="text-slate-400">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-t-md rounded-b-xs bg-gradient-to-t from-violet-600 to-cyan-500 border border-cyan-400 shadow-sm" />
          <span className="text-cyan-300 font-bold">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-t-md rounded-b-xs bg-amber-500/20 border border-amber-500/50" />
          <span className="text-amber-400 font-medium">Held (10m)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-t-md rounded-b-xs bg-slate-900 border border-slate-900 opacity-40" />
          <span className="text-slate-600">Reserved</span>
        </div>
        <div className="hidden sm:block text-slate-600">|</div>
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded-full bg-violet-500/30 border border-violet-500" />
          <span className="text-violet-300 font-medium">Gold (${show?.tierPricing?.gold || 18})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded-full bg-cyan-500/30 border border-cyan-400" />
          <span className="text-cyan-300 font-medium">VIP Platinum (${show?.tierPricing?.platinum || 25})</span>
        </div>
      </div>

      {/* Floating Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-cinema-darker/95 backdrop-blur-xl border-t border-cinema-border/90 p-4 sm:p-5 z-40 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold">Selected Seats:</span>
              {selectedSeatIds.length === 0 ? (
                <span className="text-xs text-slate-500 italic">None selected</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeatIds.map((id) => (
                    <span
                      key={id}
                      className="px-2 py-0.5 rounded-md text-xs font-black bg-cyan-950/60 text-cyan-300 border border-cyan-800/50"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Max 8 seats per transaction &bull; Free instant hold for 10 minutes
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Subtotal</span>
              <span className="text-2xl font-black text-white">${subTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              disabled={submitting || selectedSeatIds.length === 0}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-black shadow-lg shadow-violet-950/80 hover:shadow-cyan-950/80 transition-all flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Securing Hold...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
