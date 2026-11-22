import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Expense,
  NavPage,
  Product,
  Sale,
  SaleItem,
  ShopSettings,
  StockNotification,
  StockStatus,
  StoreSnapshot,
  ToastAlert,
} from '../types/shop';
import { getLocalDateString, getStockStatus, roundMoney } from '../utils/calculations';
import {
  clearAllStoreData,
  hydrateFromIndexedDB,
  loadSnapshotSync,
  resetToStarterData,
  saveSnapshot,
  validateImportedSnapshot,
} from '../utils/storage';

export interface ProductInput {
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minStockLimit: number;
  gstRate: number;
  unit: string;
  description: string;
}

export interface RecordSaleInput {
  date: string;
  items: Array<{
    productId: string;
    quantity: number;
    sellingPrice: number;
    gstRate: number;
  }>;
  discount: number;
  paymentMethod: Sale['paymentMethod'];
  note: string;
}

interface ShopContextValue {
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
  stockFilterHint: 'all' | StockStatus;
  setStockFilterHint: (filter: 'all' | StockStatus) => void;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  notifications: StockNotification[];
  settings: ShopSettings;
  unreadNotificationCount: number;
  toasts: ToastAlert[];
  dismissToast: (id: string) => void;
  pushToast: (toast: Omit<ToastAlert, 'id'>) => void;
  addProduct: (input: ProductInput) => Product;
  updateProduct: (id: string, input: ProductInput) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  recordSale: (input: RecordSaleInput) => Sale | null;
  deleteSale: (id: string, restoreStock?: boolean) => void;
  addExpense: (input: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearReadNotifications: () => void;
  updateSettings: (partial: Partial<ShopSettings>) => void;
  exportBackupJson: () => void;
  importBackupJson: (jsonText: string) => void;
  resetStarter: () => void;
  clearAllData: () => void;
  openQuickProductModal: boolean;
  setOpenQuickProductModal: (open: boolean) => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildStockAlert(product: Product): StockNotification | null {
  const status = getStockStatus(product);
  if (status === 'out-of-stock') {
    return {
      id: makeId('notif'),
      productId: product.id,
      productName: product.name,
      category: product.category,
      remainingQuantity: 0,
      minStockLimit: product.minStockLimit,
      type: 'out-of-stock',
      message: `${product.name} is now out of stock (0 ${product.unit} remaining).`,
      createdAt: new Date().toISOString(),
      read: false,
    };
  }
  if (status === 'low-stock') {
    return {
      id: makeId('notif'),
      productId: product.id,
      productName: product.name,
      category: product.category,
      remainingQuantity: product.quantity,
      minStockLimit: product.minStockLimit,
      type: 'low-stock',
      message: `${product.name} reached low stock (${product.quantity} ${product.unit} left, limit: ${product.minStockLimit}).`,
      createdAt: new Date().toISOString(),
      read: false,
    };
  }
  return null;
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<StoreSnapshot>(() => loadSnapshotSync());
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [stockFilterHint, setStockFilterHint] = useState<'all' | StockStatus>('all');
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [openQuickProductModal, setOpenQuickProductModal] = useState(false);

  // Hydrate from IndexedDB if available and localStorage had fallback
  useEffect(() => {
    let mounted = true;
    hydrateFromIndexedDB().then((idbSnap) => {
      if (mounted && idbSnap) {
        setSnapshot((prev) => {
          // Only overwrite if IDB has data and differs
          if (
            prev.products.length === idbSnap.products.length &&
            prev.sales.length === idbSnap.sales.length &&
            prev.expenses.length === idbSnap.expenses.length
          ) {
            return prev;
          }
          return idbSnap;
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateAndPersist = useCallback((updater: (prev: StoreSnapshot) => StoreSnapshot) => {
    setSnapshot((prev) => {
      const next = updater(prev);
      saveSnapshot(next);
      return next;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastAlert, 'id'>) => {
    const id = makeId('toast');
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5200);
  }, []);

  const addProduct = useCallback(
    (input: ProductInput): Product => {
      const now = new Date().toISOString();
      const newProduct: Product = {
        id: makeId('prod'),
        name: input.name.trim(),
        category: input.category.trim() || 'General',
        purchasePrice: Math.max(0, Number(input.purchasePrice) || 0),
        sellingPrice: Math.max(0, Number(input.sellingPrice) || 0),
        quantity: Math.max(0, Math.floor(Number(input.quantity) || 0)),
        minStockLimit: Math.max(0, Math.floor(Number(input.minStockLimit) || 0)),
        gstRate: Math.max(0, Number(input.gstRate) || 0),
        unit: input.unit.trim() || 'pcs',
        description: input.description.trim(),
        createdAt: now,
        updatedAt: now,
      };

      const alert = buildStockAlert(newProduct);

      updateAndPersist((prev) => ({
        ...prev,
        products: [newProduct, ...prev.products],
        notifications: alert ? [alert, ...prev.notifications] : prev.notifications,
      }));

      if (alert) {
        pushToast({
          title: alert.type === 'out-of-stock' ? 'Out of Stock Alert' : 'Low Stock Alert',
          message: alert.message,
          variant: alert.type === 'out-of-stock' ? 'danger' : 'warning',
        });
      } else {
        pushToast({
          title: 'Product Added',
          message: `${newProduct.name} added to inventory.`,
          variant: 'success',
        });
      }

      return newProduct;
    },
    [pushToast, updateAndPersist]
  );

  const updateProduct = useCallback(
    (id: string, input: ProductInput) => {
      let generatedAlert: StockNotification | null = null;
      const now = new Date().toISOString();

      updateAndPersist((prev) => {
        const products = prev.products.map((p) => {
          if (p.id !== id) return p;
          const updated: Product = {
            ...p,
            name: input.name.trim(),
            category: input.category.trim() || 'General',
            purchasePrice: Math.max(0, Number(input.purchasePrice) || 0),
            sellingPrice: Math.max(0, Number(input.sellingPrice) || 0),
            quantity: Math.max(0, Math.floor(Number(input.quantity) || 0)),
            minStockLimit: Math.max(0, Math.floor(Number(input.minStockLimit) || 0)),
            gstRate: Math.max(0, Number(input.gstRate) || 0),
            unit: input.unit.trim() || 'pcs',
            description: input.description.trim(),
            updatedAt: now,
          };
          generatedAlert = buildStockAlert(updated);
          return updated;
        });

        const notifications = generatedAlert
          ? [generatedAlert, ...prev.notifications]
          : prev.notifications;

        return { ...prev, products, notifications };
      });

      if (generatedAlert) {
        const alert = generatedAlert as StockNotification;
        pushToast({
          title: alert.type === 'out-of-stock' ? 'Out of Stock Alert' : 'Low Stock Alert',
          message: alert.message,
          variant: alert.type === 'out-of-stock' ? 'danger' : 'warning',
        });
      } else {
        pushToast({
          title: 'Product Updated',
          message: `${input.name} details saved.`,
          variant: 'success',
        });
      }
    },
    [pushToast, updateAndPersist]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      updateAndPersist((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
      }));
      pushToast({
        title: 'Product Deleted',
        message: 'Product removed from stock catalogue.',
        variant: 'info',
      });
    },
    [pushToast, updateAndPersist]
  );

  const adjustStock = useCallback(
    (id: string, delta: number) => {
      let generatedAlert: StockNotification | null = null;
      let targetName = '';
      let nextQty = 0;

      updateAndPersist((prev) => {
        const products = prev.products.map((p) => {
          if (p.id !== id) return p;
          const qty = Math.max(0, p.quantity + delta);
          targetName = p.name;
          nextQty = qty;
          const updated: Product = {
            ...p,
            quantity: qty,
            updatedAt: new Date().toISOString(),
          };
          if (delta < 0 || qty <= updated.minStockLimit) {
            generatedAlert = buildStockAlert(updated);
          }
          return updated;
        });

        return {
          ...prev,
          products,
          notifications: generatedAlert
            ? [generatedAlert, ...prev.notifications]
            : prev.notifications,
        };
      });

      if (generatedAlert) {
        const alert = generatedAlert as StockNotification;
        pushToast({
          title: alert.type === 'out-of-stock' ? 'Out of Stock Alert' : 'Low Stock Alert',
          message: alert.message,
          variant: alert.type === 'out-of-stock' ? 'danger' : 'warning',
        });
      } else if (targetName) {
        pushToast({
          title: 'Stock Updated',
          message: `${targetName}: ${nextQty} units now available.`,
          variant: 'success',
        });
      }
    },
    [pushToast, updateAndPersist]
  );

  const recordSale = useCallback(
    (input: RecordSaleInput): Sale | null => {
      if (!input.items.length) return null;

      let createdSale: Sale | null = null;
      const newAlerts: StockNotification[] = [];
      let errorMsg = '';

      updateAndPersist((prev) => {
        const productMap = new Map<string, Product>(prev.products.map((p) => [p.id, p]));
        const saleItems: SaleItem[] = [];

        for (const line of input.items) {
          const prod = productMap.get(line.productId);
          if (!prod) {
            errorMsg = 'One of the selected products no longer exists.';
            return prev;
          }
          const qty = Math.max(1, Math.floor(line.quantity));
          if (qty > prod.quantity) {
            errorMsg = `Insufficient stock for ${prod.name} (only ${prod.quantity} ${prod.unit} available).`;
            return prev;
          }

          const unitPrice = Math.max(0, line.sellingPrice);
          const gstRate = Math.max(0, line.gstRate);
          const subtotal = roundMoney(unitPrice * qty);
          const gstAmount = roundMoney((subtotal * gstRate) / 100);
          const totalAmount = roundMoney(subtotal + gstAmount);

          saleItems.push({
            productId: prod.id,
            productName: prod.name,
            category: prod.category,
            unit: prod.unit,
            quantity: qty,
            purchasePrice: prod.purchasePrice,
            sellingPrice: unitPrice,
            gstRate,
            subtotal,
            gstAmount,
            totalAmount,
          });

          const updatedProd: Product = {
            ...prod,
            quantity: prod.quantity - qty,
            updatedAt: new Date().toISOString(),
          };
          productMap.set(prod.id, updatedProd);

          const alert = buildStockAlert(updatedProd);
          if (alert) {
            newAlerts.push(alert);
          }
        }

        const subtotal = roundMoney(saleItems.reduce((sum, i) => sum + i.subtotal, 0));
        const gstTotal = roundMoney(saleItems.reduce((sum, i) => sum + i.gstAmount, 0));
        const totalCost = roundMoney(
          saleItems.reduce((sum, i) => sum + i.purchasePrice * i.quantity, 0)
        );
        const discount = Math.max(0, roundMoney(input.discount || 0));
        const totalAmount = Math.max(0, roundMoney(subtotal + gstTotal - discount));

        const nextReceiptNum = `INV-${1001 + prev.sales.length}`;
        const sale: Sale = {
          id: makeId('sale'),
          receiptNumber: nextReceiptNum,
          date: input.date || getLocalDateString(),
          createdAt: new Date().toISOString(),
          items: saleItems,
          subtotal,
          gstTotal,
          discount,
          totalAmount,
          totalCost,
          paymentMethod: input.paymentMethod,
          note: input.note.trim(),
        };

        createdSale = sale;

        return {
          ...prev,
          products: prev.products.map((p) => productMap.get(p.id) || p),
          sales: [sale, ...prev.sales],
          notifications: [...newAlerts, ...prev.notifications],
        };
      });

      if (errorMsg) {
        pushToast({
          title: 'Cannot Record Sale',
          message: errorMsg,
          variant: 'danger',
        });
        return null;
      }

      if (createdSale) {
        const s = createdSale as Sale;
        pushToast({
          title: `Sale Recorded (${s.receiptNumber})`,
          message: `Total ${snapshot.settings.currencySymbol}${s.totalAmount.toFixed(2)} saved and stock updated.`,
          variant: 'success',
        });

        for (const alert of newAlerts) {
          pushToast({
            title: alert.type === 'out-of-stock' ? 'Out of Stock Alert' : 'Low Stock Alert',
            message: alert.message,
            variant: alert.type === 'out-of-stock' ? 'danger' : 'warning',
          });
        }
      }

      return createdSale;
    },
    [pushToast, snapshot.settings.currencySymbol, updateAndPersist]
  );

  const deleteSale = useCallback(
    (id: string, restoreStock = true) => {
      updateAndPersist((prev) => {
        const target = prev.sales.find((s) => s.id === id);
        if (!target) return prev;

        let nextProducts = prev.products;
        if (restoreStock) {
          const restoreMap = new Map<string, number>();
          for (const item of target.items) {
            restoreMap.set(item.productId, (restoreMap.get(item.productId) || 0) + item.quantity);
          }
          nextProducts = prev.products.map((p) => {
            const addBack = restoreMap.get(p.id);
            if (!addBack) return p;
            return {
              ...p,
              quantity: p.quantity + addBack,
              updatedAt: new Date().toISOString(),
            };
          });
        }

        return {
          ...prev,
          products: nextProducts,
          sales: prev.sales.filter((s) => s.id !== id),
        };
      });

      pushToast({
        title: 'Sale Deleted',
        message: restoreStock
          ? 'Transaction removed and sold quantities restored to stock.'
          : 'Transaction removed from records.',
        variant: 'info',
      });
    },
    [pushToast, updateAndPersist]
  );

  const addExpense = useCallback(
    (input: Omit<Expense, 'id' | 'createdAt'>) => {
      const expense: Expense = {
        ...input,
        id: makeId('exp'),
        amount: Math.max(0, roundMoney(Number(input.amount) || 0)),
        description: input.description.trim(),
        createdAt: new Date().toISOString(),
      };
      updateAndPersist((prev) => ({
        ...prev,
        expenses: [expense, ...prev.expenses],
      }));
      pushToast({
        title: 'Expense Saved',
        message: `${expense.category}: ${snapshot.settings.currencySymbol}${expense.amount.toFixed(2)} logged.`,
        variant: 'success',
      });
    },
    [pushToast, snapshot.settings.currencySymbol, updateAndPersist]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      updateAndPersist((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== id),
      }));
      pushToast({
        title: 'Expense Removed',
        message: 'Expense entry deleted.',
        variant: 'info',
      });
    },
    [pushToast, updateAndPersist]
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      updateAndPersist((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }));
    },
    [updateAndPersist]
  );

  const markAllNotificationsRead = useCallback(() => {
    updateAndPersist((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, [updateAndPersist]);

  const clearReadNotifications = useCallback(() => {
    updateAndPersist((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => !n.read),
    }));
  }, [updateAndPersist]);

  const updateSettings = useCallback(
    (partial: Partial<ShopSettings>) => {
      updateAndPersist((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...partial },
      }));
      pushToast({
        title: 'Settings Saved',
        message: 'Shop preferences updated.',
        variant: 'success',
      });
    },
    [pushToast, updateAndPersist]
  );

  const exportBackupJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SHOP_TRACK_Backup_${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({
      title: 'Backup Downloaded',
      message: 'Full shop database exported to JSON file.',
      variant: 'success',
    });
  }, [pushToast, snapshot]);

  const importBackupJson = useCallback(
    (jsonText: string) => {
      try {
        const parsed = JSON.parse(jsonText);
        const validated = validateImportedSnapshot(parsed);
        saveSnapshot(validated);
        setSnapshot(validated);
        pushToast({
          title: 'Backup Restored',
          message: `Restored ${validated.products.length} products and ${validated.sales.length} sales.`,
          variant: 'success',
        });
      } catch (err) {
        pushToast({
          title: 'Restore Failed',
          message: err instanceof Error ? err.message : 'Invalid backup JSON file.',
          variant: 'danger',
        });
      }
    },
    [pushToast]
  );

  const resetStarter = useCallback(() => {
    const starter = resetToStarterData();
    setSnapshot(starter);
    pushToast({
      title: 'Sample Shop Data Loaded',
      message: 'Starter products, sales, and expenses restored.',
      variant: 'info',
    });
  }, [pushToast]);

  const clearAllData = useCallback(() => {
    const empty = clearAllStoreData();
    setSnapshot(empty);
    pushToast({
      title: 'All Shop Data Cleared',
      message: 'Database reset to an empty shop.',
      variant: 'info',
    });
  }, [pushToast]);

  const unreadNotificationCount = useMemo(
    () => snapshot.notifications.filter((n) => !n.read).length,
    [snapshot.notifications]
  );

  const value: ShopContextValue = {
    activePage,
    setActivePage,
    stockFilterHint,
    setStockFilterHint,
    products: snapshot.products,
    sales: snapshot.sales,
    expenses: snapshot.expenses,
    notifications: snapshot.notifications,
    settings: snapshot.settings,
    unreadNotificationCount,
    toasts,
    dismissToast,
    pushToast,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    recordSale,
    deleteSale,
    addExpense,
    deleteExpense,
    markNotificationRead,
    markAllNotificationsRead,
    clearReadNotifications,
    updateSettings,
    exportBackupJson,
    importBackupJson,
    resetStarter,
    clearAllData,
    openQuickProductModal,
    setOpenQuickProductModal,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error('useShop must be used inside ShopProvider');
  }
  return ctx;
}
