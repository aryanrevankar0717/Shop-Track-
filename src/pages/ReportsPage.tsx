import { Download, FileSpreadsheet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StockStatusLabel } from '../components/StockStatusLabel';
import { useShop } from '../context/ShopContext';
import {
  calculatePeriodMetrics,
  formatCurrency,
  formatDisplayDate,
  formatMonthLabel,
  getLocalDateString,
  getMonthKey,
  getStockStatus,
} from '../utils/calculations';
import {
  exportDailySalesReportExcel,
  exportDailySalesReportPDF,
  exportGstSummaryReportExcel,
  exportGstSummaryReportPDF,
  exportMonthlyIncomeReportExcel,
  exportMonthlyIncomeReportPDF,
  exportProfitLossReportExcel,
  exportProfitLossReportPDF,
  exportStockReportExcel,
  exportStockReportPDF,
} from '../utils/exporters';

type ReportType =
  | 'daily-sales'
  | 'monthly-income'
  | 'stock-availability'
  | 'out-of-stock'
  | 'profit-loss'
  | 'gst-summary';

const REPORT_TABS: Array<{ id: ReportType; title: string; subtitle: string }> = [
  { id: 'daily-sales', title: 'Daily Sales Report', subtitle: 'Sales, GST & profit for a specific date' },
  { id: 'monthly-income', title: 'Monthly Income Report', subtitle: 'Monthly sales, COGS, expenses & profit' },
  { id: 'stock-availability', title: 'Stock Availability Report', subtitle: 'Full inventory quantities & stock valuation' },
  { id: 'out-of-stock', title: 'Out-of-Stock & Low Stock', subtitle: 'Items requiring urgent restock' },
  { id: 'profit-loss', title: 'Profit & Loss Report', subtitle: 'Revenue, COGS, operating expenses & net margin' },
  { id: 'gst-summary', title: 'GST Summary Report', subtitle: 'Taxable turnover & CGST/SGST by GST slab' },
];

