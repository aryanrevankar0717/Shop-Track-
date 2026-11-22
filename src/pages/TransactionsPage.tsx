import { Download, Eye, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Sale } from '../types/shop';
import {
  formatCurrency,
  formatDisplayDate,
  getLocalDateString,
  getMonthKey,
  shiftDateString,
} from '../utils/calculations';
import { exportReceiptPDF } from '../utils/exporters';

type PeriodFilter = 'all' | 'daily' | 'weekly' | 'monthly';

export function TransactionsPage() {
  const { sales, settings } = useShop();
  const today = getLocalDateString();

  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [dailyDate, setDailyDate] = useState(today);
  const [monthlyKey, setMonthlyKey] = useState(getMonthKey());
  const [search, setSearch] = useState('');
  const [inspectSale, setInspectSale] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    const weekStart = shiftDateString(today, -6);
    const q = search.trim().toLowerCase();

    return [...sales]
      .filter((s) => {
        if (period === 'daily' && s.date !== dailyDate) return false;
        if (period === 'weekly' && (s.date < weekStart || s.date > today)) return false;
        if (period === 'monthly' && !s.date.startsWith(monthlyKey)) return false;
        if (!q) return true;
        return (
          s.receiptNumber.toLowerCase().includes(q) ||
          s.paymentMethod.toLowerCase().includes(q) ||
          s.note.toLowerCase().includes(q) ||
          s.items.some((i) => i.productName.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [dailyDate, monthlyKey, period, sales, search, today]);

  const totals = useMemo(() => {
    return filteredSales.reduce(
      (acc, s) => {
        acc.revenue += s.totalAmount;
        acc.gst += s.gstTotal;
        return acc;
      },
      { revenue: 0, gst: 0 }
    );
  }, [filteredSales]);

  const sym = settings.currencySymbol;

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'daily', 'weekly', 'monthly'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                  period === p
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'weekly' ? 'Weekly (7d)' : p}
              </button>
            ))}
          </div>

          {period === 'daily' && (
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
            />
          )}

          {period === 'monthly' && (
            <input
              type="month"
              value={monthlyKey}
              onChange={(e) => setMonthlyKey(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
            />
          )}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt, product, payment..."
            className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Matching Transactions</p>
          <p className="mt-1 font-mono text-2xl font-bold text-navy-900 tabular-nums">
            {filteredSales.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Total Sales Value</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {formatCurrency(totals.revenue, sym)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Total GST Collected</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totals.gst, sym)}
          </p>
        </div>
      </div>

      {/* Mobile Transaction Cards */}
      <div className="md:hidden space-y-3">
        {filteredSales.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
            No transactions match the selected filter.
          </div>
        ) : (
          filteredSales.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-navy-900">
                    {s.receiptNumber} · {s.paymentMethod}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDisplayDate(s.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-base font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(s.totalAmount, sym)}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                    GST: {formatCurrency(s.gstTotal, sym)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-700 line-clamp-2">
                {s.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspectSale(s)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 text-xs font-semibold text-navy-900 bg-slate-100 rounded-lg"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportReceiptPDF(s, settings)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 text-xs font-semibold text-white bg-emerald-700 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Transactions Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-5">Receipt #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Products &amp; Quantities</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">GST Amount</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-navy-900 whitespace-nowrap">
                      {s.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {formatDisplayDate(s.date)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 max-w-md">
                      <p className="truncate">
                        {s.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
                      </p>
                      {s.note && <p className="text-xs text-slate-400 truncate">{s.note}</p>}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {s.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {formatCurrency(s.gstTotal, sym)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                      {formatCurrency(s.totalAmount, sym)}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setInspectSale(s)}
                          className="p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100"
                          aria-label={`View receipt ${s.receiptNumber}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => exportReceiptPDF(s, settings)}
                          className="p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                          aria-label={`Download PDF ${s.receiptNumber}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Inspection Modal */}
      {inspectSale && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-[2px] sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-xl border border-slate-200 shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 sm:px-6 py-4 bg-navy-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display text-base font-bold">
                  Receipt {inspectSale.receiptNumber}
                </h3>
                <p className="text-xs text-slate-300">
                  {formatDisplayDate(inspectSale.date)} · {inspectSale.paymentMethod}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectSale(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {inspectSale.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{item.productName}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {item.quantity} {item.unit} × {formatCurrency(item.sellingPrice, sym)} (GST{' '}
                        {item.gstRate}%)
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-navy-900 tabular-nums shrink-0">
                      {formatCurrency(item.totalAmount, sym)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-sm border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(inspectSale.subtotal, sym)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Total</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(inspectSale.gstTotal, sym)}
                  </span>
                </div>
                {inspectSale.discount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount</span>
                    <span className="font-mono tabular-nums">
                      -{formatCurrency(inspectSale.discount, sym)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-navy-900 pt-2 border-t border-slate-100">
                  <span>Grand Total</span>
                  <span className="font-mono text-emerald-700 tabular-nums">
                    {formatCurrency(inspectSale.totalAmount, sym)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => exportReceiptPDF(inspectSale, settings)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Receipt PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
