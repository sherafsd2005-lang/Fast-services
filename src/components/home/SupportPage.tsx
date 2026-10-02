import React from 'react';
import { Phone, Mail, ShieldCheck, Clock, CheckCircle2, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SupportPageProps {
  contactNumber: string;
  onPostJob: () => void;
  onBrowseServices: () => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({
  contactNumber,
  onPostJob,
  onBrowseServices
}) => {
  const { isUrdu } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Hero Helpline */}
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-8 border border-slate-800">
        <div>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
            Customer Care &amp; Dispute Helpline
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1 text-white">
            We're Here to Help You
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg leading-relaxed">
            Need urgent assistance with a technician, payment verification, or job question? Contact the official FIRST STEP support team directly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href={`tel:${contactNumber}`}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-base flex items-center justify-center gap-2.5 shadow-lg shadow-teal-500/20 transition cursor-pointer"
          >
            <Phone className="w-5 h-5 text-slate-950" />
            <span className="tabular-nums">Call {contactNumber}</span>
          </a>
          <a
            href="mailto:support@firststep.pk"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Mail className="w-4 h-4" />
            <span>Email Support</span>
          </a>
        </div>
      </div>

      {/* How It Works (Section 50) */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            How FIRST STEP Works
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simple, safe, and transparent home services from booking to payment release
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 font-black text-lg flex items-center justify-center mb-4">
              1
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">
              Search or Post a Job
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose from 50+ categories to book a top-rated worker directly, or post a custom job with your desired budget and get competitive worker bids.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 font-black text-lg flex items-center justify-center mb-4">
              2
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">
              Pay Safely to FIRST STEP
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Payments are transferred to the company account (Meezan Bank, Raast, or Easypaisa) — NOT directly to the worker. Your money is protected in escrow.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 font-black text-lg flex items-center justify-center mb-4">
              3
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">
              Confirm &amp; Release
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The worker performs the work at your doorstep. Payout is released to the worker only after you confirm full satisfaction!
            </p>
          </div>
        </div>
      </div>

      {/* Safety & CNIC Protection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold text-emerald-950">
            Strict CNIC Verification Standards
          </h4>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Every service provider on FIRST STEP must submit verified NADRA CNIC documents. To safeguard worker privacy, CNIC images are never displayed publicly and remain accessible only to authorized administration.
          </p>
        </div>

        <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold text-purple-950">
            Escrow &amp; Dispute Protection
          </h4>
          <p className="text-xs text-purple-800 leading-relaxed">
            In case of work disagreement, incomplete repair, or scheduling dispute, FIRST STEP holds funds until our management arbitrates, performs re-work, or grants an approved refund.
          </p>
        </div>
      </div>
    </div>
  );
};
