import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Expense, Product, Sale, ShopSettings } from '../types/shop';
import {
  calculatePeriodMetrics,
  formatDisplayDate,
  formatMonthLabel,
  getStockStatus,
  roundMoney,
} from './calculations';

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

function pdfMoney(amount: number, currencySymbol: string): string {
  // jsPDF standard Helvetica doesn't support the ₹ glyph in some PDF readers; use Rs. for guaranteed crisp PDF rendering
  const prefix = currencySymbol === '₹' ? 'Rs. ' : `${currencySymbol} `;
  const val = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return amount < 0 ? `-${prefix}${val}` : `${prefix}${val}`;
}

function createPdfHeader(doc: jsPDF, title: string, subtitle: string, settings: ShopSettings): number {
  doc.setFillColor(15, 37, 68); // Navy Blue #0F2544
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SHOP TRACK', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(settings.shopName || 'Retail Store', 14, 20);
  if (settings.gstin) {
    doc.text(`GSTIN: ${settings.gstin}`, 14, 25.5);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, 196, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, 196, 20, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 196, 25.5, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  return 38;
}

export function exportDailySalesReportPDF(
  date: string,
  sales: Sale[],
  expenses: Expense[],
  settings: ShopSettings
) {
  const doc = new jsPDF() as JsPdfWithAutoTable;
  const metrics = calculatePeriodMetrics(sales, expenses);
  const y = createPdfHeader(doc, 'Daily Sales Report', `Date: ${formatDisplayDate(date)}`, settings);

  autoTable(doc, {
    startY: y,
    head: [['Summary Metric', 'Value']],
    body: [
      ['Total Sales Transactions', String(metrics.salesCount)],
      ['Total Units Sold', String(metrics.unitsSold)],
      ['Total Daily Revenue', pdfMoney(metrics.revenue, settings.currencySymbol)],
      ['Taxable Subtotal (Excl. GST)', pdfMoney(metrics.subtotal - metrics.discounts, settings.currencySymbol)],
      ['GST Collected', pdfMoney(metrics.gstCollected, settings.currencySymbol)],
      ['Product Cost (COGS)', pdfMoney(metrics.cogs, settings.currencySymbol)],
      ['Daily Expenses', pdfMoney(metrics.expenses, settings.currencySymbol)],
      ['Daily Net Profit', pdfMoney(metrics.netProfit, settings.currencySymbol)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 37, 68] },
  });

  const nextY = (doc.lastAutoTable?.finalY || y) + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Sales Breakdown', 14, nextY);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Receipt', 'Items', 'Payment', 'Subtotal', 'GST', 'Total']],
    body: sales.length
      ? sales.map((s) => [
          s.receiptNumber,
          s.items.map((i) => `${i.productName} x${i.quantity}`).join(', '),
          s.paymentMethod,
          pdfMoney(s.subtotal, settings.currencySymbol),
          pdfMoney(s.gstTotal, settings.currencySymbol),
          pdfMoney(s.totalAmount, settings.currencySymbol),
        ])
      : [['—', 'No sales recorded for this date', '—', '0.00', '0.00', '0.00']],
    theme: 'striped',
    headStyles: { fillColor: [21, 128, 61] },
  });

  doc.save(`SHOP_TRACK_Daily_Sales_${date}.pdf`);
}

