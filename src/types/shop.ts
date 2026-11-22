export type NavPage =
  | 'dashboard'
  | 'stock'
  | 'products'
  | 'daily-sales'
  | 'monthly-income'
  | 'income-graphs'
  | 'gst-calculator'
  | 'transactions'
  | 'reports'
  | 'notifications'
  | 'settings';

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface Product {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minStockLimit: number;
  gstRate: number;
  unit: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  quantity: number;
  purchasePrice: number; // unit cost at time of sale
  sellingPrice: number;  // unit price (excl. GST or unit selling price)
  gstRate: number;
  subtotal: number;      // quantity * sellingPrice
  gstAmount: number;     // subtotal * (gstRate / 100)
  totalAmount: number;   // subtotal + gstAmount
}

export interface Sale {
  id: string;
  receiptNumber: string;
  date: string;          // YYYY-MM-DD
  createdAt: string;     // ISO timestamp
  items: SaleItem[];
  subtotal: number;
  gstTotal: number;
  discount: number;
  totalAmount: number;   // subtotal + gstTotal - discount
  totalCost: number;     // sum(item.purchasePrice * item.quantity)
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  note: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity & Utilities'
  | 'Transport & Delivery'
  | 'Packaging'
  | 'Staff Wages'
  | 'Maintenance'
  | 'Stock Purchase'
  | 'Other';

export interface Expense {
  id: string;
  date: string;          // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  description: string;
  createdAt: string;
}

export type AlertType = 'low-stock' | 'out-of-stock';

export interface StockNotification {
  id: string;
  productId: string;
  productName: string;
  category: string;
  remainingQuantity: number;
  minStockLimit: number;
  type: AlertType;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ShopSettings {
  shopName: string;
  shopTagline: string;
  address: string;
  gstin: string;
  currencySymbol: string;
  defaultGstRate: number;
  defaultMinStockLimit: number;
  gstIncludedInProductPrice: boolean;
}

export interface StoreSnapshot {
  version: number;
  initialized: boolean;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  notifications: StockNotification[];
  settings: ShopSettings;
}

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
}
