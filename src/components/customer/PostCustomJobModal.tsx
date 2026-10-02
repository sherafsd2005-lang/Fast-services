import React, { useState } from 'react';
import { Category, CustomJob } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Megaphone, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PostCustomJobModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onSuccess: (job: CustomJob) => void;
  onOpenAuth: () => void;
}

export const PostCustomJobModal: React.FC<PostCustomJobModalProps> = ({
  isOpen,
  categories,
  onClose,
  onSuccess,
  onOpenAuth
}) => {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();
  const [title, setTitle] = useState('');
  const [categoryName, setCategoryName] = useState(categories[0]?.name || 'Plumbing');
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(user?.city || 'Karachi');
  const [area, setArea] = useState(user?.area || '');
  const [address, setAddress] = useState(user?.address || '');
  const [budget, setBudget] = useState('2500');
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'urgent'>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdJob, setCreatedJob] = useState<CustomJob | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const job = await api.createCustomJob({
        title,
        categoryName,
        serviceName: serviceName || 'General Requirement',
        description,
        city,
        area,
        address,
        budget: Number(budget),
        urgency
      });
      setCreatedJob(job);
      onSuccess(job);
    } catch (err: any) {
      setError(err.message || 'Failed to post custom job');
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

        {createdJob ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Job Posted Successfully!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your job <strong>"{title}"</strong> with a budget of <strong>PKR {Number(budget).toLocaleString()}</strong> is now visible to verified {categoryName} workers in {city}.
            </p>
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-xs text-teal-800 text-left space-y-1">
              <p className="font-bold">What happens next?</p>
              <p>• Workers will inspect your job details and submit offers or counter-offers.</p>
              <p>• You can compare worker ratings, profiles, and choose the best offer.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              Done &amp; View Job Board
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Post a Custom Job (مطلوبہ کام لگائیں)
                </h3>
                <p className="text-xs text-slate-500">
                  Set your desired budget and receive offers from local workers
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bathroom pipe leakage & faucet replacement"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Proposed Budget (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe exact requirements, dimensions, brand preferences or materials needed..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500/20"
                />
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
                    placeholder="e.g. DHA, Gulberg"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  placeholder="House/Building address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'normal', 'urgent'] as const).map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrgency(u)}
                      className={`py-2 rounded-xl border text-xs font-bold capitalize cursor-pointer transition ${
                        urgency === u
                          ? u === 'urgent'
                            ? 'bg-rose-50 border-rose-500 text-rose-700'
                            : 'bg-teal-50 border-teal-500 text-teal-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                {loading ? 'Posting Job...' : user ? 'Post Job to Worker Pool' : 'Sign In to Post Job'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
