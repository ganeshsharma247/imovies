import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { CreditCard, ShieldCheck, Clock, CheckCircle2, AlertCircle, RefreshCw, Lock, Sparkles, MapPin, Calendar } from 'lucide-react';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingState = location.state;

  const [paymentMethod, setPaymentMethod] = useState('card_mock');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState('Alex Johnson');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState('10:00');

  useEffect(() => {
    if (!bookingState || !bookingState.showId || !bookingState.selectedSeats) {
      navigate('/');
      return;
    }

    if (bookingState.expiresAt) {
      const interval = setInterval(() => {
        const remainingMs = new Date(bookingState.expiresAt).getTime() - Date.now();
        if (remainingMs <= 0) {
          setTimeLeft('00:00');
          clearInterval(interval);
          setError('Seat hold has expired. Please select your seats again.');
        } else {
          const totalSecs = Math.floor(remainingMs / 1000);
          const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
          const secs = String(totalSecs % 60).padStart(2, '0');
          setTimeLeft(`${mins}:${secs}`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [bookingState, navigate]);

  if (!bookingState) return null;

  const { show, selectedSeats } = bookingState;
  const subTotal = selectedSeats.reduce((acc, s) => acc + s.price, 0);
  const convenienceFee = +(selectedSeats.length * 1.5).toFixed(2);
  const tax = +(subTotal * 0.1).toFixed(2);
  const grandTotal = +(subTotal + convenienceFee + tax).toFixed(2);

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.post('/bookings/confirm', {
        showId: bookingState.showId,
        seatIds: selectedSeats.map((s) => s.seatId),
        paymentMethod,
        cardLastFour: '4242',
      });

      const confirmedBooking = res.data.booking;
      navigate(`/booking-success/${confirmedBooking._id}`, {
        state: { booking: confirmedBooking },
      });
    } catch (err) {
      setError(err.message || 'Payment processing simulation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-2">
      {/* Page Title & Active Hold Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-border/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white">Order Checkout</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review your movie tickets and complete simulated payment before the hold expires.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 px-4 py-2 rounded-2xl text-amber-300 text-xs font-black shadow-md w-fit">
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Hold Expires in: {timeLeft}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-center space-x-2.5 shadow-md">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Simulated Payment Portal */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl bg-cinema-card border border-cinema-border p-7 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Payment Method</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                Demo Simulator
              </span>
            </div>

            {/* Mock Card Preview */}
            <div className="relative rounded-2xl bg-gradient-to-tr from-violet-900 via-indigo-900 to-cyan-900 p-6 text-white space-y-6 border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-cyan-300 uppercase">IMOVIES PASS</span>
                <span className="text-xs font-extrabold text-slate-300">TEST NETWORK</span>
              </div>
              <div className="text-lg sm:text-xl font-mono tracking-widest font-black text-cyan-100">
                {cardNumber}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Cardholder</span>
                  <span className="font-bold text-white">{cardHolder}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Expires</span>
                  <span className="font-bold text-white">12 / 29</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Name on Card</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-cinema-darker border border-cinema-border rounded-xl text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Simulated Card Identifier</label>
                <input
                  type="text"
                  disabled
                  value={cardNumber}
                  className="w-full px-4 py-2.5 text-xs bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed font-mono"
                />
              </div>

              {/* Security Banner */}
              <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-800/30 text-violet-300 text-[11px] flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Safe Demo Checkout:</strong> No real payment gateway or credit card numbers are processed. This sandbox charges a fictional account and instantly issues your verified QR-ticket.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-violet-950/80 hover:shadow-cyan-950/80 transition flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Mock Transaction...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-cyan-200" />
                    <span>Confirm & Pay ${grandTotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-cinema-card border border-cinema-border p-6 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-white border-b border-slate-800/80 pb-3">
              Order Breakdown
            </h2>

            <div className="space-y-2 text-xs">
              <span className="text-sm font-black text-white block">{show?.movie?.title}</span>
              <p className="text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-violet-400" />
                <span>{show?.theatre?.name}</span>
              </p>
              <p className="text-slate-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>{show?.startTime ? new Date(show.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
              </p>
            </div>

            {/* Selected Seats Tag List */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Reserved Seats ({selectedSeats.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((s) => (
                  <span
                    key={s.seatId}
                    className="px-2.5 py-1 rounded-lg text-xs font-black bg-cyan-950/50 text-cyan-300 border border-cyan-800/50"
                  >
                    {s.seatId} (${s.price})
                  </span>
                ))}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tickets Subtotal</span>
                <span className="text-slate-200 font-semibold">${subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee</span>
                <span className="text-slate-200 font-semibold">${convenienceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Tax (10%)</span>
                <span className="text-slate-200 font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                <span>Total Due</span>
                <span className="text-cyan-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
