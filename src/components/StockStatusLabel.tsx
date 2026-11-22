import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { StockStatus } from '../types/shop';

export function StockStatusLabel({ status }: { status: StockStatus }) {
  if (status === 'out-of-stock') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
        <span>Out of Stock</span>
      </span>
    );
  }
  if (status === 'low-stock') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Low Stock</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span>In Stock</span>
    </span>
  );
}
