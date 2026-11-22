import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useShop();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2.5 sm:max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => {
        const styles =
          toast.variant === 'danger'
            ? 'bg-white border-red-200 text-slate-900'
            : toast.variant === 'warning'
            ? 'bg-white border-amber-200 text-slate-900'
            : toast.variant === 'success'
            ? 'bg-white border-emerald-200 text-slate-900'
            : 'bg-white border-slate-200 text-slate-900';

        const icon =
          toast.variant === 'danger' ? (
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          ) : toast.variant === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : toast.variant === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-navy-800 shrink-0 mt-0.5" />
          );

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all ${styles}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
