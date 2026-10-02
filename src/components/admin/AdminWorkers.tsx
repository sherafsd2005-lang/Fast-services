import React, { useState, useEffect } from 'react';
import { WorkerProfile, Category } from '../../types';
import { api } from '../../services/api';
import {
  Plus,
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  AlertCircle,
  FileText,
  UserCheck,
  Star,
  Clock,
  RotateCcw,
  Ban,
  Camera,
  MapPin,
  ExternalLink,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

interface AdminWorkersProps {
  categories: Category[];
}

export const AdminWorkers: React.FC<AdminWorkersProps> = ({ categories }) => {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'under_review' | 'reupload_required' | 'verified' | 'rejected' | 'suspended' | 'all'>('pending');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);

  // Decision Modal State
  const [actionType, setActionType] = useState<'reject' | 'reupload' | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Worker Form
  const [newWorker, setNewWorker] = useState({
    name: '',
    mobile: '',
    email: '',
    city: 'Karachi',
    area: '',
    experience: '3–5 years',
    services: [] as string[],
    startingPrice: '1000',
    visitCharge: '300',
    about: '',
    verificationStatus: 'verified'
  });

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkers({});
      setWorkers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleOpenInspect = (worker: WorkerProfile) => {
    setSelectedWorker(worker);
    setActionType(null);
    setFeedbackNote('');
  };

  const handleDirectApprove = async (workerId: string) => {
    setActionLoading(true);
    try {
      await api.adminVerifyWorkerAction(workerId, 'approve');
      await loadWorkers();
      if (selectedWorker && selectedWorker.id === workerId) {
        const updated = workers.find(w => w.id === workerId);
        if (updated) setSelectedWorker({ ...updated, verificationStatus: 'verified', cnicStatus: 'approved' });
        else setSelectedWorker(null);
      }
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectSuspend = async (workerId: string) => {
    if (!confirm('Are you sure you want to suspend this worker? Their account and public listing will be deactivated.')) return;
    setActionLoading(true);
    try {
      await api.adminVerifyWorkerAction(workerId, 'suspend');
      await loadWorkers();
      if (selectedWorker && selectedWorker.id === workerId) {
        setSelectedWorker(null);
      }
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectRestore = async (workerId: string) => {
    setActionLoading(true);
    try {
      await api.adminVerifyWorkerAction(workerId, 'restore');
      await loadWorkers();
      if (selectedWorker && selectedWorker.id === workerId) {
        setSelectedWorker(null);
      }
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDecision = async () => {
    if (!selectedWorker || !actionType) return;
    if (!feedbackNote.trim()) {
      alert('Please provide specific feedback or reason for the worker.');
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === 'reject') {
        await api.adminVerifyWorkerAction(selectedWorker.id, 'reject', feedbackNote);
      } else if (actionType === 'reupload') {
        await api.adminVerifyWorkerAction(selectedWorker.id, 'request_reupload', feedbackNote);
      }
      await loadWorkers();
      setActionType(null);
      setFeedbackNote('');
      setSelectedWorker(null);
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorker.name || !newWorker.mobile || newWorker.services.length === 0) {
      alert('Name, mobile, and at least one service are required');
      return;
    }

    try {
      await api.adminAddWorker(newWorker);
      setShowAddModal(false);
      setNewWorker({
        name: '',
        mobile: '',
        email: '',
        city: 'Karachi',
        area: '',
        experience: '3–5 years',
        services: [],
        startingPrice: '1000',
        visitCharge: '300',
        about: '',
        verificationStatus: 'verified'
      });
      await loadWorkers();
    } catch (e: any) {
      alert(e.message || 'Failed to add worker');
    }
  };

  // Counts for tabs
  const pendingCount = workers.filter(w => w.verificationStatus === 'pending' || w.verificationStatus === 'under_review').length;
  const reuploadCount = workers.filter(w => w.verificationStatus === 'reupload_required').length;
  const verifiedCount = workers.filter(w => w.verificationStatus === 'verified').length;
  const rejectedCount = workers.filter(w => w.verificationStatus === 'rejected').length;
  const suspendedCount = workers.filter(w => w.verificationStatus === 'suspended').length;

  const filteredWorkers = workers.filter(w => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.mobile.includes(search) ||
      w.city.toLowerCase().includes(search.toLowerCase()) ||
      w.services.some(s => s.toLowerCase().includes(search.toLowerCase()));

    let matchStatus = true;
    if (statusFilter === 'pending') {
      matchStatus = w.verificationStatus === 'pending' || w.verificationStatus === 'under_review';
    } else if (statusFilter === 'reupload_required') {
      matchStatus = w.verificationStatus === 'reupload_required';
    } else if (statusFilter === 'verified') {
      matchStatus = w.verificationStatus === 'verified';
    } else if (statusFilter === 'rejected') {
      matchStatus = w.verificationStatus === 'rejected';
    } else if (statusFilter === 'suspended') {
      matchStatus = w.verificationStatus === 'suspended';
    }

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
              Verification Authority
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            WORKER VERIFICATION &amp; CREDENTIAL MANAGEMENT
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict CNIC verification, profile approval, rejection with cause, and document re-upload management
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Worker Manually</span>
        </button>
      </div>

      {/* Verification Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Review</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
            statusFilter === 'pending' ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-800'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('reupload_required')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            statusFilter === 'reupload_required'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-upload Required</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
            statusFilter === 'reupload_required' ? 'bg-white text-orange-600' : 'bg-orange-100 text-orange-800'
          }`}>
            {reuploadCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('verified')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            statusFilter === 'verified'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified Workers</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
            statusFilter === 'verified' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {verifiedCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            statusFilter === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected ({rejectedCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('suspended')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            statusFilter === 'suspended'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>Suspended ({suspendedCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>All Workers ({workers.length})</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by worker name, phone number, city, or skill category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
        />
      </div>

      {/* Workers Verification Cards / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading workers registry...</div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-800">No workers in this category</p>
            <p className="text-xs text-slate-500 mt-1">Try switching tabs or adjusting search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Worker Profile</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Service &amp; Experience</th>
                  <th className="py-3.5 px-4">CNIC Proof</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                  <th className="py-3.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkers.map(w => (
                  <tr key={w.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                          {w.avatarUrl ? (
                            <img src={w.avatarUrl} alt={w.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                              {w.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                            <span>{w.name}</span>
                            {w.verificationStatus === 'verified' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                            )}
                          </p>
                          <p className="text-slate-500 font-mono text-[11px]">{w.mobile}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{w.city}</span>
                      <span className="text-slate-400 block text-[11px]">{w.area}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs mb-1">
                        {w.services.slice(0, 2).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                            {s}
                          </span>
                        ))}
                        {w.services.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{w.services.length - 2} more
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Exp: {w.experience} · Visit: PKR {w.visitCharge}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {w.cnicFrontUrl || w.cnicBackUrl ? (
                        <button
                          onClick={() => handleOpenInspect(w)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                            w.cnicStatus === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                          <span>CNIC Attached</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No document</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                          w.verificationStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.verificationStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : w.verificationStatus === 'reupload_required'
                            ? 'bg-orange-100 text-orange-800'
                            : w.verificationStatus === 'suspended'
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.verificationStatus.replace(/_/g, ' ')}
                      </span>
                      {w.verificationNote && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 max-w-[160px]" title={w.verificationNote}>
                          Note: {w.verificationNote}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenInspect(w)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        {w.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => handleDirectApprove(w.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Worker Detailed Inspection & Verification Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-8 border border-slate-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border-2 border-slate-200">
                  {selectedWorker.avatarUrl ? (
                    <img src={selectedWorker.avatarUrl} alt={selectedWorker.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-xl text-slate-400">
                      {selectedWorker.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900">{selectedWorker.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        selectedWorker.verificationStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedWorker.verificationStatus === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : selectedWorker.verificationStatus === 'reupload_required'
                          ? 'bg-orange-100 text-orange-800'
                          : selectedWorker.verificationStatus === 'suspended'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedWorker.verificationStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedWorker.mobile} · {selectedWorker.city} ({selectedWorker.area})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWorker(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Worker Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Experience</span>
                <span className="font-bold text-slate-800">{selectedWorker.experience}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Starting Price</span>
                <span className="font-bold text-slate-800">
                  {selectedWorker.startingPrice ? `PKR ${selectedWorker.startingPrice.toLocaleString()}` : 'Discussion'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Visit Charge</span>
                <span className="font-bold text-slate-800">PKR {selectedWorker.visitCharge}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Rating</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{selectedWorker.rating} ({selectedWorker.reviewCount})</span>
                </span>
              </div>
            </div>

            {/* Services List */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1.5">Registered Services:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedWorker.services.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-100 text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* CNIC Documents View (Admin Only) */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-700" />
                  <span>Confidential NADRA CNIC Credentials</span>
                </span>
                <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                  Status: {selectedWorker.cnicStatus || 'pending'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-700 mb-1 block">CNIC Front Side</span>
                  <div className="h-44 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative group">
                    {selectedWorker.cnicFrontUrl ? (
                      <img src={selectedWorker.cnicFrontUrl} alt="CNIC Front" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400">Front Not Uploaded</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 mb-1 block">CNIC Back Side</span>
                  <div className="h-44 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative group">
                    {selectedWorker.cnicBackUrl ? (
                      <img src={selectedWorker.cnicBackUrl} alt="CNIC Back" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400">Back Not Uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Verification Note if present */}
            {selectedWorker.verificationNote && (
              <div className="p-3.5 rounded-xl bg-slate-100 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block">Existing Verification Note:</span>
                <p className="mt-0.5">{selectedWorker.verificationNote}</p>
              </div>
            )}

            {/* Prompt Form for Reject or Request Re-upload */}
            {actionType && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>
                    {actionType === 'reject' ? 'Reason for Rejecting Worker:' : 'Specific Instructions for Re-upload:'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {actionType === 'reupload' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setFeedbackNote('CNIC back side photo is blurry or unreadable. Please upload a clear photo under good lighting.')}
                        className="px-2 py-1 rounded bg-white border border-amber-300 text-amber-900 hover:bg-amber-100"
                      >
                        Blurry Back Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackNote('Both CNIC front and back photos must be clear with all 13 digits and expiry visible.')}
                        className="px-2 py-1 rounded bg-white border border-amber-300 text-amber-900 hover:bg-amber-100"
                      >
                        All digits visible
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackNote('Please upload a clear front-facing profile picture (selfie).')}
                        className="px-2 py-1 rounded bg-white border border-amber-300 text-amber-900 hover:bg-amber-100"
                      >
                        Clear Profile Photo
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setFeedbackNote('CNIC provided is expired or invalid according to verification check.')}
                        className="px-2 py-1 rounded bg-white border border-rose-300 text-rose-900 hover:bg-rose-100"
                      >
                        Expired CNIC
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackNote('Identity details do not match the registered user credentials.')}
                        className="px-2 py-1 rounded bg-white border border-rose-300 text-rose-900 hover:bg-rose-100"
                      >
                        Mismatch Data
                      </button>
                    </>
                  )}
                </div>

                <textarea
                  rows={2}
                  required
                  placeholder={
                    actionType === 'reject'
                      ? 'Enter clear explanation why this worker application is rejected...'
                      : 'Enter instructions explaining what needs to be re-uploaded (e.g. clear CNIC back photo)...'
                  }
                  value={feedbackNote}
                  onChange={e => setFeedbackNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500/20"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setActionType(null); setFeedbackNote(''); }}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDecision}
                    disabled={actionLoading}
                    className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs ${
                      actionType === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {actionLoading ? 'Saving...' : actionType === 'reject' ? 'Confirm Rejection' : 'Send Re-upload Request'}
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Buttons */}
            {!actionType && (
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedWorker.verificationStatus === 'suspended' ? (
                    <button
                      onClick={() => handleDirectRestore(selectedWorker.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Restore &amp; Activate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDirectSuspend(selectedWorker.id)}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Suspend Worker
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setActionType('reject'); setFeedbackNote(''); }}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold cursor-pointer"
                  >
                    Reject Worker
                  </button>

                  <button
                    onClick={() => { setActionType('reupload'); setFeedbackNote(''); }}
                    className="px-4 py-2 rounded-xl bg-orange-50 text-orange-800 hover:bg-orange-100 text-xs font-bold cursor-pointer"
                  >
                    Request Re-upload
                  </button>

                  <button
                    onClick={() => handleDirectApprove(selectedWorker.id)}
                    disabled={actionLoading}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Worker (Verified)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Worker Manually Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-slate-900">Add Worker Manually (Admin)</h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateWorker} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sajid Ali"
                  value={newWorker.name}
                  onChange={e => setNewWorker({ ...newWorker, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03001234567"
                  value={newWorker.mobile}
                  onChange={e => setNewWorker({ ...newWorker, mobile: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <select
                    value={newWorker.city}
                    onChange={e => setNewWorker({ ...newWorker, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Area *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DHA, Gulshan"
                    value={newWorker.area}
                    onChange={e => setNewWorker({ ...newWorker, area: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Services (Choose from catalog) *
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                  {categories.flatMap(c => c.services).map(s => {
                    const checked = newWorker.services.includes(s.name);
                    return (
                      <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setNewWorker({ ...newWorker, services: newWorker.services.filter(item => item !== s.name) });
                            } else {
                              setNewWorker({ ...newWorker, services: [...newWorker.services, s.name] });
                            }
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span>{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Starting Price (PKR)</label>
                  <input
                    type="number"
                    value={newWorker.startingPrice}
                    onChange={e => setNewWorker({ ...newWorker, startingPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Visit Charge (PKR)</label>
                  <input
                    type="number"
                    value={newWorker.visitCharge}
                    onChange={e => setNewWorker({ ...newWorker, visitCharge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
                >
                  Create &amp; Verify Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
