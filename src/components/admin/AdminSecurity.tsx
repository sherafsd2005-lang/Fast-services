import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, Key, History, UserCheck, ShieldAlert } from 'lucide-react';

export const AdminSecurity: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadAuditLogs = async () => {
    try {
      const logs = await api.adminGetAuditLogs();
      setAuditLogs(logs.slice(0, 8));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminChangePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      // Immediately update local storage token so this session continues uninterrupted with fresh token
      localStorage.setItem('firststep_token', res.token);
      setSuccess('Admin password changed successfully! Your old password has been invalidated immediately, and a fresh salted cryptographic hash has been committed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await loadAuditLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to change admin password. Verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Change Admin Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Change Admin Password</h3>
            <p className="text-xs text-slate-500">
              Only authorized Administrators can modify the primary admin credentials
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              required
              placeholder="Enter current admin password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Password *
            </label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
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
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-950 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-purple-900">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>Password Security Enforcement Rules:</span>
            </p>
            <p>• Old password will immediately cease to function across all devices.</p>
            <p>• New password will be immediately effective for all subsequent logins.</p>
            <p>• Stored with salted PBKDF2 SHA-512 cryptographic one-way hashing (never plaintext).</p>
            <p>• Customers and Workers cannot access this endpoint; unauthorized calls yield HTTP 403.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            {loading ? 'Validating & Hashing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Active Session & Privilege Verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC)</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strict separation guarantees that Customer and Worker tokens cannot invoke administrative endpoints, change admin settings, or view identity records.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Admin Account</span>
              <span className="font-bold text-slate-800">FIRST STEP Central Admin</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Session Status</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                Active Authenticated Session
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Worker / Customer Access</span>
              <span className="text-rose-600 font-bold text-[10px]">Strictly Blocked</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-purple-600" />
            <h4 className="text-sm font-bold text-slate-900">Recent Security Audit Logs</h4>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Real-time audit log of administrative actions, logins, and verifications.
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400">No logs recorded yet.</p>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
