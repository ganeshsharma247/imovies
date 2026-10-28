import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Ticket, Calendar, MapPin, AlertCircle, RefreshCw, XCircle, CheckCircle2, ChevronRight, Sparkles, Clapperboard } from 'lucide-react';

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/bookings/my-bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(err.message || 'Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    setCancelMessage(null);

    try {
      await apiClient.post(`/bookings/${cancelModalBooking._id}/cancel`, {
        reason: 'Cancelled by customer',
      });
      setCancelMessage({ type: 'success', text: 'Booking successfully cancelled. Refund processed.' });
      setTimeout(() => {
        setCancelModalBooking(null);
        setCancelMessage(null);
        fetchBookings();
      }, 1500);
    } catch (err) {
      setCancelMessage({ type: 'error', text: err.message || 'Cancellation failed' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-2">
      <div className="border-b border-cinema-border/80 pb-5">
        <div className="flex items-center space-x-2">
          <Ticket className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl sm:text-3xl font-black text-white">My Cinema Tickets</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review your digital passes, QR entrance tickets, and transaction receipts.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Loading your ticket history...</p>
        </div>
      ) : error ? (
        <div className="p-10 rounded-3xl bg-rose-950/20 border border-rose-900/40 text-center space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-300 font-medium">{error}</p>
          <button
            onClick={fetchBookings}
            className="text-xs font-bold px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-cinema-card border border-cinema-border space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
            <Ticket className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Tickets Booked Yet</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              You haven't reserved any cinema tickets yet. Explore movies now showing and pick your seats!
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-black text-xs shadow-lg shadow-violet-950/70"
          >
            <span>Browse Movies</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((b) => {
            const isConfirmed = b.status === 'confirmed';

            return (
              <div
                key={b._id}
                className="rounded-3xl bg-cinema-card border border-cinema-border p-6 sm:p-7 space-y-5 hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-950/30 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-950/50 px-3 py-1 rounded-lg border border-cyan-800/40">
                      {b.bookingReference}
                    </span>
                    <span className="text-xs text-slate-500">
                      Booked on {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider w-fit ${
                      isConfirmed
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Movie Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white">{b.movie?.title}</h3>
                    <div className="space-y-1 text-xs text-slate-400">
                      <p className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-violet-400" />
                        <span>{b.theatre?.name} &bull; {b.show?.screenName || 'Screen 1'}</span>
                      </p>
                      <p className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {b.show?.startTime
                            ? new Date(b.show.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                            : 'Scheduled Showtime'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Seats & Price */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                        Seats ({b.seats?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {b.seats?.map((s) => (
                          <span
                            key={s.seatId}
                            className="px-2.5 py-0.5 rounded-md text-xs font-black bg-slate-900 border border-slate-700 text-slate-200"
                          >
                            {s.seatId}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                        Total Amount
                      </span>
                      <span className="text-lg font-black text-white">${b.pricing?.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Payment Status: <strong className="text-slate-300 capitalize">{b.paymentStatus}</strong>
                  </div>

                  <div className="flex items-center space-x-3">
                    {isConfirmed && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        className="text-xs font-bold text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
                      >
                        Cancel Booking
                      </button>
                    )}

                    <Link
                      to={`/booking-success/${b._id}`}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition flex items-center space-x-1.5"
                    >
                      <span>View Pass & QR</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-cinema-card border border-cinema-border p-7 space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <XCircle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">Cancel Movie Booking?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to cancel booking <strong>{cancelModalBooking.bookingReference}</strong> for <em>{cancelModalBooking.movie?.title}</em>?
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>&bull; Your reserved seats will be immediately released back to available.</p>
              <p>&bull; Simulated refund of <strong>${cancelModalBooking.pricing?.totalAmount?.toFixed(2)}</strong> will be issued to your mock account.</p>
              <p>&bull; Cancellations are only permitted up to 2 hours prior to showtime.</p>
            </div>

            {cancelMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  cancelMessage.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                }`}
              >
                {cancelMessage.text}
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelBooking}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-rose-950/60 transition flex items-center justify-center space-x-1.5"
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
