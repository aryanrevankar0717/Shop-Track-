import {
  BarChart3,
  Bell,
  Boxes,
  Calculator,
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  PlusCircle,
  ReceiptText,
  Settings,
  TrendingUp,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { NavPage } from '../types/shop';

const ALL_PAGES: Array<{
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

export function MobileBottomNav() {
  const { activePage, setActivePage, unreadNotificationCount, setStockFilterHint } = useShop();
  const [moreOpen, setMoreOpen] = useState(false);

  const navigate = (id: NavPage) => {
    if (id === 'stock') setStockFilterHint('all');
    setActivePage(id);
    setMoreOpen(false);
  };

  const isMoreActive = ![
    'dashboard',
    'stock',
    'daily-sales',
    'gst-calculator',
  ].includes(activePage);

  return (
    <>
      {/* Bottom Sheet Drawer for All 11 Sections */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="All SHOP TRACK sections"
            className="relative z-10 bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl max-h-[82vh] flex flex-col overflow-hidden"
          >
            {/* Drag handle & Header */}
            <div className="pt-3 pb-2 px-5 border-b border-slate-100 shrink-0">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-navy-900">
                    All Menu Options
                  </h2>
                  <p className="text-xs text-slate-500">Tap any tool to open</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label="Close menu sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid of Touch Tiles */}
            <div className="p-4 overflow-y-auto grid grid-cols-3 gap-2.5 pb-6">
              {ALL_PAGES.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                const showUnread = item.id === 'notifications' && unreadNotificationCount > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    className={`relative flex flex-col items-center justify-center gap-2 p-3 min-h-[78px] rounded-2xl border text-center transition-colors ${
                      active
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 active:bg-slate-100'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${active ? 'text-emerald-300' : 'text-navy-900'}`}
                    />
                    <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                      {item.label}
                    </span>
                    {showUnread && (
                      <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-md bg-red-600 text-white text-[10px] font-mono font-bold tabular-nums">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Tab Bar (Thumb Zone Navigation) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(15,37,68,0.06)]"
      >
        <div className="grid grid-cols-5 items-center h-[62px] px-1">
          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] gap-1 transition-colors ${
              activePage === 'dashboard' ? 'text-navy-900' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard
              className={`w-5 h-5 ${
                activePage === 'dashboard' ? 'text-emerald-700 stroke-[2.4]' : ''
              }`}
            />
            <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
              Home
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('stock')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] gap-1 transition-colors ${
              activePage === 'stock' ? 'text-navy-900' : 'text-slate-500'
            }`}
          >
            <Boxes
              className={`w-5 h-5 ${
                activePage === 'stock' ? 'text-emerald-700 stroke-[2.4]' : ''
              }`}
            />
            <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
              Stock
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('daily-sales')}
            className="flex flex-col items-center justify-center h-full min-h-[44px] gap-0.5"
          >
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
                activePage === 'daily-sales'
                  ? 'bg-navy-900 text-white'
                  : 'bg-emerald-700 text-white'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
            </span>
            <span
              className={`text-[10px] font-bold tracking-tight whitespace-nowrap ${
                activePage === 'daily-sales' ? 'text-navy-900' : 'text-emerald-700'
              }`}
            >
              Sale
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('gst-calculator')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] gap-1 transition-colors ${
              activePage === 'gst-calculator' ? 'text-navy-900' : 'text-slate-500'
            }`}
          >
            <Calculator
              className={`w-5 h-5 ${
                activePage === 'gst-calculator' ? 'text-emerald-700 stroke-[2.4]' : ''
              }`}
            />
            <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
              GST
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`relative flex flex-col items-center justify-center h-full min-h-[44px] gap-1 transition-colors ${
              isMoreActive || moreOpen ? 'text-navy-900' : 'text-slate-500'
            }`}
          >
            <MoreHorizontal
              className={`w-5 h-5 ${
                isMoreActive || moreOpen ? 'text-emerald-700 stroke-[2.4]' : ''
              }`}
            />
            <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
              Menu
            </span>
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-3 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-md bg-red-600 text-white text-[9px] font-mono font-bold tabular-nums">
                {unreadNotificationCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
