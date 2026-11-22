import { Calculator, Copy, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { calculateGSTBreakdown, formatCurrency } from '../utils/calculations';

const PRESET_SLABS = [5, 12, 18, 28];

export function GstCalculatorPage() {
  const { settings } = useShop();
  const sym = settings.currencySymbol;

  const [priceInput, setPriceInput] = useState('1000');
  const [quantityInput, setQuantityInput] = useState('1');
  const [gstRate, setGstRate] = useState<number>(18);
  const [customRate, setCustomRate] = useState('18');
  const [mode, setMode] = useState<'exclusive' | 'inclusive'>('exclusive');
  const [supplyType, setSupplyType] = useState<'intra' | 'inter'>('intra');
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () =>
      calculateGSTBreakdown({
        price: Number(priceInput) || 0,
        quantity: Math.max(1, Number(quantityInput) || 1),
        gstRate,
        mode,
        supplyType,
      }),
    [gstRate, mode, priceInput, quantityInput, supplyType]
  );

  const handleSelectSlab = (rate: number) => {
    setGstRate(rate);
    setCustomRate(String(rate));
  };

  const handleCustomRateChange = (val: string) => {
    setCustomRate(val);
    const parsed = Number(val);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setGstRate(parsed);
    }
  };

  const handleCopyBreakdown = () => {
    const lines = [
      `SHOP TRACK — GST Calculation`,
      `Mode: ${mode === 'exclusive' ? 'Price Excludes GST' : 'Price Includes GST'}`,
      `Base Price (Excl. GST): ${formatCurrency(result.totalBasePrice, sym)}`,
      supplyType === 'intra'
        ? `CGST (${result.cgstRate}%): ${formatCurrency(result.cgstAmount, sym)} | SGST (${result.sgstRate}%): ${formatCurrency(result.sgstAmount, sym)}`
        : `IGST (${result.igstRate}%): ${formatCurrency(result.igstAmount, sym)}`,
      `Total GST (${result.gstRate}%): ${formatCurrency(result.totalGstAmount, sym)}`,
      `Final Total (Incl. GST): ${formatCurrency(result.finalTotalAmount, sym)}`,
    ].join('\n');
    navigator.clipboard?.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Controls */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-navy-900 text-white flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-navy-900">
                GST &amp; Tax Calculator
              </h2>
              <p className="text-xs text-slate-500">
                Instant CGST, SGST, and IGST breakdown for Indian retail billing
              </p>
            </div>
          </div>

          {/* Calculation Mode Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Price Input Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('exclusive')}
                className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                  mode === 'exclusive'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Excludes GST (Add GST)
              </button>
              <button
                type="button"
                onClick={() => setMode('inclusive')}
                className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                  mode === 'inclusive'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Includes GST (Extract GST)
              </button>
            </div>
          </div>

          {/* Product Price & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {mode === 'exclusive'
                  ? `Product Price Excl. GST (${sym})`
                  : `Product Price Incl. GST (${sym})`}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 text-lg font-mono font-bold tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                className="w-full px-4 py-3 text-lg font-mono font-bold tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* GST Percentage Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select GST Slab (%)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_SLABS.map((slab) => (
                <button
                  key={slab}
                  type="button"
                  onClick={() => handleSelectSlab(slab)}
                  className={`py-2.5 text-sm font-mono font-bold rounded-lg border transition-colors ${
                    gstRate === slab
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {slab}%
                </button>
              ))}
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={customRate}
                  onChange={(e) => handleCustomRateChange(e.target.value)}
                  placeholder="Custom"
                  aria-label="Custom GST percentage"
                  className="w-full h-full px-2.5 py-2.5 text-sm font-mono font-bold text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
                <span className="text-[10px] text-slate-400 block text-center mt-0.5">Custom %</span>
              </div>
            </div>
          </div>

          {/* Supply Type (CGST+SGST vs IGST) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Tax Breakdown Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setSupplyType('intra')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors ${
                  supplyType === 'intra'
                    ? 'bg-white text-navy-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Intra-State (CGST + SGST)
              </button>
              <button
                type="button"
                onClick={() => setSupplyType('inter')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors ${
                  supplyType === 'inter'
                    ? 'bg-white text-navy-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inter-State (IGST)
              </button>
            </div>
          </div>
        </div>

        {/* Result Breakdown Card */}
        <div className="lg:col-span-5 bg-navy-900 text-white p-6 rounded-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">
                Final GST Breakdown ({result.gstRate}%)
              </span>
              <button
                type="button"
                onClick={handleCopyBreakdown}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="mt-5 pb-5 border-b border-white/10">
              <p className="text-xs text-slate-300">Final Payable Amount (Incl. GST)</p>
              <p className="font-mono text-3xl sm:text-4xl font-extrabold text-white tabular-nums mt-1">
                {formatCurrency(result.finalTotalAmount, sym)}
              </p>
            </div>

            <div className="mt-5 space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Price Excluding GST</span>
                <span className="font-mono font-semibold text-white tabular-nums">
                  {formatCurrency(result.totalBasePrice, sym)}
                </span>
              </div>

              {supplyType === 'intra' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">CGST ({result.cgstRate}%)</span>
                    <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                      +{formatCurrency(result.cgstAmount, sym)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">SGST ({result.sgstRate}%)</span>
                    <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                      +{formatCurrency(result.sgstAmount, sym)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">IGST ({result.igstRate}%)</span>
                  <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                    +{formatCurrency(result.igstAmount, sym)}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="font-semibold text-white">Total GST Amount</span>
                <span className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(result.totalGstAmount, sym)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-white/10 text-xs text-slate-200 leading-relaxed">
            Per unit base price (excl. GST):{' '}
            <strong className="font-mono text-white tabular-nums">
              {formatCurrency(result.unitBasePrice, sym)}
            </strong>
          </div>
        </div>
      </div>

      {/* Quick GST Reference Table */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200">
        <h3 className="font-display text-sm font-bold text-navy-900 mb-3">
          Quick Slab Comparison for {formatCurrency(Number(priceInput) || 0, sym)} (x
          {Math.max(1, Number(quantityInput) || 1)})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">GST Rate</th>
                <th className="py-2.5 px-4 text-right">Taxable Base</th>
                <th className="py-2.5 px-4 text-right">CGST</th>
                <th className="py-2.5 px-4 text-right">SGST</th>
                <th className="py-2.5 px-4 text-right">Total GST</th>
                <th className="py-2.5 px-4 text-right">Total Incl. GST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {PRESET_SLABS.map((slab) => {
                const row = calculateGSTBreakdown({
                  price: Number(priceInput) || 0,
                  quantity: Math.max(1, Number(quantityInput) || 1),
                  gstRate: slab,
                  mode,
                  supplyType: 'intra',
                });
                return (
                  <tr key={slab} className={slab === gstRate ? 'bg-emerald-50/60' : ''}>
                    <td className="py-2.5 px-4 font-bold text-navy-900">{slab}%</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(row.totalBasePrice, sym)}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(row.cgstAmount, sym)}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(row.sgstAmount, sym)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-700">
                      {formatCurrency(row.totalGstAmount, sym)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-navy-900">
                      {formatCurrency(row.finalTotalAmount, sym)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
