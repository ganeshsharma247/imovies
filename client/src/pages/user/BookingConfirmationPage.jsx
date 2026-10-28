import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { CheckCircle2, Ticket, Printer, ArrowLeft, RefreshCw, Calendar, Clock, MapPin } from 'lucide-react';

export default function BookingConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!booking && id) {
      async function fetchBooking() {
        try {
          const res = await apiClient.get(`/bookings/${id}`);
          setBooking(res.data.booking);
        } catch (err) {
          setError(err.message || 'Failed to load booking');
        } finally {
          setLoading(false);
        }
      }
      fetchBooking();
    }
  }, [id, booking]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-cinema-accent mx-auto" />
        <p className="text-sm text-slate-400">Loading your confirmed ticket...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-xl bg-red-950/20 border border-red-900/30 text-center space-y-3 my-12">
        <p className="text-sm text-red-300">{error || 'Ticket not found'}</p>
        <Link to="/" className="inline-block text-xs font-semibold px-4 py-2 bg-slate-800 text-white rounded-lg">
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 pt-4">
      {/* Animated Success Badge */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">Booking Confirmed!</h1>
        <p className="text-xs text-slate-400">
          Your digital ticket has been issued and seats reserved.
        </p>
      </div>

      {/* Cinema Ticket Card */}
      <div className="rounded-2xl bg-cinema-card border border-cinema-border shadow-2xl overflow-hidden print:border-black print:text-black print:bg-white">
        {/* Ticket Top Ribbon */}
        <div className="bg-gradient-to-r from-red-600 to-cinema-accent p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ticket className="w-5 h-5" />
            <span className="font-extrabold tracking-wider text-sm uppercase">IMovies Ticket Pass</span>
          </div>
          <span className="text-xs font-mono font-bold bg-black/30 px-2.5 py-1 rounded">
            {booking.bookingReference}
          </span>
        </div>

        {/* Ticket Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-cinema-accent uppercase tracking-wider">
                Now Showing
              </span>
              <h2 className="text-2xl font-black text-white">
                {booking.movie?.title}
              </h2>
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{booking.theatre?.name}</span>
                </span>
                <span>&bull;</span>
                <span>{booking.show?.screenName || 'Screen 1'}</span>
              </div>
            </div>

            {/* QR Code Container */}
            {booking.qrCodeData && (
              <div className="flex-shrink-0 bg-white p-2.5 rounded-xl shadow-lg border border-slate-700">
                <img
                  src={booking.qrCodeData}
                  alt={`QR Code for ${booking.bookingReference}`}
                  className="w-28 h-28 object-contain"
                />
                <span className="block text-[9px] font-mono text-center text-slate-600 mt-1 font-bold">
                  SCAN AT GATE
                </span>
              </div>
            )}
          </div>

          {/* Seat Grid Breakdown */}
          <div className="p-4 rounded-xl bg-cinema-dark border border-cinema-border/70 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 block">Reserved Seats</span>
              <span className="text-lg font-extrabold text-cinema-platinum">
                {booking.seats.map((s) => s.seatId).join(', ')}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Total Paid</span>
              <span className="text-lg font-black text-white">
                ${booking.pricing?.totalAmount?.toFixed(2)}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Perforation Dashed Line */}
        <div className="relative border-t-2 border-dashed border-cinema-border/60">
          <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-cinema-dark" />
          <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-cinema-dark" />
        </div>

        {/* Ticket Footer */}
        <div className="p-4 bg-cinema-dark/50 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Show this digital QR pass at cinema entrance</span>
          <span>Booked on {new Date(booking.bookedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Ticket</span>
        </button>

        <Link
          to="/my-bookings"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cinema-accent hover:bg-cinema-accentHover text-white text-xs font-bold transition shadow-lg shadow-red-950/40"
        >
          <Ticket className="w-4 h-4" />
          <span>View All My Tickets</span>
        </Link>
      </div>
    </div>
  );
}
