import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { CheckCircle2, Ticket, Printer, ArrowLeft, RefreshCw, Calendar, Clock, MapPin, Sparkles, Clapperboard } from 'lucide-react';

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
        <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-400">Loading your confirmed ticket pass...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto p-10 rounded-3xl bg-rose-950/20 border border-rose-900/40 text-center space-y-4 my-12">
        <p className="text-sm text-rose-300 font-medium">{error || 'Ticket record not found'}</p>
        <Link
          to="/"
          className="inline-block text-xs font-bold px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl shadow-md"
        >
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 pt-4">
      {/* Animated Confirmation Badge */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-glow-cyan">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Booking Confirmed!</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Your digital ticket has been issued and seats reserved.
        </p>
      </div>

      {/* Cinematic Digital Ticket Pass */}
      <div className="rounded-3xl bg-cinema-card border border-cinema-border shadow-2xl overflow-hidden print:border-black print:text-black print:bg-white">
        {/* Ticket Top Ribbon */}
        <div className="bg-gradient-to-r from-violet-700 via-indigo-600 to-cyan-600 p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5">
            <Clapperboard className="w-5 h-5 text-cyan-200" />
            <span className="font-black tracking-wider text-sm uppercase">IMOVIES DIGITAL PASS</span>
          </div>
          <span className="text-xs font-mono font-black bg-black/40 px-3 py-1 rounded-lg border border-white/20 tracking-wider">
            {booking.bookingReference}
          </span>
        </div>

        {/* Ticket Main Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded-md border border-cyan-800/40">
                Confirmed Admission
              </span>
              <h2 className="text-2xl font-black text-white">
                {booking.movie?.title}
              </h2>
              <div className="space-y-1 text-xs text-slate-400">
                <p className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-violet-400" />
                  <span>{booking.theatre?.name} &bull; {booking.theatre?.city}</span>
                </p>
                <p className="text-slate-400">
                  Auditorium: <strong className="text-slate-200">{booking.show?.screenName || 'Screen 1'}</strong>
                </p>
              </div>
            </div>

            {/* Scannable QR Code */}
            {booking.qrCodeData && (
              <div className="flex-shrink-0 bg-white p-3 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col items-center">
                <img
                  src={booking.qrCodeData}
                  alt={`QR Code for ${booking.bookingReference}`}
                  className="w-28 h-28 object-contain"
                />
                <span className="text-[9px] font-mono font-bold text-slate-800 uppercase mt-1 tracking-wider">
                  Scan at Gate
                </span>
              </div>
            )}
          </div>

          {/* Reserved Seats Chips */}
          <div className="p-4 rounded-2xl bg-cinema-darker border border-cinema-border space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Reserved Seats
            </span>
            <div className="flex flex-wrap gap-2">
              {booking.seats?.map((seat) => (
                <span
                  key={seat.seatId}
                  className="px-3 py-1 rounded-xl text-xs font-black bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 flex items-center space-x-1"
                >
                  <span>Seat {seat.seatId}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({seat.tier})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Timing & Payment Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">Show Date</span>
              <span className="text-slate-200 font-bold">
                {booking.show?.startTime ? new Date(booking.show.startTime).toLocaleDateString() : 'Today'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">Showtime</span>
              <span className="text-slate-200 font-bold">
                {booking.show?.startTime ? new Date(booking.show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '7:00 PM'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">Payment</span>
              <span className="text-emerald-400 font-bold capitalize">{booking.paymentStatus || 'Paid'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">Total Paid</span>
              <span className="text-cyan-400 font-black">${booking.pricing?.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Perforated Divider */}
        <div className="relative flex items-center justify-between px-4">
          <div className="w-5 h-5 rounded-full bg-cinema-darker -ml-6" />
          <div className="flex-1 border-b-2 border-dashed border-slate-800 mx-2" />
          <div className="w-5 h-5 rounded-full bg-cinema-darker -mr-6" />
        </div>

        {/* Ticket Footer Notes */}
        <div className="bg-slate-950/60 p-4 sm:px-8 text-center text-[11px] text-slate-500">
          Present this digital QR pass at the entrance. Doors open 15 minutes prior to showtime.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-2 border border-slate-700"
        >
          <Printer className="w-4 h-4 text-cyan-400" />
          <span>Print / Save Ticket</span>
        </button>

        <Link
          to="/my-bookings"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-black shadow-lg shadow-violet-950/70 transition flex items-center justify-center space-x-2"
        >
          <Ticket className="w-4 h-4 text-cyan-200" />
          <span>View All My Tickets</span>
        </Link>
      </div>
    </div>
  );
}
