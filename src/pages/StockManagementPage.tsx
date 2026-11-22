import { Edit2, Minus, Plus, PlusCircle, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProductModal } from '../components/ProductModal';
import { StockStatusLabel } from '../components/StockStatusLabel';
import { useShop } from '../context/ShopContext';
import { Product, StockStatus } from '../types/shop';
import { formatCurrency, formatNumber, getStockStatus } from '../utils/calculations';

export function StockManagementPage() {
  const {
    products,
    settings,
    stockFilterHint,
    setStockFilterHint,
    adjustStock,
    deleteProduct,
  } = useShop();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>(stockFilterHint);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  useEffect(() => {
    setStatusFilter(stockFilterHint);
  }, [stockFilterHint]);

  const counts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalUnits = 0;
    let stockCostValue = 0;

    for (const p of products) {
      totalUnits += p.quantity;
      stockCostValue += p.purchasePrice * p.quantity;
      const st = getStockStatus(p);
      if (st === 'in-stock') inStock++;
      else if (st === 'low-stock') lowStock++;
      else outOfStock++;
    }

    return {
      all: products.length,
      inStock,
      lowStock,
      outOfStock,
      totalUnits,
      stockCostValue,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const st = getStockStatus(p);
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, search, statusFilter]);

  const sym = settings.currencySymbol;

  const handleFilterClick = (filter: 'all' | StockStatus) => {
    setStatusFilter(filter);
    setStockFilterHint(filter);
  };

  return (
    <div className="space-y-6">
      {/* Stock Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Total Stock Units</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-navy-900 tabular-nums">
            {formatNumber(counts.totalUnits)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Inventory Cost Value</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-navy-900 tabular-nums">
            {formatCurrency(counts.stockCostValue, sym)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-amber-700">Low Stock Items</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-amber-600 tabular-nums">
            {formatNumber(counts.lowStock)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-red-700">Out of Stock Items</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-red-600 tabular-nums">
            {formatNumber(counts.outOfStock)}
          </p>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Segmented Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => handleFilterClick('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-navy-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick('in-stock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'in-stock'
                ? 'bg-emerald-700 text-white'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            In Stock ({counts.inStock})
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick('low-stock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'low-stock'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            Low Stock ({counts.lowStock})
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick('out-of-stock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'out-of-stock'
                ? 'bg-red-600 text-white'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            Out of Stock ({counts.outOfStock})
          </button>
        </div>

        {/* Search + Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stock items..."
              className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Mobile Touch Cards */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
            <p className="text-sm font-semibold text-slate-700">No matching products found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try clearing filters or add a new product.
            </p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const status = getStockStatus(prod);
            return (
              <div
                key={prod.id}
                className="bg-white p-4 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">{prod.category}</p>
                    <h3 className="font-display text-sm font-bold text-navy-900 mt-0.5">
                      {prod.name}
                    </h3>
                  </div>
                  <StockStatusLabel status={status} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-slate-100">
                  <div>
                    <span className="block text-slate-500">Purchase</span>
                    <span className="font-mono font-semibold text-slate-700 tabular-nums">
                      {formatCurrency(prod.purchasePrice, sym)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Selling</span>
                    <span className="font-mono font-bold text-navy-900 tabular-nums">
                      {formatCurrency(prod.sellingPrice, sym)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-500">Min Limit</span>
                    <span className="font-mono font-semibold text-slate-700 tabular-nums">
                      {prod.minStockLimit} {prod.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustStock(prod.id, -1)}
                      disabled={prod.quantity <= 0}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 active:bg-slate-100 disabled:opacity-40"
                      aria-label={`Decrease stock for ${prod.name}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="min-w-[68px] text-center font-mono text-sm font-bold text-navy-900 tabular-nums">
                      {prod.quantity} {prod.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustStock(prod.id, 1)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 active:bg-slate-100"
                      aria-label={`Increase stock for ${prod.name}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustStock(prod.id, 10)}
                      className="min-h-[44px] px-2.5 text-xs font-mono font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 active:bg-emerald-100"
                    >
                      +10
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(prod);
                        setModalOpen(true);
                      }}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                      aria-label={`Edit ${prod.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProduct(prod)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${prod.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Stock Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-5">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Purchase</th>
                <th className="py-3.5 px-4 text-right">Selling</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Min Limit</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <p className="text-sm font-semibold text-slate-700">No matching products found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try clearing filters or add a new product to start managing stock.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const status = getStockStatus(prod);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate">{prod.name}</p>
                        {prod.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{prod.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {prod.category}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatCurrency(prod.purchasePrice, sym)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(prod.sellingPrice, sym)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustStock(prod.id, -1)}
                            disabled={prod.quantity <= 0}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label={`Decrease stock for ${prod.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="min-w-[64px] text-center font-mono text-sm font-bold text-navy-900 tabular-nums">
                            {prod.quantity} {prod.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustStock(prod.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                            aria-label={`Increase stock for ${prod.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStock(prod.id, 10)}
                            className="px-2 h-7 text-[11px] font-mono font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            title="Quick restock +10"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {prod.minStockLimit} {prod.unit}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StockStatusLabel status={status} />
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(prod);
                              setModalOpen(true);
                            }}
                            className="p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
                            aria-label={`Edit ${prod.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(prod)}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            aria-label={`Delete ${prod.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        open={modalOpen}
        editingProduct={editingProduct}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
      />

      <ConfirmModal
        open={Boolean(deletingProduct)}
        title="Delete Product"
        message={`Are you sure you want to delete "${deletingProduct?.name}" from your shop inventory? Existing historical sales records will remain intact.`}
        confirmLabel="Delete Product"
        danger
        onConfirm={() => {
          if (deletingProduct) {
            deleteProduct(deletingProduct.id);
          }
          setDeletingProduct(null);
        }}
        onCancel={() => setDeletingProduct(null)}
      />
    </div>
  );
}
