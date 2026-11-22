import { LayoutGrid, List, PlusCircle, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProductModal } from '../components/ProductModal';
import { StockStatusLabel } from '../components/StockStatusLabel';
import { useShop } from '../context/ShopContext';
import { Product, StockStatus } from '../types/shop';
import { formatCurrency, getStockStatus } from '../utils/calculations';

export function ProductsCataloguePage() {
  const { products, settings } = useShop();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && getStockStatus(p) !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, products, search, statusFilter]);

  const sym = settings.currencySymbol;

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name, category, or notes..."
              className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | StockStatus)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              aria-label="Filter by stock status"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>

            <div className="flex items-center p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500'
                }`}
                aria-label="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Product</span>
            </button>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalogue Content */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <p className="text-base font-semibold text-slate-800">No products match your search</p>
          <p className="text-sm text-slate-500 mt-1">
            Adjust category filters or add a new item to your catalogue.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const st = getStockStatus(p);
            const profitPerUnit = p.sellingPrice - p.purchasePrice;
            return (
              <div
                key={p.id}
                className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between gap-4 hover:border-navy-800/30 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {p.category} · GST {p.gstRate}%
                      </p>
                      <h3 className="font-display text-base font-bold text-navy-900 mt-0.5 line-clamp-2">
                        {p.name}
                      </h3>
                    </div>
                    <StockStatusLabel status={st} />
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="block text-slate-500">Purchase</span>
                      <span className="font-mono font-semibold text-slate-700 tabular-nums">
                        {formatCurrency(p.purchasePrice, sym)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Selling Price</span>
                      <span className="font-mono font-bold text-navy-900 tabular-nums">
                        {formatCurrency(p.sellingPrice, sym)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-500">Available</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {p.quantity} {p.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Unit Margin:{' '}
                      <strong className="font-mono text-emerald-700 tabular-nums">
                        +{formatCurrency(profitPerUnit, sym)}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(p);
                        setModalOpen(true);
                      }}
                      className="text-xs font-semibold text-navy-900 hover:text-emerald-700 transition-colors"
                    >
                      Edit Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3.5 px-5">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Purchase Price</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-right">GST</th>
                  <th className="py-3.5 px-4 text-right">Available Qty</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{p.category}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                      {formatCurrency(p.purchasePrice, sym)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-navy-900 tabular-nums">
                      {formatCurrency(p.sellingPrice, sym)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                      {p.gstRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="py-3 px-4">
                      <StockStatusLabel status={getStockStatus(p)} />
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(p);
                          setModalOpen(true);
                        }}
                        className="text-xs font-semibold text-navy-900 hover:text-emerald-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductModal
        open={modalOpen}
        editingProduct={editingProduct}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
      />
    </div>
  );
}
