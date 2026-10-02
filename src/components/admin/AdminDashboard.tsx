import React, { useState, useEffect } from 'react';
import { Category, AppSettings } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AdminWorkers } from './AdminWorkers';
import { AdminCategories } from './AdminCategories';
import { AdminPayments } from './AdminPayments';
import { AdminPaymentSettings } from './AdminPaymentSettings';
import { AdminPosters } from './AdminPosters';
import { AdminSecurity } from './AdminSecurity';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminLoginScreen } from './AdminLoginScreen';
import {
  Users,
  Wrench,
  Calendar,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Star,
  AlertTriangle,
  Plus,
  Shield,
  Settings,
  Lock,
  Layers,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Phone,
  RefreshCw,
  LogOut,
  KeyRound
} from 'lucide-react';

interface AdminDashboardProps {
  categories: Category[];
  onRefreshCategories: () => void;
  contactNumber: string;
  onUpdateContactNumber: (newNumber: string) => void;
  onLogoutAdmin?: () => void;
  onNavigate?: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  categories,
  onRefreshCategories,
  contactNumber,
  onUpdateContactNumber,
  onLogoutAdmin,
  onNavigate
}) => {
  const { user, isAdmin, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'categories' | 'payments' | 'payment_settings' | 'posters' | 'disputes' | 'security' | 'audit_logs' | 'settings'>('overview');

  // Strict role guard: Admin password authentication required before entering
  // The Admin Dashboard must NEVER open without correct authentication.
  if (!isAdmin) {
    return (
      <AdminLoginScreen
        onSuccess={() => {
          setActiveTab('overview');
        }}
        onCancel={() => {
          if (onLogoutAdmin) onLogoutAdmin();
          else if (onNavigate) onNavigate('home');
          else window.location.href = '/';
        }}
      />
    );
  }

  // Admin Settings Password Change State
  const [adminCurrPassword, setAdminCurrPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPwdLoading, setAdminPwdLoading] = useState(false);
  const [adminPwdSuccess, setAdminPwdSuccess] = useState('');
  const [adminPwdError, setAdminPwdError] = useState('');

  const handleAdminSettingsPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPwdError('');
    setAdminPwdSuccess('');

    if (adminNewPassword.length < 6) {
      setAdminPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      setAdminPwdError('New password and confirm password do not match.');
      return;
    }

    setAdminPwdLoading(true);
    try {
      const res = await api.adminChangePassword({
        currentPassword: adminCurrPassword,
        newPassword: adminNewPassword,
        confirmPassword: adminConfirmPassword
      });
      localStorage.setItem('firststep_token', res.token);
      await refreshUser();
      setAdminPwdSuccess('Admin password successfully changed! The new password is active and saved permanently.');
      setAdminCurrPassword('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      setTimeout(() => setAdminPwdSuccess(''), 4000);
    } catch (err: any) {
      setAdminPwdError(err.message || 'Failed to change admin password. Please check your current password.');
    } finally {
      setAdminPwdLoading(false);
    }
  };

  const [stats, setStats] = useState<{
    customersCount: number;
    workersCount: number;
    activeBookings: number;
    completedJobs: number;
    totalRevenue: number;
    pendingPayments: number;
    pendingPayouts: number;
    reviewsCount: number;
  } | null>(null);

  const [needsAttention, setNeedsAttention] = useState<{
    pendingWorkers: any[];
    pendingCnics: any[];
    pendingPayments: any[];
    openDisputes: any[];
    pendingRefunds: any[];
  } | null>(null);

  const [disputes, setDisputes] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [newHelpline, setNewHelpline] = useState(contactNumber);
  const [commissionInput, setCommissionInput] = useState('10');
  const [announcementInput, setAnnouncementInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [st, na, dispList, sets] = await Promise.all([
        api.adminGetStats(),
        api.adminGetNeedsAttention(),
        api.getDisputes(),
        api.getSettings()
      ]);
      setStats(st);
      setNeedsAttention(na);
      setDisputes(dispList);
      setAppSettings(sets);
      setNewHelpline(sets.contactNumber || contactNumber);
      setCommissionInput(String(sets.defaultCommissionPercent || 10));
      setAnnouncementInput(sets.announcementText || '');
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.adminUpdateSettings({
        contactNumber: newHelpline,
        defaultCommissionPercent: Number(commissionInput),
        announcementText: announcementInput
      });
      setAppSettings(updated);
      onUpdateContactNumber(newHelpline);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to update settings');
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    const resolution = prompt('Enter resolution statement:');
    if (!resolution) return;
    try {
      await api.adminResolveDispute(disputeId, {
        status: 'resolved',
        resolution
      });
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-purple-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold uppercase tracking-wider">
              Central Operations Admin
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            FIRST STEP Command Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real database metrics, worker verification, payment clearing, and company controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stats</span>
          </button>
          <button
            onClick={() => {
              logout();
              if (onLogoutAdmin) onLogoutAdmin();
            }}
            className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Sign out of Admin Dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('workers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'workers'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Worker Verification</span>
          {needsAttention?.pendingWorkers && needsAttention.pendingWorkers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px]">
              {needsAttention.pendingWorkers.length} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Verify Payments &amp; Payouts</span>
        </button>

        <button
          onClick={() => setActiveTab('payment_settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'payment_settings'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Payment Methods Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('posters')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'posters'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Hero Posters</span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'disputes'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Disputes ({disputes.filter(d => d.status === 'open').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'security'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Admin Security</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'audit_logs'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* Top 8 Cards (Section 28) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">👥 Customers</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tabular-nums">
                {stats.customersCount}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">🧑‍🔧 Workers</span>
              <p className="text-2xl sm:text-3xl font-black text-teal-700 mt-1 tabular-nums">
                {stats.workersCount}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">📋 Active Orders</span>
              <p className="text-2xl sm:text-3xl font-black text-blue-700 mt-1 tabular-nums">
                {stats.activeBookings}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">✅ Completed Jobs</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 tabular-nums">
                {stats.completedJobs}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">💰 Verified Revenue</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tabular-nums">
                PKR {stats.totalRevenue.toLocaleString()}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">💳 Pending Payments</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 tabular-nums">
                {stats.pendingPayments}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">💵 Worker Payouts</span>
              <p className="text-2xl sm:text-3xl font-black text-teal-700 mt-1 tabular-nums">
                PKR {stats.pendingPayouts.toLocaleString()}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">⭐ Customer Reviews</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-500 mt-1 tabular-nums">
                {stats.reviewsCount}
              </p>
            </div>
          </div>

          {/* Admin Needs Attention (Section 30) */}
          {needsAttention && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-amber-950">Needs Administrative Attention:</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setActiveTab('workers')}
                  className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition"
                >
                  <span className="text-xs text-slate-500">Pending CNIC &amp; Worker Reviews</span>
                  <p className="text-xl font-extrabold text-amber-800 mt-0.5">
                    {needsAttention.pendingWorkers.length + needsAttention.pendingCnics.length}
                  </p>
                  <span className="text-[11px] text-teal-700 font-bold mt-1 inline-block">Review Workers →</span>
                </div>

                <div
                  onClick={() => setActiveTab('payments')}
                  className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition"
                >
                  <span className="text-xs text-slate-500">Unverified Customer Payments</span>
                  <p className="text-xl font-extrabold text-amber-800 mt-0.5">
                    {needsAttention.pendingPayments.length}
                  </p>
                  <span className="text-[11px] text-teal-700 font-bold mt-1 inline-block">Verify Payments →</span>
                </div>

                <div
                  onClick={() => setActiveTab('disputes')}
                  className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition"
                >
                  <span className="text-xs text-slate-500">Open Service Disputes</span>
                  <p className="text-xl font-extrabold text-amber-800 mt-0.5">
                    {needsAttention.openDisputes.length}
                  </p>
                  <span className="text-[11px] text-teal-700 font-bold mt-1 inline-block">Manage Disputes →</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Shortcuts (Section 29) */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Quick Administrative Actions
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab('workers')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-500 hover:shadow-xs transition text-left cursor-pointer"
              >
                <Plus className="w-5 h-5 text-teal-600 mb-1" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">Add Worker</span>
                <span className="text-[11px] text-slate-400">Onboard staff manually</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-500 hover:shadow-xs transition text-left cursor-pointer"
              >
                <Plus className="w-5 h-5 text-teal-600 mb-1" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">Add Category</span>
                <span className="text-[11px] text-slate-400">Expand marketplace services</span>
              </button>

              <button
                onClick={() => setActiveTab('payment_settings')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-500 hover:shadow-xs transition text-left cursor-pointer"
              >
                <DollarSign className="w-5 h-5 text-teal-600 mb-1" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">Payment Accounts</span>
                <span className="text-[11px] text-slate-400">Meezan, Raast, Easypaisa</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 hover:shadow-xs transition text-left cursor-pointer"
              >
                <Lock className="w-5 h-5 text-purple-600 mb-1" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">Security &amp; Passwords</span>
                <span className="text-[11px] text-slate-400">Change Admin credentials</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKERS TAB */}
      {activeTab === 'workers' && (
        <AdminWorkers categories={categories} />
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <AdminCategories categories={categories} onRefresh={onRefreshCategories} />
      )}

      {/* PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <AdminPayments />
      )}

      {/* PAYMENT SETTINGS TAB */}
      {activeTab === 'payment_settings' && (
        <AdminPaymentSettings />
      )}

      {/* POSTERS TAB */}
      {activeTab === 'posters' && (
        <AdminPosters categories={categories} />
      )}

      {/* DISPUTES TAB */}
      {activeTab === 'disputes' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Support &amp; Dispute Resolutions</h3>
          <p className="text-xs text-slate-500">Manage reported customer and worker disagreements</p>
          {disputes.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No open disputes reported.</p>
          ) : (
            <div className="space-y-3">
              {disputes.map(d => (
                <div key={d.id} className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold text-rose-600 uppercase">
                        {d.issueType.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        Booking #{d.bookingId} — Raised by {d.raisedByName} ({d.raisedByRole})
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 capitalize">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">{d.description}</p>
                  {d.resolution && (
                    <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl font-medium">
                      Resolution: {d.resolution}
                    </p>
                  )}
                  {d.status === 'open' && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleResolveDispute(d.id)}
                        className="px-4 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold"
                      >
                        Resolve Dispute
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <AdminSecurity />
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'audit_logs' && (
        <AdminAuditLogs />
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          {/* Card 1: Platform Settings & Helpline */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Platform Settings &amp; Helpline</h3>
                <p className="text-xs text-slate-500">
                  Update the official customer helpline and default commission rates
                </p>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Settings updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Helpline Number *
                </label>
                <input
                  type="text"
                  required
                  value={newHelpline}
                  onChange={e => setNewHelpline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold font-mono focus:ring-2 focus:ring-teal-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Displayed in header, contact section, support screens, and booking invoices.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default FIRST STEP Commission Rate (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  required
                  value={commissionInput}
                  onChange={e => setCommissionInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Homepage Announcement Banner (Optional)
                </label>
                <textarea
                  rows={2}
                  value={announcementInput}
                  onChange={e => setAnnouncementInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                Save Platform Settings
              </button>
            </form>
          </div>

          {/* Card 2: Change Admin Password inside Admin Settings */}
          <div className="bg-white rounded-3xl border border-purple-200 p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Change Admin Password</h3>
                <p className="text-xs text-slate-500">
                  Update primary administrative credentials. Effective immediately.
                </p>
              </div>
            </div>

            {adminPwdError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adminPwdError}</span>
              </div>
            )}

            {adminPwdSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{adminPwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAdminSettingsPasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Admin Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={adminCurrPassword}
                  onChange={e => setAdminCurrPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Admin Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={adminNewPassword}
                  onChange={e => setAdminNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={adminConfirmPassword}
                  onChange={e => setAdminConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-700" />
                  <span>Password Security Guarantee:</span>
                </p>
                <p>• Old password will immediately stop working.</p>
                <p>• New password will be required upon next login and after logout.</p>
                <p>• Saved permanently in database with salted PBKDF2 hash.</p>
              </div>

              <button
                type="submit"
                disabled={adminPwdLoading}
                className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                {adminPwdLoading ? 'Verifying & Saving...' : 'Change Admin Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
