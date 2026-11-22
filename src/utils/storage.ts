import { Expense, Product, Sale, ShopSettings, StockNotification, StoreSnapshot } from '../types/shop';
import { getLocalDateString, getStockStatus, shiftDateString } from './calculations';

const DB_NAME = 'shoptrack_persistent_db';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
const SNAPSHOT_KEY = 'primary_store';
const LS_KEY = 'shoptrack_store_v1';

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Shree Sai General & Provision Store',
  shopTagline: 'Quality Groceries & Daily Essentials',
  address: '14, Market Road, Sector 4',
  gstin: '27AABCS1429B1Z5',
  currencySymbol: '₹',
  defaultGstRate: 18,
  defaultMinStockLimit: 10,
  gstIncludedInProductPrice: false,
};

function createStarterSnapshot(): StoreSnapshot {
  const today = getLocalDateString();
  const d1 = shiftDateString(today, -1);
  const d2 = shiftDateString(today, -2);
  const d3 = shiftDateString(today, -4);
  const d4 = shiftDateString(today, -6);
  const d5 = shiftDateString(today, -12);
  const prevMonthDate = shiftDateString(today, -32);
  const prevMonthDate2 = shiftDateString(today, -38);

  const products: Product[] = [
    {
      id: 'prod-1',
      name: 'India Gate Basmati Rice (5 kg)',
      category: 'Groceries & Grains',
      purchasePrice: 440,
      sellingPrice: 540,
      quantity: 38,
      minStockLimit: 10,
      gstRate: 5,
      unit: 'bag',
      description: 'Aged long-grain basmati rice 5 kg retail pack.',
      createdAt: `${prevMonthDate2}T09:00:00.000Z`,
      updatedAt: `${today}T08:30:00.000Z`,
    },
    {
      id: 'prod-2',
      name: 'Fortune Sunflower Oil (1 L)',
      category: 'Cooking Oils',
      purchasePrice: 122,
      sellingPrice: 148,
      quantity: 8,
      minStockLimit: 12,
      gstRate: 5,
      unit: 'pouch',
      description: 'Refined sunflower cooking oil 1 litre pouch.',
      createdAt: `${prevMonthDate2}T09:15:00.000Z`,
      updatedAt: `${today}T09:00:00.000Z`,
    },
    {
      id: 'prod-3',
      name: 'Tata Tea Gold (500 g)',
      category: 'Beverages',
      purchasePrice: 215,
      sellingPrice: 265,
      quantity: 24,
      minStockLimit: 8,
      gstRate: 5,
      unit: 'pack',
      description: 'Premium Assam leaf blend tea 500 g.',
      createdAt: `${prevMonthDate2}T09:20:00.000Z`,
      updatedAt: `${d1}T14:20:00.000Z`,
    },
    {
      id: 'prod-4',
      name: 'Amul Taaza Toned Milk (1 L)',
      category: 'Dairy',
      purchasePrice: 60,
      sellingPrice: 72,
      quantity: 0,
      minStockLimit: 15,
      gstRate: 0,
      unit: 'carton',
      description: 'UHT treated toned milk tetra pack 1 litre.',
      createdAt: `${prevMonthDate2}T09:30:00.000Z`,
      updatedAt: `${today}T10:15:00.000Z`,
    },
    {
      id: 'prod-5',
      name: 'Surf Excel Matic Liquid (1 L)',
      category: 'Household & Care',
      purchasePrice: 175,
      sellingPrice: 220,
      quantity: 19,
      minStockLimit: 6,
      gstRate: 18,
      unit: 'bottle',
      description: 'Top-load liquid laundry detergent 1 litre.',
      createdAt: `${prevMonthDate}T10:00:00.000Z`,
      updatedAt: `${d2}T11:45:00.000Z`,
    },
    {
      id: 'prod-6',
      name: 'Colgate Strong Teeth (200 g)',
      category: 'Personal Care',
      purchasePrice: 88,
      sellingPrice: 112,
      quantity: 5,
      minStockLimit: 10,
      gstRate: 18,
      unit: 'tube',
      description: 'Anticavity calcium boost toothpaste 200 g.',
      createdAt: `${prevMonthDate}T10:20:00.000Z`,
      updatedAt: `${d1}T17:10:00.000Z`,
    },
    {
      id: 'prod-7',
      name: 'Aashirvaad Whole Wheat Atta (10 kg)',
      category: 'Groceries & Grains',
      purchasePrice: 375,
      sellingPrice: 445,
      quantity: 22,
      minStockLimit: 8,
      gstRate: 5,
      unit: 'bag',
      description: '100% MP Sharbati whole wheat flour 10 kg bag.',
      createdAt: `${prevMonthDate}T11:00:00.000Z`,
      updatedAt: `${today}T08:00:00.000Z`,
    },
    {
      id: 'prod-8',
      name: 'Dettol Antiseptic Liquid (550 ml)',
      category: 'Personal Care',
      purchasePrice: 158,
      sellingPrice: 195,
      quantity: 14,
      minStockLimit: 5,
      gstRate: 12,
      unit: 'bottle',
      description: 'Multi-purpose antiseptic disinfectant liquid 550 ml.',
      createdAt: `${d5}T10:00:00.000Z`,
      updatedAt: `${d3}T16:30:00.000Z`,
    },
    {
      id: 'prod-9',
      name: 'Haldiram Bhujia Sev (400 g)',
      category: 'Snacks & Bakery',
      purchasePrice: 82,
      sellingPrice: 105,
      quantity: 30,
      minStockLimit: 10,
      gstRate: 12,
      unit: 'pack',
      description: 'Crispy traditional moth bean & gram flour namkeen.',
      createdAt: `${d5}T11:15:00.000Z`,
      updatedAt: `${d2}T18:00:00.000Z`,
    },
    {
      id: 'prod-10',
      name: 'Cadbury Dairy Milk Silk (150 g)',
      category: 'Snacks & Bakery',
      purchasePrice: 135,
      sellingPrice: 175,
      quantity: 4,
      minStockLimit: 8,
      gstRate: 18,
      unit: 'bar',
      description: 'Smooth chocolate bar 150 g family pack.',
      createdAt: `${d4}T12:00:00.000Z`,
      updatedAt: `${today}T11:20:00.000Z`,
    },
  ];

  const makeSale = (
    id: string,
    receiptNumber: string,
    date: string,
    time: string,
    lines: Array<{ prod: Product; qty: number }>,
    paymentMethod: Sale['paymentMethod'],
    discount = 0,
    note = ''
  ): Sale => {
    const items = lines.map(({ prod, qty }) => {
      const subtotal = Math.round(prod.sellingPrice * qty * 100) / 100;
      const gstAmount = Math.round(((subtotal * prod.gstRate) / 100) * 100) / 100;
      return {
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        unit: prod.unit,
        quantity: qty,
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice,
        gstRate: prod.gstRate,
        subtotal,
        gstAmount,
        totalAmount: Math.round((subtotal + gstAmount) * 100) / 100,
      };
    });
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const gstTotal = items.reduce((s, i) => s + i.gstAmount, 0);
    const totalCost = items.reduce((s, i) => s + i.purchasePrice * i.quantity, 0);
    const totalAmount = Math.max(0, Math.round((subtotal + gstTotal - discount) * 100) / 100);
    return {
      id,
      receiptNumber,
      date,
      createdAt: `${date}T${time}:00.000Z`,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      gstTotal: Math.round(gstTotal * 100) / 100,
      discount,
      totalAmount,
      totalCost: Math.round(totalCost * 100) / 100,
      paymentMethod,
      note,
    };
  };

  const sales: Sale[] = [
    makeSale('sale-1', 'INV-1001', prevMonthDate2, '11:20', [{ prod: products[0], qty: 4 }, { prod: products[2], qty: 3 }], 'UPI', 0, 'Monthly household stock'),
    makeSale('sale-2', 'INV-1002', prevMonthDate, '16:45', [{ prod: products[6], qty: 5 }, { prod: products[4], qty: 2 }], 'Cash', 50, 'Regular customer'),
    makeSale('sale-3', 'INV-1003', d5, '10:30', [{ prod: products[0], qty: 3 }, { prod: products[1], qty: 6 }, { prod: products[8], qty: 4 }], 'UPI'),
    makeSale('sale-4', 'INV-1004', d4, '14:15', [{ prod: products[4], qty: 4 }, { prod: products[7], qty: 3 }], 'Card'),
    makeSale('sale-5', 'INV-1005', d3, '18:05', [{ prod: products[6], qty: 3 }, { prod: products[2], qty: 5 }, { prod: products[5], qty: 4 }], 'Cash'),
    makeSale('sale-6', 'INV-1006', d2, '12:40', [{ prod: products[8], qty: 6 }, { prod: products[9], qty: 4 }], 'UPI'),
    makeSale('sale-7', 'INV-1007', d1, '17:50', [{ prod: products[0], qty: 2 }, { prod: products[1], qty: 4 }, { prod: products[3], qty: 8 }], 'UPI', 0, 'Evening counter rush'),
    makeSale('sale-8', 'INV-1008', today, '09:40', [{ prod: products[6], qty: 2 }, { prod: products[2], qty: 3 }], 'UPI', 0, 'Morning order'),
    makeSale('sale-9', 'INV-1009', today, '11:15', [{ prod: products[4], qty: 2 }, { prod: products[8], qty: 5 }, { prod: products[9], qty: 3 }], 'Cash'),
  ];

  const expenses: Expense[] = [
    {
      id: 'exp-1',
      date: prevMonthDate2,
      category: 'Rent',
      amount: 12000,
      description: 'Monthly shop rent',
      createdAt: `${prevMonthDate2}T09:00:00.000Z`,
    },
    {
      id: 'exp-2',
      date: prevMonthDate,
      category: 'Electricity & Utilities',
      amount: 1850,
      description: 'Electricity bill & cold storage',
      createdAt: `${prevMonthDate}T13:00:00.000Z`,
    },
    {
      id: 'exp-3',
      date: d5,
      category: 'Transport & Delivery',
      amount: 750,
      description: 'Wholesale market tempo freight',
      createdAt: `${d5}T08:30:00.000Z`,
    },
    {
      id: 'exp-4',
      date: d2,
      category: 'Packaging',
      amount: 420,
      description: 'Carry bags & parcel tape',
      createdAt: `${d2}T15:00:00.000Z`,
    },
    {
      id: 'exp-5',
      date: today,
      category: 'Maintenance',
      amount: 350,
      description: 'Counter display cleaning & bulb replacement',
      createdAt: `${today}T08:45:00.000Z`,
    },
  ];

  const notifications: StockNotification[] = [];
  for (const prod of products) {
    const status = getStockStatus(prod);
    if (status === 'out-of-stock') {
      notifications.push({
        id: `notif-init-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        remainingQuantity: prod.quantity,
        minStockLimit: prod.minStockLimit,
        type: 'out-of-stock',
        message: `${prod.name} is out of stock (0 ${prod.unit} remaining). Restock immediately.`,
        createdAt: `${today}T10:15:00.000Z`,
        read: false,
      });
    } else if (status === 'low-stock') {
      notifications.push({
        id: `notif-init-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        remainingQuantity: prod.quantity,
        minStockLimit: prod.minStockLimit,
        type: 'low-stock',
        message: `${prod.name} is running low (${prod.quantity} ${prod.unit} left, limit: ${prod.minStockLimit}).`,
        createdAt: `${today}T09:05:00.000Z`,
        read: false,
      });
    }
  }

  return {
    version: 1,
    initialized: true,
    products,
    sales,
    expenses,
    notifications,
    settings: DEFAULT_SETTINGS,
  };
}

