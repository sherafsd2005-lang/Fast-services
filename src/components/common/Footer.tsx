import React from 'react';
import { Phone, Mail, ShieldCheck, Clock, MapPin, Heart, Wrench, Lock } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface FooterProps {
  contactNumber: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register' | 'admin') => void;
  onOpenWorkerRegister: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  contactNumber,
  onNavigate,
  onOpenAuth,
  onOpenWorkerRegister
}) => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Contact */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-black text-lg">
                FS
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                FIRST STEP
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Pakistan's dedicated home and local service marketplace. Connecting trusted plumbers, electricians, AC technicians, cleaners and 50+ local professionals with households nationwide.
            </p>
            <div className="pt-2 space-y-2">
              <a
                href={`tel:${contactNumber}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-950/80 border border-teal-800/80 text-teal-300 font-bold text-sm hover:bg-teal-900/60 transition"
              >
                <Phone className="w-4 h-4 text-teal-400" />
                <span className="tabular-nums">Call Helpline: {contactNumber}</span>
              </a>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Serving Karachi, Lahore, Islamabad, Rawalpindi & nationwide</span>
              </div>
            </div>
          </div>

          {/* Popular Services */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Popular Services
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('categories')} className="hover:text-teal-400 transition text-left">
                  Plumbing & Leakages
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('categories')} className="hover:text-teal-400 transition text-left">
                  Electrician & Wiring
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('categories')} className="hover:text-teal-400 transition text-left">
                  Inverter AC Master Wash
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('categories')} className="hover:text-teal-400 transition text-left">
                  Deep Home Cleaning
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('categories')} className="hover:text-teal-400 transition text-left">
                  Carpenter & Woodwork
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('categories')} className="hover:text-teal-400 transition text-left">
                  Solar Inverter & Wiring
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-teal-400 transition text-left">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('workers')} className="hover:text-teal-400 transition text-left">
                  Browse Workers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('post_job')} className="hover:text-teal-400 transition text-left">
                  Post a Custom Job
                </button>
              </li>
              <li>
                <button onClick={onOpenWorkerRegister} className="hover:text-teal-400 transition text-left text-teal-400 font-semibold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Join as Worker</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('support')} className="hover:text-teal-400 transition text-left">
                  Customer Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-purple-400 transition text-left flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Safety & Payment Guarantee */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Trust & Safety
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>All workers undergo rigorous CNIC & identity verification.</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Customer payments securely held by FIRST STEP until job completion.</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-slate-500 mb-2">Accepted Payment Channels:</p>
                <div className="flex items-center gap-2 font-semibold text-slate-300 text-xs">
                  <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded">Meezan Bank</span>
                  <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded">Raast</span>
                  <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded">Easypaisa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} FIRST STEP Services (Pvt) Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('support')} className="hover:underline">
              Terms & Conditions
            </button>
            <span>·</span>
            <button onClick={() => onNavigate('support')} className="hover:underline">
              Privacy & CNIC Policy
            </button>
            <span>·</span>
            <button onClick={() => onNavigate('support')} className="hover:underline">
              Help Center
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
