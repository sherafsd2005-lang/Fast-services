import React, { useState } from 'react';
import { Category, ServiceItem } from '../../types';
import { api } from '../../services/api';
import { Plus, Edit, Trash2, CheckCircle2, ChevronRight, Layers, Sparkles } from 'lucide-react';

interface AdminCategoriesProps {
  categories: Category[];
  onRefresh: () => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({ categories, onRefresh }) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState<string | null>(null);

  // New Category State
  const [newCat, setNewCat] = useState({
    name: '',
    nameUrdu: '',
    icon: '🔧',
    description: ''
  });

  // New Service State
  const [newService, setNewService] = useState({
    name: '',
    nameUrdu: '',
    basePrice: '1000',
    description: ''
  });

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name || !newCat.nameUrdu) return;
    try {
      await api.adminAddCategory({
        ...newCat,
        services: []
      });
      setShowAddModal(false);
      setNewCat({ name: '', nameUrdu: '', icon: '🔧', description: '' });
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to add category');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCategory) return;
    try {
      await api.adminUpdateCategory(editingCategory.id, editingCategory);
      setEditingCategory(null);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await api.adminDeleteCategory(id);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to delete category');
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await api.adminUpdateCategory(cat.id, { isActive: !cat.isActive });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddServiceToCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddServiceModal || !newService.name) return;
    const cat = categories.find(c => c.id === showAddServiceModal);
    if (!cat) return;

    const srv: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: newService.name,
      nameUrdu: newService.nameUrdu || newService.name,
      basePrice: Number(newService.basePrice) || 1000,
      description: newService.description
    };

    try {
      await api.adminUpdateCategory(cat.id, {
        services: [...cat.services, srv]
      });
      setShowAddServiceModal(null);
      setNewService({ name: '', nameUrdu: '', basePrice: '1000', description: '' });
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to add service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Dynamic Category &amp; Service Manager</h3>
          <p className="text-xs text-slate-500">
            Total {categories.length} categories active across customer search and worker onboarding
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`p-5 rounded-3xl border transition shadow-xs flex flex-col justify-between ${
              cat.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                    <span className="text-[11px] text-teal-700 font-semibold">{cat.nameUrdu}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-1">{cat.description}</p>
              )}

              {/* Services Sublist */}
              <div className="mt-3 pt-3 border-t border-slate-50 space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold uppercase">
                  <span>Services ({cat.services.length})</span>
                  <button
                    onClick={() => setShowAddServiceModal(cat.id)}
                    className="text-teal-600 hover:underline font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Service</span>
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                  {cat.services.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-1.5 rounded-lg bg-slate-50 text-[11px]">
                      <span className="font-medium text-slate-800 truncate mr-2">{s.name}</span>
                      <span className="font-bold text-slate-700 shrink-0 tabular-nums">
                        PKR {s.basePrice || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setEditingCategory(cat)}
                className="font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                className="font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-900">Add New Service Category</h4>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Home Installation"
                  value={newCat.name}
                  onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name (Urdu) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. اسمارٹ ہوم سروسز"
                  value={newCat.nameUrdu}
                  onChange={e => setNewCat({ ...newCat, nameUrdu: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emoji / Icon *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🤖 or 💡"
                  value={newCat.icon}
                  onChange={e => setNewCat({ ...newCat, icon: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of services provided..."
                  value={newCat.description}
                  onChange={e => setNewCat({ ...newCat, description: e.target.value })}
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
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-900">Add Service to Category</h4>
            <form onSubmit={handleAddServiceToCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Title (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Digital Door Lock Fitting"
                  value={newService.name}
                  onChange={e => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Title (Urdu)</label>
                <input
                  type="text"
                  placeholder="e.g. ڈیجیٹل ڈور لاک تنصیب"
                  value={newService.nameUrdu}
                  onChange={e => setNewService({ ...newService, nameUrdu: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Base Price (PKR)</label>
                <input
                  type="number"
                  value={newService.basePrice}
                  onChange={e => setNewService({ ...newService, basePrice: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-slate-900">Edit Category Details</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name (English)</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name (Urdu)</label>
                <input
                  type="text"
                  value={editingCategory.nameUrdu}
                  onChange={e => setEditingCategory({ ...editingCategory, nameUrdu: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Icon Emoji</label>
                <input
                  type="text"
                  value={editingCategory.icon}
                  onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