export function createEmptySnapshot(): StoreSnapshot {
  return {
    version: 1,
    initialized: true,
    products: [],
    sales: [],
    expenses: [],
    notifications: [],
    settings: DEFAULT_SETTINGS,
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

async function readFromIndexedDB(): Promise<StoreSnapshot | null> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(SNAPSHOT_KEY);
      req.onsuccess = () => resolve((req.result as StoreSnapshot) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function writeToIndexedDB(snapshot: StoreSnapshot): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(snapshot, SNAPSHOT_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage already handled synchronously
  }
}

export function saveSnapshot(snapshot: StoreSnapshot): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota errors if any, IndexedDB handles large sets
  }
  void writeToIndexedDB(snapshot);
}

function normalizeSettings(rawSettings?: Partial<ShopSettings>): ShopSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(rawSettings || {}) };
  if (merged.shopName === 'Shree Ganesh General & Provision Store') {
    merged.shopName = DEFAULT_SETTINGS.shopName;
  }
  return merged;
}

export function loadSnapshotSync(): StoreSnapshot {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreSnapshot;
      if (parsed && parsed.initialized && Array.isArray(parsed.products)) {
        const next: StoreSnapshot = {
          ...createEmptySnapshot(),
          ...parsed,
          settings: normalizeSettings(parsed.settings),
        };
        if (parsed.settings?.shopName === 'Shree Ganesh General & Provision Store') {
          saveSnapshot(next);
        }
        return next;
      }
    }
  } catch {
    // Fall through to starter snapshot
  }
  const starter = createStarterSnapshot();
  saveSnapshot(starter);
  return starter;
}

