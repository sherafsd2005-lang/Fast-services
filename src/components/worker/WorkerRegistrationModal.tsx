import React, { useState } from 'react';
import { Category, WorkerProfile } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, Shield, Upload, Camera, AlertCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';

interface WorkerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: (worker: WorkerProfile) => void;
}

export const WorkerRegistrationModal: React.FC<WorkerRegistrationModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess
}) => {
  const { refreshUser } = useAuth();
  const { isUrdu } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Karachi');
  const [area, setArea] = useState('');
  const [experience, setExperience] = useState<'Less than 1 year' | '1–3 years' | '3–5 years' | '5–10 years' | '10+ years'>('1–3 years');
  const [priceType, setPriceType] = useState<'fixed' | 'discuss'>('fixed');
  const [startingPrice, setStartingPrice] = useState<string>('800');
  const [visitCharge, setVisitCharge] = useState<string>('300');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [cnicFrontUrl, setCnicFrontUrl] = useState<string>('');
  const [cnicBackUrl, setCnicBackUrl] = useState<string>('');

  if (!isOpen) return null;

  // Pakistani Cities
  const PAKISTAN_CITIES = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Hyderabad', 'Abbottabad'
  ];

  const toggleService = (srvName: string) => {
    if (selectedServices.includes(srvName)) {
      setSelectedServices(selectedServices.filter(s => s !== srvName));
    } else {
      setSelectedServices([...selectedServices, srvName]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'cnicFront' | 'cnicBack') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (target === 'avatar') setAvatarUrl(base64);
      if (target === 'cnicFront') setCnicFrontUrl(base64);
      if (target === 'cnicBack') setCnicBackUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.registerWorker({
        name,
        mobile,
        password,
        city,
        area,
        services: selectedServices,
        experience,
        startingPrice: priceType === 'discuss' ? null : Number(startingPrice),
        priceType,
        visitCharge: Number(visitCharge),
        avatarUrl,
        cnicFrontUrl,
        cnicBackUrl
      });
      localStorage.setItem('firststep_token', res.token);
      await refreshUser();
      setSubmitted(true);
      onSuccess(res.worker);
    } catch (err: any) {
      setError(err.message || 'Worker registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl p-6 sm:p-8 relative my-8 border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Registration Submitted!
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your profile will be reviewed by FIRST STEP. Once your CNIC and credentials are verified by our team, you will receive full access to accept customer bookings and custom jobs!
            </p>
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-xs text-teal-800 text-left space-y-1">
              <p className="font-bold">Next Steps:</p>
              <p>• Our support desk (03209976716) may call for routine phone confirmation.</p>
              <p>• You can log into your Worker Dashboard at any time to update your portfolio.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition"
            >
              Go to Worker Dashboard
            </button>
          </div>
        ) : (
          <div>
            {/* Progress Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                <span>Step {step} of 8</span>
                <span className="text-teal-700 font-bold">
                  {step === 1 && 'What work do you do?'}
                  {step === 2 && 'Personal Information'}
                  {step === 3 && 'Location & City'}
                  {step === 4 && 'Experience'}
                  {step === 5 && 'Starting Rates'}
                  {step === 6 && 'Profile Picture'}
                  {step === 7 && 'CNIC Verification'}
                  {step === 8 && 'Review & Submit'}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all duration-300"
                  style={{ width: `${(step / 8) * 100}%` }}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: What work do you do? */}
            {step === 1 && (
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-900">
                  What work do you do? (آپ کیا کام کرتے ہیں؟)
                </h4>
                <p className="text-xs text-slate-500">
                  Select the services you offer. You can choose more than one.
                </p>
                <div className="max-h-80 overflow-y-auto pr-1 grid grid-cols-2 gap-2 sm:gap-2.5">
                  {categories.flatMap(c => c.services.map(s => ({ ...s, catIcon: c.icon, catName: c.name }))).slice(0, 40).map(srv => {
                    const isSelected = selectedServices.includes(srv.name);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleService(srv.name)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 text-teal-950'
                            : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700'
                        }`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{srv.catIcon}</span>
                        <div>
                          <p className="text-xs font-bold leading-tight">{srv.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{srv.catName}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Name, Mobile, Password */}
            {step === 2 && (
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-900">
                  Personal Details (ذاتی معلومات)
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Tariq"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="03001234567"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Create a secure password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            {/* Step 3: City & Area */}
            {step === 3 && (
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-900">
                  Location (شہر اور علاقہ)
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {PAKISTAN_CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Town / Sector *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gulshan-e-Iqbal, DHA, F-10, Saddar"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Experience */}
            {step === 4 && (
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-900">
                  Work Experience (آپ کا تجربہ کتنا ہے؟)
                </h4>
                <div className="space-y-2">
                  {(['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'] as const).map(exp => (
                    <label
                      key={exp}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                        experience === exp ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm font-semibold text-slate-800">{exp}</span>
                      <input
                        type="radio"
                        name="experience"
                        checked={experience === exp}
                        onChange={() => setExperience(exp)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Pricing */}
            {step === 5 && (
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-900">
                  Pricing &amp; Visit Charges (ریٹس اور فیس)
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setPriceType('fixed')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                      priceType === 'fixed' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    Set Starting Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceType('discuss')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                      priceType === 'discuss' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    Discuss With Customer
                  </button>
                </div>

                {priceType === 'fixed' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Starting Service Price (PKR)</label>
                    <input
                      type="number"
                      value={startingPrice}
                      onChange={e => setStartingPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Visit / Inspection Charge (PKR)</label>
                  <input
                    type="number"
                    value={visitCharge}
                    onChange={e => setVisitCharge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Standard home visit checkup fee if customer decides not to proceed with major repairs.
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Profile Picture (Requirement 5) */}
            {step === 6 && (
              <div className="space-y-4 text-center">
                <h4 className="text-lg font-bold text-slate-900">
                  Worker Profile Picture (پروفائل تصویر)
                </h4>
                <p className="text-xs text-slate-500">
                  Upload a photo or take a picture using your camera. A clear, friendly face photo will be shown to customers when they search or book.
                </p>
                <div className="w-28 h-28 rounded-3xl border-2 border-teal-500 mx-auto flex items-center justify-center overflow-hidden bg-slate-100 relative shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-teal-600" />
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-2.5">
                  <label className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'avatar')} />
                  </label>

                  <label className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Photo</span>
                    <input type="file" accept="image/*" capture="user" className="hidden" onChange={e => handleFileUpload(e, 'avatar')} />
                  </label>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(7)}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    Continue to CNIC Verification →
                  </button>
                </div>
              </div>
            )}

            {/* Step 7: CNIC / Identity Verification */}
            {step === 7 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <h4 className="text-lg font-bold text-slate-900">
                    CNIC / Identity Verification (شناختی کارڈ تصدیق)
                  </h4>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                  <strong>Strict Privacy Notice:</strong> Your CNIC will be used only for internal verification and will <strong>NOT</strong> be publicly displayed to customers or other workers. Only authorized FIRST STEP Admin can access it.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front */}
                  <div className="border border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-700 mb-2">CNIC Front (سامنے کی طرف)</p>
                    {cnicFrontUrl ? (
                      <div className="relative rounded-xl overflow-hidden h-28 border border-slate-200 mb-2">
                        <img src={cnicFrontUrl} alt="CNIC Front" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCnicFrontUrl('')}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="h-28 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-3 cursor-pointer hover:border-teal-500 hover:bg-teal-50/20 transition mb-2">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[11px] text-slate-500 font-medium">Upload Front Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'cnicFront')} />
                      </label>
                    )}
                  </div>

                  {/* Back */}
                  <div className="border border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-700 mb-2">CNIC Back (پیچھے کی طرف)</p>
                    {cnicBackUrl ? (
                      <div className="relative rounded-xl overflow-hidden h-28 border border-slate-200 mb-2">
                        <img src={cnicBackUrl} alt="CNIC Back" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCnicBackUrl('')}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="h-28 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-3 cursor-pointer hover:border-teal-500 hover:bg-teal-50/20 transition mb-2">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[11px] text-slate-500 font-medium">Upload Back Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'cnicBack')} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Submit & Summary */}
            {step === 8 && (
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-900">
                  Review &amp; Submit Registration
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-bold">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile:</span>
                    <span className="font-bold">{mobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-bold">{area}, {city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Services ({selectedServices.length}):</span>
                    <span className="font-bold line-clamp-1">{selectedServices.slice(0, 3).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Experience:</span>
                    <span className="font-bold">{experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CNIC Uploaded:</span>
                    <span className="font-bold text-emerald-600">{cnicFrontUrl && cnicBackUrl ? 'Yes (Front & Back)' : 'Pending'}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">
                  By clicking Submit, you agree to FIRST STEP service terms and company payment collection policies.
                </p>
              </div>
            )}

            {/* Modal Controls */}
            <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {step < 8 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && selectedServices.length === 0) {
                      setError('Please select at least one service');
                      return;
                    }
                    if (step === 2 && (!name || !mobile || !password)) {
                      setError('Please enter your name, mobile, and password');
                      return;
                    }
                    if (step === 3 && !area) {
                      setError('Please specify your area');
                      return;
                    }
                    setError('');
                    setStep(step + 1);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="px-8 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
