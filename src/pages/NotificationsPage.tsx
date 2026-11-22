import { AlertTriangle, Bell, Check, CheckCheck, PackagePlus, Trash2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProductModal } from '../components/ProductModal';
import { useShop } from '../context/ShopContext';
import { Product } from '../types/shop';

type AlertFilter = 'all' | 'unread' | 'out-of-stock' | 'low-stock';

export function NotificationsPage() {
  const {
    notifications,
    products,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearReadNotifications,
  } = useShop();

  const [filter, setFilter] = useState<AlertFilter>('all');
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread' && n.read) return false;
      if (filter === 'out-of-stock' && n.type !== 'out-of-stock') return false;
      if (filter === 'low-stock' && n.type !== 'low-stock') return false;
      return true;
    });
  }, [filter, notifications]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          {(
            [
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadNotificationCount})` },
              { id: 'out-of-stock', label: 'Out of Stock' },
              { id: 'low-stock', label: 'Low Stock' },
            ] as Array<{ id: AlertFilter; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filter === tab.id ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unreadNotificationCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
          <button
            type="button"
            onClick={clearReadNotifications}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Read</span>
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No stock notifications</p>
            <p className="text-xs text-slate-500 mt-1">
              Automatic alerts appear here whenever a product reaches its minimum stock limit or runs out.
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const linkedProduct = productMap.get(n.productId);
            const isOut = n.type === 'out-of-stock';

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  n.read ? 'bg-white' : 'bg-slate-50/80'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isOut ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {isOut ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isOut ? 'text-red-700' : 'text-amber-700'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : 'Low Stock'}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-xs text-slate-500">{n.category}</span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(n.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {!n.read && (
                        <span className="text-[11px] font-bold text-emerald-700 ml-1">
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-navy-900 mt-1">{n.productName}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    <p className="text-xs font-mono text-slate-500 mt-1 tabular-nums">
                      Alert Qty: {n.remainingQuantity} | Min Limit: {n.minStockLimit}
                      {linkedProduct && ` | Current Live Stock: ${linkedProduct.quantity} ${linkedProduct.unit}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {linkedProduct && (
                    <button
                      type="button"
                      onClick={() => setRestockProduct(linkedProduct)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>Restock</span>
                    </button>
                  )}
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ProductModal
        open={Boolean(restockProduct)}
        editingProduct={restockProduct}
        onClose={() => setRestockProduct(null)}
      />
    </div>
  );
}
