import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Shield, Lock, Phone, User as UserIcon, X, AlertCircle, CheckCircle2, KeyRound, Wrench } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'admin';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess
}) => {
  const { login, adminLogin, register } = useAuth();
  const { isUrdu } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register' | 'admin' | 'admin_forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Karachi');
  const [area, setArea] = useState('');
  const [email, setEmail] = useState('');

  // Admin Recovery Fields
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'admin') {
        await adminLogin(identifier, password);
        onClose();
        if (onSuccess) onSuccess();
      } else if (mode === 'admin_forgot') {
        if (newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters long.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New password and confirm password do not match.');
        }
        const res = await api.adminRecoverPassword({
          identifier,
          recoveryKey,
          newPassword,
          confirmPassword
        });
        localStorage.setItem('firststep_token', res.token);
        setSuccessMsg('Admin password successfully reset! Redirecting to Admin Console...');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      } else if (mode === 'login') {
        await login(identifier, password);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        await register({
          role: 'customer',
          name,
          mobile: identifier,
          email,
          password,
          city,
          area
        });
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl relative border border-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-xl mx-auto mb-3 shadow-md ${
            mode === 'admin' || mode === 'admin_forgot' ? 'bg-purple-700 text-white' : 'bg-teal-600 text-white'
          }`}>
            {mode === 'admin' || mode === 'admin_forgot' ? <Shield className="w-6 h-6" /> : 'FS'}
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'admin'
              ? 'FIRST STEP Admin Portal'
              : mode === 'admin_forgot'
              ? 'Admin Password Recovery'
              : mode === 'register'
              ? 'Create Customer Account'
              : 'Sign in to FIRST STEP'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'admin'
              ? 'Restricted to authorized administrative personnel only'
              : mode === 'admin_forgot'
              ? 'Verify with administrative security key to recover access'
              : mode === 'register'
              ? 'Book verified technicians & manage home jobs'
              : 'Customer & Worker login with Mobile / Email & Password'}
          </p>
        </div>

        {/* Admin Warning Banner */}
        {mode === 'admin' && (
          <div className="mb-4 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
            <Shield className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Protected Admin Checkpoint</p>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Worker and Customer accounts are strictly rejected here. All attempts are monitored and recorded in audit logs.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kamran Siddiqui"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          )}

          {/* Identifier Field (used in login, register, admin, admin_forgot) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {mode === 'admin' || mode === 'admin_forgot' ? 'Admin Mobile or Email *' : 'Mobile Number / Email *'}
            </label>
            <input
              type="text"
              required
              placeholder={mode === 'admin' || mode === 'admin_forgot' ? '03209976716 or admin@firststep.pk' : '03001234567 or email'}
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                mode === 'admin' || mode === 'admin_forgot'
                  ? 'border-purple-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600'
                  : 'border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
              }`}
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Area *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DHA, Gulshan"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* Standard password field for login, register, and admin login */}
          {mode !== 'admin_forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password *</label>
                {mode === 'admin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('admin_forgot'); setError(''); }}
                    className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${
                  mode === 'admin'
                    ? 'border-purple-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600'
                    : 'border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
                }`}
              />
            </div>
          )}

          {/* Admin Recovery Mode Extra Fields */}
          {mode === 'admin_forgot' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Recovery Security Key *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter administrative recovery key"
                  value={recoveryKey}
                  onChange={e => setRecoveryKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Provided during initial FIRST STEP deployment or via operations desk.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Admin Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer ${
              mode === 'admin' || mode === 'admin_forgot' ? 'bg-purple-700 hover:bg-purple-800' : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {loading
              ? 'Verifying...'
              : mode === 'admin'
              ? 'Sign In to Admin Console'
              : mode === 'admin_forgot'
              ? 'Reset Admin Password'
              : mode === 'register'
              ? 'Register Customer Account'
              : 'Sign In to Account'}
          </button>
        </form>

        {/* Switchers & Help */}
        <div className="pt-5 mt-5 border-t border-slate-100 flex flex-col items-center gap-2.5 text-xs text-slate-500">
          {mode === 'login' && (
            <>
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
              <div className="flex items-center gap-3 pt-1 border-t border-slate-100 w-full justify-center">
                <button
                  onClick={() => { setMode('admin'); setError(''); }}
                  className="text-slate-400 hover:text-purple-700 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <p>
              Already registered?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className="font-bold text-teal-700 hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}

          {(mode === 'admin' || mode === 'admin_forgot') && (
            <div className="flex flex-col items-center gap-1.5">
              {mode === 'admin_forgot' && (
                <button
                  type="button"
                  onClick={() => { setMode('admin'); setError(''); }}
                  className="font-bold text-purple-700 hover:underline cursor-pointer"
                >
                  ← Back to Admin Login
                </button>
              )}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="font-bold text-teal-700 hover:underline cursor-pointer"
              >
                Back to Customer / Worker Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
