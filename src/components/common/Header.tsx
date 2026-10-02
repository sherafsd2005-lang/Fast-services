import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';
import { Phone, User as UserIcon, Menu, X, Shield, Wrench, LayoutDashboard, LogOut, Globe, Lock } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: (mode?: 'login' | 'register' | 'admin') => void;
  onOpenWorkerRegister: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
  contactNumber: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenWorkerRegister,
  onNavigate,
  currentView,
  contactNumber
}) => {
  const { user, logout, isAdmin, isWorker, isCustomer } = useAuth();
  const { lang, setLang, t, isUrdu } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ur' : 'en');
  };

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:bg-teal-700 transition">
              FS
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-teal-700 transition whitespace-nowrap">
              FIRST STEP
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links (single line) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <button
            onClick={() => handleNavClick('home')}
            className={`hover:text-teal-700 transition cursor-pointer whitespace-nowrap ${currentView === 'home' ? 'text-teal-700' : ''}`}
          >
            {t('nav.home', 'Home')}
          </button>
          <button
            onClick={() => handleNavClick('categories')}
            className={`hover:text-teal-700 transition cursor-pointer whitespace-nowrap ${currentView === 'categories' ? 'text-teal-700' : ''}`}
          >
            {t('nav.categories', 'Services')}
          </button>
          <button
            onClick={() => handleNavClick('workers')}
            className={`hover:text-teal-700 transition cursor-pointer whitespace-nowrap ${currentView === 'workers' ? 'text-teal-700' : ''}`}
          >
            {t('nav.workers', 'Find Workers')}
          </button>
          <button
            onClick={() => handleNavClick('post_job')}
            className={`hover:text-teal-700 transition cursor-pointer whitespace-nowrap ${currentView === 'post_job' ? 'text-teal-700' : ''}`}
          >
            {t('nav.post_job', 'Post Job')}
          </button>
          <button
            onClick={() => handleNavClick('support')}
            className={`hover:text-teal-700 transition cursor-pointer whitespace-nowrap ${currentView === 'support' ? 'text-teal-700' : ''}`}
          >
            {t('nav.support', 'Support')}
          </button>
          <button
            onClick={() => handleNavClick('admin')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              currentView === 'admin'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/60'
            }`}
            title="Admin Portal (Secure Login)"
          >
            <Lock className="w-3 h-3 text-purple-600" />
            <span>Admin Portal</span>
          </button>
        </nav>

        {/* Zone 3: Actions + Phone Helpline + PWA Install + User State */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Helpline Phone */}
          <a
            href={`tel:${contactNumber}`}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 hover:bg-teal-100 transition whitespace-nowrap"
            title="Helpline Support"
          >
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            <span className="tabular-nums">{contactNumber}</span>
          </a>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer whitespace-nowrap"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'en' ? 'اردو' : 'English'}</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Auth State CTAs */}
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition cursor-pointer shadow-sm whitespace-nowrap"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
              {isWorker && (
                <button
                  onClick={() => handleNavClick('worker_dashboard')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition cursor-pointer shadow-sm whitespace-nowrap"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Worker Panel</span>
                </button>
              )}
              {isCustomer && (
                <button
                  onClick={() => handleNavClick('customer_dashboard')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-sm whitespace-nowrap"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">My Account</span>
                </button>
              )}
              <button
                onClick={logout}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-red-600 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer whitespace-nowrap"
              >
                {t('nav.login', 'Sign In')}
              </button>
              <button
                onClick={onOpenWorkerRegister}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition cursor-pointer shadow-sm whitespace-nowrap"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{t('nav.register_worker', 'Join as Worker')}</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm font-medium">
            <button
              onClick={() => handleNavClick('home')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
            >
              {t('nav.home', 'Home')}
            </button>
            <button
              onClick={() => handleNavClick('categories')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
            >
              {t('nav.categories', 'Services')}
            </button>
            <button
              onClick={() => handleNavClick('workers')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
            >
              {t('nav.workers', 'Find Workers')}
            </button>
            <button
              onClick={() => handleNavClick('post_job')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
            >
              {t('nav.post_job', 'Post Job')}
            </button>
            <button
              onClick={() => handleNavClick('support')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
            >
              {t('nav.support', 'Support')}
            </button>
            <button
              onClick={() => {
                handleNavClick('admin');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 rounded-lg hover:bg-purple-50 text-purple-700 font-semibold flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <a
              href={`tel:${contactNumber}`}
              className="flex items-center justify-center gap-2 py-2 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200"
            >
              <Phone className="w-4 h-4 text-teal-600" />
              <span>Helpline: {contactNumber}</span>
            </a>
            {!user && (
              <button
                onClick={() => {
                  onOpenWorkerRegister();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold text-center"
              >
                Join as Worker (کاریگر بنیں)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