export async function hydrateFromIndexedDB(): Promise<StoreSnapshot | null> {
  const idbData = await readFromIndexedDB();
  if (idbData && idbData.initialized && Array.isArray(idbData.products)) {
    const next: StoreSnapshot = {
      ...createEmptySnapshot(),
      ...idbData,
      settings: normalizeSettings(idbData.settings),
    };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    return next;
  }
  return null;
}

export function validateImportedSnapshot(raw: unknown): StoreSnapshot {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid backup file format.');
  }
  const candidate = raw as Partial<StoreSnapshot>;
  if (!Array.isArray(candidate.products) || !Array.isArray(candidate.sales) || !Array.isArray(candidate.expenses)) {
    throw new Error('Backup file is missing required products, sales, or expenses arrays.');
  }
  return {
    version: 1,
    initialized: true,
    products: candidate.products,
    sales: candidate.sales,
    expenses: candidate.expenses,
    notifications: Array.isArray(candidate.notifications) ? candidate.notifications : [],
    settings: {
      ...DEFAULT_SETTINGS,
      ...(candidate.settings || {}),
    },
  };
}

export function resetToStarterData(): StoreSnapshot {
  const starter = createStarterSnapshot();
  saveSnapshot(starter);
  return starter;
}

export function clearAllStoreData(): StoreSnapshot {
  const empty = createEmptySnapshot();
  saveSnapshot(empty);
  return empty;
}
