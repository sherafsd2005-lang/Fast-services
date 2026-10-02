import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Category, HeroPoster, WorkerProfile, Booking, CustomJob } from './types';
import { api } from './services/api';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { HeroPosterCarousel } from './components/home/HeroPosterCarousel';
import { CategoryBrowser } from './components/home/CategoryBrowser';
import { WorkerDirectory } from './components/home/WorkerDirectory';
import { SupportPage } from './components/home/SupportPage';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { WorkerDashboard } from './components/worker/WorkerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { WorkerRegistrationModal } from './components/worker/WorkerRegistrationModal';
import { AuthModal } from './components/common/AuthModal';
import { BookWorkerModal } from './components/customer/BookWorkerModal';
import { PostCustomJobModal } from './components/customer/PostCustomJobModal';
import { PaymentModal } from './components/customer/PaymentModal';
import { ReviewModal } from './components/customer/ReviewModal';
import { DisputeModal } from './components/customer/DisputeModal';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { JobOffersModal } from './components/customer/JobOffersModal';
import {
  Search,
  MapPin,
  ShieldCheck,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Star,
  Users
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isAdmin, isWorker } = useAuth();
  const { t, isUrdu } = useLanguage();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('home');
  const [categories, setCategories] = useState<Category[]>([]);
  const [posters, setPosters] = useState<HeroPoster[]>([]);
  const [contactNumber, setContactNumber] = useState('03209976716');
  const [featuredWorkers, setFeaturedWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State on Home
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [homeSelectedCity, setHomeSelectedCity] = useState('');

  // Modals State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'admin'>('login');
  const [workerRegisterOpen, setWorkerRegisterOpen] = useState(false);
  const [bookModalWorker, setBookModalWorker] = useState<WorkerProfile | null>(null);
  const [bookModalService, setBookModalService] = useState<string | undefined>(undefined);
  const [postJobModalOpen, setPostJobModalOpen] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null);
  const [chatParams, setChatParams] = useState<{ isOpen: boolean; bookingId?: string; jobId?: string; recipientId?: string; recipientName?: string }>({ isOpen: false });
  const [offersJobId, setOffersJobId] = useState<string | null>(null);

  const loadInitialData = async () => {
    try {
      const [cats, posts, sets, wrks] = await Promise.all([
        api.getCategories(),
        api.getPosters(),
        api.getSettings(),
        api.getWorkers({ verifiedOnly: 'true' })
      ]);
      setCategories(cats);
      setPosters(posts);
      if (sets?.contactNumber) {
        setContactNumber(sets.contactNumber);
      }
      setFeaturedWorkers(wrks.slice(0, 4));
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register' | 'admin' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleNavigate = (view: string) => {
    if (view.startsWith('job_offers_')) {
      const jId = view.replace('job_offers_', '');
      setOffersJobId(jId);
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryService = (catName: string, serviceName?: string) => {
    setCurrentView('workers');
  };

  const handleBookWorker = (worker: WorkerProfile, srvName?: string) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    setBookModalWorker(worker);
    setBookModalService(srvName);
  };

  const handleBookAgain = async (workerId: string) => {
    try {
      const worker = await api.getWorker(workerId);
      handleBookWorker(worker);
    } catch (e) {
      console.error(e);
    }
  };

  const handleHomeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentView('workers');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Bar Header */}
      <Header
        onOpenAuth={handleOpenAuth}
        onOpenWorkerRegister={() => setWorkerRegisterOpen(true)}
        onNavigate={handleNavigate}
        currentView={currentView}
        contactNumber={contactNumber}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <div className="space-y-12 sm:space-y-16 pb-16">
            {/* Hero Section Container */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
              {/* Animated Rotating Hero Posters */}
              <HeroPosterCarousel
                posters={posters}
                onSelectService={(cat, srv) => {
                  setCurrentView('workers');
                }}
                onPostJob={() => {
                  if (!user) handleOpenAuth('login');
                  else setPostJobModalOpen(true);
                }}
              />

              {/* Simple Search & Location Bar */}
              <div className="mt-6 p-4 rounded-3xl bg-white border border-slate-200 shadow-md">
                <form onSubmit={handleHomeSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t('hero.search_placeholder', 'Search 50+ services (e.g. Plumber, Electrician, AC Repair)...')}
                      value={homeSearchQuery}
                      onChange={e => setHomeSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-3 relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={homeSelectedCity}
                      onChange={e => setHomeSelectedCity(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-700"
                    >
                      <option value="">All Pakistan Cities</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Multan">Multan</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Search className="w-4 h-4" />
                      <span>{t('hero.find_worker_btn', 'Find Worker')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) handleOpenAuth('login');
                        else setPostJobModalOpen(true);
                      }}
                      className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer whitespace-nowrap hidden sm:flex items-center gap-1"
                      title="Post Custom Job"
                    >
                      <PlusCircle className="w-4 h-4 text-teal-400" />
                      <span>Post Job</span>
                    </button>
                  </div>
                </form>

                {/* Popular Keywords Pill Row */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
                  <span className="text-slate-400 font-medium shrink-0">Popular:</span>
                  {[
                    { label: '🔧 Plumbing', cat: 'Plumbing' },
                    { label: '⚡ Electrical', cat: 'Electrical' },
                    { label: '❄️ AC Repair', cat: 'AC & HVAC' },
                    { label: '🧹 Home Cleaning', cat: 'Home Cleaning' },
                    { label: '🪚 Carpenter', cat: 'Carpenter' },
                    { label: '🎨 Painting', cat: 'Painting' },
                    { label: '☀️ Solar', cat: 'Solar / Energy' },
                    { label: '🚗 Car Repair', cat: 'Car Repair' }
                  ].map(item => (
                    <button
                      key={item.cat}
                      type="button"
                      onClick={() => setCurrentView('workers')}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-semibold shrink-0 transition text-[11px] cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Complete Dynamic Category System (Section 4 & 5) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6">
              <CategoryBrowser
                categories={categories}
                selectedCategory={null}
                onSelectCategory={handleSelectCategoryService}
              />
            </section>

            {/* Featured CNIC Verified Workers */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Top-Rated Verified Workers
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Directly book trusted professionals with proven 5-star track records
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('workers')}
                  className="font-bold text-xs sm:text-sm text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Workers</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {featuredWorkers.map(w => (
                  <div
                    key={w.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-lg transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {w.avatarUrl ? (
                            <img src={w.avatarUrl} alt={w.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                              {w.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                            <span>{w.name}</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          </div>
                          <span className="text-xs text-slate-500 block">{w.city} ({w.area})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mb-2">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{w.rating}</span>
                        <span className="text-slate-400 font-normal">({w.reviewCount} reviews)</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                        {w.about}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">From</span>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {w.startingPrice ? `PKR ${w.startingPrice.toLocaleString()}` : 'Quote'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleBookWorker(w)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* How It Works & Protection Badges */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="bg-gradient-to-br from-slate-900 to-teal-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
                <div className="max-w-3xl mb-8">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">FIRST STEP Standards</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                    Safe, Transparent &amp; Effortless Home Services
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    Designed for ordinary families with zero technical confusion. We protect your money and guarantee verified technicians.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <ShieldCheck className="w-8 h-8 text-teal-400 mb-3" />
                    <h4 className="text-base font-bold text-white mb-1">100% CNIC Verified</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Every worker is vetted with authentic NADRA credentials before they can accept bookings.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <Clock className="w-8 h-8 text-teal-400 mb-3" />
                    <h4 className="text-base font-bold text-white mb-1">Protected Company Escrow</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      You pay to FIRST STEP company account (Meezan / Raast / Easypaisa). Payout is only released after you confirm the job is complete!
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <Phone className="w-8 h-8 text-teal-400 mb-3" />
                    <h4 className="text-base font-bold text-white mb-1">Live Phone Helpline</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Call our representative directly at <strong className="text-teal-300 tabular-nums">{contactNumber}</strong> for any dispute or instant help.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {currentView === 'categories' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <CategoryBrowser
              categories={categories}
              selectedCategory={null}
              onSelectCategory={handleSelectCategoryService}
            />
          </div>
        )}

        {currentView === 'workers' && (
          <WorkerDirectory
            categories={categories}
            onBookWorker={handleBookWorker}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentView === 'post_job' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-xl mx-auto shadow-sm">
              <PlusCircle className="w-12 h-12 text-teal-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-900">Post Your Custom Job</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
                Tell us what you need fixed and set your own budget. Verified workers will send competitive offers.
              </p>
              <button
                onClick={() => {
                  if (!user) handleOpenAuth('login');
                  else setPostJobModalOpen(true);
                }}
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition"
              >
                Open Job Creation Form
              </button>
            </div>
          </div>
        )}

        {currentView === 'support' && (
          <SupportPage
            contactNumber={contactNumber}
            onPostJob={() => {
              if (!user) handleOpenAuth('login');
              else setPostJobModalOpen(true);
            }}
            onBrowseServices={() => setCurrentView('categories')}
          />
        )}

        {currentView === 'customer_dashboard' && (
          <CustomerDashboard
            onNavigate={handleNavigate}
            onOpenBookingPayment={(booking) => setPaymentBooking(booking)}
            onOpenReview={(booking) => setReviewBooking(booking)}
            onOpenDispute={(booking) => setDisputeBooking(booking)}
            onOpenChat={(bookingId, recId, recName) => {
              setChatParams({ isOpen: true, bookingId, recipientId: recId, recipientName: recName });
            }}
            onBookAgain={handleBookAgain}
          />
        )}

        {currentView === 'worker_dashboard' && (
          <WorkerDashboard
            onNavigate={handleNavigate}
            onOpenChat={(bookingId, recId, recName) => {
              setChatParams({ isOpen: true, bookingId, recipientId: recId, recipientName: recName });
            }}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            categories={categories}
            onRefreshCategories={loadInitialData}
            contactNumber={contactNumber}
            onUpdateContactNumber={(num) => setContactNumber(num)}
            onLogoutAdmin={() => setCurrentView('home')}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        contactNumber={contactNumber}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onOpenWorkerRegister={() => setWorkerRegisterOpen(true)}
      />

      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={chatParams.isOpen}
        onClose={() => setChatParams({ ...chatParams, isOpen: false })}
        bookingId={chatParams.bookingId}
        jobId={chatParams.jobId}
        recipientId={chatParams.recipientId}
        recipientName={chatParams.recipientName}
      />

      {/* Customer Offers Viewer Modal */}
      <JobOffersModal
        jobId={offersJobId}
        onClose={() => setOffersJobId(null)}
        onOfferAccepted={() => setCurrentView('customer_dashboard')}
        onOpenChat={(bookingId, recId, recName) => {
          setChatParams({ isOpen: true, bookingId, recipientId: recId, recipientName: recName });
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          if (authModalMode === 'admin') setCurrentView('admin');
        }}
      />

      {/* 8-Step Worker Registration Modal */}
      <WorkerRegistrationModal
        isOpen={workerRegisterOpen}
        onClose={() => setWorkerRegisterOpen(false)}
        categories={categories}
        onSuccess={() => {
          setWorkerRegisterOpen(false);
          setCurrentView('worker_dashboard');
        }}
      />

      {/* Book Worker Modal */}
      <BookWorkerModal
        isOpen={!!bookModalWorker}
        worker={bookModalWorker}
        selectedServiceName={bookModalService}
        onClose={() => setBookModalWorker(null)}
        onSuccess={(bk) => {
          setBookModalWorker(null);
          setCurrentView('customer_dashboard');
        }}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* Post Custom Job Modal */}
      <PostCustomJobModal
        isOpen={postJobModalOpen}
        categories={categories}
        onClose={() => setPostJobModalOpen(false)}
        onSuccess={() => {
          setPostJobModalOpen(false);
          setCurrentView('customer_dashboard');
        }}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* Company Payment Modal (Meezan / Raast / Easypaisa) */}
      <PaymentModal
        isOpen={!!paymentBooking}
        booking={paymentBooking}
        onClose={() => setPaymentBooking(null)}
        onSuccess={() => {
          setPaymentBooking(null);
        }}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!reviewBooking}
        booking={reviewBooking}
        onClose={() => setReviewBooking(null)}
        onSuccess={() => setReviewBooking(null)}
      />

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={!!disputeBooking}
        booking={disputeBooking}
        onClose={() => setDisputeBooking(null)}
        onSuccess={() => setDisputeBooking(null)}
      />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