export function ReportsPage() {
  const { products, sales, expenses, settings } = useShop();
  const [activeReport, setActiveReport] = useState<ReportType>('daily-sales');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [plScope, setPlScope] = useState<'month' | 'all'>('month');

  const sym = settings.currencySymbol;

  const dailySales = useMemo(
    () => sales.filter((s) => s.date === selectedDate),
    [sales, selectedDate]
  );
  const dailyExpenses = useMemo(
    () => expenses.filter((e) => e.date === selectedDate),
    [expenses, selectedDate]
  );

  const monthSales = useMemo(
    () => sales.filter((s) => s.date.startsWith(selectedMonth)),
    [sales, selectedMonth]
  );
  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(selectedMonth)),
    [expenses, selectedMonth]
  );

  const scopedSales = plScope === 'month' ? monthSales : sales;
  const scopedExpenses = plScope === 'month' ? monthExpenses : expenses;
  const scopedLabel = plScope === 'month' ? formatMonthLabel(selectedMonth) : 'All Recorded Periods';

  const lowOrOutProducts = useMemo(
    () => products.filter((p) => getStockStatus(p) !== 'in-stock'),
    [products]
  );

  const gstSlabSummary = useMemo(() => {
    const map: Record<number, { taxable: number; cgst: number; sgst: number; totalGst: number; total: number }> = {};
    for (const s of scopedSales) {
      for (const item of s.items) {
        if (!map[item.gstRate]) {
          map[item.gstRate] = { taxable: 0, cgst: 0, sgst: 0, totalGst: 0, total: 0 };
        }
        map[item.gstRate].taxable += item.subtotal;
        map[item.gstRate].cgst += item.gstAmount / 2;
        map[item.gstRate].sgst += item.gstAmount / 2;
        map[item.gstRate].totalGst += item.gstAmount;
        map[item.gstRate].total += item.totalAmount;
      }
    }
    return Object.entries(map)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([rate, vals]) => ({ rate: Number(rate), ...vals }));
  }, [scopedSales]);

  const handleDownloadPDF = () => {
    switch (activeReport) {
      case 'daily-sales':
        exportDailySalesReportPDF(selectedDate, dailySales, dailyExpenses, settings);
        break;
      case 'monthly-income':
        exportMonthlyIncomeReportPDF(selectedMonth, monthSales, monthExpenses, settings);
        break;
      case 'stock-availability':
        exportStockReportPDF(products, false, settings);
        break;
      case 'out-of-stock':
        exportStockReportPDF(products, true, settings);
        break;
      case 'profit-loss':
        exportProfitLossReportPDF(scopedLabel, scopedSales, scopedExpenses, settings);
        break;
      case 'gst-summary':
        exportGstSummaryReportPDF(scopedLabel, scopedSales, settings);
        break;
    }
  };

  const handleDownloadExcel = () => {
    switch (activeReport) {
      case 'daily-sales':
        exportDailySalesReportExcel(selectedDate, dailySales, dailyExpenses);
        break;
      case 'monthly-income':
        exportMonthlyIncomeReportExcel(selectedMonth, monthSales, monthExpenses);
        break;
      case 'stock-availability':
        exportStockReportExcel(products, false);
        break;
      case 'out-of-stock':
        exportStockReportExcel(products, true);
        break;
      case 'profit-loss':
        exportProfitLossReportExcel(scopedLabel, scopedSales, scopedExpenses);
        break;
      case 'gst-summary':
        exportGstSummaryReportExcel(scopedLabel, scopedSales);
        break;
    }
  };

  const dailyMetrics = calculatePeriodMetrics(dailySales, dailyExpenses);
  const monthlyMetrics = calculatePeriodMetrics(monthSales, monthExpenses);
  const scopedMetrics = calculatePeriodMetrics(scopedSales, scopedExpenses);

  return (
    <div className="space-y-6">
      {/* Report Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORT_TABS.map((tab) => {
          const active = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReport(tab.id)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                active
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-navy-800/40'
              }`}
            >
              <p className={`font-display text-sm font-bold ${active ? 'text-white' : 'text-navy-900'}`}>
                {tab.title}
              </p>
              <p className={`text-xs mt-1 ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                {tab.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Controls & Export Buttons */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {activeReport === 'daily-sales' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              />
            </div>
          )}

          {activeReport === 'monthly-income' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Select Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              />
            </div>
          )}

          {(activeReport === 'profit-loss' || activeReport === 'gst-summary') && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPlScope('month')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                    plScope === 'month' ? 'bg-navy-900 text-white' : 'text-slate-600'
                  }`}
                >
                  Specific Month
                </button>
                <button
                  type="button"
                  onClick={() => setPlScope('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                    plScope === 'all' ? 'bg-navy-900 text-white' : 'text-slate-600'
                  }`}
                >
                  All Time
                </button>
              </div>
              {plScope === 'month' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                />
              )}
            </div>
          )}

          {(activeReport === 'stock-availability' || activeReport === 'out-of-stock') && (
            <p className="text-sm font-semibold text-navy-900">
              {activeReport === 'out-of-stock'
                ? `${lowOrOutProducts.length} products needing restock`
                : `${products.length} total products in inventory`}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Report Live Preview */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-navy-900">
            {REPORT_TABS.find((t) => t.id === activeReport)?.title} Preview
          </h3>
          <span className="text-xs text-slate-500">
            {activeReport === 'daily-sales'
              ? formatDisplayDate(selectedDate)
              : activeReport === 'monthly-income'
              ? formatMonthLabel(selectedMonth)
              : activeReport === 'profit-loss' || activeReport === 'gst-summary'
              ? scopedLabel
              : 'Live Inventory'}
          </span>
        </div>

        {/* 1. Daily Sales Report Preview */}
        {activeReport === 'daily-sales' && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">Bills</p>
                <p className="font-mono text-lg font-bold text-navy-900 tabular-nums">
                  {dailyMetrics.salesCount}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">Revenue</p>
                <p className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(dailyMetrics.revenue, sym)}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">Expenses</p>
                <p className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {formatCurrency(dailyMetrics.expenses, sym)}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">Net Profit</p>
                <p className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(dailyMetrics.netProfit, sym)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-3 px-4">Receipt</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4 text-right">GST</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailySales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        No sales on {formatDisplayDate(selectedDate)}.
                      </td>
                    </tr>
                  ) : (
                    dailySales.map((s) => (
                      <tr key={s.id}>
                        <td className="py-3 px-4 font-mono text-xs font-semibold">{s.receiptNumber}</td>
                        <td className="py-3 px-4">{s.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}</td>
                        <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">{formatCurrency(s.gstTotal, sym)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">{formatCurrency(s.totalAmount, sym)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Monthly Income Preview */}
        {activeReport === 'monthly-income' && (
          <div className="p-5 sm:p-6">
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg text-sm">
              <div className="p-4 flex justify-between">
                <span className="text-slate-600">Total Monthly Revenue ({monthlyMetrics.salesCount} sales)</span>
                <span className="font-mono font-bold text-navy-900 tabular-nums">{formatCurrency(monthlyMetrics.revenue, sym)}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-slate-600">GST Collected</span>
                <span className="font-mono font-semibold text-slate-700 tabular-nums">{formatCurrency(monthlyMetrics.gstCollected, sym)}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-slate-600">Product Cost (COGS)</span>
                <span className="font-mono font-semibold text-slate-700 tabular-nums">{formatCurrency(monthlyMetrics.cogs, sym)}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-slate-600">Monthly Gross Profit</span>
                <span className="font-mono font-bold text-emerald-700 tabular-nums">{formatCurrency(monthlyMetrics.grossProfit, sym)}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-slate-600">Monthly Operating Expenses</span>
                <span className="font-mono font-semibold text-slate-700 tabular-nums">{formatCurrency(monthlyMetrics.expenses, sym)}</span>
              </div>
              <div className="p-4 flex justify-between bg-slate-50 font-bold">
                <span className="text-navy-900">Monthly Net Profit</span>
                <span className={`font-mono tabular-nums ${monthlyMetrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(monthlyMetrics.netProfit, sym)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3 & 4. Stock Reports Preview */}
        {(activeReport === 'stock-availability' || activeReport === 'out-of-stock') && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-5">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Available Qty</th>
                  <th className="py-3 px-4 text-right">Min Limit</th>
                  <th className="py-3 px-4 text-right">Stock Cost Value</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeReport === 'out-of-stock' ? lowOrOutProducts : products).map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-5 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{p.category}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 tabular-nums">
                      {p.minStockLimit} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                      {formatCurrency(p.purchasePrice * p.quantity, sym)}
                    </td>
                    <td className="py-3 px-5">
                      <StockStatusLabel status={getStockStatus(p)} />
                    </td>
                  </tr>
                ))}
                {activeReport === 'out-of-stock' && lowOrOutProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-emerald-700 font-semibold">
                      All products are currently well stocked!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Profit & Loss Preview */}
        {activeReport === 'profit-loss' && (
          <div className="p-5 sm:p-6">
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg text-sm">
              <div className="p-4 flex justify-between">
                <span className="text-slate-600">Gross Revenue (Incl. GST)</span>
                <span className="font-mono font-bold text-navy-900 tabular-nums">{formatCurrency(scopedMetrics.revenue, sym)}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-slate-600">Less: GST Collected</span>
                <span className="font-mono text-slate-600 tabular-nums">-{formatCurrency(scopedMetrics.gstCollected, sym)}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-slate-600">Net Sales (Excl. GST)</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">{formatCurrency(scopedMetrics.subtotal - scopedMetrics.discounts, sym)}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-slate-600">Less: Cost of Goods Sold (COGS)</span>
                <span className="font-mono text-slate-600 tabular-nums">-{formatCurrency(scopedMetrics.cogs, sym)}</span>
              </div>
              <div className="p-4 flex justify-between font-semibold">
                <span className="text-slate-800">Gross Profit</span>
                <span className="font-mono text-emerald-700 tabular-nums">{formatCurrency(scopedMetrics.grossProfit, sym)}</span>
              </div>
              <div className="p-4 flex justify-between">
                <span className="text-slate-600">Less: Operating Expenses</span>
                <span className="font-mono text-slate-600 tabular-nums">-{formatCurrency(scopedMetrics.expenses, sym)}</span>
              </div>
              <div className="p-4 flex justify-between bg-slate-50 font-bold text-base">
                <span className="text-navy-900">Net Profit / (Loss)</span>
                <span className={`font-mono tabular-nums ${scopedMetrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(scopedMetrics.netProfit, sym)} ({scopedMetrics.marginPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 6. GST Summary Preview */}
        {activeReport === 'gst-summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-5">GST Slab</th>
                  <th className="py-3 px-4 text-right">Taxable Value</th>
                  <th className="py-3 px-4 text-right">CGST</th>
                  <th className="py-3 px-4 text-right">SGST</th>
                  <th className="py-3 px-4 text-right">Total GST</th>
                  <th className="py-3 px-5 text-right">Invoice Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {gstSlabSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center font-sans text-slate-500">
                      No taxable sales recorded for {scopedLabel}.
                    </td>
                  </tr>
                ) : (
                  gstSlabSummary.map((row) => (
                    <tr key={row.rate}>
                      <td className="py-3 px-5 font-bold text-navy-900">{row.rate}%</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(row.taxable, sym)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(row.cgst, sym)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(row.sgst, sym)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {formatCurrency(row.totalGst, sym)}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-navy-900">
                        {formatCurrency(row.total, sym)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
