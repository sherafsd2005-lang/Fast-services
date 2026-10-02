import React, { useState, useEffect } from 'react';
import { Booking, CustomJob, WorkerProfile, AppNotification } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Star,
  CreditCard,
  Heart,
  Bell,
  HelpCircle,
  User as UserIcon,
  Search,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface CustomerDashboardProps {
  onNavigate: (view: string) => void;
  onOpenBookingPayment: (booking: Booking) => void;
  onOpenReview: (booking: Booking) => void;
  onOpenDispute: (booking: Booking) => void;
  onOpenChat: (bookingId?: string, recipientId?: string, recipientName?: string) => void;
  onBookAgain: (workerId: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onNavigate,
  onOpenBookingPayment,
  onOpenReview,
  onOpenDispute,
  onOpenChat,
  onBookAgain
}) => {
  const { user } = useAuth();
  const { isUrdu } = useLanguage();
  const [activeTab, setActiveTab] = useState<'bookings' | 'jobs' | 'favorites' | 'notifications' | 'profile'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customJobs, setCustomJobs] = useState<CustomJob[]>([]);
  const [favorites, setFavorites] = useState<WorkerProfile[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Customer Password Change State (Requirement 3: Customer manages ONLY their own credentials)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirm password do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      await api.changeMyPassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      setPwdSuccess('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err: any) {
      setPwdError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bks, cJobs, favs, notifs] = await Promise.all([
        api.getBookings(),
        api.getCustomJobs(),
        api.getFavorites(),
        api.getNotifications()
      ]);
      setBookings(bks);
      setCustomJobs(cJobs.filter(j => j.customerId === user?.id));
      setFavorites(favs);
      setNotifications(notifs);
    } catch (e) {
      console.error('Failed to load customer dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleConfirmCompletion = async (booking: Booking) => {
    setActionLoading(booking.id);
    try {
      await api.updateBookingStatus(booking.id, 'customer_confirmed');
      await fetchData();
      onOpenReview(booking);
    } catch (e: any) {
      alert(e.message || 'Failed to confirm job completion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChargeResponse = async (bookingId: string, chargeId: string, status: 'approved' | 'rejected') => {
    try {
      await api.respondAdditionalCharge(bookingId, chargeId, status);
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
            Customer Account Dashboard
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Manage your service appointments, payments, custom jobs and trusted workers
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('categories')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>Find a Service</span>
          </button>
          <button
            onClick={() => onNavigate('post_job')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a Job</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Bookings ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'jobs'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>My Custom Jobs ({customJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Favorite Workers ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications ({notifications.filter(n => !n.isRead).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile &amp; Password</span>
        </button>

        <button
          onClick={() => onNavigate('support')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help &amp; Disputes</span>
        </button>
      </div>

      {/* Tab: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No bookings yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Explore 50+ services to book your first verified plumber, electrician or cleaning pro.
              </p>
              <button
                onClick={() => onNavigate('categories')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm"
              >
                Browse Services
              </button>
            </div>
          ) : (
            bookings.map((booking) => {
              const pendingCharges = booking.additionalCharges.filter(c => c.status === 'pending');

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">#{booking.id}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">{booking.categoryName}</span>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                        {booking.serviceName}
                      </h4>
                    </div>

                    {/* Status Pill Indicator */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        booking.status === 'customer_confirmed' || booking.status === 'payout_released'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : booking.status === 'payment_verified' || booking.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : booking.status === 'payment_submitted'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : booking.status === 'payment_pending'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {booking.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Assigned Worker:</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{booking.workerName}</p>
                      <p className="text-slate-500">{booking.workerMobile}</p>
                    </div>

                    <div>
                      <span className="text-slate-400">Schedule:</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{booking.bookingDate}</p>
                      <p className="text-slate-500">{booking.bookingTime}</p>
                    </div>

                    <div>
                      <span className="text-slate-400">Location:</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{booking.area}, {booking.city}</p>
                      <p className="text-slate-500 line-clamp-1">{booking.address}</p>
                    </div>
                  </div>

                  {/* Additional Charge Alerts */}
                  {pendingCharges.length > 0 && (
                    <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Worker Requested Additional Payment:</span>
                      </div>
                      {pendingCharges.map(charge => (
                        <div key={charge.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-2 border-t border-amber-200/60">
                          <div>
                            <span className="font-bold text-amber-950">PKR {charge.amount.toLocaleString()}</span>
                            <span className="text-amber-800 ml-2">Reason: {charge.reason}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleChargeResponse(booking.id, charge.id, 'approved')}
                              className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                            >
                              Approve PKR {charge.amount}
                            </button>
                            <button
                              onClick={() => handleChargeResponse(booking.id, charge.id, 'rejected')}
                              className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Amount:</span>
                      <span className="text-base font-extrabold text-slate-900 tabular-nums">
                        PKR {booking.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Pay Button */}
                      {booking.status === 'payment_pending' && (
                        <button
                          onClick={() => onOpenBookingPayment(booking)}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay to FIRST STEP (PKR {booking.totalAmount})</span>
                        </button>
                      )}

                      {/* Confirm Completion Button */}
                      {booking.status === 'completed' && (
                        <button
                          disabled={actionLoading === booking.id}
                          onClick={() => handleConfirmCompletion(booking)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Satisfactory Completion</span>
                        </button>
                      )}

                      {/* Review Worker Button */}
                      {booking.status === 'customer_confirmed' && (
                        <button
                          onClick={() => onOpenReview(booking)}
                          className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Rate &amp; Review</span>
                        </button>
                      )}

                      {/* Chat with Worker */}
                      <button
                        onClick={() => onOpenChat(booking.id, booking.workerId, booking.workerName)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>

                      {/* Book Again */}
                      <button
                        onClick={() => onBookAgain(booking.workerId)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Book Again</span>
                      </button>

                      {/* Report / Dispute */}
                      <button
                        onClick={() => onOpenDispute(booking)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Submit Dispute / Problem"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Custom Jobs */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-base font-bold text-slate-900">Your Posted Custom Jobs</h4>
            <button
              onClick={() => onNavigate('post_job')}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Post New Job</span>
            </button>
          </div>

          {customJobs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <PlusCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No custom jobs posted yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Post specific tasks with your own budget to receive competitive worker bids.
              </p>
            </div>
          ) : (
            customJobs.map(job => (
              <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-teal-700 uppercase">{job.categoryName}</span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{job.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{job.description}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 capitalize">
                    {job.status}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Budget: </span>
                    <span className="font-extrabold text-slate-900">PKR {job.budget.toLocaleString()}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-500">{job.city} ({job.area})</span>
                  </div>
                  <button
                    onClick={() => onNavigate(`job_offers_${job.id}`)}
                    className="font-bold text-teal-600 hover:underline"
                  >
                    View Offers ({job.offersCount || 0})
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favorites.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No favorite workers yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Save reliable workers to easily rebook them in the future.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map(worker => (
                <div key={worker.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      {worker.avatarUrl ? (
                        <img src={worker.avatarUrl} alt={worker.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                          {worker.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{worker.name}</h4>
                      <p className="text-xs text-slate-500">{worker.city} · {worker.experience}</p>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500 mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{worker.rating}</span>
                        <span className="text-slate-400">({worker.reviewCount})</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      From PKR {worker.startingPrice ? worker.startingPrice.toLocaleString() : 'Discussion'}
                    </span>
                    <button
                      onClick={() => onBookAgain(worker.id)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition"
                    >
                      Book Again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No new notifications</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900">{n.title}</h5>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Profile & Password Security (Requirement 3: Customer manages ONLY their own credentials) */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-2xl">
          {/* Account Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h4 className="text-base font-bold text-slate-900 mb-4">Customer Account Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Full Name</span>
                <span className="font-bold text-slate-800 text-sm">{user?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Registered Mobile</span>
                <span className="font-bold text-slate-800 text-sm">{user?.mobile}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email</span>
                <span className="font-bold text-slate-800 text-sm">{user?.email || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-bold text-slate-800 text-sm">{user?.city} ({user?.area})</span>
              </div>
            </div>
          </div>

          {/* Change Customer Password */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h4 className="text-base font-bold text-slate-900 mb-1">Change Account Password</h4>
            <p className="text-xs text-slate-500 mb-4">
              Update your personal login password. Stored securely with salted cryptographic hashing.
            </p>

            {pwdError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
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
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-0.5">Role Isolation Notice:</span>
                Customer accounts have access strictly to their personal bookings and profile. Administrative controls and worker verification tools are restricted to authorized FIRST STEP staff.
              </div>

              <button
                type="submit"
                disabled={pwdLoading}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                {pwdLoading ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
