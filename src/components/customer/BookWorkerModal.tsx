import React, { useState } from 'react';
import { WorkerProfile, Booking } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, Clock, MapPin, ShieldCheck, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BookWorkerModalProps {
  isOpen: boolean;
  worker: WorkerProfile | null;
  selectedServiceName?: string;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  onOpenAuth: () => void;
}

export const BookWorkerModal: React.FC<BookWorkerModalProps> = ({
  isOpen,
  worker,
  selectedServiceName,
  onClose,
  onSuccess,
  onOpenAuth
}) => {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();
  const [serviceName, setServiceName] = useState(selectedServiceName || worker?.services[0] || 'General Service');
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [bookingTime, setBookingTime] = useState('11:00 AM');
  const [city, setCity] = useState(worker?.city || 'Karachi');
  const [area, setArea] = useState(user?.area || worker?.area || '');
  const [address, setAddress] = useState(user?.address || '');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  if (!isOpen || !worker) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const booking = await api.createBooking({
        workerId: worker.id,
        serviceName,
        categoryName: worker.categories[0] || 'General',
        bookingDate,
        bookingTime,
        city,
        area,
        address,
        description
      });
      setCreatedBooking(booking);
      onSuccess(booking);
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative border border-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {createdBooking ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Booking Request Sent!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              We have notified <strong>{worker.name}</strong> of your request for <strong>{serviceName}</strong> on <strong>{bookingDate}</strong> at <strong>{bookingTime}</strong>.
            </p>
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-xs text-teal-800 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>FIRST STEP Safe Booking Process:</span>
              </div>
              <p>1. Worker will confirm availability shortly.</p>
              <p>2. Once accepted, you pay directly to the official FIRST STEP company account (Meezan / Raast / Easypaisa).</p>
              <p>3. Payout is released to the worker only after you confirm the job is completed to your satisfaction!</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              Done &amp; View My Bookings
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                {worker.avatarUrl ? (
                  <img src={worker.avatarUrl} alt={worker.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                    {worker.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Book Verified Worker</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {worker.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {worker.city} · Visit Charge: PKR {worker.visitCharge}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Service *</label>
                <select
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  {worker.services.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time *</label>
                  <select
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  >
                    <option value="9:00 AM">9:00 AM - Morning</option>
                    <option value="11:00 AM">11:00 AM - Midday</option>
                    <option value="02:00 PM">02:00 PM - Afternoon</option>
                    <option value="04:00 PM">04:00 PM - Evening</option>
                    <option value="06:00 PM">06:00 PM - Late Evening</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Sector *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phase 5, F-10"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">House / Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House # 12-A, Street 4"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the issue, leak, or special requirements..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-slate-600 font-medium">Estimated Base Service Charge:</span>
                <span className="font-extrabold text-slate-900 tabular-nums">
                  PKR {worker.startingPrice ? worker.startingPrice.toLocaleString() : 'Discussion / Quote'}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                {loading ? 'Submitting Request...' : user ? 'Send Booking Request' : 'Sign In to Book'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
