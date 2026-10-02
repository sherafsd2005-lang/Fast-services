import React, { useState, useEffect } from 'react';
import { HeroPoster, Category } from '../../types';
import { api } from '../../services/api';
import { Plus, Trash2, Edit, CheckCircle2, Image as ImageIcon, Sparkles, Clock } from 'lucide-react';

interface AdminPostersProps {
  categories: Category[];
}

export const AdminPosters: React.FC<AdminPostersProps> = ({ categories }) => {
  const [posters, setPosters] = useState<HeroPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPoster, setEditingPoster] = useState<HeroPoster | null>(null);

  const [newPoster, setNewPoster] = useState({
    title: '',
    titleUrdu: '',
    subtitle: '',
    subtitleUrdu: '',
    category: 'Plumbing',
    serviceName: 'Pipe Leakage Repair',
    imageUrl: '',
    buttonText: 'Book Now',
    buttonTextUrdu: 'ابھی بک کریں',
    durationSeconds: 5
  });

  const loadPosters = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetPosters();
      setPosters(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosters();
  }, []);

  const handleToggle = async (poster: HeroPoster) => {
    try {
      await api.adminUpdatePoster(poster.id, { isActive: !poster.isActive });
      await loadPosters();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete hero poster "${title}"?`)) return;
    try {
      await api.adminDeletePoster(id);
      await loadPosters();
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoster.title || !newPoster.imageUrl) return;
    try {
      await api.adminCreatePoster(newPoster);
      setShowAddModal(false);
      setNewPoster({
        title: '',
        titleUrdu: '',
        subtitle: '',
        subtitleUrdu: '',
        category: 'Plumbing',
        serviceName: '',
        imageUrl: '',
        buttonText: 'Book Now',
        buttonTextUrdu: 'ابھی بک کریں',
        durationSeconds: 5
      });
      await loadPosters();
    } catch (e: any) {
      alert(e.message || 'Failed to create');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPoster) return;
    try {
      await api.adminUpdatePoster(editingPoster.id, editingPoster);
      setEditingPoster(null);
      await loadPosters();
    } catch (e: any) {
      alert(e.message || 'Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Hero Worker Poster Dashboard</h3>
          <p className="text-xs text-slate-500">
            Control the animated rotating posters, service links, durations, and active statuses
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hero Poster</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posters.map(p => (
          <div
            key={p.id}
            className={`rounded-3xl border overflow-hidden shadow-xs flex flex-col justify-between transition ${
              p.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div>
              {/* Poster Image Preview */}
              <div className="relative h-48 bg-slate-900 overflow-hidden">
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-teal-500/90 text-slate-950 text-[11px] font-bold">
                    {p.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-2xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{p.durationSeconds}s duration</span>
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-sm font-bold line-clamp-1">{p.title}</h4>
                  <p className="text-[11px] text-teal-300 line-clamp-1">{p.titleUrdu}</p>
                </div>
              </div>

              <div className="p-4 space-y-2 text-xs">
                <p className="text-slate-600 line-clamp-2">{p.subtitle}</p>
                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-2 border-t border-slate-100">
                  <span>Target Service: <strong>{p.serviceName}</strong></span>
                  <span>Button: <strong>{p.buttonText}</strong></span>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center justify-between gap-2">
              <button
                onClick={() => setEditingPoster(p)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    p.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {p.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.title)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-3.5 my-8">
            <h4 className="text-base font-bold text-slate-900">Add Hero Worker Poster</h4>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Carpenter for Bespoke Furniture"
                  value={newPoster.title}
                  onChange={e => setNewPoster({ ...newPoster, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title (Urdu) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ماہر کارپینٹر لکڑی کے کام کے لیے"
                  value={newPoster.titleUrdu}
                  onChange={e => setNewPoster({ ...newPoster, titleUrdu: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newPoster.category}
                    onChange={e => setNewPoster({ ...newPoster, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Slide Duration (seconds)</label>
                  <input
                    type="number"
                    value={newPoster.durationSeconds}
                    onChange={e => setNewPoster({ ...newPoster, durationSeconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  placeholder="Supporting trust proposition..."
                  value={newPoster.subtitle}
                  onChange={e => setNewPoster({ ...newPoster, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Poster Image URL *</label>
                <input
                  type="text"
                  required
                  placeholder="/src/assets/images/... or image URL"
                  value={newPoster.imageUrl}
                  onChange={e => setNewPoster({ ...newPoster, imageUrl: e.target.value })}
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
                  Create Poster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-3">
            <h4 className="text-base font-bold text-slate-900">Edit Hero Poster</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={editingPoster.title}
                onChange={e => setEditingPoster({ ...editingPoster, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Seconds)</label>
              <input
                type="number"
                value={editingPoster.durationSeconds}
                onChange={e => setEditingPoster({ ...editingPoster, durationSeconds: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
              <input
                type="text"
                value={editingPoster.imageUrl}
                onChange={e => setEditingPoster({ ...editingPoster, imageUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPoster(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
