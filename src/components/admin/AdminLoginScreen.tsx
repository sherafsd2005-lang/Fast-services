import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Shield, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';

interface AdminLoginScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onSuccess,
  onCancel
}) => {
  const { adminLogin, refreshUser } = useAuth();
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);

  // Recovery State
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Admin password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await adminLogin(identifier, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Incorrect Admin password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (newPassword.length < 6) {
      setRecoveryError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError('New password and confirm password do not match.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await api.adminRecoverPassword({
        identifier,
        recoveryKey,
        newPassword,
        confirmPassword
      });
      localStorage.setItem('firststep_token', res.token);
      await refreshUser();
      setRecoverySuccess('Admin password successfully reset! Unlocking Admin Dashboard...');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setRecoveryError(err.message || 'Failed to recover admin access. Verify recovery key.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-purple-900/50 shadow-2xl p-6 sm:p-8 relative">
        {/* Back Link */}
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Marketplace</span>
        </button>

        {/* Top Lock Badge */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold uppercase tracking-wider">
            Protected Admin Section
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-2">
            FIRST STEP Admin Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Admin password authentication is required to access the Admin Dashboard
          </p>
        </div>

        {/* Normal Login Mode */}
        {!showRecovery ? (
          <>
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-950/70 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Access Denied:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Admin Email or Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin or admin@firststep.pk"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Admin Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowRecovery(true); setError(''); }}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Enter Admin Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-purple-200">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Administrative Security Rules:</span>
                </p>
                <p>• Correct password must be provided before entering the dashboard.</p>
                <p>• Customer and Worker accounts are strictly prevented from entering.</p>
                <p>• After logout, Admin password will be required again.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-purple-900/40 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Authenticating Admin...' : 'Authenticate & Open Admin Dashboard'}</span>
              </button>
            </form>
          </>
        ) : (
          /* Emergency Recovery Mode */
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-800/50 text-xs text-purple-200">
              <span className="font-bold block text-sm mb-0.5">Admin Password Recovery</span>
              Enter your administrative identifier, master recovery key, and choose your new admin password.
            </div>

            {recoveryError && (
              <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{recoverySuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecoverySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Admin Identifier
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Recovery Security Key *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Master administrative recovery key"
                  value={recoveryKey}
                  onChange={e => setRecoveryKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  New Admin Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecovery(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-md"
                >
                  {recoveryLoading ? 'Verifying...' : 'Reset & Log In'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
