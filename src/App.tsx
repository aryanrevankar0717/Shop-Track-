import React from 'react';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ProductModal } from './components/ProductModal';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { ShopProvider, useShop } from './context/ShopContext';
import { DailySalesPage } from './pages/DailySalesPage';
import { DashboardPage } from './pages/DashboardPage';
import { GstCalculatorPage } from './pages/GstCalculatorPage';
import { IncomeGraphsPage } from './pages/IncomeGraphsPage';
import { MonthlyIncomePage } from './pages/MonthlyIncomePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProductsCataloguePage } from './pages/ProductsCataloguePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StockManagementPage } from './pages/StockManagementPage';
import { TransactionsPage } from './pages/TransactionsPage';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h1 className="font-display text-lg font-bold text-navy-900">
              SHOP TRACK encountered an unexpected error
            </h1>
            <p className="text-xs font-mono text-red-700 bg-red-50 p-3 rounded-lg break-words">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-semibold text-white bg-navy-900 rounded-lg"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ShopShell() {
  const { activePage, openQuickProductModal, setOpenQuickProductModal } = useShop();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'stock':
        return <StockManagementPage />;
      case 'products':
        return <ProductsCataloguePage />;
      case 'daily-sales':
        return <DailySalesPage />;
      case 'monthly-income':
        return <MonthlyIncomePage />;
      case 'income-graphs':
        return <IncomeGraphsPage />;
      case 'gst-calculator':
        return <GstCalculatorPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <SettingsPage />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar mobileOpen={false} onCloseMobile={() => {}} />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] w-full mx-auto">
          {renderPage()}
        </main>
      </div>

      <MobileBottomNav />

      <ProductModal
        open={openQuickProductModal}
        onClose={() => setOpenQuickProductModal(false)}
      />

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ShopProvider>
        <ShopShell />
      </ShopProvider>
    </AppErrorBoundary>
  );
}
