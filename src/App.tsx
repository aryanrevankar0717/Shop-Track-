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
    <ShopProvider>
      <ShopShell />
    </ShopProvider>
  );
}
