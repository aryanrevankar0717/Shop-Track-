import { ArrowDownRight, ArrowUpRight, Download, FileSpreadsheet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { InteractiveBarChart } from '../components/charts/InteractiveCharts';
import { useShop } from '../context/ShopContext';
import {
  calculatePeriodMetrics,
  formatCurrency,
  formatDisplayDate,
  formatMonthLabel,
  getMonthKey,
  getMonthlySeries,
} from '../utils/calculations';
import {
  exportMonthlyIncomeReportExcel,
  exportMonthlyIncomeReportPDF,
} from '../utils/exporters';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getPreviousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 2, 1);
  return getMonthKey(dt);
}

export function MonthlyIncomePage() {
  const { sales, expenses, settings } = useShop();

  const currentMonthKey = getMonthKey();
  const [selectedYear, setSelectedYear] = useState(Number(currentMonthKey.split('-')[0]));
  const [selectedMonthNum, setSelectedMonthNum] = useState(Number(currentMonthKey.split('-')[1]));

  const selectedMonthKey = `${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}`;
  const [compareMonthKey, setCompareMonthKey] = useState(getPreviousMonthKey(currentMonthKey));

  const yearOptions = useMemo(() => {
    const yrs = new Set<number>([new Date().getFullYear(), new Date().getFullYear() - 1]);
    for (const s of sales) yrs.add(Number(s.date.slice(0, 4)));
    for (const e of expenses) yrs.add(Number(e.date.slice(0, 4)));
    return Array.from(yrs).sort((a, b) => b - a);
  }, [expenses, sales]);

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([selectedMonthKey, getPreviousMonthKey(selectedMonthKey)]);
    for (const s of sales) keys.add(s.date.slice(0, 7));
    for (const e of expenses) keys.add(e.date.slice(0, 7));
    return Array.from(keys).sort().reverse();
  }, [expenses, sales, selectedMonthKey]);

  const selectedSales = useMemo(
    () => sales.filter((s) => s.date.startsWith(selectedMonthKey)),
    [sales, selectedMonthKey]
  );
  const selectedExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(selectedMonthKey)),
    [expenses, selectedMonthKey]
  );
  const metrics = useMemo(
    () => calculatePeriodMetrics(selectedSales, selectedExpenses),
    [selectedExpenses, selectedSales]
  );

  const compareSales = useMemo(
    () => sales.filter((s) => s.date.startsWith(compareMonthKey)),
    [sales, compareMonthKey]
  );
  const compareExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(compareMonthKey)),
    [expenses, compareMonthKey]
  );
  const compareMetrics = useMemo(
    () => calculatePeriodMetrics(compareSales, compareExpenses),
    [compareExpenses, compareSales]
  );

  const sixMonthSeries = useMemo(
    () =>
      getMonthlySeries(sales, expenses, 6, selectedMonthKey).map((m) => ({
        label: m.label,
        tooltipTitle: formatMonthLabel(m.monthKey),
        revenue: m.revenue,
        grossProfit: m.grossProfit,
        netProfit: m.netProfit,
      })),
    [expenses, sales, selectedMonthKey]
  );

  const dailyRows = useMemo(() => {
    const map = new Map<string, { salesCount: number; revenue: number; gst: number; cogs: number; expenses: number }>();
    for (const s of selectedSales) {
      const cur = map.get(s.date) || { salesCount: 0, revenue: 0, gst: 0, cogs: 0, expenses: 0 };
      cur.salesCount += 1;
      cur.revenue += s.totalAmount;
      cur.gst += s.gstTotal;
      cur.cogs += s.totalCost;
      map.set(s.date, cur);
    }
    for (const e of selectedExpenses) {
      const cur = map.get(e.date) || { salesCount: 0, revenue: 0, gst: 0, cogs: 0, expenses: 0 };
      cur.expenses += e.amount;
      map.set(e.date, cur);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, v]) => ({
        date,
        ...v,
        netProfit: v.revenue - v.gst - v.cogs - v.expenses,
      }));
  }, [selectedExpenses, selectedSales]);

  const sym = settings.currencySymbol;

  const pctDelta = (curr: number, prev: number) => {
    if (prev === 0) return curr === 0 ? 0 : 100;
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  const revDelta = pctDelta(metrics.revenue, compareMetrics.revenue);
  const profitDelta = pctDelta(metrics.netProfit, compareMetrics.netProfit);

  return (
    <div className="space-y-6">
      {/* Month & Year Picker + Export Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Month</label>
            <select
              value={selectedMonthNum}
              onChange={(e) => setSelectedMonthNum(Number(e.target.value))}
              className="px-3.5 py-2 text-sm font-medium border border-slate-200 rounded-lg bg-white"
            >
              {MONTH_NAMES.map((mName, idx) => (
                <option key={mName} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3.5 py-2 text-sm font-mono font-medium border border-slate-200 rounded-lg bg-white"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              exportMonthlyIncomeReportPDF(selectedMonthKey, selectedSales, selectedExpenses, settings)
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={() =>
              exportMonthlyIncomeReportExcel(selectedMonthKey, selectedSales, selectedExpenses)
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      {/* Key Monthly Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Monthly Income</p>
          <p className="mt-2 font-mono text-2xl font-bold text-navy-900 tabular-nums">
            {formatCurrency(metrics.revenue, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {metrics.salesCount} sales · {metrics.unitsSold} units
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Product Cost (COGS)</p>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-800 tabular-nums">
            {formatCurrency(metrics.cogs, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            GST Collected: {formatCurrency(metrics.gstCollected, sym)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Monthly Gross Profit</p>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {formatCurrency(metrics.grossProfit, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Net Sales minus COGS</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Monthly Expenses</p>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(metrics.expenses, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{selectedExpenses.length} expense entries</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Monthly Net Profit</p>
          <p
            className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
              metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatCurrency(metrics.netProfit, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Margin: {metrics.marginPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Month Comparison + 6-Month Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-navy-900">Month Comparison</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare {formatMonthLabel(selectedMonthKey)} against another month
              </p>
            </div>
            <select
              value={compareMonthKey}
              onChange={(e) => setCompareMonthKey(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white"
              aria-label="Comparison month"
            >
              {monthOptions.map((mk) => (
                <option key={mk} value={mk}>
                  {formatMonthLabel(mk)}
                </option>
              ))}
            </select>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Monthly Revenue</p>
                <p className="font-mono font-bold text-navy-900 tabular-nums mt-0.5">
                  {formatCurrency(metrics.revenue, sym)}
                </p>
                <p className="text-xs text-slate-400 tabular-nums">
                  vs {formatCurrency(compareMetrics.revenue, sym)}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums ${
                  revDelta >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {revDelta >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(revDelta).toFixed(1)}%
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Net Profit</p>
                <p className="font-mono font-bold text-emerald-700 tabular-nums mt-0.5">
                  {formatCurrency(metrics.netProfit, sym)}
                </p>
                <p className="text-xs text-slate-400 tabular-nums">
                  vs {formatCurrency(compareMetrics.netProfit, sym)}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums ${
                  profitDelta >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {profitDelta >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(profitDelta).toFixed(1)}%
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Monthly Sales Count</p>
                <p className="font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                  {metrics.salesCount} bills
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                vs {compareMetrics.salesCount} bills
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Monthly Expenses</p>
                <p className="font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                  {formatCurrency(metrics.expenses, sym)}
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                vs {formatCurrency(compareMetrics.expenses, sym)}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-display text-base font-bold text-navy-900">
            6-Month Income &amp; Profit Trajectory
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Ending {formatMonthLabel(selectedMonthKey)}
          </p>
          <InteractiveBarChart
            data={sixMonthSeries}
            series={[
              { key: 'revenue', label: 'Monthly Income', color: '#0F2544' },
              { key: 'grossProfit', label: 'Gross Profit', color: '#16A34A' },
              { key: 'netProfit', label: 'Net Profit', color: '#0EA5E9' },
            ]}
            currencySymbol={sym}
            height={250}
          />
        </div>
      </div>

      {/* Detailed Day-by-Day Table for Selected Month */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200">
          <h3 className="font-display text-base font-bold text-navy-900">
            Detailed Activity — {formatMonthLabel(selectedMonthKey)}
          </h3>
        </div>
        {/* Mobile Day-by-Day Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {dailyRows.length === 0 ? (
            <div className="py-8 px-4 text-center text-sm text-slate-500">
              No sales or expenses recorded in {formatMonthLabel(selectedMonthKey)}.
            </div>
          ) : (
            dailyRows.map((row) => (
              <div key={row.date} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-navy-900">
                    {formatDisplayDate(row.date)} · {row.salesCount} bills
                  </span>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      row.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(row.netProfit, sym)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
                  <span>Rev: {formatCurrency(row.revenue, sym)}</span>
                  <span>COGS: {formatCurrency(row.cogs, sym)}</span>
                  <span className="text-right">Exp: {formatCurrency(row.expenses, sym)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-4 text-right">Bills</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">COGS</th>
                <th className="py-3 px-4 text-right">Expenses</th>
                <th className="py-3 px-5 text-right">Daily Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {dailyRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No sales or expenses recorded in {formatMonthLabel(selectedMonthKey)}.
                  </td>
                </tr>
              ) : (
                dailyRows.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50/70">
                    <td className="py-3 px-5 font-medium text-slate-800 whitespace-nowrap">
                      {formatDisplayDate(row.date)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                      {row.salesCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-navy-900 tabular-nums">
                      {formatCurrency(row.revenue, sym)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                      {formatCurrency(row.gst, sym)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                      {formatCurrency(row.cogs, sym)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                      {formatCurrency(row.expenses, sym)}
                    </td>
                    <td
                      className={`py-3 px-5 text-right font-mono font-bold tabular-nums ${
                        row.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(row.netProfit, sym)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
