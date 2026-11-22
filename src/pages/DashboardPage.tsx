import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Calculator,
  CalendarDays,
  IndianRupee,
  Package,
  PlusCircle,
  ShoppingBag,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useMemo } from 'react';
import { InteractiveBarChart } from '../components/charts/InteractiveCharts';
import { StockStatusLabel } from '../components/StockStatusLabel';
import { useShop } from '../context/ShopContext';
import {
  calculatePeriodMetrics,
  formatCurrency,
  formatDisplayDate,
  formatMonthLabel,
  formatNumber,
  getDailySeries,
  getLocalDateString,
  getMonthKey,
  getStockStatus,
  shiftDateString,
} from '../utils/calculations';

export function DashboardPage() {
  const {
    products,
    sales,
    expenses,
    settings,
    setActivePage,
    setStockFilterHint,
    setOpenQuickProductModal,
  } = useShop();

  const today = getLocalDateString();
  const currentMonth = getMonthKey();

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStockUnits = products.reduce((sum, p) => sum + p.quantity, 0);
    const outOfStockCount = products.filter((p) => getStockStatus(p) === 'out-of-stock').length;
    const lowStockCount = products.filter((p) => getStockStatus(p) === 'low-stock').length;

    const todaySales = sales.filter((s) => s.date === today);
    const todayExpenses = expenses.filter((e) => e.date === today);
    const todayMetrics = calculatePeriodMetrics(todaySales, todayExpenses);

    const monthSales = sales.filter((s) => s.date.startsWith(currentMonth));
    const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
    const monthMetrics = calculatePeriodMetrics(monthSales, monthExpenses);

    return {
      totalProducts,
      totalStockUnits,
      outOfStockCount,
      lowStockCount,
      todaySalesCount: todayMetrics.salesCount,
      todayUnitsSold: todayMetrics.unitsSold,
      todayIncome: todayMetrics.revenue,
      monthlyIncome: monthMetrics.revenue,
      monthlyExpenses: monthMetrics.expenses,
      monthlyProfit: monthMetrics.netProfit,
      monthlySalesCount: monthMetrics.salesCount,
    };
  }, [currentMonth, expenses, products, sales, today]);

  const sevenDayData = useMemo(() => {
    const start = shiftDateString(today, -6);
    return getDailySeries(sales, expenses, start, today).map((d) => ({
      label: d.label,
      tooltipTitle: formatDisplayDate(d.date),
      revenue: d.revenue,
      expenses: d.expenses,
    }));
  }, [expenses, sales, today]);

  const alertProducts = useMemo(() => {
    return products
      .filter((p) => getStockStatus(p) !== 'in-stock')
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 6);
  }, [products]);

  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, [sales]);

  const sym = settings.currencySymbol;

  return (
    <div className="space-y-6">
      {/* Quick Action Bar */}
      <div className="bg-navy-900 rounded-xl p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white border-[#cc3131]">
            {settings.shopName}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setActivePage('daily-sales')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Sale</span>
          </button>
          <button
            type="button"
            onClick={() => setOpenQuickProductModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg transition-colors whitespace-nowrap"
          >
            <Package className="w-4 h-4" />
            <span>Add Product</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('gst-calculator')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg transition-colors whitespace-nowrap"
          >
            <Calculator className="w-4 h-4" />
            <span>GST Calculator</span>
          </button>
        </div>
      </div>

      {/* 9 Required Summary Cards (2-col compact on mobile, 3x3 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* 1. Total Products Added */}
        <button
          type="button"
          onClick={() => setActivePage('products')}
          className="text-left bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-navy-800/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">Total Products</span>
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 text-navy-900 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-2.5 sm:mt-3 font-mono text-xl sm:text-2xl font-bold text-navy-900 tabular-nums">
            {formatNumber(stats.totalProducts)}
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-slate-500">Active items in catalogue</p>
        </button>

        {/* 2. Total Stock Available */}
        <button
          type="button"
          onClick={() => {
            setStockFilterHint('all');
            setActivePage('stock');
          }}
          className="text-left bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-navy-800/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">Stock Available</span>
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 text-navy-900 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-2.5 sm:mt-3 font-mono text-xl sm:text-2xl font-bold text-navy-900 tabular-nums">
            {formatNumber(stats.totalStockUnits)}
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-slate-500">Units on shelves</p>
        </button>

        {/* 3. Total Sales Today */}
        <button
          type="button"
          onClick={() => setActivePage('daily-sales')}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-navy-800/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Sales Today</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-navy-900 tabular-nums">
            {formatNumber(stats.todaySalesCount)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {formatNumber(stats.todayUnitsSold)} units sold today
          </p>
        </button>

        {/* 4. Total Income Today */}
        <button
          type="button"
          onClick={() => setActivePage('daily-sales')}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-600/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Income Today</span>
            <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {formatCurrency(stats.todayIncome, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Today&apos;s gross sales revenue</p>
        </button>

        {/* 5. Monthly Income */}
        <button
          type="button"
          onClick={() => setActivePage('monthly-income')}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-navy-800/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Monthly Income</span>
            <span className="w-9 h-9 rounded-lg bg-slate-100 text-navy-900 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-navy-900 tabular-nums">
            {formatCurrency(stats.monthlyIncome, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {stats.monthlySalesCount} orders in {formatMonthLabel(currentMonth)}
          </p>
        </button>

        {/* 6. Total Expenses (Monthly) */}
        <button
          type="button"
          onClick={() => setActivePage('daily-sales')}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-navy-800/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Expenses</span>
            <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(stats.monthlyExpenses, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Operating expenses this month</p>
        </button>

        {/* 7. Monthly Profit */}
        <button
          type="button"
          onClick={() => setActivePage('monthly-income')}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-600/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Monthly Profit</span>
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                stats.monthlyProfit >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p
            className={`mt-3 font-mono text-2xl font-bold tabular-nums ${
              stats.monthlyProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatCurrency(stats.monthlyProfit, sym)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Net profit after COGS &amp; expenses</p>
        </button>

        {/* 8. Products Out of Stock */}
        <button
          type="button"
          onClick={() => {
            setStockFilterHint('out-of-stock');
            setActivePage('stock');
          }}
          className="text-left bg-white p-5 rounded-xl border border-slate-200 hover:border-red-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Products Out of Stock</span>
            <span className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <p
            className={`mt-3 font-mono text-2xl font-bold tabular-nums ${
              stats.outOfStockCount > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {formatNumber(stats.outOfStockCount)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.outOfStockCount > 0 ? 'Needs immediate restocking' : 'All products available'}
          </p>
        </button>

        {/* 9. Products Running Low on Stock */}
        <button
          type="button"
          onClick={() => {
            setStockFilterHint('low-stock');
            setActivePage('stock');
          }}
          className="col-span-2 lg:col-span-1 text-left bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">Products Low on Stock</span>
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p
            className={`mt-2.5 sm:mt-3 font-mono text-xl sm:text-2xl font-bold tabular-nums ${
              stats.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {formatNumber(stats.lowStockCount)}
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
            {stats.lowStockCount > 0 ? 'At or below minimum stock limit' : 'Healthy inventory buffer'}
          </p>
        </button>
      </div>

      {/* Main Content Split: 7-Day Revenue Chart + Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display text-base font-bold text-navy-900">
                7-Day Sales &amp; Expense Trend
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily cash inflow vs operating expenses over the past week
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('income-graphs')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 hover:text-emerald-700 transition-colors whitespace-nowrap"
            >
              <span>All Graphs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <InteractiveBarChart
            data={sevenDayData}
            series={[
              { key: 'revenue', label: 'Daily Income', color: '#16A34A' },
              { key: 'expenses', label: 'Expenses', color: '#0F2544' },
            ]}
            currencySymbol={sym}
            height={240}
          />
        </div>

        {/* Low & Out of Stock Alerts Panel */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display text-base font-bold text-navy-900">
                Stock Attention Needed
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Products at zero or below minimum limit
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('notifications')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 hover:text-emerald-700 transition-colors whitespace-nowrap"
            >
              <span>Alert Centre</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {alertProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm font-semibold text-emerald-700">All Stock Levels Healthy</p>
              <p className="text-xs text-slate-500 mt-1">
                Every product is currently above its minimum stock threshold.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {alertProducts.map((p) => {
                const st = getStockStatus(p);
                return (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.category} · Min limit: {p.minStockLimit} {p.unit}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                        {p.quantity} {p.unit}
                      </p>
                      <StockStatusLabel status={st} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setStockFilterHint('low-stock');
              setActivePage('stock');
            }}
            className="mt-4 w-full py-2.5 text-xs font-semibold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Manage &amp; Restock Inventory
          </button>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-navy-900">Recent Sales</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest recorded counter bills</p>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('transactions')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 hover:text-emerald-700 transition-colors whitespace-nowrap"
          >
            <span>View All Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {recentSales.length === 0 ? (
            <div className="py-8 px-4 text-center text-sm text-slate-500">
              No sales recorded yet. Tap &ldquo;Sale&rdquo; below to log your first sale.
            </div>
          ) : (
            recentSales.map((sale) => (
              <div key={sale.id} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-navy-900">
                    {sale.receiptNumber} · {sale.paymentMethod}
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(sale.totalAmount, sym)}
                  </span>
                </div>
                <p className="text-xs text-slate-700 line-clamp-2">
                  {sale.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{formatDisplayDate(sale.date)}</span>
                  <span>GST: {formatCurrency(sale.gstTotal, sym)}</span>
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
                <th className="py-3 px-5">Receipt</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Products Sold</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No sales recorded yet. Click &ldquo;Record Sale&rdquo; to log your first sale.
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-semibold text-navy-900 whitespace-nowrap">
                      {sale.receiptNumber}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {formatDisplayDate(sale.date)}
                    </td>
                    <td className="py-3 px-4 text-slate-800 max-w-xs truncate">
                      {sale.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {sale.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {formatCurrency(sale.gstTotal, sym)}
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                      {formatCurrency(sale.totalAmount, sym)}
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
