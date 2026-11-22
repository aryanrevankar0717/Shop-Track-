import {
  BarChart3,
  Bell,
  Boxes,
  Calculator,
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  Store,
  TrendingUp,
  X,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { NavPage } from '../types/shop';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stock', label: 'Stock Management', icon: Boxes },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'daily-sales', label: 'Daily Sales', icon: CalendarDays },
  { id: 'monthly-income', label: 'Monthly Income', icon: TrendingUp },
  { id: 'income-graphs', label: 'Income Graphs', icon: BarChart3 },
  { id: 'gst-calculator', label: 'GST Calculator', icon: Calculator },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { activePage, setActivePage, unreadNotificationCount, settings, setStockFilterHint } =
    useShop();

  const handleSelect = (id: NavPage) => {
    if (id === 'stock') {
      setStockFilterHint('all');
    }
    setActivePage(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-navy-900 text-white w-64 select-none">
      {/* Brand Lockup */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="flex items-center gap-3 text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="block font-display text-base font-extrabold tracking-tight text-white whitespace-nowrap">
              SHOP TRACK
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const showUnread = item.id === 'notifications' && unreadNotificationCount > 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </span>
              {showUnread && (
                <span
                  className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md tabular-nums ${
                    isActive ? 'bg-white text-emerald-700' : 'bg-red-500 text-white'
                  }`}
                >
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Shop Identity Footer */}
      <div className="px-4 py-3.5 border-t border-white/10 bg-navy-950/60 shrink-0">
        <p className="text-xs font-semibold text-white truncate">{settings.shopName}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{settings.shopTagline || 'Store Ledger'}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-navy-800 bg-navy-900">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full shadow-2xl">{navContent}</div>
        </div>
      )}
    </>
  );
}
