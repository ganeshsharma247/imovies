import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Clock, ShieldAlert, ArrowRight, Film, RefreshCw, AlertCircle, Check } from 'lucide-react';

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
          setError('You can select a maximum of 8 seats per booking.');
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

  // Calculate pricing
  const selectedSeatObjects = seats.filter((s) => selectedSeatIds.includes(s.seatId));
  const subTotal = selectedSeatObjects.reduce((sum, s) => sum + s.price, 0);

  // Proceed to Checkout: Lock seats on server first
  const handleProceedToCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/shows/${showId}/seats` } });
      return;
    }

    if (selectedSeatIds.length === 0) {
      setError('Please select at least one seat to proceed.');
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
      setError(err.message || 'One or more selected seats are no longer available. Please try another selection.');
      loadShowSeats();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-cinema-accent mx-auto" />
        <p className="text-sm text-slate-400">Loading interactive seat layout...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Show Breadcrumb and Summary Header */}
      <div className="rounded-xl bg-cinema-card border border-cinema-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-cinema-accent font-bold uppercase tracking-wider">
            Seat Selection
          </span>
          <h1 className="text-xl font-extrabold text-white">
            {show?.movie?.title}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {show?.theatre?.name} &bull; {show?.screenName} &bull; {show?.startTime ? new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
        </div>

        {timeLeft && (
          <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-400 text-xs font-bold">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>Hold Timer: {timeLeft}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/30 border border-red-900/40 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Screen Curved Banner */}
      <div className="relative max-w-2xl mx-auto pt-6 text-center">
        <div className="h-2 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full shadow-[0_0_20px_rgba(56,189,248,0.7)]" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-2 block">
          All Eyes This Way &bull; Cinema Screen
        </span>
      </div>

      {/* Seat Layout Map */}
      <div className="max-w-3xl mx-auto p-6 sm:p-10 rounded-2xl bg-cinema-card border border-cinema-border overflow-x-auto">
        <div className="space-y-3 min-w-[500px]">
          {Object.entries(rowsMap).map(([rowLabel, rowSeats]) => (
            <div key={rowLabel} className="flex items-center justify-center space-x-2 sm:space-x-3">
              <span className="w-6 text-xs font-bold text-slate-500 text-center">
                {rowLabel}
              </span>

              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {rowSeats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.seatId);
                  const isBooked = seat.status === 'booked';
                  const isLocked = seat.status === 'locked' && !isSelected;

                  let seatStyle = 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700 cursor-pointer';

                  if (isBooked) {
                    seatStyle = 'bg-slate-900 text-slate-600 border-slate-900 cursor-not-allowed opacity-40';
                  } else if (isLocked) {
                    seatStyle = 'bg-amber-500/20 text-amber-400 border-amber-500/40 cursor-not-allowed';
                  } else if (isSelected) {
                    seatStyle = 'bg-cinema-accent text-white border-cinema-accent shadow-md shadow-red-950 font-bold scale-105';
                  } else if (seat.tier === 'platinum') {
                    seatStyle = 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/60 cursor-pointer';
                  } else if (seat.tier === 'gold') {
                    seatStyle = 'bg-amber-950/30 text-amber-300 border-amber-800/50 hover:bg-amber-900/50 cursor-pointer';
                  }

                  return (
                    <button
                      key={seat.seatId}
                      disabled={isBooked || isLocked}
                      onClick={() => toggleSeat(seat)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg rounded-b-sm border text-[11px] font-semibold transition-all duration-200 flex items-center justify-center ${seatStyle}`}
                      title={`${seat.seatId} (${seat.tier.toUpperCase()}) - $${seat.price}`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : seat.number}
                    </button>
                  );
                })}
              </div>

              <span className="w-6 text-xs font-bold text-slate-500 text-center">
                {rowLabel}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-10 border-t border-slate-800/80 mt-8 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded bg-slate-800 border border-slate-700" />
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded bg-cinema-accent border border-cinema-accent" />
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded bg-amber-500/30 border border-amber-500/50" />
            <span>Held (10m TTL)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded bg-slate-900 border border-slate-900 opacity-50" />
            <span>Booked</span>
          </div>
        </div>
      </div>

      {/* Floating Checkout Drawer */}
      <div className="sticky bottom-4 z-40 max-w-3xl mx-auto rounded-xl bg-cinema-card/95 backdrop-blur-md border border-cinema-border p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">
            Selected: <strong className="text-white">{selectedSeatIds.length} Seats</strong>
            {selectedSeatIds.length > 0 && ` (${selectedSeatIds.join(', ')})`}
          </div>
          <div className="text-xl font-extrabold text-white">
            ${subTotal.toFixed(2)}
          </div>
        </div>

        <button
          onClick={handleProceedToCheckout}
          disabled={selectedSeatIds.length === 0 || submitting}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-cinema-accent hover:bg-cinema-accentHover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-red-950/50 transition"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Holding Seats...</span>
            </>
          ) : (
            <>
              <span>Hold & Proceed to Pay</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
