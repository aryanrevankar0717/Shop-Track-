import { Bell, Menu, PlusCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { NavPage } from '../types/shop';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

const PAGE_TITLES: Record<NavPage, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of stock, daily sales, monthly profit, and alerts',
  },
  stock: {
    title: 'Stock Management',
    subtitle: 'Manage product inventory, quantities, and low-stock limits',
  },
  products: {
    title: 'Product Catalogue',
    subtitle: 'Search, filter, and inspect product pricing and availability',
  },
  'daily-sales': {
    title: 'Daily Sales & Income',
    subtitle: 'Record customer sales, log daily expenses, and inspect daily profit',
  },
  'monthly-income': {
    title: 'Monthly Income Report',
    subtitle: 'Review monthly revenue, expenses, gross profit, and net profit',
  },
  'income-graphs': {
    title: 'Income & Sales Graphs',
    subtitle: 'Interactive revenue, profit, expense, and sales comparison charts',
  },
  'gst-calculator': {
    title: 'GST & Tax Calculator',
    subtitle: 'Calculate CGST, SGST, IGST, inclusive and exclusive GST prices',
  },
  transactions: {
    title: 'Transaction History',
    subtitle: 'Search and filter past sales receipts with GST breakdown',
  },
  reports: {
    title: 'Reports & Export',
    subtitle: 'Generate and download PDF and Excel business reports',
  },
  notifications: {
    title: 'Stock Notifications',
    subtitle: 'Automatic low-stock and out-of-stock alerts centre',
  },
  settings: {
    title: 'Settings & Data Backup',
    subtitle: 'Configure store details, backup JSON, or restore shop data',
  },
};

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const { activePage, setActivePage, unreadNotificationCount } = useShop();
  const meta = PAGE_TITLES[activePage];

  return (
    <header className="sticky top-0 z-30 h-13 lg:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-3">
      {/* Left: Mobile drawer toggle + Page Title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-base sm:text-xl font-bold text-navy-900 truncate">
            {meta.title}
          </h1>
          <p className="hidden md:block text-xs text-slate-500 truncate">{meta.subtitle}</p>
        </div>
      </div>

      {/* Right: Notification Bell + Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setActivePage('notifications')}
          className="relative min-h-[40px] min-w-[40px] sm:min-h-[42px] sm:min-w-[42px] flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-navy-900 hover:bg-slate-50 transition-colors"
          aria-label="View stock notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-md bg-red-600 text-white text-[10px] font-mono font-bold tabular-nums">
              {unreadNotificationCount}
            </span>
          )}
        </button>

        {activePage !== 'daily-sales' && (
          <button
            type="button"
            onClick={() => setActivePage('daily-sales')}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Record Sale</span>
          </button>
        )}
      </div>
    </header>
  );
}
