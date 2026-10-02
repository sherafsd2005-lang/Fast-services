import React, { useState } from 'react';
import { Category } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Search, ChevronRight, Layers, ArrowRight } from 'lucide-react';

interface CategoryBrowserProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryName: string, serviceName?: string) => void;
}

export const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  const { isUrdu } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalCat, setActiveModalCat] = useState<Category | null>(null);

  const filteredCategories = categories.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.nameUrdu.includes(term) ||
      c.services.some(s => s.name.toLowerCase().includes(term) || s.nameUrdu.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isUrdu ? 'تمام سروس کیٹیگریز' : 'All Service Categories'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isUrdu ? '50 سے زائد تصدیق شدہ گھریلو اور لوکل سروسز' : 'Over 50+ verified home and commercial local services'}
          </p>
        </div>

        {/* Instant Category Filter */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={isUrdu ? 'سروس یا کیٹیگری تلاش کریں...' : 'Search categories or services...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition shadow-xs"
          />
        </div>
      </div>

      {/* Grid of Large Graphical Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {filteredCategories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              onClick={() => {
                if (cat.services.length > 0) {
                  setActiveModalCat(cat);
                } else {
                  onSelectCategory(cat.name);
                }
              }}
              className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer min-h-[110px] ${
                isSelected
                  ? 'bg-teal-50 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                  : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">
                {cat.icon || '🛠️'}
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-teal-700 transition line-clamp-1">
                {isUrdu ? cat.nameUrdu : cat.name}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {cat.services.length} {isUrdu ? 'سروسز' : 'services'}
              </span>
            </button>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No services found matching "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-3 px-4 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Services Drawer / Modal for Selected Category */}
      {activeModalCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeModalCat.icon}</span>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {isUrdu ? activeModalCat.nameUrdu : activeModalCat.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {activeModalCat.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalCat(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-2 overflow-y-auto flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Available Services in this Category:
              </p>
              {activeModalCat.services.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => {
                    onSelectCategory(activeModalCat.name, srv.name);
                    setActiveModalCat(null);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50/70 hover:border-teal-200 transition cursor-pointer group"
                >
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-teal-700">
                      {isUrdu ? srv.nameUrdu : srv.name}
                    </h5>
                    {srv.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {srv.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {srv.basePrice && (
                      <span className="text-xs font-bold text-slate-700 tabular-nums">
                        PKR {srv.basePrice.toLocaleString()}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  onSelectCategory(activeModalCat.name);
                  setActiveModalCat(null);
                }}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>View All {activeModalCat.name} Workers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
