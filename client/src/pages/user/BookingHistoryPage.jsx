import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { Ticket, Calendar, MapPin, AlertCircle, RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="border-b border-cinema-border pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
          <Ticket className="w-6 h-6 text-cinema-accent" />
          <span>My Tickets & Booking History</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your upcoming cinema admissions and previous bookings.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-cinema-accent mx-auto" />
          <p className="text-sm text-slate-400">Loading your tickets...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-red-950/20 border border-red-900/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={fetchBookings}
            className="text-xs font-semibold px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-cinema-card border border-cinema-border space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Bookings Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have not booked any cinema tickets yet. Explore movies currently showing and secure your seats today!
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-lg bg-cinema-accent text-white font-bold text-xs shadow-md shadow-red-950/40"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isConfirmed = b.status === 'confirmed';

            return (
              <div
                key={b._id}
                className="rounded-xl bg-cinema-card border border-cinema-border p-5 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              >
                <div className="flex items-center space-x-4">
                  {/* Poster Thumbnail */}
                  <img
                    src={b.movie?.posterUrl}
                    alt={b.movie?.title}
                    className="w-16 h-22 object-cover rounded-lg bg-slate-900 flex-shrink-0"
                  />

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cinema-accent">
                        {b.bookingReference}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isConfirmed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base">{b.movie?.title}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{b.theatre?.name}</span>
                      </span>
                      <span>&bull;</span>
                      <span>Seats: <strong className="text-white">{b.seats?.map((s) => s.seatId).join(', ')}</strong></span>
                      <span>&bull;</span>
                      <span>${b.pricing?.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <Link
                    to={`/booking-success/${b._id}`}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                  >
                    View Ticket & QR
                  </Link>

                  {isConfirmed && (
                    <button
                      onClick={() => setCancelModalBooking(b)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/30 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-cinema-card border border-cinema-border p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <XCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Cancel Booking?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel booking <strong className="text-white font-mono">{cancelModalBooking.bookingReference}</strong> for <strong className="text-white">{cancelModalBooking.movie?.title}</strong>?
            </p>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>&bull; Refund Amount: <strong className="text-white">${cancelModalBooking.pricing?.totalAmount?.toFixed(2)}</strong></div>
              <div>&bull; Reserved seats ({cancelModalBooking.seats?.map((s) => s.seatId).join(', ')}) will be released immediately.</div>
              <div>&bull; Cancellation is subject to the 2-hour pre-show cutoff policy.</div>
            </div>

            {cancelMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                  cancelMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {cancelMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{cancelMessage.text}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                disabled={cancelling}
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Keep Booking
              </button>
              <button
                disabled={cancelling}
                onClick={handleCancelBooking}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center space-x-2"
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
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
