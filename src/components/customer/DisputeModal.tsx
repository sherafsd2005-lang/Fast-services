import React, { useState } from 'react';
import { Booking } from '../../types';
import { api } from '../../services/api';
import { AlertTriangle, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  booking,
  onClose,
  onSuccess
}) => {
  const [issueType, setIssueType] = useState<'worker_problem' | 'payment_problem' | 'booking_problem' | 'service_problem' | 'refund_problem'>('service_problem');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe your issue in detail.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.fileDispute({
        bookingId: booking.id,
        issueType,
        description: description.trim()
      });
      setSubmitted(true);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to file dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Dispute Filed with FIRST STEP
            </h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Our central support operations will review the booking records and get in touch via phone (03209976716).
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  File a Problem or Dispute
                </h3>
                <p className="text-xs text-slate-500">
                  Regarding Booking #{booking.id} ({booking.serviceName})
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={issueType}
                  onChange={e => setIssueType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                >
                  <option value="service_problem">Work Quality or Incomplete Service</option>
                  <option value="worker_problem">Worker Behavior or No-Show</option>
                  <option value="payment_problem">Payment or Additional Charge Disagreement</option>
                  <option value="refund_problem">Refund Request</option>
                  <option value="booking_problem">Timing or Scheduling Misunderstanding</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Explanation *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain what happened and what outcome you desire (e.g. re-work, partial refund, or explanation)..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                FIRST STEP holds payments in escrow until disputes are resolved according to platform standards.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition"
              >
                {loading ? 'Filing Dispute...' : 'Submit to Admin Team'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
