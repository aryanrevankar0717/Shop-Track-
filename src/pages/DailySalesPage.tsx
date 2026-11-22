import { Calendar, Plus, Receipt, Trash2, Wallet } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useShop } from '../context/ShopContext';
import { ExpenseCategory, Sale } from '../types/shop';
import {
  calculatePeriodMetrics,
  formatCurrency,
  formatDisplayDate,
  getLocalDateString,
  roundMoney,
} from '../utils/calculations';

interface CartLine {
  productId: string;
  quantity: number;
  sellingPrice: number;
  gstRate: number;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Rent',
  'Electricity & Utilities',
  'Transport & Delivery',
  'Packaging',
  'Staff Wages',
  'Maintenance',
  'Stock Purchase',
  'Other',
];

export function DailySalesPage() {
  const {
    products,
    sales,
    expenses,
    settings,
    recordSale,
    deleteSale,
    addExpense,
    deleteExpense,
  } = useShop();

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  // Sale Builder State
  const availableProducts = useMemo(
    () => products.filter((p) => p.quantity > 0).sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );

  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [lineQty, setLineQty] = useState('1');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Cash');
  const [saleNote, setSaleNote] = useState('');
  const [saleError, setSaleError] = useState('');

  // Expense Form State
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Transport & Delivery');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Confirm delete sale
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const sym = settings.currencySymbol;
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const activeProdId = selectedProdId || availableProducts[0]?.id || '';
  const activeProd = productMap.get(activeProdId);

  const handleAddToCart = () => {
    setSaleError('');
    if (!activeProd) {
      setSaleError('Please select an in-stock product.');
      return;
    }
    const qty = Math.max(1, Math.floor(Number(lineQty) || 1));
    const existing = cart.find((c) => c.productId === activeProd.id);
    const totalRequested = qty + (existing?.quantity || 0);

    if (totalRequested > activeProd.quantity) {
      setSaleError(
        `Only ${activeProd.quantity} ${activeProd.unit} of "${activeProd.name}" available in stock.`
      );
      return;
    }

    if (existing) {
      setCart((prev) =>
        prev.map((c) =>
          c.productId === activeProd.id ? { ...c, quantity: c.quantity + qty } : c
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          productId: activeProd.id,
          quantity: qty,
          sellingPrice: activeProd.sellingPrice,
          gstRate: activeProd.gstRate,
        },
      ]);
    }
    setLineQty('1');
  };

  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let gstTotal = 0;
    for (const line of cart) {
      const sub = roundMoney(line.sellingPrice * line.quantity);
      const gst = roundMoney((sub * line.gstRate) / 100);
      subtotal += sub;
      gstTotal += gst;
    }
    const disc = Math.max(0, Number(discount) || 0);
    const grandTotal = Math.max(0, roundMoney(subtotal + gstTotal - disc));
    return { subtotal: roundMoney(subtotal), gstTotal: roundMoney(gstTotal), disc, grandTotal };
  }, [cart, discount]);

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError('');
    if (cart.length === 0) {
      setSaleError('Add at least one product to the sale bill.');
      return;
    }

    const res = recordSale({
      date: selectedDate,
      items: cart,
      discount: Number(discount) || 0,
      paymentMethod,
      note: saleNote,
    });

    if (res) {
      setCart([]);
      setDiscount('0');
      setSaleNote('');
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expAmount);
    if (!amt || amt <= 0) return;
    addExpense({
      date: selectedDate,
      category: expCategory,
      amount: amt,
      description: expDesc || expCategory,
    });
    setExpAmount('');
    setExpDesc('');
  };

  // Metrics for selected date
  const dateSales = useMemo(
    () => sales.filter((s) => s.date === selectedDate),
    [sales, selectedDate]
  );
  const dateExpenses = useMemo(
    () => expenses.filter((e) => e.date === selectedDate),
    [expenses, selectedDate]
  );
  const dayMetrics = useMemo(
    () => calculatePeriodMetrics(dateSales, dateExpenses),
    [dateExpenses, dateSales]
  );

  return (
    <div className="space-y-6">
      {/* Date Filter Header + Daily Summary */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-navy-900">
            Sales &amp; Profit for {formatDisplayDate(selectedDate)}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any date to record sales, log expenses, or review daily financial totals.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value || getLocalDateString())}
            className="px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />
          <button
            type="button"
            onClick={() => setSelectedDate(getLocalDateString())}
            className="px-3 py-2 text-xs font-semibold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            Today
          </button>
        </div>
      </div>

      {/* Daily Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Total Sales</p>
          <p className="mt-1 font-mono text-xl font-bold text-navy-900 tabular-nums">
            {dayMetrics.salesCount} bills
          </p>
          <p className="text-xs text-slate-400 mt-0.5 tabular-nums">{dayMetrics.unitsSold} units sold</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Daily Revenue</p>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-700 tabular-nums">
            {formatCurrency(dayMetrics.revenue, sym)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
            GST: {formatCurrency(dayMetrics.gstCollected, sym)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Product Cost (COGS)</p>
          <p className="mt-1 font-mono text-xl font-bold text-slate-800 tabular-nums">
            {formatCurrency(dayMetrics.cogs, sym)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Cost of items sold</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Daily Expenses</p>
          <p className="mt-1 font-mono text-xl font-bold text-slate-800 tabular-nums">
            {formatCurrency(dayMetrics.expenses, sym)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{dateExpenses.length} expense entries</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-slate-500">Daily Net Profit</p>
          <p
            className={`mt-1 font-mono text-xl font-bold tabular-nums ${
              dayMetrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatCurrency(dayMetrics.netProfit, sym)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Net Sales - COGS - Expenses</p>
        </div>
      </div>

      {/* Main Split: Record Sale Form + Log Daily Expense Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Record Sale Card */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Receipt className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-display text-base font-bold text-navy-900">Record New Sale</h3>
              <p className="text-xs text-slate-500">
                Stock quantities update automatically upon saving the bill.
              </p>
            </div>
          </div>

          <form onSubmit={handleRecordSale} className="mt-4 space-y-4">
            {saleError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {saleError}
              </div>
            )}

            {/* Product Picker Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Product (In Stock)
                </label>
                <select
                  value={activeProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                >
                  {availableProducts.length === 0 ? (
                    <option value="">No products currently in stock</option>
                  ) : (
                    availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {sym}
                        {p.sellingPrice} ({p.quantity} {p.unit} left)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Qty</label>
                <input
                  type="number"
                  min="1"
                  max={activeProd?.quantity || 9999}
                  value={lineQty}
                  onChange={(e) => setLineQty(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={availableProducts.length === 0}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 disabled:opacity-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            {cart.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2 text-right">Price</th>
                      <th className="py-2.5 px-2 text-right">GST %</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                      <th className="py-2.5 px-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((line) => {
                      const prod = productMap.get(line.productId);
                      const sub = line.sellingPrice * line.quantity;
                      const lineTotal = sub + (sub * line.gstRate) / 100;
                      return (
                        <tr key={line.productId}>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {prod?.name || 'Product'}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              max={prod?.quantity || 9999}
                              value={line.quantity}
                              onChange={(e) => {
                                const val = Math.max(1, Math.floor(Number(e.target.value) || 1));
                                const maxAllowed = prod?.quantity || val;
                                setCart((prev) =>
                                  prev.map((c) =>
                                    c.productId === line.productId
                                      ? { ...c, quantity: Math.min(val, maxAllowed) }
                                      : c
                                  )
                                );
                              }}
                              className="w-14 px-1.5 py-1 text-center font-mono border border-slate-200 rounded"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                            {formatCurrency(line.sellingPrice, sym)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                            {line.gstRate}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-navy-900 tabular-nums">
                            {formatCurrency(lineTotal, sym)}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setCart((prev) => prev.filter((c) => c.productId !== line.productId))
                              }
                              className="p-1 text-slate-400 hover:text-red-600"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payment, Discount & Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as Sale['paymentMethod'])}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Discount ({sym})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bill Note (Optional)
                </label>
                <input
                  type="text"
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  placeholder="Counter note..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs text-slate-600 font-mono tabular-nums">
                <div>Subtotal: {formatCurrency(cartSummary.subtotal, sym)}</div>
                <div>GST Total: {formatCurrency(cartSummary.gstTotal, sym)}</div>
                {cartSummary.disc > 0 && (
                  <div>Discount: -{formatCurrency(cartSummary.disc, sym)}</div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="block text-xs font-medium text-slate-500">Grand Total</span>
                  <span className="font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(cartSummary.grandTotal, sym)}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  Save Sale
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Add Daily Expense Card */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <Wallet className="w-5 h-5 text-navy-900" />
              <div>
                <h3 className="font-display text-base font-bold text-navy-900">Add Daily Expense</h3>
                <p className="text-xs text-slate-500">
                  Log shop rent, transport, bills, or miscellaneous costs for {formatDisplayDate(selectedDate)}.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddExpense} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Expense Category
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Amount ({sym}) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-2.5 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="e.g., Tempo delivery charge, electricity..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors"
              >
                Save Expense
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 mb-2">
              Expenses on {formatDisplayDate(selectedDate)}
            </h4>
            {dateExpenses.length === 0 ? (
              <p className="text-xs text-slate-400">No expenses logged for this date.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {dateExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{exp.category}</p>
                      <p className="text-slate-500 truncate">{exp.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(exp.amount, sym)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        aria-label="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Date Sales List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-navy-900">
            Sales Recorded on {formatDisplayDate(selectedDate)}
          </h3>
          <span className="text-xs font-mono font-semibold text-slate-500 tabular-nums">
            {dateSales.length} {dateSales.length === 1 ? 'bill' : 'bills'}
          </span>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {dateSales.length === 0 ? (
            <div className="py-8 px-4 text-center text-sm text-slate-500">
              No sales recorded on {formatDisplayDate(selectedDate)}.
            </div>
          ) : (
            dateSales.map((s) => (
              <div key={s.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-navy-900">
                    {s.receiptNumber} · {s.paymentMethod}
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(s.totalAmount, sym)}
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  {s.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    Sub: {formatCurrency(s.subtotal, sym)} · GST: {formatCurrency(s.gstTotal, sym)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSaleToDelete(s)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                    aria-label={`Void sale ${s.receiptNumber}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                <th className="py-3 px-4">Items Sold</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {dateSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No sales recorded on {formatDisplayDate(selectedDate)}.
                  </td>
                </tr>
              ) : (
                dateSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-5 font-mono text-xs font-semibold text-navy-900">
                      {s.receiptNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {s.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{s.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                      {formatCurrency(s.subtotal, sym)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                      {formatCurrency(s.gstTotal, sym)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {formatCurrency(s.totalAmount, sym)}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => setSaleToDelete(s)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label={`Void sale ${s.receiptNumber}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(saleToDelete)}
        title="Void & Delete Sale"
        message={`Delete receipt ${saleToDelete?.receiptNumber}? Sold item quantities will automatically be restored back to your product stock.`}
        confirmLabel="Void Sale & Restore Stock"
        danger
        onConfirm={() => {
          if (saleToDelete) {
            deleteSale(saleToDelete.id, true);
          }
          setSaleToDelete(null);
        }}
        onCancel={() => setSaleToDelete(null)}
      />
    </div>
  );
}
