import React, { useState, useEffect } from 'react';
import { CustomJob, JobOffer } from '../../types';
import { api } from '../../services/api';
import { Star, CheckCircle2, X, DollarSign, Clock, MessageSquare, ArrowRight } from 'lucide-react';

interface JobOffersModalProps {
  jobId: string | null;
  onClose: () => void;
  onOfferAccepted: () => void;
  onOpenChat: (bookingId?: string, recipientId?: string, recipientName?: string) => void;
}

export const JobOffersModal: React.FC<JobOffersModalProps> = ({
  jobId,
  onClose,
  onOfferAccepted,
  onOpenChat
}) => {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOffers = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const data = await api.getJobOffers(jobId);
      setOffers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, [jobId]);

  if (!jobId) return null;

  const handleAcceptOffer = async (offerId: string) => {
    setActionLoading(offerId);
    try {
      await api.respondJobOffer(jobId, offerId, 'accepted');
      alert('Offer Accepted! A booking has been created. Please proceed to submit payment to FIRST STEP company account.');
      onOfferAccepted();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Failed to accept offer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      await api.respondJobOffer(jobId, offerId, 'rejected');
      await loadOffers();
    } catch (e: any) {
      alert(e.message || 'Failed to reject offer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-extrabold text-slate-900 mb-1">
          Worker Offers &amp; Counter Bids
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Compare offers from interested local workers for Job #{jobId}
        </p>

        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading bids...</p>
        ) : offers.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">No offers received yet</p>
            <p className="text-xs text-slate-500 mt-1">Local technicians have been notified and will submit bids soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map(offer => (
              <div
                key={offer.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">{offer.workerName}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{offer.workerRating}</span>
                      </span>
                      <span>·</span>
                      <span>{offer.workerCompletedJobs} jobs completed</span>
                      <span>·</span>
                      <span className="text-slate-400">{offer.estimatedArrival}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Proposed Price</span>
                    <span className="text-lg font-black text-teal-700 tabular-nums">
                      PKR {offer.proposedPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {offer.message && (
                  <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 mb-3 italic">
                    "{offer.message}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                    offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                    offer.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {offer.status}
                  </span>

                  {offer.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectOffer(offer.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                      >
                        Decline
                      </button>
                      <button
                        disabled={actionLoading === offer.id}
                        onClick={() => handleAcceptOffer(offer.id)}
                        className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
                      >
                        {actionLoading === offer.id ? 'Accepting...' : 'Accept & Book'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
