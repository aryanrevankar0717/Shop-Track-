import { Expense, Product, Sale, StockStatus } from '../types/shop';

export function getStockStatus(product: Pick<Product, 'quantity' | 'minStockLimit'>): StockStatus {
  if (product.quantity <= 0) return 'out-of-stock';
  if (product.quantity <= product.minStockLimit) return 'low-stock';
  return 'in-stock';
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(safe));
  return safe < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatCompactCurrency(amount: number, symbol = '₹'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(safe);
  let text = '';
  if (abs >= 10000000) {
    text = `${(abs / 10000000).toFixed(2)}Cr`;
  } else if (abs >= 100000) {
    text = `${(abs / 100000).toFixed(2)}L`;
  } else if (abs >= 1000) {
    text = `${(abs / 1000).toFixed(1)}k`;
  } else {
    text = abs.toFixed(0);
  }
  return safe < 0 ? `-${symbol}${text}` : `${symbol}${text}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(Number.isFinite(value) ? value : 0);
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function shiftDateString(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + deltaDays);
  return getLocalDateString(dt);
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, 1);
  return dt.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, 1);
  return dt.toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit',
  });
}

export interface GstCalculationInput {
  price: number;
  quantity: number;
  gstRate: number;
  mode: 'exclusive' | 'inclusive';
  supplyType: 'intra' | 'inter';
}

export interface GstCalculationResult {
  unitBasePrice: number;
  totalBasePrice: number;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  finalTotalAmount: number;
}

export function calculateGSTBreakdown(input: GstCalculationInput): GstCalculationResult {
  const price = Math.max(0, Number(input.price) || 0);
  const quantity = Math.max(1, Number(input.quantity) || 1);
  const gstRate = Math.max(0, Number(input.gstRate) || 0);
  const grossEntered = price * quantity;

  let totalBasePrice = 0;
  let totalGstAmount = 0;
  let finalTotalAmount = 0;

  if (input.mode === 'exclusive') {
    totalBasePrice = roundMoney(grossEntered);
    totalGstAmount = roundMoney((totalBasePrice * gstRate) / 100);
    finalTotalAmount = roundMoney(totalBasePrice + totalGstAmount);
  } else {
    finalTotalAmount = roundMoney(grossEntered);
    totalBasePrice = roundMoney(finalTotalAmount / (1 + gstRate / 100));
    totalGstAmount = roundMoney(finalTotalAmount - totalBasePrice);
  }

  const unitBasePrice = roundMoney(totalBasePrice / quantity);

  if (input.supplyType === 'intra') {
    const halfRate = roundMoney(gstRate / 2);
    const cgstAmount = roundMoney(totalGstAmount / 2);
    const sgstAmount = roundMoney(totalGstAmount - cgstAmount);
    return {
      unitBasePrice,
      totalBasePrice,
      gstRate,
      cgstRate: halfRate,
      sgstRate: halfRate,
      igstRate: 0,
      cgstAmount,
      sgstAmount,
      igstAmount: 0,
      totalGstAmount,
      finalTotalAmount,
    };
  }

  return {
    unitBasePrice,
    totalBasePrice,
    gstRate,
    cgstRate: 0,
    sgstRate: 0,
    igstRate: gstRate,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: totalGstAmount,
    totalGstAmount,
    finalTotalAmount,
  };
}

export interface PeriodMetrics {
  salesCount: number;
  unitsSold: number;
  revenue: number;
  subtotal: number;
  gstCollected: number;
  discounts: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  marginPercent: number;
}

export function calculatePeriodMetrics(sales: Sale[], expenses: Expense[]): PeriodMetrics {
  let unitsSold = 0;
  let revenue = 0;
  let subtotal = 0;
  let gstCollected = 0;
  let discounts = 0;
  let cogs = 0;

  for (const s of sales) {
    revenue += s.totalAmount;
    subtotal += s.subtotal;
    gstCollected += s.gstTotal;
    discounts += s.discount;
    cogs += s.totalCost;
    for (const item of s.items) {
      unitsSold += item.quantity;
    }
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  // Gross profit compares net sales (after discount, excl. GST or total revenue minus COGS).
  // In retail shopkeeping, Revenue = totalAmount, Net Realized Sales (excl. GST) = subtotal - discount.
  // Using totalAmount - cogs for shopkeeper cashflow or (subtotal - discount - cogs) for tax-excluded profit:
  // Standard retail P&L: Revenue (excl. GST) = subtotal - discount, or totalAmount if GST is pass-through.
  // We keep revenue = sum(totalAmount) for cash inflow, and grossProfit = (subtotal - discount) - cogs (or revenue - gstCollected - cogs).
  // Note: subtotal - discount === revenue - gstCollected! Let's ensure both are consistent.
  const netSalesExclGst = roundMoney(subtotal - discounts);
  const grossProfit = roundMoney(netSalesExclGst - cogs);
  const netProfit = roundMoney(grossProfit - totalExpenses);
  const marginPercent = netSalesExclGst > 0 ? roundMoney((netProfit / netSalesExclGst) * 100) : 0;

  return {
    salesCount: sales.length,
    unitsSold,
    revenue: roundMoney(revenue),
    subtotal: roundMoney(subtotal),
    gstCollected: roundMoney(gstCollected),
    discounts: roundMoney(discounts),
    cogs: roundMoney(cogs),
    grossProfit,
    expenses: roundMoney(totalExpenses),
    netProfit,
    marginPercent,
  };
}

export function getDailySeries(
  sales: Sale[],
  expenses: Expense[],
  startDate: string,
  endDate: string
) {
  const days: Array<{
    date: string;
    label: string;
    revenue: number;
    expenses: number;
    cogs: number;
    grossProfit: number;
    netProfit: number;
    salesCount: number;
  }> = [];

  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const start = new Date(sy, (sm || 1) - 1, sd || 1);
  const end = new Date(ey, (em || 1) - 1, ed || 1);

  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 366) {
    guard++;
    const dateKey = getLocalDateString(cursor);
    const daySales = sales.filter((s) => s.date === dateKey);
    const dayExpenses = expenses.filter((e) => e.date === dateKey);
    const m = calculatePeriodMetrics(daySales, dayExpenses);

    days.push({
      date: dateKey,
      label: cursor.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      revenue: m.revenue,
      expenses: m.expenses,
      cogs: m.cogs,
      grossProfit: m.grossProfit,
      netProfit: m.netProfit,
      salesCount: m.salesCount,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function getWeeklySeries(sales: Sale[], expenses: Expense[], weeksCount = 8, anchorDateStr?: string) {
  const anchorStr = anchorDateStr || getLocalDateString();
  const [ay, am, ad] = anchorStr.split('-').map(Number);
  const anchor = new Date(ay, (am || 1) - 1, ad || 1);

  // Align end of current week to Sunday or anchor day
  const results: Array<{
    label: string;
    range: string;
    revenue: number;
    expenses: number;
    netProfit: number;
    salesCount: number;
  }> = [];

  for (let i = weeksCount - 1; i >= 0; i--) {
    const endDt = new Date(anchor);
    endDt.setDate(anchor.getDate() - i * 7);
    const startDt = new Date(endDt);
    startDt.setDate(endDt.getDate() - 6);

    const startKey = getLocalDateString(startDt);
    const endKey = getLocalDateString(endDt);

    const weekSales = sales.filter((s) => s.date >= startKey && s.date <= endKey);
    const weekExpenses = expenses.filter((e) => e.date >= startKey && e.date <= endKey);
    const m = calculatePeriodMetrics(weekSales, weekExpenses);

    const startShort = startDt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const endShort = endDt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    results.push({
      label: startShort,
      range: `${startShort} - ${endShort}`,
      revenue: m.revenue,
      expenses: m.expenses,
      netProfit: m.netProfit,
      salesCount: m.salesCount,
    });
  }

  return results;
}

export function getMonthlySeries(sales: Sale[], expenses: Expense[], monthsCount = 6, anchorMonthKey?: string) {
  const anchorKey = anchorMonthKey || getMonthKey();
  const [ay, am] = anchorKey.split('-').map(Number);

  const results: Array<{
    monthKey: string;
    label: string;
    revenue: number;
    expenses: number;
    cogs: number;
    grossProfit: number;
    netProfit: number;
    salesCount: number;
  }> = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const dt = new Date(ay, (am || 1) - 1 - i, 1);
    const key = getMonthKey(dt);
    const monthSales = sales.filter((s) => s.date.startsWith(key));
    const monthExpenses = expenses.filter((e) => e.date.startsWith(key));
    const m = calculatePeriodMetrics(monthSales, monthExpenses);

    results.push({
      monthKey: key,
      label: formatShortMonthLabel(key),
      revenue: m.revenue,
      expenses: m.expenses,
      cogs: m.cogs,
      grossProfit: m.grossProfit,
      netProfit: m.netProfit,
      salesCount: m.salesCount,
    });
  }

  return results;
}
