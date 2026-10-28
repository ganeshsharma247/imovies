import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { CreditCard, ShieldCheck, Clock, CheckCircle2, AlertCircle, RefreshCw, Lock } from 'lucide-react';

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
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Title & Hold Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Checkout & Payment</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete your order before the temporary hold expires.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-amber-400 text-xs font-bold w-fit">
          <Clock className="w-4 h-4 animate-pulse" />
          <span>Hold Expires in: {timeLeft}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Payment Method Simulation */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl bg-cinema-card border border-cinema-border p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-cinema-accent" />
              <span>Select Payment Method (Mock Gateway)</span>
            </h2>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'card_mock', label: 'Credit / Debit Card' },
                { id: 'upi_mock', label: 'UPI / QR' },
                { id: 'netbanking_mock', label: 'Net Banking' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                    paymentMethod === m.id
                      ? 'bg-cinema-accent/10 border-cinema-accent text-white'
                      : 'bg-cinema-dark border-cinema-border text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Mock Card Form */}
            {paymentMethod === 'card_mock' && (
              <form onSubmit={handleConfirmPayment} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-sm bg-cinema-dark border border-cinema-border rounded-lg text-white focus:outline-none focus:border-cinema-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Card Number (Demo Sandbox)
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    readOnly
                    className="w-full px-3.5 py-2 text-sm bg-cinema-dark border border-cinema-border rounded-lg text-slate-300 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      defaultValue="12/28"
                      className="w-full px-3.5 py-2 text-sm bg-cinema-dark border border-cinema-border rounded-lg text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      CVV (Simulated)
                    </label>
                    <input
                      type="password"
                      defaultValue="•••"
                      className="w-full px-3.5 py-2 text-sm bg-cinema-dark border border-cinema-border rounded-lg text-slate-300"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Sandbox Environment: Simulated payment will succeed immediately. No actual money will be charged.</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || timeLeft === '00:00'}
                  className="w-full py-3 rounded-xl bg-cinema-accent hover:bg-cinema-accentHover disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-red-950/50 flex items-center justify-center space-x-2 transition"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Confirming Booking...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay & Confirm ${grandTotal}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {paymentMethod !== 'card_mock' && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-cinema-dark border border-cinema-border text-center space-y-2">
                  <p className="text-xs text-slate-300 font-medium">
                    Fast checkout via Mock {paymentMethod === 'upi_mock' ? 'UPI / QR' : 'Net Banking'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click confirm to simulate instant bank confirmation.
                  </p>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={submitting || timeLeft === '00:00'}
                  className="w-full py-3 rounded-xl bg-cinema-accent hover:bg-cinema-accentHover disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-red-950/50 flex items-center justify-center space-x-2 transition"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <span>Confirm & Pay ${grandTotal}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary Breakdown */}
        <div className="rounded-2xl bg-cinema-card border border-cinema-border p-6 space-y-5 h-fit">
          <h2 className="text-base font-bold text-white border-b border-cinema-border pb-3">
            Order Summary
          </h2>

          <div>
            <h3 className="text-sm font-bold text-white">{show?.movie?.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{show?.theatre?.name}</p>
            <p className="text-[11px] text-slate-500">{show?.screenName}</p>
          </div>

          {/* Selected Seats Badges */}
          <div className="space-y-1.5 pt-2 border-t border-cinema-border/50">
            <span className="text-xs text-slate-400">Seats ({selectedSeats.length})</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedSeats.map((s) => (
                <span
                  key={s.seatId}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-cinema-platinum border border-slate-700"
                >
                  {s.seatId} (${s.price})
                </span>
              ))}
            </div>
          </div>

          {/* Pricing Calculation Lines */}
          <div className="space-y-2 pt-3 border-t border-cinema-border/50 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Tickets Base Cost</span>
              <span>${subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Convenience Fee</span>
              <span>${convenienceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Integrated Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          </div>

          {/* Total Amount */}
          <div className="pt-3 border-t border-cinema-border flex justify-between items-baseline">
            <span className="text-sm font-bold text-white">Total Amount</span>
            <span className="text-2xl font-black text-white">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
