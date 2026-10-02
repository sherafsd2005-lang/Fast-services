import React, { useState, useEffect } from 'react';
import { WorkerProfile, Category } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Heart,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface WorkerDirectoryProps {
  categories: Category[];
  initialCategory?: string;
  initialService?: string;
  onBookWorker: (worker: WorkerProfile, serviceName?: string) => void;
  onOpenAuth: () => void;
}

export const WorkerDirectory: React.FC<WorkerDirectoryProps> = ({
  categories,
  initialCategory = '',
  initialService = '',
  onBookWorker,
  onOpenAuth
}) => {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialService || '');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || 'all');
  const [cityFilter, setCityFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedWorkerDetails, setSelectedWorkerDetails] = useState<WorkerProfile | null>(null);

  const PAK_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkers({});
      setWorkers(data);

      if (user) {
        const favs = await api.getFavorites();
        setFavorites(favs.map(f => f.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const toggleFavorite = async (workerId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      const res = await api.toggleFavorite(workerId);
      if (res.favorited) {
        setFavorites(prev => [...prev, workerId]);
      } else {
        setFavorites(prev => prev.filter(id => id !== workerId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredWorkers = workers.filter(w => {
    const matchSearch =
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.services.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
      w.area.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      categoryFilter === 'all' ||
      w.categories.some(c => c.toLowerCase() === categoryFilter.toLowerCase());

    const matchCity =
      cityFilter === 'all' ||
      w.city.toLowerCase() === cityFilter.toLowerCase();

    const matchAvail =
      availabilityFilter === 'all' ||
      w.availability === availabilityFilter;

    const matchVerified = !verifiedOnly || w.verificationStatus === 'verified';

    return matchSearch && matchCategory && matchCity && matchAvail && matchVerified;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isUrdu ? 'تصدیق شدہ کاریگر تلاش کریں' : 'Find Verified Service Providers'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {isUrdu
            ? 'شناختی کارڈ سے تصدیق شدہ پلمبر، الیکٹریشن اور ہوم سروس ماہرین'
            : 'Browse verified technicians, inspect transparent rates, and book on-demand'}
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-8 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isUrdu ? 'سروس یا نام تلاش کریں...' : 'Search service, worker or area...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium"
            >
              <option value="all">All Cities (Pakistan)</option>
              {PAK_CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div>
            <select
              value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium"
            >
              <option value="all">Any Availability</option>
              <option value="available">🟢 Available Now</option>
              <option value="busy">🟡 Busy on Job</option>
              <option value="off_today">🔴 Off Today</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Show only CNIC Verified Badge workers</span>
            </span>
          </label>

          <span className="text-slate-400 font-medium">
            Showing {filteredWorkers.length} workers
          </span>
        </div>
      </div>

      {/* Workers Grid */}
      {filteredWorkers.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
          <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No matching service providers found</h4>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or selecting another category or city.</p>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('all');
              setCityFilter('all');
              setAvailabilityFilter('all');
              setVerifiedOnly(false);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkers.map(w => {
            const isFav = favorites.includes(w.id);
            const isAvailable = w.availability === 'available';

            return (
              <div
                key={w.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top: Avatar, Name, Favorite */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {w.avatarUrl ? (
                          <img src={w.avatarUrl} alt={w.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-slate-400 text-lg">
                            {w.name.charAt(0)}
                          </div>
                        )}
                        {/* Status dot */}
                        <span
                          className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white ${
                            w.availability === 'available' ? 'bg-emerald-500' :
                            w.availability === 'busy' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          title={`Status: ${w.availability}`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-teal-700 transition">
                            {w.name}
                          </h4>
                          {w.verificationStatus === 'verified' && (
                            <span title="CNIC Verified Pro">
                              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{w.area ? `${w.area}, ` : ''}{w.city}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFavorite(w.id)}
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        isFav ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-rose-500 hover:bg-slate-50'
                      }`}
                      title={isFav ? 'Remove Favorite' : 'Save to Favorites'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Rating & Stats Bar */}
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50 text-xs mb-3 font-medium">
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{w.rating}</span>
                      <span className="text-slate-400 font-normal">({w.reviewCount})</span>
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600">
                      {w.completedJobsCount} jobs done
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600">
                      {w.experience}
                    </span>
                  </div>

                  {/* Services Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {w.services.slice(0, 3).map(s => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg bg-teal-50/70 border border-teal-100 text-teal-800 text-[11px] font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                    {w.services.length > 3 && (
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold">
                        +{w.services.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Bio Preview */}
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {w.about}
                  </p>
                </div>

                {/* Bottom Card Controls: Pricing & CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Starting Fee</span>
                    <span className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
                      {w.startingPrice ? `PKR ${w.startingPrice.toLocaleString()}` : 'Discuss Quote'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedWorkerDetails(w)}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => onBookWorker(w)}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Book Worker</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Worker Profile Detail Modal */}
      {selectedWorkerDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedWorkerDetails(null)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm absolute top-5 right-5 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                {selectedWorkerDetails.avatarUrl ? (
                  <img src={selectedWorkerDetails.avatarUrl} alt={selectedWorkerDetails.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-slate-400 text-2xl">
                    {selectedWorkerDetails.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{selectedWorkerDetails.name}</h3>
                  {selectedWorkerDetails.verificationStatus === 'verified' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ CNIC Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {selectedWorkerDetails.area}, {selectedWorkerDetails.city} · {selectedWorkerDetails.experience}
                </p>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{selectedWorkerDetails.rating}</span>
                  </span>
                  <span>· {selectedWorkerDetails.completedJobsCount} jobs completed</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1">About &amp; Skills:</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl">
                  {selectedWorkerDetails.about}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Offered Services:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedWorkerDetails.services.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-100 text-teal-800 font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900 text-white">
                <div>
                  <span className="text-slate-400 block text-[11px]">Starting Price</span>
                  <span className="text-base font-black text-teal-300">
                    {selectedWorkerDetails.startingPrice ? `PKR ${selectedWorkerDetails.startingPrice.toLocaleString()}` : 'Discussion'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Home Visit Charge</span>
                  <span className="text-base font-black text-white">
                    PKR {selectedWorkerDetails.visitCharge}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  const w = selectedWorkerDetails;
                  setSelectedWorkerDetails(null);
                  onBookWorker(w);
                }}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition"
              >
                Proceed to Book This Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
