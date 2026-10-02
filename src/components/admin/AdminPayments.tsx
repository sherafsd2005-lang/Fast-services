import React, { useState, useEffect } from 'react';
import { Payment, WorkerPayout } from '../../types';
import { api } from '../../services/api';
import { CheckCircle2, XCircle, AlertCircle, CreditCard, DollarSign, Clock } from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'customer_payments' | 'worker_payouts'>('customer_payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<WorkerPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [payList, payoutList] = await Promise.all([
        api.adminGetPayments(),
        api.adminGetPayouts()
      ]);
      setPayments(payList);
      setPayouts(payoutList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyPayment = async (paymentId: string, status: 'confirmed' | 'rejected') => {
    const reason = status === 'rejected' ? prompt('Reason for payment rejection (e.g. Trx ID not found in Meezan/Easypaisa statement):') : '';
    try {
      await api.adminVerifyPayment(paymentId, status, reason || undefined);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const handleReleasePayout = async (payoutId: string) => {
    if (!window.confirm('Release net payout funds to worker?')) return;
    try {
      await api.adminReleasePayout(payoutId);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const handleHoldPayout = async (payoutId: string) => {
    const reason = prompt('Reason for holding payout:');
    if (!reason) return;
    try {
      await api.adminHoldPayout(payoutId, reason);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Financial Verification &amp; Payouts</h3>
          <p className="text-xs text-slate-500">
            Verify incoming customer bank transfers and authorize released worker payouts
          </p>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveSubTab('customer_payments')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'customer_payments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('worker_payouts')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'worker_payouts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Worker Payouts ({payouts.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'customer_payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Payment ID</th>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Channel &amp; Trx ID</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">#{p.id}</td>
                    <td className="py-3 px-4 font-mono text-teal-700 font-bold">#{p.bookingId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.customerName}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{p.paymentMethodName}</span>
                      <span className="font-mono text-slate-500 block text-[11px]">{p.transactionId}</span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 tabular-nums">
                      PKR {p.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.paymentDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        p.status === 'under_verification' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'under_verification' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerifyPayment(p.id, 'confirmed')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            Verify &amp; Confirm
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(p.id, 'rejected')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'worker_payouts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Payout ID</th>
                  <th className="py-3.5 px-4">Worker</th>
                  <th className="py-3.5 px-4">Booking</th>
                  <th className="py-3.5 px-4">Customer Paid</th>
                  <th className="py-3.5 px-4">FIRST STEP Commission</th>
                  <th className="py-3.5 px-4">Net Worker Payout</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">#{po.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{po.workerName}</td>
                    <td className="py-3 px-4 font-mono text-teal-700 font-bold">#{po.bookingId}</td>
                    <td className="py-3 px-4 tabular-nums">PKR {po.customerPayment.toLocaleString()}</td>
                    <td className="py-3 px-4 tabular-nums text-slate-500">PKR {po.commission.toLocaleString()}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-700 tabular-nums">
                      PKR {po.netPayout.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        po.status === 'released' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        po.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {po.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReleasePayout(po.id)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                          >
                            Release Payout
                          </button>
                          <button
                            onClick={() => handleHoldPayout(po.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                          >
                            Hold
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
