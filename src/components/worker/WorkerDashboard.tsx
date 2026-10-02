import React, { useState, useEffect, useRef } from 'react';
import { Booking, CustomJob, WorkerProfile, WorkerPayout } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  CheckCircle2,
  XCircle,
  PlusCircle,
  User,
  Image,
  Bell,
  HelpCircle,
  Megaphone,
  Briefcase,
  AlertCircle,
  Send,
  MessageSquare,
  Camera,
  Upload,
  Trash2,
  Lock,
  Shield,
  ShieldCheck,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface WorkerDashboardProps {
  onNavigate: (view: string) => void;
  onOpenChat: (bookingId?: string, recipientId?: string, recipientName?: string) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  onNavigate,
  onOpenChat
}) => {
  const { user, workerProfile, refreshUser } = useAuth();
  const { isUrdu } = useLanguage();
  const [activeTab, setActiveTab] = useState<'bookings' | 'custom_jobs' | 'earnings' | 'profile' | 'portfolio' | 'support'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [openJobs, setOpenJobs] = useState<CustomJob[]>([]);
  const [earnings, setEarnings] = useState<{
    totalEarnings: number;
    releasedEarnings: number;
    pendingEarnings: number;
    totalCommissionPaid: number;
    bonusesEarned: number;
    payoutHistory: WorkerPayout[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Additional Charge & Counter Offer state
  const [chargeBookingId, setChargeBookingId] = useState<string | null>(null);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeReason, setChargeReason] = useState('');
  const [counterJobId, setCounterJobId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  // Profile Edit State
  const [aboutInput, setAboutInput] = useState(workerProfile?.about || '');
  const [startingPriceInput, setStartingPriceInput] = useState(String(workerProfile?.startingPrice || '800'));
  const [priceTypeInput, setPriceTypeInput] = useState<'fixed' | 'discuss'>(workerProfile?.priceType || 'fixed');
  const [visitChargeInput, setVisitChargeInput] = useState(String(workerProfile?.visitCharge || '300'));
  const [experienceInput, setExperienceInput] = useState<any>(workerProfile?.experience || '3–5 years');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password Change State (Worker's own credentials only)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Re-upload documents modal
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [reuploadFront, setReuploadFront] = useState('');
  const [reuploadBack, setReuploadBack] = useState('');
  const [reuploadAvatar, setReuploadAvatar] = useState('');
  const [reuploadLoading, setReuploadLoading] = useState(false);
  const [reuploadSuccess, setReuploadSuccess] = useState('');

  // Hidden File Inputs
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const loadWorkerData = async () => {
    if (!workerProfile) return;
    setLoading(true);
    try {
      const [bks, jobs, earn] = await Promise.all([
        api.getBookings(),
        api.getCustomJobs({ city: workerProfile.city }),
        api.getWorkerEarnings(workerProfile.id)
      ]);
      setBookings(bks);
      setOpenJobs(jobs.filter(j => j.status === 'open'));
      setEarnings(earn);
    } catch (e) {
      console.error('Failed to load worker data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerData();
    if (workerProfile) {
      setAboutInput(workerProfile.about || '');
      setStartingPriceInput(String(workerProfile.startingPrice || '800'));
      setPriceTypeInput(workerProfile.priceType || 'fixed');
      setVisitChargeInput(String(workerProfile.visitCharge || '300'));
      setExperienceInput(workerProfile.experience || '3–5 years');
    }
  }, [workerProfile]);

  const toggleAvailability = async (newStatus: 'available' | 'off_today' | 'busy') => {
    if (!workerProfile) return;
    try {
      await api.updateWorkerAvailability(workerProfile.id, { availability: newStatus });
      await refreshUser();
    } catch (e) {
      console.error('Failed to toggle availability:', e);
    }
  };

  const handleBookingAction = async (bookingId: string, status: string, reason?: string) => {
    try {
      await api.updateBookingStatus(bookingId, status, reason);
      await loadWorkerData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const handleSendAdditionalCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeBookingId || !chargeAmount || !chargeReason) return;
    try {
      await api.requestAdditionalCharge(chargeBookingId, {
        amount: Number(chargeAmount),
        reason: chargeReason
      });
      setChargeBookingId(null);
      setChargeAmount('');
      setChargeReason('');
      await loadWorkerData();
      alert('Additional charge request sent to customer for approval!');
    } catch (e: any) {
      alert(e.message || 'Failed to submit additional charge');
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterJobId || !counterPrice) return;
    try {
      await api.submitJobOffer(counterJobId, {
        proposedPrice: Number(counterPrice),
        message: counterMessage || 'I am ready to perform this task with top quality.',
        estimatedArrival: 'Today within 1-2 hours'
      });
      setCounterJobId(null);
      setCounterPrice('');
      setCounterMessage('');
      await loadWorkerData();
      alert('Offer submitted successfully to the customer!');
    } catch (e: any) {
      alert(e.message || 'Failed to submit offer');
    }
  };

  // Profile Picture Upload Handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workerProfile) return;
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      try {
        await api.updateWorkerProfilePicture(workerProfile.id, base64);
        await refreshUser();
        setProfileSuccess('Profile picture updated successfully!');
        setTimeout(() => setProfileSuccess(''), 3000);
      } catch (err: any) {
        alert(err.message || 'Failed to update profile picture');
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove Profile Picture
  const handleRemovePhoto = async () => {
    if (!workerProfile) return;
    if (!confirm('Are you sure you want to remove your profile picture?')) return;
    try {
      await api.updateWorkerProfilePicture(workerProfile.id, '');
      await refreshUser();
      setProfileSuccess('Profile picture removed.');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to remove picture');
    }
  };

  // Save Allowed Profile Details
  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerProfile) return;
    setProfileSaving(true);
    setProfileSuccess('');
    try {
      await api.updateWorkerProfile(workerProfile.id, {
        about: aboutInput,
        startingPrice: priceTypeInput === 'discuss' ? null : Number(startingPriceInput),
        priceType: priceTypeInput,
        visitCharge: Number(visitChargeInput),
        experience: experienceInput
      });
      await refreshUser();
      setProfileSuccess('Profile information saved successfully!');
      setTimeout(() => setProfileSuccess(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Change Worker Password
  const handleChangeWorkerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changeMyPassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      setPasswordSuccess('Your password has been updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Document Re-upload
  const handleReuploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerProfile) return;
    setReuploadLoading(true);
    try {
      await api.workerReuploadDocuments(workerProfile.id, {
        cnicFrontUrl: reuploadFront || undefined,
        cnicBackUrl: reuploadBack || undefined,
        avatarUrl: reuploadAvatar || undefined
      });
      await refreshUser();
      setReuploadSuccess('Documents submitted for review! Admin has been notified.');
      setTimeout(() => {
        setShowReuploadModal(false);
        setReuploadSuccess('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit documents');
    } finally {
      setReuploadLoading(false);
    }
  };

  if (!workerProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-slate-800">Worker Profile Not Activated</h3>
        <p className="text-sm text-slate-500 mt-1">Please complete worker registration or contact FIRST STEP admin.</p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
        >
          Return Home
        </button>
      </div>
    );
  }

  const currentAvail = workerProfile.availability;
  const vStatus = workerProfile.verificationStatus;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* 1. PROMINENT VERIFICATION STATUS BANNER (Requirement 6) */}
      <div className="mb-6">
        {vStatus === 'pending' && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs uppercase tracking-wider bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-md">
                    Pending Verification
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-amber-950 mt-1">
                  Your Worker Application is Under Administrative Review
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Your credentials and CNIC are currently in queue for review by FIRST STEP Operations. Once verified, your profile will immediately go live on customer search.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-semibold text-amber-700 block">Typical review time: 1-2 hours</span>
            </div>
          </div>
        )}

        {vStatus === 'reupload_required' && (
          <div className="p-4 sm:p-5 rounded-3xl bg-orange-50 border border-orange-300 text-orange-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs uppercase tracking-wider bg-orange-200 text-orange-900 px-2 py-0.5 rounded-md">
                  Action Required: Re-upload Documents
                </span>
                <h4 className="text-sm sm:text-base font-bold text-orange-950 mt-1">
                  Admin Feedback: {workerProfile.verificationNote || 'Please provide clearer CNIC documents.'}
                </h4>
                <p className="text-xs text-orange-800 mt-0.5">
                  Click the button to upload replacement CNIC photos so our team can approve your profile immediately.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowReuploadModal(true)}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer shrink-0"
            >
              Re-upload CNIC Photos
            </button>
          </div>
        )}

        {vStatus === 'rejected' && (
          <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 shadow-xs flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 font-bold">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xs uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md">
                Application Rejected
              </span>
              <h4 className="text-sm sm:text-base font-bold text-rose-950 mt-1">
                Reason: {workerProfile.verificationNote || 'Verification requirements not fulfilled.'}
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                If you believe this is an error, please contact FIRST STEP Support Helpline at <strong>03209976716</strong>.
              </p>
            </div>
          </div>
        )}

        {vStatus === 'suspended' && (
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-100 border border-slate-300 text-slate-900 shadow-xs flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xs uppercase tracking-wider bg-slate-300 text-slate-800 px-2 py-0.5 rounded-md">
                Account Suspended
              </span>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                Your worker account has been suspended by Administration
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Contact FIRST STEP operations desk at 03209976716 to discuss account restoration.
              </p>
            </div>
          </div>
        )}

        {vStatus === 'verified' && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">
                NADRA Verified Pro Active: Your profile is 100% authenticated and accepting bookings.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
              VERIFIED
            </span>
          </div>
        )}
      </div>

      {/* Top Banner with One-Tap Availability Toggle */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-700 overflow-hidden shrink-0 border-2 border-teal-400 relative">
            {workerProfile.avatarUrl ? (
              <img src={workerProfile.avatarUrl} alt={workerProfile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-xl text-white">
                {workerProfile.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {workerProfile.name}
              </h2>
              {vStatus === 'verified' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  ✓ Verified Pro
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {workerProfile.city} ({workerProfile.area}) · {workerProfile.services.slice(0, 2).join(', ')}
            </p>
            <div className="flex items-center gap-3 text-xs mt-2">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{workerProfile.rating}</span>
                <span className="text-slate-400 font-normal">({workerProfile.reviewCount} reviews)</span>
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-medium">
                {workerProfile.completedJobsCount} jobs completed
              </span>
            </div>
          </div>
        </div>

        {/* Quick Availability Switch Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Status:</span>
          <div className="inline-flex p-1 rounded-2xl bg-slate-800 border border-slate-700">
            <button
              onClick={() => toggleAvailability('available')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                currentAvail === 'available'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Available</span>
            </button>

            <button
              onClick={() => toggleAvailability('off_today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                currentAvail === 'off_today'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Off Today</span>
            </button>

            <button
              onClick={() => toggleAvailability('busy')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                currentAvail === 'busy'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Busy on Job</span>
            </button>
          </div>
        </div>
      </div>

      {/* Large Graphical Dashboard Buttons (Section 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`p-4 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[90px] ${
            activeTab === 'bookings'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400 hover:bg-teal-50/30'
          }`}
        >
          <Calendar className="w-6 h-6 mb-1.5" />
          <span className="text-xs sm:text-sm font-bold">My Bookings</span>
          <span className="text-[11px] opacity-80 mt-0.5">{bookings.length} Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('custom_jobs')}
          className={`p-4 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[90px] ${
            activeTab === 'custom_jobs'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400 hover:bg-teal-50/30'
          }`}
        >
          <Megaphone className="w-6 h-6 mb-1.5" />
          <span className="text-xs sm:text-sm font-bold">Custom Jobs</span>
          <span className="text-[11px] opacity-80 mt-0.5">{openJobs.length} Available</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`p-4 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[90px] ${
            activeTab === 'earnings'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400 hover:bg-teal-50/30'
          }`}
        >
          <DollarSign className="w-6 h-6 mb-1.5" />
          <span className="text-xs sm:text-sm font-bold">My Earnings</span>
          <span className="text-[11px] opacity-80 mt-0.5">PKR {earnings?.releasedEarnings.toLocaleString() || '0'}</span>
        </button>

        {/* Dedicated Profile & Security Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`p-4 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[90px] ${
            activeTab === 'profile'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400 hover:bg-teal-50/30'
          }`}
        >
          <User className="w-6 h-6 mb-1.5" />
          <span className="text-xs sm:text-sm font-bold">Profile &amp; Photo</span>
          <span className="text-[11px] opacity-80 mt-0.5">Edit Details</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`p-4 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[90px] ${
            activeTab === 'portfolio'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400 hover:bg-teal-50/30'
          }`}
        >
          <Image className="w-6 h-6 mb-1.5" />
          <span className="text-xs sm:text-sm font-bold">My Portfolio</span>
          <span className="text-[11px] opacity-80 mt-0.5">Work Photos</span>
        </button>

        <button
          onClick={() => onNavigate('support')}
          className="p-4 rounded-2xl border border-slate-200 bg-white text-slate-800 hover:border-teal-400 hover:bg-teal-50/30 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[90px]"
        >
          <HelpCircle className="w-6 h-6 mb-1.5 text-teal-600" />
          <span className="text-xs sm:text-sm font-bold">Worker Support</span>
          <span className="text-[11px] text-slate-400 mt-0.5">03209976716</span>
        </button>
      </div>

      {/* Hidden file and camera inputs for profile picture */}
      <input
        type="file"
        ref={fileUploadRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Tab: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-slate-900">Assigned Bookings</h3>
            <span className="text-xs text-slate-500">Live order lifecycle updates</span>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">No bookings yet</p>
              <p className="text-xs text-slate-500 mt-1">Keep your status "Available" to receive customer requests.</p>
            </div>
          ) : (
            bookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-xs font-mono text-slate-400">Order #{booking.id}</span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{booking.serviceName}</h4>
                    <p className="text-xs text-slate-500">{booking.categoryName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize w-fit ${
                    booking.status === 'requested' ? 'bg-amber-100 text-amber-800' :
                    booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'payment_verified' ? 'bg-emerald-100 text-emerald-800' :
                    booking.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {booking.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Customer:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{booking.customerName}</p>
                    <p className="text-slate-500">{booking.customerMobile}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Address:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{booking.area}, {booking.city}</p>
                    <p className="text-slate-500 line-clamp-1">{booking.address}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Schedule:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{booking.bookingDate}</p>
                    <p className="text-slate-500">{booking.bookingTime}</p>
                  </div>
                </div>

                {/* Additional Charges display */}
                {booking.additionalCharges && booking.additionalCharges.length > 0 && (
                  <div className="my-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900">Additional Charges:</span>
                    {booking.additionalCharges.map(ch => (
                      <div key={ch.id} className="flex justify-between mt-1 text-slate-700">
                        <span>{ch.reason}</span>
                        <span className="font-bold">PKR {ch.amount} ({ch.status})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChat(booking.id, booking.customerId, booking.customerName)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                      <span>Chat Customer</span>
                    </button>

                    <button
                      onClick={() => setChargeBookingId(booking.id)}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Request Extra Charge</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {booking.status === 'requested' && (
                      <>
                        <button
                          onClick={() => handleBookingAction(booking.id, 'cancelled', 'Worker unavailable')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleBookingAction(booking.id, 'accepted')}
                          className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                        >
                          Accept Booking
                        </button>
                      </>
                    )}

                    {booking.status === 'payment_verified' && (
                      <button
                        onClick={() => handleBookingAction(booking.id, 'completed')}
                        className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs"
                      >
                        Mark Job Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Custom Jobs */}
      {activeTab === 'custom_jobs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-slate-900">Custom Jobs in {workerProfile.city}</h3>
            <span className="text-xs text-slate-500">Send offers and propose your rate</span>
          </div>

          {openJobs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">No open custom jobs in your area</p>
              <p className="text-xs text-slate-500 mt-1">Check back soon when customers post special tasks.</p>
            </div>
          ) : (
            openJobs.map(job => (
              <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-teal-700 uppercase">{job.categoryName}</span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{job.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{job.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Customer Budget</span>
                    <p className="text-lg font-black text-slate-900 tabular-nums">PKR {job.budget.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500">
                    <span>{job.area}, {job.city}</span>
                    <span className="mx-2">·</span>
                    <span className="capitalize font-semibold text-rose-600">{job.urgency} Priority</span>
                  </div>

                  <button
                    onClick={() => {
                      setCounterJobId(job.id);
                      setCounterPrice(String(job.budget));
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Counter Offer</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Earnings */}
      {activeTab === 'earnings' && earnings && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400">Total Net Earnings</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                PKR {earnings.totalEarnings.toLocaleString()}
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400">Released to You</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
                PKR {earnings.releasedEarnings.toLocaleString()}
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400">Pending Release</span>
              <h3 className="text-2xl font-black text-amber-600 mt-1 tabular-nums">
                PKR {earnings.pendingEarnings.toLocaleString()}
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400">Company Commission</span>
              <h3 className="text-2xl font-black text-slate-500 mt-1 tabular-nums">
                PKR {earnings.totalCommissionPaid.toLocaleString()}
              </h3>
            </div>
          </div>

          {/* Payout History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h4 className="text-base font-bold text-slate-900 mb-4">Payout Transaction History</h4>
            {earnings.payoutHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No completed payouts yet.</p>
            ) : (
              <div className="space-y-3">
                {earnings.payoutHistory.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">Booking #{p.bookingId}</p>
                      <p className="text-slate-400">Customer Paid: PKR {p.customerPayment} · Commission: PKR {p.commission}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-700 text-sm">PKR {p.netPayout.toLocaleString()}</p>
                      <span className="text-[10px] font-bold uppercase text-slate-500">{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Profile & Photo & Worker Security (Requirements 4, 5, and 3) */}
      {activeTab === 'profile' && (
        <div className="space-y-8 max-w-4xl">
          {profileSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {/* Section 5: WORKER PROFILE PICTURE MANAGEMENT */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Worker Profile Picture</h3>
                <p className="text-xs text-slate-500">
                  Upload, take photo using your camera, change, or remove your photo. Shown to customers upon booking.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-28 h-28 rounded-3xl border-2 border-teal-500 overflow-hidden bg-slate-100 flex items-center justify-center relative shadow-sm shrink-0">
                {workerProfile.avatarUrl ? (
                  <img src={workerProfile.avatarUrl} alt={workerProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-3xl font-black text-slate-400">
                    {workerProfile.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="space-y-3 text-center sm:text-left">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {/* Upload Profile Picture */}
                  <button
                    type="button"
                    onClick={() => fileUploadRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Profile Picture</span>
                  </button>

                  {/* Take Photo using phone camera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>

                  {/* Remove Profile Picture */}
                  {workerProfile.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Supported formats: JPG, PNG, WEBP. A professional, clear face photo significantly increases customer bookings.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: ALLOWED PROFILE INFORMATION EDITING */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Allowed Profile Information</h3>
                <p className="text-xs text-slate-500">
                  Update your rates, experience, and service details. Admin controls remain strictly protected.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfileDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={workerProfile.name}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs sm:text-sm cursor-not-allowed"
                    title="Name registered with CNIC"
                  />
                  <span className="text-[10px] text-slate-400">Verified against NADRA CNIC records.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Mobile Number</label>
                  <input
                    type="text"
                    disabled
                    value={workerProfile.mobile}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs sm:text-sm cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400">Used for customer dispatch &amp; SMS alerts.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience</label>
                  <select
                    value={experienceInput}
                    onChange={e => setExperienceInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  >
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1–3 years">1–3 years</option>
                    <option value="3–5 years">3–5 years</option>
                    <option value="5–10 years">5–10 years</option>
                    <option value="10+ years">10+ years Master Craftsman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rate Structure</label>
                  <select
                    value={priceTypeInput}
                    onChange={e => setPriceTypeInput(e.target.value as 'fixed' | 'discuss')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  >
                    <option value="fixed">Fixed Starting Rate</option>
                    <option value="discuss">Discuss on Phone / Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {priceTypeInput === 'fixed' ? 'Starting Price (PKR)' : 'Estimated Inspection (PKR)'}
                  </label>
                  <input
                    type="number"
                    value={startingPriceInput}
                    onChange={e => setStartingPriceInput(e.target.value)}
                    disabled={priceTypeInput === 'discuss'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Home Visit Inspection Charge (PKR)
                </label>
                <input
                  type="number"
                  required
                  value={visitChargeInput}
                  onChange={e => setVisitChargeInput(e.target.value)}
                  className="w-full max-w-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Charged if customer inspects but declines repair.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  About Your Experience &amp; Specialization (تعارف)
                </label>
                <textarea
                  rows={3}
                  value={aboutInput}
                  onChange={e => setAboutInput(e.target.value)}
                  placeholder="Describe your skills, tools, and past service track record..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Section 3: WORKER ACCOUNT PASSWORD SECURITY */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Worker Password Security</h3>
                <p className="text-xs text-slate-500">
                  Manage your personal worker account credentials. Strictly separate from Administrative systems.
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangeWorkerPassword} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                {passwordLoading ? 'Updating Password...' : 'Change Worker Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Portfolio */}
      {activeTab === 'portfolio' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h4 className="text-base font-bold text-slate-900">Your Work Portfolio</h4>
          <p className="text-xs text-slate-500">Photos of completed installations and repair work build customer trust.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {workerProfile.portfolio.map(item => (
              <div key={item.id} className="rounded-xl overflow-hidden border border-slate-200 aspect-square">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Re-upload Documents Modal */}
      {showReuploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-4 my-8 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-lg font-bold text-slate-900">Re-upload CNIC &amp; Verification Documents</h4>
              <button onClick={() => setShowReuploadModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {reuploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold">
                {reuploadSuccess}
              </div>
            )}

            <form onSubmit={handleReuploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CNIC Front Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = ev => setReuploadFront(ev.target?.result as string);
                    r.readAsDataURL(file);
                  }}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CNIC Back Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = ev => setReuploadBack(ev.target?.result as string);
                    r.readAsDataURL(file);
                  }}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReuploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reuploadLoading}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold"
                >
                  {reuploadLoading ? 'Uploading...' : 'Submit Documents for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Additional Charge Modal */}
      {chargeBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900 mb-2">Request Additional Charge</h4>
            <p className="text-xs text-slate-500 mb-4">
              Enter extra cost for spare parts or extended labor. Customer must approve before it is added to the booking.
            </p>
            <form onSubmit={handleSendAdditionalCharge} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Amount (PKR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={chargeAmount}
                  onChange={e => setChargeAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Description *</label>
                <textarea
                  required
                  placeholder="e.g. Replacement PPRC 1/2-inch valve purchased from market"
                  value={chargeReason}
                  onChange={e => setChargeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChargeBookingId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900 mb-2">Submit Job Offer / Counter</h4>
            <form onSubmit={handleSendOffer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Proposed Price (PKR) *</label>
                <input
                  type="number"
                  required
                  value={counterPrice}
                  onChange={e => setCounterPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message to Customer</label>
                <textarea
                  rows={3}
                  placeholder="Tell customer when you can arrive and what tools you have..."
                  value={counterMessage}
                  onChange={e => setCounterMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCounterJobId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                >
                  Submit Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