export function exportDailySalesReportExcel(
  date: string,
  sales: Sale[],
  expenses: Expense[]
) {
  const wb = XLSX.utils.book_new();
  const metrics = calculatePeriodMetrics(sales, expenses);

  const summaryRows = [
    { Metric: 'Report Date', Value: date },
    { Metric: 'Total Transactions', Value: metrics.salesCount },
    { Metric: 'Total Units Sold', Value: metrics.unitsSold },
    { Metric: 'Total Daily Revenue', Value: metrics.revenue },
    { Metric: 'GST Collected', Value: metrics.gstCollected },
    { Metric: 'Product Cost (COGS)', Value: metrics.cogs },
    { Metric: 'Daily Expenses', Value: metrics.expenses },
    { Metric: 'Daily Net Profit', Value: metrics.netProfit },
  ];

  const salesRows = sales.map((s) => ({
    Receipt: s.receiptNumber,
    Date: s.date,
    Items: s.items.map((i) => `${i.productName} (x${i.quantity})`).join('; '),
    Payment_Method: s.paymentMethod,
    Subtotal: s.subtotal,
    GST_Amount: s.gstTotal,
    Discount: s.discount,
    Total_Amount: s.totalAmount,
    Cost_Of_Goods: s.totalCost,
  }));

  const expenseRows = expenses.map((e) => ({
    Date: e.date,
    Category: e.category,
    Description: e.description,
    Amount: e.amount,
  }));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesRows.length ? salesRows : [{ Note: 'No sales' }]), 'Sales');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseRows.length ? expenseRows : [{ Note: 'No expenses' }]), 'Expenses');

  XLSX.writeFile(wb, `SHOP_TRACK_Daily_Sales_${date}.xlsx`);
}

