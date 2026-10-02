import React, { useState, useEffect } from 'react';
import { Booking, PaymentMethod } from '../../types';
import { api } from '../../services/api';
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, Copy, X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  booking,
  onClose,
  onSuccess
}) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getPaymentMethods().then(data => {
        setMethods(data);
        if (data.length > 0) {
          setSelectedMethodId(data[0].id);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const selectedMethod = methods.find(m => m.id === selectedMethodId) || methods[0];

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setScreenshotUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setError('Please provide the Transaction ID (Trx ID) from your bank or wallet transfer.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.submitPayment({
        bookingId: booking.id,
        amount: booking.totalAmount,
        paymentMethodId: selectedMethod.id,
        transactionId: transactionId.trim(),
        screenshotUrl
      });
      setSubmitted(true);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment submission failed');
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

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Payment Proof Submitted!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your payment for Booking #{booking.id} is now <strong>Under Verification</strong> by the FIRST STEP financial team. Once confirmed, your booking will become officially verified!
            </p>
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-100 text-xs text-teal-800 text-left">
              <p className="font-bold">Transaction Reference:</p>
              <p className="font-mono">{transactionId}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              Back to Bookings
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-black">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Pay to FIRST STEP Company Account
                </h3>
                <p className="text-xs text-slate-500">
                  Protected booking payment for {booking.serviceName}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Total Amount Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between mb-5">
              <div>
                <span className="text-xs text-slate-400">Total Payable Amount:</span>
                <p className="text-xl sm:text-2xl font-black text-teal-300 tabular-nums">
                  PKR {booking.totalAmount.toLocaleString()}
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                100% Escrow Protected
              </span>
            </div>

            {/* Method Tabs */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Company Payment Method:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {methods.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethodId(m.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      selectedMethodId === m.id
                        ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Method Details */}
            {selectedMethod && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 mb-5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Account Title:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>{selectedMethod.accountTitle}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedMethod.accountTitle, 'title')}
                      className="text-slate-400 hover:text-teal-600 cursor-pointer"
                      title="Copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Account Number / Phone:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-sm">
                    <span>{selectedMethod.accountNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedMethod.accountNumber, 'num')}
                      className="text-slate-400 hover:text-teal-600 cursor-pointer"
                      title="Copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {selectedMethod.iban && (
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500">IBAN:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-[11px]">
                      <span>{selectedMethod.iban}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedMethod.iban!, 'iban')}
                        className="text-slate-400 hover:text-teal-600 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {selectedMethod.instructions && (
                  <p className="text-[11px] text-slate-500 italic pt-1">
                    {selectedMethod.instructions}
                  </p>
                )}

                {copiedField && (
                  <p className="text-[11px] text-emerald-600 font-bold text-center">
                    Copied to clipboard!
                  </p>
                )}
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank / Wallet Transaction ID (Trx ID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN-82910482 or 3737 Trx ID"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Receipt / Screenshot (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 text-xs font-semibold text-slate-600 cursor-pointer flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Screenshot</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  {screenshotUrl && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Screenshot attached
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                {loading ? 'Submitting...' : 'Submit Payment for Verification'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
