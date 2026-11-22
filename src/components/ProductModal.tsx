import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Product } from '../types/shop';
import { ProductInput, useShop } from '../context/ShopContext';

interface ProductModalProps {
  open: boolean;
  editingProduct?: Product | null;
  onClose: () => void;
}

const DEFAULT_CATEGORIES = [
  'Groceries & Grains',
  'Cooking Oils',
  'Dairy',
  'Beverages',
  'Snacks & Bakery',
  'Personal Care',
  'Household & Care',
  'Electronics & Accessories',
  'Stationery',
  'General',
];

const UNIT_OPTIONS = ['pcs', 'pack', 'kg', 'g', 'litre', 'ml', 'bag', 'bottle', 'box', 'carton', 'tube', 'bar'];
const GST_OPTIONS = [0, 5, 12, 18, 28];

export function ProductModal({ open, editingProduct, onClose }: ProductModalProps) {
  const { settings, products, addProduct, updateProduct } = useShop();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Groceries & Grains');
  const [customCategory, setCustomCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minStockLimit, setMinStockLimit] = useState(String(settings.defaultMinStockLimit));
  const [gstRate, setGstRate] = useState(String(settings.defaultGstRate));
  const [unit, setUnit] = useState('pcs');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...products.map((p) => p.category)])
  ).sort();

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setCustomCategory('');
      setPurchasePrice(String(editingProduct.purchasePrice));
      setSellingPrice(String(editingProduct.sellingPrice));
      setQuantity(String(editingProduct.quantity));
      setMinStockLimit(String(editingProduct.minStockLimit));
      setGstRate(String(editingProduct.gstRate));
      setUnit(editingProduct.unit);
      setDescription(editingProduct.description);
    } else {
      setName('');
      setCategory(allCategories[0] || 'General');
      setCustomCategory('');
      setPurchasePrice('');
      setSellingPrice('');
      setQuantity('0');
      setMinStockLimit(String(settings.defaultMinStockLimit));
      setGstRate(String(settings.defaultGstRate));
      setUnit('pcs');
      setDescription('');
    }
  }, [open, editingProduct, settings.defaultGstRate, settings.defaultMinStockLimit]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a product name.');
      return;
    }
    const buy = Number(purchasePrice);
    const sell = Number(sellingPrice);
    const qty = Number(quantity);
    const minLim = Number(minStockLimit);
    const gst = Number(gstRate);

    if (Number.isNaN(buy) || buy < 0 || Number.isNaN(sell) || sell < 0) {
      setError('Purchase and selling prices must be valid positive numbers.');
      return;
    }
    if (Number.isNaN(qty) || qty < 0) {
      setError('Quantity must be 0 or greater.');
      return;
    }

    const finalCategory = category === '__custom__' ? customCategory.trim() || 'General' : category;

    const payload: ProductInput = {
      name: name.trim(),
      category: finalCategory,
      purchasePrice: buy,
      sellingPrice: sell,
      quantity: Math.floor(qty),
      minStockLimit: Math.max(0, Math.floor(Number.isNaN(minLim) ? 5 : minLim)),
      gstRate: Math.max(0, Number.isNaN(gst) ? 0 : gst),
      unit,
      description: description.trim(),
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-[2px] sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl bg-white rounded-t-2xl sm:rounded-xl border border-slate-200 shadow-xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-navy-900 text-white shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Set pricing, available stock, GST rate, and low-stock alert threshold.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close product form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Fortune Sunflower Oil (1 L)"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">+ Custom Category</option>
              </select>
            </div>

            {category === '__custom__' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Custom Category Name *
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category name"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Unit of Measurement
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Purchase Price ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Selling Price ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Available Qty *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Min Stock Limit *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={minStockLimit}
                onChange={(e) => setMinStockLimit(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                GST Slab (%)
              </label>
              <div className="flex items-center gap-1.5">
                {GST_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setGstRate(String(rate))}
                    className={`px-2.5 py-2 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                      Number(gstRate) === rate
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="w-16 px-2 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  aria-label="Custom GST percent"
                />
              </div>
            </div>

            {Number(sellingPrice) > 0 && Number(purchasePrice) >= 0 && (
              <div className="flex items-end">
                <div className="w-full px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-800">Unit Profit Margin</span>
                  <span className="text-sm font-mono font-bold text-emerald-700 tabular-nums">
                    {settings.currencySymbol}
                    {(Number(sellingPrice) - Number(purchasePrice)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brand, pack size, shelf notes, or supplier details..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
            >
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