export function exportMonthlyIncomeReportPDF(
  monthKey: string,
  sales: Sale[],
  expenses: Expense[],
  settings: ShopSettings
) {
  const doc = new jsPDF() as JsPdfWithAutoTable;
  const metrics = calculatePeriodMetrics(sales, expenses);
  const label = formatMonthLabel(monthKey);
  const y = createPdfHeader(doc, 'Monthly Income Report', `Period: ${label}`, settings);

  autoTable(doc, {
    startY: y,
    head: [['Financial Metric', 'Amount / Count']],
    body: [
      ['Total Monthly Income (Revenue)', pdfMoney(metrics.revenue, settings.currencySymbol)],
      ['Total Sales Count', `${metrics.salesCount} orders (${metrics.unitsSold} units)`],
      ['GST Collected', pdfMoney(metrics.gstCollected, settings.currencySymbol)],
      ['Product Cost (COGS)', pdfMoney(metrics.cogs, settings.currencySymbol)],
      ['Monthly Gross Profit', pdfMoney(metrics.grossProfit, settings.currencySymbol)],
      ['Monthly Operating Expenses', pdfMoney(metrics.expenses, settings.currencySymbol)],
      ['Monthly Net Profit', pdfMoney(metrics.netProfit, settings.currencySymbol)],
      ['Net Profit Margin', `${metrics.marginPercent.toFixed(1)}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 37, 68] },
  });

  const nextY = (doc.lastAutoTable?.finalY || y) + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Monthly Transactions', 14, nextY);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Date', 'Receipt', 'Items Sold', 'Subtotal', 'GST', 'Total']],
    body: sales.length
      ? sales.map((s) => [
          formatDisplayDate(s.date),
          s.receiptNumber,
          `${s.items.reduce((acc, i) => acc + i.quantity, 0)} units`,
          pdfMoney(s.subtotal, settings.currencySymbol),
          pdfMoney(s.gstTotal, settings.currencySymbol),
          pdfMoney(s.totalAmount, settings.currencySymbol),
        ])
      : [['—', '—', 'No transactions in this month', '0.00', '0.00', '0.00']],
    theme: 'striped',
    headStyles: { fillColor: [21, 128, 61] },
  });

  doc.save(`SHOP_TRACK_Monthly_Income_${monthKey}.pdf`);
}

export function exportMonthlyIncomeReportExcel(
  monthKey: string,
  sales: Sale[],
  expenses: Expense[]
) {
  const wb = XLSX.utils.book_new();
  const metrics = calculatePeriodMetrics(sales, expenses);

  const summary = [
    { Metric: 'Month', Value: formatMonthLabel(monthKey) },
    { Metric: 'Total Monthly Income', Value: metrics.revenue },
    { Metric: 'Total Sales Count', Value: metrics.salesCount },
    { Metric: 'Total Units Sold', Value: metrics.unitsSold },
    { Metric: 'GST Collected', Value: metrics.gstCollected },
    { Metric: 'Product Cost (COGS)', Value: metrics.cogs },
    { Metric: 'Monthly Gross Profit', Value: metrics.grossProfit },
    { Metric: 'Monthly Expenses', Value: metrics.expenses },
    { Metric: 'Monthly Net Profit', Value: metrics.netProfit },
    { Metric: 'Net Profit Margin (%)', Value: metrics.marginPercent },
  ];

  const txRows = sales.map((s) => ({
    Date: s.date,
    Receipt: s.receiptNumber,
    Payment: s.paymentMethod,
    Items: s.items.map((i) => `${i.productName} x${i.quantity}`).join('; '),
    Subtotal: s.subtotal,
    GST: s.gstTotal,
    Discount: s.discount,
    Total_Revenue: s.totalAmount,
    COGS: s.totalCost,
  }));

  const expRows = expenses.map((e) => ({
    Date: e.date,
    Category: e.category,
    Description: e.description,
    Amount: e.amount,
  }));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Monthly Summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows.length ? txRows : [{ Note: 'No sales' }]), 'Sales');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expRows.length ? expRows : [{ Note: 'No expenses' }]), 'Expenses');

  XLSX.writeFile(wb, `SHOP_TRACK_Monthly_Income_${monthKey}.xlsx`);
}

export function exportStockReportPDF(
  products: Product[],
  onlyLowOrOut: boolean,
  settings: ShopSettings
) {
  const doc = new jsPDF() as JsPdfWithAutoTable;
  const filtered = onlyLowOrOut
    ? products.filter((p) => getStockStatus(p) !== 'in-stock')
    : products;

  const title = onlyLowOrOut ? 'Out-of-Stock & Low Stock Report' : 'Stock Availability Report';
  const y = createPdfHeader(doc, title, `Products Listed: ${filtered.length}`, settings);

  autoTable(doc, {
    startY: y,
    head: [['Product', 'Category', 'Qty', 'Min Limit', 'Status', 'Buy Price', 'Sell Price', 'Stock Value']],
    body: filtered.length
      ? filtered.map((p) => {
          const st = getStockStatus(p);
          const statusLabel = st === 'out-of-stock' ? 'OUT OF STOCK' : st === 'low-stock' ? 'LOW STOCK' : 'IN STOCK';
          return [
            p.name,
            p.category,
            `${p.quantity} ${p.unit}`,
            String(p.minStockLimit),
            statusLabel,
            pdfMoney(p.purchasePrice, settings.currencySymbol),
            pdfMoney(p.sellingPrice, settings.currencySymbol),
            pdfMoney(p.purchasePrice * p.quantity, settings.currencySymbol),
          ];
        })
      : [['—', 'No matching products', '0', '0', '—', '0.00', '0.00', '0.00']],
    theme: 'striped',
    headStyles: { fillColor: [15, 37, 68] },
    styles: { fontSize: 8.5 },
  });

  const fileSlug = onlyLowOrOut ? 'Low_And_Out_Of_Stock' : 'Stock_Availability';
  doc.save(`SHOP_TRACK_${fileSlug}.pdf`);
}

export function exportStockReportExcel(products: Product[], onlyLowOrOut: boolean) {
  const filtered = onlyLowOrOut
    ? products.filter((p) => getStockStatus(p) !== 'in-stock')
    : products;

  const rows = filtered.map((p) => {
    const st = getStockStatus(p);
    return {
      Product_Name: p.name,
      Category: p.category,
      Available_Qty: p.quantity,
      Unit: p.unit,
      Min_Stock_Limit: p.minStockLimit,
      Status: st === 'out-of-stock' ? 'Out of Stock' : st === 'low-stock' ? 'Low Stock' : 'In Stock',
      Purchase_Price: p.purchasePrice,
      Selling_Price: p.sellingPrice,
      GST_Percent: p.gstRate,
      Inventory_Cost_Value: roundMoney(p.purchasePrice * p.quantity),
      Inventory_Retail_Value: roundMoney(p.sellingPrice * p.quantity),
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No items' }]), 'Inventory');
  const fileSlug = onlyLowOrOut ? 'Low_And_Out_Of_Stock' : 'Stock_Availability';
  XLSX.writeFile(wb, `SHOP_TRACK_${fileSlug}.xlsx`);
}

export function exportProfitLossReportPDF(
  periodLabel: string,
  sales: Sale[],
  expenses: Expense[],
  settings: ShopSettings
) {
  const doc = new jsPDF() as JsPdfWithAutoTable;
  const metrics = calculatePeriodMetrics(sales, expenses);
  const y = createPdfHeader(doc, 'Profit & Loss Statement', periodLabel, settings);

  autoTable(doc, {
    startY: y,
    head: [['Line Item', 'Amount']],
    body: [
      ['Gross Sales Revenue (Incl. GST)', pdfMoney(metrics.revenue, settings.currencySymbol)],
      ['Less: GST Collected (Tax Liability)', pdfMoney(metrics.gstCollected, settings.currencySymbol)],
      ['Net Sales Revenue (Excl. GST)', pdfMoney(metrics.subtotal - metrics.discounts, settings.currencySymbol)],
      ['Less: Cost of Goods Sold (COGS)', pdfMoney(metrics.cogs, settings.currencySymbol)],
      ['Gross Profit', pdfMoney(metrics.grossProfit, settings.currencySymbol)],
      ['Less: Total Operating Expenses', pdfMoney(metrics.expenses, settings.currencySymbol)],
      ['Net Profit / (Loss)', pdfMoney(metrics.netProfit, settings.currencySymbol)],
      ['Net Profit Margin', `${metrics.marginPercent.toFixed(2)}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 37, 68] },
  });

  const expByCat: Record<string, number> = {};
  for (const e of expenses) {
    expByCat[e.category] = (expByCat[e.category] || 0) + e.amount;
  }

  const nextY = (doc.lastAutoTable?.finalY || y) + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Expenses by Category', 14, nextY);

  const catEntries = Object.entries(expByCat);
  autoTable(doc, {
    startY: nextY + 4,
    head: [['Expense Category', 'Total Amount']],
    body: catEntries.length
      ? catEntries.map(([cat, amt]) => [cat, pdfMoney(amt, settings.currencySymbol)])
      : [['No expenses recorded', pdfMoney(0, settings.currencySymbol)]],
    theme: 'striped',
    headStyles: { fillColor: [21, 128, 61] },
  });

  doc.save(`SHOP_TRACK_Profit_Loss_Report.pdf`);
}

