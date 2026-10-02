import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../../types';
import { api } from '../../services/api';
import { CreditCard, Plus, CheckCircle2, AlertCircle, Edit, Save } from 'lucide-react';

export const AdminPaymentSettings: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({
    name: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    easypaisaNumber: '',
    raastId: '',
    instructions: '',
    isActive: true
  });
  const [msg, setMsg] = useState('');

  const loadMethods = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetPaymentSettings();
      setMethods(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleSaveEdit = async () => {
    if (!editingMethod) return;
    try {
      await api.adminUpdatePaymentMethod(editingMethod.id, editingMethod);
      setEditingMethod(null);
      setMsg('Payment account settings updated successfully!');
      setTimeout(() => setMsg(''), 3000);
      await loadMethods();
    } catch (e: any) {
      alert(e.message || 'Failed to save');
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      await api.adminUpdatePaymentMethod(method.id, { isActive: !method.isActive });
      await loadMethods();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminAddPaymentMethod(newMethod);
      setShowAddModal(false);
      setNewMethod({ name: '', accountTitle: '', accountNumber: '', iban: '', instructions: '', isActive: true });
      await loadMethods();
    } catch (e: any) {
      alert(e.message || 'Failed to add payment method');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">FIRST STEP Company Payment Settings</h3>
          <p className="text-xs text-slate-500">
            Configure official bank and wallet accounts where customers transfer booking payments
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {methods.map(method => (
          <div
            key={method.id}
            className={`p-6 rounded-3xl border transition shadow-xs flex flex-col justify-between ${
              method.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-sm font-extrabold text-slate-900">{method.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  method.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {method.isActive ? 'Active on Public Site' : 'Disabled'}
                </span>
              </div>

              <div className="py-4 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Account Title</span>
                  <span className="font-bold text-slate-800">{method.accountTitle}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Account Number / Mobile</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{method.accountNumber}</span>
                </div>
                {method.iban && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">IBAN</span>
                    <span className="font-mono text-slate-700 text-[11px] break-all">{method.iban}</span>
                  </div>
                )}
                {method.instructions && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Instructions for Customer</span>
                    <p className="text-[11px] text-slate-600 italic line-clamp-2">{method.instructions}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setEditingMethod(method)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
              <button
                onClick={() => handleToggleActive(method)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  method.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {method.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-900">
              Edit Payment Details: {editingMethod.name}
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Title *</label>
              <input
                type="text"
                value={editingMethod.accountTitle}
                onChange={e => setEditingMethod({ ...editingMethod, accountTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number / Phone *</label>
              <input
                type="text"
                value={editingMethod.accountNumber}
                onChange={e => setEditingMethod({ ...editingMethod, accountNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IBAN (if applicable)</label>
              <input
                type="text"
                value={editingMethod.iban || ''}
                onChange={e => setEditingMethod({ ...editingMethod, iban: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Instructions</label>
              <textarea
                rows={3}
                value={editingMethod.instructions || ''}
                onChange={e => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMethod(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900 mb-3">Add Company Payment Method</h4>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Method Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Chartered / JazzCash"
                  value={newMethod.name}
                  onChange={e => setNewMethod({ ...newMethod, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Title *</label>
                <input
                  type="text"
                  required
                  placeholder="FIRST STEP SERVICES"
                  value={newMethod.accountTitle}
                  onChange={e => setNewMethod({ ...newMethod, accountTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="Bank account or wallet mobile"
                  value={newMethod.accountNumber}
                  onChange={e => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions</label>
                <textarea
                  rows={2}
                  placeholder="How customer should transfer and verify..."
                  value={newMethod.instructions}
                  onChange={e => setNewMethod({ ...newMethod, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                >
                  Create Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
