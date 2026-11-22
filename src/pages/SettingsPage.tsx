import { Download, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useShop } from '../context/ShopContext';

export function SettingsPage() {
  const {
    settings,
    products,
    sales,
    expenses,
    updateSettings,
    exportBackupJson,
    importBackupJson,
    resetStarter,
    clearAllData,
  } = useShop();

  const [shopName, setShopName] = useState(settings.shopName);
  const [shopTagline, setShopTagline] = useState(settings.shopTagline);
  const [address, setAddress] = useState(settings.address);
  const [gstin, setGstin] = useState(settings.gstin);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [defaultGstRate, setDefaultGstRate] = useState(String(settings.defaultGstRate));
  const [defaultMinStockLimit, setDefaultMinStockLimit] = useState(
    String(settings.defaultMinStockLimit)
  );

  const [confirmMode, setConfirmMode] = useState<'reset-starter' | 'clear-all' | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shopName: shopName.trim() || 'SHOP TRACK Store',
      shopTagline: shopTagline.trim(),
      address: address.trim(),
      gstin: gstin.trim(),
      currencySymbol: currencySymbol.trim() || '₹',
      defaultGstRate: Math.max(0, Number(defaultGstRate) || 0),
      defaultMinStockLimit: Math.max(0, Math.floor(Number(defaultMinStockLimit) || 5)),
    });
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        importBackupJson(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Shop Preferences Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white p-6 rounded-xl border border-slate-200 space-y-5"
      >
        <div className="pb-4 border-b border-slate-100">
          <h2 className="font-display text-lg font-bold text-navy-900">
            Shop Details &amp; Billing Preferences
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Displayed on PDF reports, receipts, and store headers. No login or account required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Shop Name
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Shop Tagline
            </label>
            <input
              type="text"
              value={shopTagline}
              onChange={(e) => setShopTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Shop Address (For Receipts &amp; Reports)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              GSTIN (Optional)
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g., 27AABCS1429B1Z5"
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Currency Symbol
            </label>
            <select
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="₹">₹ (Indian Rupee)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default GST Rate (%)
            </label>
            <select
              value={defaultGstRate}
              onChange={(e) => setDefaultGstRate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-lg bg-white"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Min Stock Alert Limit
            </label>
            <input
              type="number"
              min="0"
              value={defaultMinStockLimit}
              onChange={(e) => setDefaultMinStockLimit(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Data Persistence, Backup & Restore */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="font-display text-lg font-bold text-navy-900">
            Data Storage, Backup &amp; Restore
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All products, stock, sales, expenses, and notifications are automatically saved to persistent browser storage ({products.length} products, {sales.length} sales, {expenses.length} expenses).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900">Download Full Backup</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Save a complete JSON backup of your inventory, transactions, expenses, and settings to your device.
              </p>
            </div>
            <button
              type="button"
              onClick={exportBackupJson}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Backup (.json)</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900">Restore From Backup</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Select a previously exported SHOP TRACK JSON backup file to restore your store data.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-navy-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Backup (.json)</span>
            </button>
          </div>
        </div>

        {/* Reset Options */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Need to start fresh with an empty ledger or reload sample store items?
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmMode('reset-starter')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Sample Data</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmMode('clear-all')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmMode === 'reset-starter'}
        title="Load Sample Shop Data"
        message="This will replace your current data with the starter retail shop inventory and sample sales. Export a backup first if you want to keep current records."
        confirmLabel="Load Sample Data"
        onConfirm={() => {
          resetStarter();
          setConfirmMode(null);
        }}
        onCancel={() => setConfirmMode(null)}
      />

      <ConfirmModal
        open={confirmMode === 'clear-all'}
        title="Clear All Shop Data"
        message="This will permanently erase all products, sales, expenses, and notifications so you can start with a blank shop. This cannot be undone unless you have a JSON backup."
        confirmLabel="Yes, Clear Everything"
        danger
        onConfirm={() => {
          clearAllData();
          setConfirmMode(null);
        }}
        onCancel={() => setConfirmMode(null)}
      />
    </div>
  );
}