export function exportProfitLossReportExcel(
  periodLabel: string,
  sales: Sale[],
  expenses: Expense[]
) {
  const metrics = calculatePeriodMetrics(sales, expenses);
  const rows = [
    { Line_Item: 'Period', Amount: periodLabel },
    { Line_Item: 'Gross Sales Revenue (Incl. GST)', Amount: metrics.revenue },
    { Line_Item: 'GST Collected', Amount: metrics.gstCollected },
    { Line_Item: 'Net Sales (Excl. GST)', Amount: roundMoney(metrics.subtotal - metrics.discounts) },
    { Line_Item: 'Cost of Goods Sold (COGS)', Amount: metrics.cogs },
    { Line_Item: 'Gross Profit', Amount: metrics.grossProfit },
    { Line_Item: 'Operating Expenses', Amount: metrics.expenses },
    { Line_Item: 'Net Profit', Amount: metrics.netProfit },
    { Line_Item: 'Net Margin (%)', Amount: metrics.marginPercent },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Profit & Loss');
  XLSX.writeFile(wb, `SHOP_TRACK_Profit_Loss_Report.xlsx`);
}

export function exportGstSummaryReportPDF(
  periodLabel: string,
  sales: Sale[],
  settings: ShopSettings
) {
  const doc = new jsPDF() as JsPdfWithAutoTable;
  const y = createPdfHeader(doc, 'GST Summary Report', periodLabel, settings);

  const slabMap: Record<number, { taxable: number; gst: number; cgst: number; sgst: number; total: number }> = {};
  for (const s of sales) {
    for (const item of s.items) {
      const rate = item.gstRate;
      if (!slabMap[rate]) {
        slabMap[rate] = { taxable: 0, gst: 0, cgst: 0, sgst: 0, total: 0 };
      }
      slabMap[rate].taxable += item.subtotal;
      slabMap[rate].gst += item.gstAmount;
      slabMap[rate].cgst += item.gstAmount / 2;
      slabMap[rate].sgst += item.gstAmount / 2;
      slabMap[rate].total += item.totalAmount;
    }
  }

  const slabs = Object.entries(slabMap).sort((a, b) => Number(a[0]) - Number(b[0]));

  autoTable(doc, {
    startY: y,
    head: [['GST Slab', 'Taxable Value', 'CGST', 'SGST', 'Total GST', 'Invoice Value']],
    body: slabs.length
      ? slabs.map(([rate, val]) => [
          `${rate}%`,
          pdfMoney(val.taxable, settings.currencySymbol),
          pdfMoney(val.cgst, settings.currencySymbol),
          pdfMoney(val.sgst, settings.currencySymbol),
          pdfMoney(val.gst, settings.currencySymbol),
          pdfMoney(val.total, settings.currencySymbol),
        ])
      : [['—', '0.00', '0.00', '0.00', '0.00', '0.00']],
    theme: 'grid',
    headStyles: { fillColor: [15, 37, 68] },
  });

  doc.save(`SHOP_TRACK_GST_Summary_Report.pdf`);
}

export function exportGstSummaryReportExcel(periodLabel: string, sales: Sale[]) {
  const slabMap: Record<number, { taxable: number; gst: number; cgst: number; sgst: number; total: number }> = {};
  for (const s of sales) {
    for (const item of s.items) {
      const rate = item.gstRate;
      if (!slabMap[rate]) {
        slabMap[rate] = { taxable: 0, gst: 0, cgst: 0, sgst: 0, total: 0 };
      }
      slabMap[rate].taxable += item.subtotal;
      slabMap[rate].gst += item.gstAmount;
      slabMap[rate].cgst += item.gstAmount / 2;
      slabMap[rate].sgst += item.gstAmount / 2;
      slabMap[rate].total += item.totalAmount;
    }
  }

  const rows = Object.entries(slabMap)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([rate, v]) => ({
      Period: periodLabel,
      GST_Slab_Percent: Number(rate),
      Taxable_Amount: roundMoney(v.taxable),
      CGST_Amount: roundMoney(v.cgst),
      SGST_Amount: roundMoney(v.sgst),
      Total_GST: roundMoney(v.gst),
      Total_Invoice_Value: roundMoney(v.total),
    }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No GST sales' }]), 'GST Summary');
  XLSX.writeFile(wb, `SHOP_TRACK_GST_Summary_Report.xlsx`);
}

export function exportReceiptPDF(sale: Sale, settings: ShopSettings) {
  const doc = new jsPDF() as JsPdfWithAutoTable;
  const y = createPdfHeader(
    doc,
    `Invoice ${sale.receiptNumber}`,
    `Date: ${formatDisplayDate(sale.date)} | ${sale.paymentMethod}`,
    settings
  );

  autoTable(doc, {
    startY: y,
    head: [['Product', 'Qty', 'Rate', 'GST %', 'GST Amt', 'Total']],
    body: sale.items.map((item) => [
      item.productName,
      `${item.quantity} ${item.unit}`,
      pdfMoney(item.sellingPrice, settings.currencySymbol),
      `${item.gstRate}%`,
      pdfMoney(item.gstAmount, settings.currencySymbol),
      pdfMoney(item.totalAmount, settings.currencySymbol),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [15, 37, 68] },
  });

  const nextY = (doc.lastAutoTable?.finalY || y) + 10;
  doc.setFontSize(10);
  doc.text(`Subtotal: ${pdfMoney(sale.subtotal, settings.currencySymbol)}`, 196, nextY, { align: 'right' });
  doc.text(`Total GST: ${pdfMoney(sale.gstTotal, settings.currencySymbol)}`, 196, nextY + 6, { align: 'right' });
  if (sale.discount > 0) {
    doc.text(`Discount: -${pdfMoney(sale.discount, settings.currencySymbol)}`, 196, nextY + 12, { align: 'right' });
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(
    `Grand Total: ${pdfMoney(sale.totalAmount, settings.currencySymbol)}`,
    196,
    nextY + (sale.discount > 0 ? 20 : 14),
    { align: 'right' }
  );

  doc.save(`Receipt_${sale.receiptNumber}.pdf`);
}
