import { useMemo, useState } from 'react';
import {
  InteractiveAreaChart,
  InteractiveBarChart,
} from '../components/charts/InteractiveCharts';
import { useShop } from '../context/ShopContext';
import {
  formatDisplayDate,
  formatMonthLabel,
  getDailySeries,
  getLocalDateString,
  getMonthlySeries,
  getWeeklySeries,
  shiftDateString,
} from '../utils/calculations';

type RangePreset = '7d' | '14d' | '30d' | 'custom';

export function IncomeGraphsPage() {
  const { sales, expenses, settings } = useShop();
  const today = getLocalDateString();

  const [preset, setPreset] = useState<RangePreset>('14d');
  const [customStart, setCustomStart] = useState(shiftDateString(today, -29));
  const [customEnd, setCustomEnd] = useState(today);
  const [monthCount, setMonthCount] = useState<6 | 12>(6);

  const { startDate, endDate } = useMemo(() => {
    if (preset === '7d') return { startDate: shiftDateString(today, -6), endDate: today };
    if (preset === '14d') return { startDate: shiftDateString(today, -13), endDate: today };
    if (preset === '30d') return { startDate: shiftDateString(today, -29), endDate: today };
    return {
      startDate: customStart <= customEnd ? customStart : customEnd,
      endDate: customEnd >= customStart ? customEnd : customStart,
    };
  }, [customEnd, customStart, preset, today]);

  const dailyData = useMemo(
    () =>
      getDailySeries(sales, expenses, startDate, endDate).map((d) => ({
        label: d.label,
        tooltipTitle: formatDisplayDate(d.date),
        revenue: d.revenue,
        expenses: d.expenses,
        netProfit: d.netProfit,
      })),
    [endDate, expenses, sales, startDate]
  );

  const weeklyData = useMemo(
    () =>
      getWeeklySeries(sales, expenses, 8, endDate).map((w) => ({
        label: w.label,
        tooltipTitle: w.range,
        revenue: w.revenue,
        netProfit: w.netProfit,
      })),
    [endDate, expenses, sales]
  );

  const monthlyData = useMemo(
    () =>
      getMonthlySeries(sales, expenses, monthCount).map((m) => ({
        label: m.label,
        tooltipTitle: formatMonthLabel(m.monthKey),
        revenue: m.revenue,
        grossProfit: m.grossProfit,
        netProfit: m.netProfit,
        expenses: m.expenses,
      })),
    [expenses, monthCount, sales]
  );

  const sym = settings.currencySymbol;

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Daily Range:</span>
          {(['7d', '14d', '30d', 'custom'] as RangePreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                preset === p
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p === '7d'
                ? 'Last 7 Days'
                : p === '14d'
                ? 'Last 14 Days'
                : p === '30d'
                ? 'Last 30 Days'
                : 'Custom Dates'}
            </button>
          ))}

          {preset === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Monthly Window:</span>
          <button
            type="button"
            onClick={() => setMonthCount(6)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              monthCount === 6
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            6 Months
          </button>
          <button
            type="button"
            onClick={() => setMonthCount(12)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              monthCount === 12
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            12 Months
          </button>
        </div>
      </div>

      {/* 6 Required Interactive Graphs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 1. Daily Income Graph */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-display text-base font-bold text-navy-900">1. Daily Income Graph</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Daily sales revenue from {formatDisplayDate(startDate)} to {formatDisplayDate(endDate)}
          </p>
          <InteractiveAreaChart
            data={dailyData}
            seriesKey="revenue"
            seriesLabel="Daily Income"
            color="#16A34A"
            currencySymbol={sym}
            height={230}
          />
        </div>

        {/* 2. Weekly Sales Graph */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-display text-base font-bold text-navy-900">2. Weekly Sales Graph</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            8-week rolling sales revenue performance
          </p>
          <InteractiveBarChart
            data={weeklyData}
            series={[{ key: 'revenue', label: 'Weekly Sales', color: '#0F2544' }]}
            currencySymbol={sym}
            height={230}
          />
        </div>

        {/* 3. Monthly Income Graph */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-display text-base font-bold text-navy-900">3. Monthly Income Graph</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Total revenue across the last {monthCount} months
          </p>
          <InteractiveBarChart
            data={monthlyData}
            series={[{ key: 'revenue', label: 'Monthly Income', color: '#16A34A' }]}
            currencySymbol={sym}
            height={230}
          />
        </div>

        {/* 4. Monthly Profit Graph */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-display text-base font-bold text-navy-900">4. Monthly Profit Graph</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Gross profit vs net profit after expenses
          </p>
          <InteractiveBarChart
            data={monthlyData}
            series={[
              { key: 'grossProfit', label: 'Gross Profit', color: '#0F2544' },
              { key: 'netProfit', label: 'Net Profit', color: '#16A34A' },
            ]}
            currencySymbol={sym}
            height={230}
          />
        </div>

        {/* 5. Monthly Expense Graph */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-display text-base font-bold text-navy-900">5. Monthly Expense Graph</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Operating expenses across the last {monthCount} months
          </p>
          <InteractiveAreaChart
            data={monthlyData}
            seriesKey="expenses"
            seriesLabel="Monthly Expenses"
            color="#D97706"
            currencySymbol={sym}
            height={230}
          />
        </div>

        {/* 6. Sales Comparison Graph */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200">
          <h3 className="font-display text-base font-bold text-navy-900">
            6. Sales Comparison Graph
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Side-by-side comparison of Monthly Income, Expenses, and Net Profit
          </p>
          <InteractiveBarChart
            data={monthlyData}
            series={[
              { key: 'revenue', label: 'Income', color: '#0F2544' },
              { key: 'expenses', label: 'Expenses', color: '#D97706' },
              { key: 'netProfit', label: 'Net Profit', color: '#16A34A' },
            ]}
            currencySymbol={sym}
            height={230}
          />
        </div>
      </div>
    </div>
  );
}
